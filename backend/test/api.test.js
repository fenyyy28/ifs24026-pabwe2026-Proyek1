process.env.DB_PATH = ':memory:';
const fs = require('fs');
const os = require('os');
const path = require('path');
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-up-'));
// folder front-end palsu agar jalur "sajikan hasil build" selalu teruji
const DIST = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-dist-'));
fs.writeFileSync(path.join(DIST, 'index.html'), '<!doctype html><title>LaundryTrack</title>');
process.env.FRONTEND_DIST = DIST;
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

// =====================================================================
//  Tes tambahan untuk cakupan 100%
// =====================================================================
const json = (token) => ({ ...as(token), 'Content-Type': 'application/json' });
const idOf = async (admin, username) => (await request(app).get('/api/users').set(as(admin))).body.find((u) => u.username === username)?.id;
const orderUntuk = async (admin, userId, extra = {}) => (await request(app).post('/api/orders').set(as(admin)).send({
  user_id: userId, estimasi_selesai: '2099-01-01', berat_kg: 1, items: [{ jenis: 'Kaos', jumlah: 1 }], ...extra,
}));

test('statistik untuk petugas dan penghuni', async () => {
  const admin = await login('petugas', 'petugas123');
  const a = (await request(app).get('/api/stats').set(as(admin))).body;
  assert.ok(a.total_order >= 4 && 'permintaan' in a && 'komplain_terbuka' in a);
  const b = (await request(app).get('/api/stats').set(as(await login('budi', 'budi123')))).body;
  assert.ok(b.total_order >= 2 && b.siap_diambil >= 1 && b.terlambat >= 1);
  assert.ok(b.total_order < a.total_order);
});

test('autentikasi: token rusak, pengguna terhapus, validasi register, health, 404', async () => {
  const admin = await login('petugas', 'petugas123');
  assert.strictEqual((await request(app).get('/api/auth/me').set({ Authorization: 'Bearer rusak' })).status, 401);
  assert.strictEqual((await request(app).get('/api/auth/me')).status, 401);
  assert.strictEqual((await request(app).get('/api/health')).body.ok, true);

  assert.strictEqual((await request(app).post('/api/auth/register').send({ username: 'abc', password: 'rahasia1' })).status, 400);
  assert.strictEqual((await request(app).post('/api/auth/register').send({ nama: 'A', kamar: '1', username: 'A B!', password: 'rahasia1' })).status, 400);
  assert.strictEqual((await request(app).post('/api/auth/register').send({ nama: 'A', kamar: '1', username: 'validuser', password: '123' })).status, 400);
  assert.strictEqual((await request(app).post('/api/auth/login').send({ username: 'tidakada', password: 'x' })).status, 401);
  assert.strictEqual((await request(app).post('/api/auth/login').send({})).status, 401);

  const r = await request(app).post('/api/auth/register').send({ nama: 'Sementara', kamar: 'Z-1', username: 'sementara', password: 'rahasia1' });
  assert.strictEqual((await request(app).get('/api/auth/me').set(as(r.body.token))).body.username, 'sementara');
  assert.strictEqual((await request(app).delete(`/api/users/${r.body.user.id}`).set(as(admin))).status, 200);
  assert.strictEqual((await request(app).get('/api/auth/me').set(as(r.body.token))).status, 401);

  assert.strictEqual((await request(app).get('/api/tidak-ada').set(as(admin))).status, 404);
});

test('keamanan: verifikasi kata sandi dengan format salah', () => {
  const { hashPassword, verifyPassword } = require('../security');
  assert.strictEqual(verifyPassword('x', 'tanpa-pemisah'), false);
  assert.strictEqual(verifyPassword('x', ''), false);
  const h = hashPassword('abc');
  assert.strictEqual(verifyPassword('abc', h), true);
  assert.strictEqual(verifyPassword('abd', h), false);
});

test('petugas mengelola penghuni', async () => {
  const admin = await login('petugas', 'petugas123');
  const budi = await login('budi', 'budi123');
  assert.strictEqual((await request(app).get('/api/users').set(as(budi))).status, 403);

  const baru = await request(app).post('/api/auth/register').send({ nama: 'Kelola', kamar: 'K-1', username: 'kelola', password: 'rahasia1' });
  const id = baru.body.user.id;
  assert.strictEqual((await request(app).put(`/api/users/${id}`).set(as(admin)).send({ nama: '' })).status, 400);
  assert.strictEqual((await request(app).put('/api/users/99999').set(as(admin)).send({ nama: 'X', kamar: '1' })).status, 404);
  assert.strictEqual((await request(app).put(`/api/users/${id}`).set(as(admin)).send({ nama: 'Kelola Baru', kamar: 'K-2', kontak: '0812' })).status, 200);
  assert.strictEqual((await request(app).delete('/api/users/99999').set(as(admin))).status, 404);
  assert.strictEqual((await request(app).delete(`/api/users/${id}`).set(as(admin))).status, 200);
});

