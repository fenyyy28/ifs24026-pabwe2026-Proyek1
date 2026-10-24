process.env.DB_PATH = ':memory:';
process.env.UPLOAD_DIR = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'lt-up-'));
const { test } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');
require('../db').seed();

const login = async (username, password) => (await request(app).post('/api/auth/login').send({ username, password })).body.token;
const as = (token) => ({ Authorization: `Bearer ${token}` });

test('tanpa login ditolak', async () => {
  assert.strictEqual((await request(app).get('/api/orders')).status, 401);
});

test('register penghuni baru lalu login', async () => {
  const r = await request(app).post('/api/auth/register').send({ nama: 'Uji Coba', kamar: 'D-1', username: 'uji', password: 'rahasia1' });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.body.user.role, 'penghuni');
  const dup = await request(app).post('/api/auth/register').send({ nama: 'X', kamar: 'D-2', username: 'uji', password: 'rahasia1' });
  assert.strictEqual(dup.status, 409);
  const salah = await request(app).post('/api/auth/login').send({ username: 'uji', password: 'salah' });
  assert.strictEqual(salah.status, 401);
  assert.ok(await login('uji', 'rahasia1'));
});

test('penghuni hanya melihat cucian miliknya dan tidak boleh mengubah status', async () => {
  const siti = await login('siti', 'siti123');
  const list = await request(app).get('/api/orders').set(as(siti));
  assert.ok(list.body.length > 0 && list.body.every((o) => o.nama === 'Siti Aminah'));
  const orderBudi = (await request(app).get('/api/orders').set(as(await login('budi', 'budi123')))).body[0];
  assert.strictEqual((await request(app).get(`/api/orders/${orderBudi.id}`).set(as(siti))).status, 404);
  assert.strictEqual((await request(app).patch(`/api/orders/${orderBudi.id}/status`).set(as(siti)).send({ status: 'dicuci' })).status, 403);
});

test('petugas ubah status -> penghuni dapat notifikasi dan riwayat', async () => {
  const admin = await login('petugas', 'petugas123');
  const siti = await login('siti', 'siti123');
  const users = (await request(app).get('/api/users').set(as(admin))).body;
  const sitiId = users.find((u) => u.username === 'siti').id;
  const o = await request(app).post('/api/orders').set(as(admin)).send({
    user_id: sitiId, estimasi_selesai: '2099-01-01', berat_kg: 2,
    items: [{ jenis: 'Kemeja', jumlah: 2, warna: 'Putih' }],
  });
  assert.strictEqual(o.status, 201);
  const id = o.body.id;

  await request(app).patch(`/api/orders/${id}/status`).set(as(admin)).send({ status: 'siap_diambil' });
  const notif = (await request(app).get('/api/notifications').set(as(siti))).body;
  assert.ok(notif.some((n) => n.order_id === id && n.judul === 'Cucian siap diambil'));
  const cnt = await request(app).get('/api/notifications/unread-count').set(as(siti));
  assert.ok(cnt.body.total >= 2);

  const detail = (await request(app).get(`/api/orders/${id}`).set(as(siti))).body;
  assert.deepStrictEqual(detail.riwayat.map((r) => r.status), ['diterima', 'siap_diambil']);

  // belum dicek -> tidak boleh selesai
  assert.strictEqual((await request(app).patch(`/api/orders/${id}/status`).set(as(admin)).send({ status: 'selesai' })).status, 400);
  await request(app).patch(`/api/items/${detail.items[0].id}`).set(as(admin)).send({ dikembalikan: true });
  assert.strictEqual((await request(app).patch(`/api/orders/${id}/status`).set(as(admin)).send({ status: 'selesai' })).status, 200);
});