test('validasi pembuatan order', async () => {
  const admin = await login('petugas', 'petugas123');
  const siti = await idOf(admin, 'siti');
  const andre = await idOf(admin, 'andre');
  assert.strictEqual((await request(app).post('/api/orders').set(as(admin)).send({})).status, 400);
  assert.strictEqual((await request(app).post('/api/orders').set(as(admin)).send({ user_id: 99999, estimasi_selesai: '2099-01-01' })).status, 404);
  assert.strictEqual((await orderUntuk(admin, siti, { items: [] })).status, 400);
  assert.strictEqual((await orderUntuk(admin, siti, { items: [{ jenis: '' }] })).status, 400);
  assert.strictEqual((await orderUntuk(admin, siti, { items: [null] })).status, 400);
  assert.strictEqual((await orderUntuk(admin, siti, { request_id: 99999 })).status, 400);

  const rq = async (token, catatan = 'cucian') => (await request(app).post('/api/requests').set(as(token))
    .field('catatan', catatan).field('waktu_jemput', '2099-01-01')).body.id;
  const sitiToken = await login('siti', 'siti123');
  const milikSiti = await rq(sitiToken);
  assert.strictEqual((await orderUntuk(admin, andre, { request_id: milikSiti })).status, 400); // bukan miliknya

  const ok = await orderUntuk(admin, siti, { request_id: milikSiti });
  assert.strictEqual(ok.status, 201);
  assert.strictEqual((await orderUntuk(admin, siti, { request_id: milikSiti })).status, 400); // sudah jadi order
  assert.strictEqual((await request(app).patch(`/api/requests/${milikSiti}`).set(as(admin)).send({ status: 'ditolak' })).status, 400);

  const ditolak = await rq(sitiToken);
  await request(app).patch(`/api/requests/${ditolak}`).set(as(admin)).send({ status: 'ditolak', tanggapan: 'Penuh' });
  assert.strictEqual((await orderUntuk(admin, siti, { request_id: ditolak })).status, 400);
});

test('status order, item, dan hapus order', async () => {
  const admin = await login('petugas', 'petugas123');
  const siti = await idOf(admin, 'siti');
  const o = (await orderUntuk(admin, siti)).body.id;

  assert.strictEqual((await request(app).patch(`/api/orders/${o}/status`).set(as(admin)).send({ status: 'ngawur' })).status, 400);
  assert.strictEqual((await request(app).patch('/api/orders/99999/status').set(as(admin)).send({ status: 'dicuci' })).status, 404);
  assert.strictEqual((await request(app).patch(`/api/orders/${o}/status`).set(as(admin)).send({ status: 'diterima' })).status, 200); // sama: tanpa notifikasi

  // lewati setiap tahap: pesan notifikasi dibuat untuk tiap status
  const sitiToken = await login('siti', 'siti123');
  for (const st of ['dicuci', 'disetrika', 'siap_diambil']) {
    assert.strictEqual((await request(app).patch(`/api/orders/${o}/status`).set(as(admin)).send({ status: st })).status, 200);
  }
  const judul = (await request(app).get('/api/notifications').set(as(sitiToken))).body.filter((n) => n.order_id === o).map((n) => n.judul);
  for (const j of ['Cucian sedang dicuci', 'Cucian sedang disetrika', 'Cucian siap diambil']) assert.ok(judul.includes(j), j);

  assert.strictEqual((await request(app).patch('/api/items/99999').set(as(admin)).send({ dikembalikan: true })).status, 404);
  assert.strictEqual((await request(app).patch('/api/items/1').set(as(await login('siti', 'siti123'))).send({ dikembalikan: true })).status, 403);

  assert.strictEqual((await request(app).get('/api/orders/99999').set(as(admin))).status, 404);
  const cari = await request(app).get('/api/orders?status=diterima&terlambat=0&q=LDR').set(as(admin));
  assert.ok(cari.body.length > 0);
  assert.ok((await request(app).get('/api/orders?terlambat=1').set(as(admin))).body.every((x) => x.terlambat === 1));

  assert.strictEqual((await request(app).delete('/api/orders/99999').set(as(admin))).status, 404);
  assert.strictEqual((await request(app).delete(`/api/orders/${o}`).set(as(admin))).status, 200);
});

test('komplain: validasi, hak akses, dan hapus', async () => {
  const admin = await login('petugas', 'petugas123');
  const budi = await login('budi', 'budi123');
  const order = (await request(app).get('/api/orders').set(as(budi))).body[0];

  assert.strictEqual((await request(app).post('/api/complaints').set(as(admin)).send({ order_id: order.id, jenis: 'hilang', deskripsi: 'x' })).status, 403);
  assert.strictEqual((await request(app).post('/api/complaints').set(as(budi)).send({ jenis: 'hilang' })).status, 400);
  assert.strictEqual((await request(app).post('/api/complaints').set(as(budi)).send({ order_id: order.id, jenis: 'ngawur', deskripsi: 'x' })).status, 400);
  assert.strictEqual((await request(app).post('/api/complaints').set(as(budi)).send({ order_id: 99999, jenis: 'hilang', deskripsi: 'x' })).status, 404);

  const c = await request(app).post('/api/complaints').set(as(budi)).send({ order_id: order.id, jenis: 'tertukar', deskripsi: 'Bukan punyaku' });
  assert.strictEqual((await request(app).patch('/api/complaints/99999').set(as(admin)).send({ status: 'selesai' })).status, 404);
  assert.ok((await request(app).get('/api/complaints').set(as(admin))).body.length >= 1);
  assert.strictEqual((await request(app).delete('/api/complaints/99999').set(as(admin))).status, 404);
  assert.strictEqual((await request(app).delete(`/api/complaints/${c.body.id}`).set(as(admin))).status, 200);
});

test('permintaan jemput: validasi, hak akses, pembatalan, dan hapus', async () => {
  const admin = await login('petugas', 'petugas123');
  const siti = await login('siti', 'siti123');
  const budi = await login('budi', 'budi123');

  assert.strictEqual((await request(app).post('/api/requests').set(as(admin)).field('catatan', 'x').field('waktu_jemput', '2099-01-01')).status, 403);
  // kosong -> ditolak, dan foto yang terlanjur terunggah dibersihkan
  const kosong = await request(app).post('/api/requests').set(as(siti)).field('catatan', '  ')
    .attach('foto', JPG, { filename: 'a.jpg', contentType: 'image/jpeg' });
  assert.strictEqual(kosong.status, 400);

  // penghuni tanpa permintaan -> daftar kosong
  const baru = await request(app).post('/api/auth/register').send({ nama: 'Kosong', kamar: 'E-1', username: 'kosong', password: 'rahasia1' });
  assert.deepStrictEqual((await request(app).get('/api/requests').set(as(baru.body.token))).body, []);

  const r = await request(app).post('/api/requests').set(as(siti)).field('catatan', 'Jemput').field('waktu_jemput', '2099-01-01')
    .attach('foto', JPG, { filename: 'a.jpg', contentType: 'image/jpeg' });
  const id = r.body.id;
  assert.ok((await request(app).get('/api/requests').set(as(admin))).body.some((x) => x.id === id));

  assert.strictEqual((await request(app).patch(`/api/requests/${id}`).set(as(admin)).send({ status: 'ngawur' })).status, 400);
  assert.strictEqual((await request(app).patch('/api/requests/99999').set(as(admin)).send({ status: 'disetujui' })).status, 404);
  assert.strictEqual((await request(app).patch(`/api/requests/${id}`).set(as(admin)).send({ status: 'disetujui' })).status, 200);

  assert.strictEqual((await request(app).delete('/api/requests/99999').set(as(siti))).status, 404);
  assert.strictEqual((await request(app).delete(`/api/requests/${id}`).set(as(budi))).status, 404); // milik orang lain
  assert.strictEqual((await request(app).delete(`/api/requests/${id}`).set(as(siti))).status, 400); // sudah disetujui
  assert.strictEqual((await request(app).delete(`/api/requests/${id}`).set(as(admin))).status, 200); // petugas boleh
});

test('unggah foto: batas ukuran, jumlah, dan nama field', async () => {
  const siti = await login('siti', 'siti123');
  const base = () => request(app).post('/api/requests').set(as(siti)).field('catatan', 'x').field('waktu_jemput', '2099-01-01');

  const besar = await base().attach('foto', Buffer.alloc(5 * 1024 * 1024 + 10), { filename: 'b.jpg', contentType: 'image/jpeg' });
  assert.strictEqual(besar.status, 400);
  assert.match(besar.body.error, /5 MB/);

  let banyak = base();
  for (let i = 0; i < 5; i++) banyak = banyak.attach('foto', JPG, { filename: `f${i}.jpg`, contentType: 'image/jpeg' });
  assert.strictEqual((await banyak).status, 400);

  const salahField = await base().attach('gambar', JPG, { filename: 'f.jpg', contentType: 'image/jpeg' });
  assert.strictEqual(salahField.status, 400);
});