test('alur komplain: diajukan -> ditangani -> selesai', async () => {
  const admin = await login('petugas', 'petugas123');
  const budi = await login('budi', 'budi123');
  const order = (await request(app).get('/api/orders').set(as(budi))).body[0];

  const c = await request(app).post('/api/complaints').set(as(budi)).send({ order_id: order.id, jenis: 'hilang', deskripsi: 'Kaos kaki hilang' });
  assert.strictEqual(c.status, 201);
  let mine = (await request(app).get('/api/complaints').set(as(budi))).body.find((x) => x.id === c.body.id);
  assert.strictEqual(mine.status, 'diajukan');

  assert.strictEqual((await request(app).patch(`/api/complaints/${c.body.id}`).set(as(budi)).send({ status: 'selesai' })).status, 403);
  assert.strictEqual((await request(app).patch(`/api/complaints/${c.body.id}`).set(as(admin)).send({ status: 'baru' })).status, 400);

  await request(app).patch(`/api/complaints/${c.body.id}`).set(as(admin)).send({ status: 'ditangani', tanggapan: 'Kami cek di ruang cuci' });
  await request(app).patch(`/api/complaints/${c.body.id}`).set(as(admin)).send({ status: 'selesai' });
  mine = (await request(app).get('/api/complaints').set(as(budi))).body.find((x) => x.id === c.body.id);
  assert.strictEqual(mine.status, 'selesai');
  assert.strictEqual(mine.tanggapan, 'Kami cek di ruang cuci');
});

const JPG = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64');

test('permintaan jemput dengan foto -> disetujui -> jadi order', async () => {
  const admin = await login('petugas', 'petugas123');
  const andre = await login('andre', 'andre123');

  const r = await request(app).post('/api/requests').set(as(andre))
    .field('catatan', '6 kaos kotor').field('waktu_jemput', '2099-01-01')
    .attach('foto', JPG, { filename: 'kotor.jpg', contentType: 'image/jpeg' });
  assert.strictEqual(r.status, 201);

  const mine = (await request(app).get('/api/requests').set(as(andre))).body.find((x) => x.id === r.body.id);
  assert.strictEqual(mine.status, 'menunggu');
  assert.strictEqual(mine.foto.length, 1);
  assert.strictEqual((await request(app).get(mine.foto[0])).status, 200);

  // penghuni tidak boleh menyetujui
  assert.strictEqual((await request(app).patch(`/api/requests/${r.body.id}`).set(as(andre)).send({ status: 'disetujui' })).status, 403);
  assert.strictEqual((await request(app).patch(`/api/requests/${r.body.id}`).set(as(admin)).send({ status: 'disetujui', tanggapan: 'Dijemput jam 4' })).status, 200);

  const andreId = (await request(app).get('/api/users').set(as(admin))).body.find((u) => u.username === 'andre').id;
  const o = await request(app).post('/api/orders').set(as(admin)).send({
    user_id: andreId, estimasi_selesai: '2099-01-05', berat_kg: 2, request_id: r.body.id,
    items: [{ jenis: 'Kaos', jumlah: 6 }],
  });
  assert.strictEqual(o.status, 201);
  const detail = (await request(app).get(`/api/orders/${o.body.id}`).set(as(andre))).body;
  assert.strictEqual(detail.foto.length, 1);
  const after = (await request(app).get('/api/requests').set(as(andre))).body.find((x) => x.id === r.body.id);
  assert.strictEqual(after.status, 'diorder');
});

test('foto non-gambar ditolak dan penghuni bisa membatalkan permintaan', async () => {
  const siti = await login('siti', 'siti123');
  const bukan = await request(app).post('/api/requests').set(as(siti))
    .field('catatan', 'x').field('waktu_jemput', '2099-01-01')
    .attach('foto', Buffer.from('bukan gambar'), { filename: 'a.txt', contentType: 'text/plain' });
  assert.strictEqual(bukan.status, 400);

  const ok = await request(app).post('/api/requests').set(as(siti)).field('catatan', 'cucian').field('waktu_jemput', '2099-01-01');
  assert.strictEqual(ok.status, 201);
  assert.strictEqual((await request(app).delete(`/api/requests/${ok.body.id}`).set(as(siti))).status, 200);
});

test('papan cucian menampilkan status penghuni lain tanpa data pribadi', async () => {
  const siti = await login('siti', 'siti123');
  const board = (await request(app).get('/api/board').set(as(siti))).body;
  assert.ok(board.some((b) => b.milikku === 1) && board.some((b) => b.milikku === 0));
  for (const b of board) {
    assert.ok(!('items' in b) && !('total_harga' in b) && !('user_id' in b));
    assert.ok(!b.nama.includes(' '));
  }
});