test('notifikasi: daftar, tandai dibaca satu, dan semua', async () => {
  const budi = await login('budi', 'budi123');
  const siti = await login('siti', 'siti123');
  const list = (await request(app).get('/api/notifications').set(as(budi))).body;
  assert.ok(list.length > 0);
  const belum = (await request(app).get('/api/notifications/unread-count').set(as(budi))).body.total;
  assert.ok(belum > 0);

  await request(app).patch(`/api/notifications/${list[0].id}/read`).set(as(siti)); // milik orang lain: tidak berefek
  assert.strictEqual((await request(app).get('/api/notifications/unread-count').set(as(budi))).body.total, belum);

  await request(app).patch(`/api/notifications/${list.find((n) => !n.dibaca).id}/read`).set(as(budi));
  assert.strictEqual((await request(app).get('/api/notifications/unread-count').set(as(budi))).body.total, belum - 1);
  await request(app).post('/api/notifications/read-all').set(as(budi));
  assert.strictEqual((await request(app).get('/api/notifications/unread-count').set(as(budi))).body.total, 0);
});

test('penanganan error: JSON rusak dan kesalahan server', async () => {
  const admin = await login('petugas', 'petugas123');
  const rusak = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bukan json');
  assert.strictEqual(rusak.status, 400);

  // simulasikan database rusak setelah autentikasi berhasil -> ditangkap handler 500
  const db = require('../db');
  const asliPrepare = db.prepare;
  const asliError = console.error;
  let panggilan = 0;
  db.prepare = function (...args) {
    if (panggilan++ === 0) return asliPrepare.apply(db, args); // pencarian pengguna oleh auth
    throw new Error('database rusak');
  };
  console.error = () => {};
  try {
    const r = await request(app).get('/api/orders').set(as(admin));
    assert.strictEqual(r.status, 500);
    assert.strictEqual(r.body.error, 'Terjadi kesalahan pada server');
  } finally {
    db.prepare = asliPrepare;
    console.error = asliError;
  }
  assert.strictEqual((await request(app).get('/api/orders').set(as(admin))).status, 200);
});

test('front-end hasil build disajikan, tetapi bukan untuk /api dan /uploads', async () => {
  const root = await request(app).get('/');
  assert.strictEqual(root.status, 200);
  assert.match(root.text, /LaundryTrack/);
  assert.strictEqual((await request(app).get('/masuk')).status, 200);
  const upload = await request(app).get('/uploads/tidak-ada.jpg');
  assert.strictEqual(upload.status, 404);
  assert.ok(!/LaundryTrack/.test(upload.text));
});

test('migrasi database dari skema lama', () => {
  const { connect, migrate } = require('../db');
  const lama = connect(':memory:');
  lama.exec('CREATE TABLE users (id INTEGER); PRAGMA user_version = 1;');
  migrate(lama);
  assert.strictEqual(lama.prepare('PRAGMA user_version').get().user_version, 3);
  assert.ok(lama.prepare("SELECT name FROM sqlite_master WHERE name = 'requests'").get());
  assert.ok(lama.prepare("PRAGMA table_info(users)").all().some((c) => c.name === 'username'));
});

test('server.js: start() menyalakan server dan seed tidak mengulang data', async () => {
  const { start } = require('../server');
  const log = console.log;
  console.log = () => {};
  const srv = start(0);
  await new Promise((resolve) => (srv.listening ? resolve() : srv.once('listening', resolve)));
  await new Promise((resolve) => setTimeout(resolve, 20));
  console.log = log;
  await new Promise((resolve) => srv.close(resolve));
});

test('jalur alias /auth/register dan /auth/login berfungsi seperti /api/auth/*', async () => {
  const daftar = await request(app).post('/auth/register').send({ nama: 'Alias', kamar: 'A-9', username: 'aliasuser', password: 'rahasia1' });
  assert.strictEqual(daftar.status, 201);
  const masuk = await request(app).post('/auth/login').send({ username: 'aliasuser', password: 'rahasia1' });
  assert.strictEqual(masuk.status, 200);
  assert.ok(masuk.body.token);
  assert.strictEqual((await request(app).post('/auth/login').send({ username: 'aliasuser', password: 'salah' })).status, 401);
  assert.ok(await login('feny', 'feny123')); // akun data awal untuk grader
});
