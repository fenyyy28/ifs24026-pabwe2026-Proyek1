process.env.DB_PATH = ':memory:';
const fs = require('fs');
const os = require('os');
const path = require('path');
const UPLOADS = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-cov-'));
process.env.UPLOAD_DIR = UPLOADS;

const { test } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');
const db = require('../db');
db.seed();

// ---------- helper ----------
const tokens = {};
async function login(username, password) {
  if (!tokens[username]) {
    tokens[username] = (await request(app).post('/api/auth/login').send({ username, password })).body.token;
  }
  return tokens[username];
}
const admin = () => login('petugas', 'petugas123');
const budi = () => login('budi', 'budi123');
const siti = () => login('siti', 'siti123');
const andre = () => login('andre', 'andre123');
const as = (token) => ({ Authorization: `Bearer ${token}` });
const idOf = (username) => db.prepare('SELECT id FROM users WHERE username=?').get(username).id;

async function until(fn, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (fn()) return true;
    await new Promise((r) => setTimeout(r, 10));
  }
  return fn();
}

const JPG = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64');
const jpg = (name = 'f.jpg') => ({ filename: name, contentType: 'image/jpeg' });

async function newRequest(token, body = {}) {
  const r = await request(app).post('/api/requests').set(as(token))
    .send({ catatan: 'cucian kotor', waktu_jemput: '2099-01-01', ...body });
  assert.strictEqual(r.status, 201);
  return r.body.id;
}

// ---------- health & 404 ----------
test('health check dan endpoint tidak dikenal', async () => {
  assert.deepStrictEqual((await request(app).get('/api/health')).body, { ok: true });
  const t = await admin();
  const r = await request(app).get('/api/tidak-ada').set(as(t));
  assert.strictEqual(r.status, 404);
  assert.strictEqual(r.body.error, 'Endpoint tidak ditemukan');
  assert.strictEqual((await request(app).get('/bukan-api')).status, 404);
});

// ---------- auth ----------
test('register: semua validasi dan normalisasi input', async () => {
  const post = (b) => request(app).post('/api/auth/register').send(b);
  assert.strictEqual((await post({ kamar: 'E-1', username: 'warga1', password: 'rahasia1' })).status, 400);
  assert.strictEqual((await post({ nama: 'Warga', username: 'warga1', password: 'rahasia1' })).status, 400);
  assert.strictEqual((await post({ nama: 'Warga', kamar: 'E-1', password: 'rahasia1' })).status, 400);
  assert.strictEqual((await post({ nama: 'Warga', kamar: 'E-1', username: 'a!', password: 'rahasia1' })).status, 400);
  assert.strictEqual((await post({ nama: 'Warga', kamar: 'E-1', username: 'warga1' })).status, 400);
  assert.strictEqual((await post({ nama: 'Warga', kamar: 'E-1', username: 'warga1', password: 'abc' })).status, 400);

  const ok = await post({ nama: ' Warga Satu ', kamar: ' E-5 ', kontak: '0812', username: 'WARGA1', password: 'rahasia1' });
  assert.strictEqual(ok.status, 201);
  assert.strictEqual(ok.body.user.nama, 'Warga Satu');
  assert.strictEqual(ok.body.user.kamar, 'E-5');
  assert.strictEqual(ok.body.user.username, 'warga1');
  assert.strictEqual(ok.body.user.kontak, '0812');

  const tanpaKontak = await post({ nama: 'Warga Dua', kamar: 'E-6', username: 'warga2', password: 'rahasia1' });
  assert.strictEqual(tanpaKontak.status, 201);
  assert.strictEqual(tanpaKontak.body.user.kontak, null);
});

test('login: body kosong, tanpa password, dan password salah ditolak', async () => {
  assert.strictEqual((await request(app).post('/api/auth/login').send({})).status, 401);
  assert.strictEqual((await request(app).post('/api/auth/login').send({ username: 'budi' })).status, 401);
  assert.strictEqual((await request(app).post('/api/auth/login').send({ username: 'budi', password: 'salah' })).status, 401);
  const ok = await request(app).post('/api/auth/login').send({ username: ' BUDI ', password: 'budi123' });
  assert.strictEqual(ok.status, 200);
  assert.ok(!('password_hash' in ok.body.user));
});

test('GET /api/auth/me mengembalikan pengguna yang sedang masuk', async () => {
  const r = await request(app).get('/api/auth/me').set(as(await budi()));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.username, 'budi');
});

test('token tidak valid ditolak: bukan Bearer, token rusak, dan pengguna sudah dihapus', async () => {
  assert.strictEqual((await request(app).get('/api/auth/me').set({ Authorization: 'Basic abc' })).status, 401);
  assert.strictEqual((await request(app).get('/api/auth/me').set({ Authorization: 'Bearer rusak' })).status, 401);

  const reg = await request(app).post('/api/auth/register').send({ nama: 'Hantu', kamar: 'X-1', username: 'hantu', password: 'rahasia1' });
  const t = reg.body.token;
  assert.strictEqual((await request(app).get('/api/auth/me').set(as(t))).status, 200);
  assert.strictEqual((await request(app).delete(`/api/users/${reg.body.user.id}`).set(as(await admin()))).status, 200);
  assert.strictEqual((await request(app).get('/api/auth/me').set(as(t))).status, 401);
});

// ---------- stats ----------
test('statistik untuk petugas dan penghuni', async () => {
  const a = await request(app).get('/api/stats').set(as(await admin()));
  assert.strictEqual(a.status, 200);
  for (const k of ['total_order', 'aktif', 'siap_diambil', 'terlambat', 'komplain_terbuka', 'permintaan']) {
    assert.strictEqual(typeof a.body[k], 'number');
  }
  assert.ok(a.body.total_order >= 4);
  assert.ok(a.body.terlambat >= 1);

  const b = await request(app).get('/api/stats').set(as(await budi()));
  assert.strictEqual(b.status, 200);
  assert.strictEqual(b.body.total_order, 2);
  assert.strictEqual(b.body.siap_diambil, 1);
  assert.ok(b.body.total_order < a.body.total_order);
});

// ---------- users ----------
test('kelola penghuni: daftar, ubah, hapus', async () => {
  const a = await admin();
  assert.strictEqual((await request(app).get('/api/users').set(as(await budi()))).status, 403);
  const list = await request(app).get('/api/users').set(as(a));
  assert.strictEqual(list.status, 200);
  assert.ok(list.body.length >= 3 && list.body.every((u) => u.username !== 'petugas'));

  const sitiId = idOf('siti');
  const put = (id, body, token = a) => request(app).put(`/api/users/${id}`).set(as(token)).send(body);
  assert.strictEqual((await put(sitiId, { kamar: 'B-1' })).status, 400);
  assert.strictEqual((await put(sitiId, { nama: 'Siti' })).status, 400);
  assert.strictEqual((await put(9999, { nama: 'X', kamar: 'Y' })).status, 404);
  assert.strictEqual((await put(idOf('petugas'), { nama: 'X', kamar: 'Y' })).status, 404);

  assert.strictEqual((await put(sitiId, { nama: 'Siti Aminah', kamar: 'B-206', kontak: '0899' })).status, 200);
  let siti1 = (await request(app).get('/api/users').set(as(a))).body.find((u) => u.id === sitiId);
  assert.strictEqual(siti1.kamar, 'B-206');
  assert.strictEqual(siti1.kontak, '0899');
  assert.strictEqual((await put(sitiId, { nama: 'Siti Aminah', kamar: 'B-205' })).status, 200);
  siti1 = (await request(app).get('/api/users').set(as(a))).body.find((u) => u.id === sitiId);
  assert.strictEqual(siti1.kontak, null);

  const reg = await request(app).post('/api/auth/register').send({ nama: 'Hapus Aku', kamar: 'Z-1', username: 'hapusaku', password: 'rahasia1' });
  const del = (id) => request(app).delete(`/api/users/${id}`).set(as(a));
  assert.strictEqual((await del(reg.body.user.id)).status, 200);
  assert.strictEqual((await del(reg.body.user.id)).status, 404);
  assert.strictEqual((await del(idOf('petugas'))).status, 404);
});

// ---------- orders ----------
test('daftar order: filter status, terlambat, dan pencarian', async () => {
  const a = await admin();
  const get = (qs, token = a) => request(app).get(`/api/orders${qs}`).set(as(token));

  const semua = (await get('')).body;
  assert.ok(semua.length >= 4);

  const dicuci = (await get('?status=dicuci')).body;
  assert.ok(dicuci.length >= 1 && dicuci.every((o) => o.status === 'dicuci'));

  const telat = (await get('?terlambat=1')).body;
  assert.ok(telat.length >= 1 && telat.every((o) => o.terlambat === 1));

  const cari = (await get('?q=LDR-0002')).body;
  assert.ok(cari.some((o) => o.kode === 'LDR-0002'));
  assert.ok((await get('?q=Siti')).body.every((o) => o.nama === 'Siti Aminah'));
  assert.deepStrictEqual((await get('?q=zzzzzz')).body, []);

  const gabungan = (await get('?status=dicuci&terlambat=1&q=Budi')).body;
  assert.ok(gabungan.length >= 1);

  const milikBudi = (await get('?status=siap_diambil', await budi())).body;
  assert.ok(milikBudi.length >= 1 && milikBudi.every((o) => o.nama === 'Budi Santoso'));
});

test('detail order: petugas boleh melihat semua, order tidak ada -> 404', async () => {
  const a = await admin();
  const ok = await request(app).get('/api/orders/1').set(as(a));
  assert.strictEqual(ok.status, 200);
  assert.ok(Array.isArray(ok.body.items) && Array.isArray(ok.body.riwayat) && Array.isArray(ok.body.complaints));
  assert.deepStrictEqual(ok.body.foto, []);
  assert.strictEqual((await request(app).get('/api/orders/9999').set(as(a))).status, 404);
});

test('buat order: validasi input', async () => {
  const a = await admin();
  const post = (b) => request(app).post('/api/orders').set(as(a)).send(b);
  const items = [{ jenis: 'Kaos' }];
  const budiId = idOf('budi');

  assert.strictEqual((await request(app).post('/api/orders').set(as(await budi())).send({})).status, 403);
  assert.strictEqual((await post({})).status, 400);
  assert.strictEqual((await post({ user_id: budiId, items })).status, 400);
  assert.strictEqual((await post({ user_id: 9999, estimasi_selesai: '2099-01-01', items })).status, 404);
  assert.strictEqual((await post({ user_id: idOf('petugas'), estimasi_selesai: '2099-01-01', items })).status, 404);
  assert.strictEqual((await post({ user_id: budiId, estimasi_selesai: '2099-01-01' })).status, 400);
  assert.strictEqual((await post({ user_id: budiId, estimasi_selesai: '2099-01-01', items: [] })).status, 400);
  assert.strictEqual((await post({ user_id: budiId, estimasi_selesai: '2099-01-01', items: [{ jenis: '' }] })).status, 400);
});

test('buat order dari permintaan jemput: cocok, ditolak, dan sudah jadi order', async () => {
  const a = await admin();
  const post = (b) => request(app).post('/api/orders').set(as(a)).send(b);
  const sitiId = idOf('siti');
  const base = { estimasi_selesai: '2099-01-01', items: [{ jenis: 'Kaos' }] };

  assert.strictEqual((await post({ ...base, user_id: sitiId, request_id: 9999 })).status, 400);
  // permintaan seed milik siti, tetapi dipakai untuk budi
  assert.strictEqual((await post({ ...base, user_id: idOf('budi'), request_id: 1 })).status, 400);

  const ditolak = await newRequest(await siti());
  assert.strictEqual((await request(app).patch(`/api/requests/${ditolak}`).set(as(a)).send({ status: 'ditolak' })).status, 200);
  assert.strictEqual((await post({ ...base, user_id: sitiId, request_id: ditolak })).status, 400);

  const baru = await newRequest(await siti());
  assert.strictEqual((await post({ ...base, user_id: sitiId, request_id: baru })).status, 201);
  assert.strictEqual((await post({ ...base, user_id: sitiId, request_id: baru })).status, 400);
});

test('siklus order: nilai bawaan item, semua status, centang item, selesai, hapus', async () => {
  const a = await admin();
  const b = await budi();
  const created = await request(app).post('/api/orders').set(as(a)).send({
    user_id: idOf('budi'), estimasi_selesai: '2099-01-01',
    items: [{ jenis: 'Kaos' }, { jenis: 'Jaket', jumlah: '3', warna: 'Hitam', catatan: 'Kancing lepas' }],
  });
  assert.strictEqual(created.status, 201);
  const id = created.body.id;

  let detail = (await request(app).get(`/api/orders/${id}`).set(as(a))).body;
  assert.strictEqual(detail.berat_kg, 0);
  assert.strictEqual(detail.total_harga, 0);
  assert.strictEqual(detail.items[0].jumlah, 1);
  assert.strictEqual(detail.items[0].warna, null);
  assert.strictEqual(detail.items[0].catatan, null);
  assert.strictEqual(detail.items[1].jumlah, 3);
  assert.strictEqual(detail.items[1].warna, 'Hitam');

  const patch = (body, oid = id) => request(app).patch(`/api/orders/${oid}/status`).set(as(a)).send(body);
  assert.strictEqual((await patch({ status: 'tidak-valid' })).status, 400);
  assert.strictEqual((await patch({ status: 'dicuci' }, 9999)).status, 404);

  // status yang sama tidak menambah riwayat
  assert.strictEqual((await patch({ status: 'diterima' })).status, 200);
  detail = (await request(app).get(`/api/orders/${id}`).set(as(a))).body;
  assert.strictEqual(detail.riwayat.length, 1);

  for (const s of ['dicuci', 'disetrika', 'siap_diambil']) assert.strictEqual((await patch({ status: s })).status, 200);
  const judul = (await request(app).get('/api/notifications').set(as(b))).body.filter((n) => n.order_id === id).map((n) => n.judul);
  for (const j of ['Cucian diterima', 'Cucian sedang dicuci', 'Cucian sedang disetrika', 'Cucian siap diambil']) {
    assert.ok(judul.includes(j), j);
  }

  const belum = await patch({ status: 'selesai' });
  assert.strictEqual(belum.status, 400);
  assert.match(belum.body.error, /Masih ada 2 item/);

  const item = (iid, body, token = a) => request(app).patch(`/api/items/${iid}`).set(as(token)).send(body);
  assert.strictEqual((await item(detail.items[0].id, { dikembalikan: true }, b)).status, 403);
  assert.strictEqual((await item(9999, { dikembalikan: true })).status, 404);
  const off = await item(detail.items[0].id, { dikembalikan: false });
  assert.strictEqual(off.body.dikembalikan, 0);
  const on0 = await item(detail.items[0].id, { dikembalikan: true });
  assert.strictEqual(on0.body.dikembalikan, 1);
  await item(detail.items[1].id, { dikembalikan: true });

  assert.strictEqual((await patch({ status: 'selesai' })).status, 200);
  const judul2 = (await request(app).get('/api/notifications').set(as(b))).body.filter((n) => n.order_id === id).map((n) => n.judul);
  assert.ok(judul2.includes('Cucian sudah diterima'));

  assert.strictEqual((await request(app).delete(`/api/orders/${id}`).set(as(b))).status, 403);
  assert.strictEqual((await request(app).delete(`/api/orders/${id}`).set(as(a))).status, 200);
  assert.strictEqual((await request(app).delete(`/api/orders/${id}`).set(as(a))).status, 404);
  assert.strictEqual((await request(app).get(`/api/orders/${id}`).set(as(a))).status, 404);
});

// ---------- complaints ----------
test('komplain: validasi, daftar, tanggapan, dan hapus', async () => {
  const a = await admin();
  const b = await budi();
  const post = (body, token = b) => request(app).post('/api/complaints').set(as(token)).send(body);

  assert.strictEqual((await post({ order_id: 1, jenis: 'hilang', deskripsi: 'x' }, a)).status, 403);
  assert.strictEqual((await post({ jenis: 'hilang', deskripsi: 'x' })).status, 400);
  assert.strictEqual((await post({ order_id: 1, jenis: 'hilang' })).status, 400);
  assert.strictEqual((await post({ order_id: 1, jenis: 'rusak', deskripsi: 'x' })).status, 400);
  assert.strictEqual((await post({ order_id: 1, deskripsi: 'x' })).status, 400);
  assert.strictEqual((await post({ order_id: 2, jenis: 'hilang', deskripsi: 'x' })).status, 404);

  const c = await post({ order_id: 1, jenis: 'tertukar', deskripsi: 'Kemeja bukan punya saya' });
  assert.strictEqual(c.status, 201);
  const cid = c.body.id;

  const notifAdmin = (await request(app).get('/api/notifications').set(as(a))).body;
  assert.ok(notifAdmin.some((n) => n.judul === 'Komplain baru' && n.pesan.includes('Budi Santoso') && n.pesan.includes('tertukar')));

  const semua = (await request(app).get('/api/complaints').set(as(a))).body;
  assert.ok(semua.some((x) => x.id === cid));
  const milik = (await request(app).get('/api/complaints').set(as(b))).body;
  assert.ok(milik.length >= 1 && milik.every((x) => x.nama === 'Budi Santoso'));
  const lain = (await request(app).get('/api/complaints').set(as(await siti()))).body;
  assert.ok(!lain.some((x) => x.id === cid));

  const patch = (id, body) => request(app).patch(`/api/complaints/${id}`).set(as(a)).send(body);
  assert.strictEqual((await patch(cid, { status: 'baru' })).status, 400);
  assert.strictEqual((await patch(9999, { status: 'selesai' })).status, 404);

  assert.strictEqual((await patch(cid, { status: 'ditangani', tanggapan: 'Sedang dicek' })).status, 200);
  // tanpa tanggapan baru -> tanggapan lama dipertahankan
  assert.strictEqual((await patch(cid, { status: 'diajukan' })).status, 200);
  const after = (await request(app).get('/api/complaints').set(as(b))).body.find((x) => x.id === cid);
  assert.strictEqual(after.status, 'diajukan');
  assert.strictEqual(after.tanggapan, 'Sedang dicek');

  const pesan = (await request(app).get('/api/notifications').set(as(b))).body.map((n) => n.pesan);
  assert.ok(pesan.some((p) => p.includes('Tanggapan petugas: Sedang dicek')));
  assert.ok(pesan.some((p) => p.includes('Komplain kamu tercatat dan menunggu petugas.') && !p.includes('Tanggapan petugas')));

  assert.strictEqual((await request(app).delete(`/api/complaints/${cid}`).set(as(b))).status, 403);
  assert.strictEqual((await request(app).delete(`/api/complaints/${cid}`).set(as(a))).status, 200);
  assert.strictEqual((await request(app).delete(`/api/complaints/${cid}`).set(as(a))).status, 404);
});

// ---------- requests ----------
test('daftar permintaan: kosong, milik sendiri, dan semua untuk petugas', async () => {
  const baru = await request(app).post('/api/auth/register').send({ nama: 'Kosong', kamar: 'K-1', username: 'kosong', password: 'rahasia1' });
  const kosong = await request(app).get('/api/requests').set(as(baru.body.token));
  assert.deepStrictEqual(kosong.body, []);

  const id = await newRequest(await andre());
  const milik = (await request(app).get('/api/requests').set(as(await andre()))).body;
  assert.ok(milik.length >= 1 && milik.every((r) => r.nama === 'Andre Silalahi'));
  assert.deepStrictEqual(milik.find((r) => r.id === id).foto, []);
  const semua = (await request(app).get('/api/requests').set(as(await admin()))).body;
  assert.ok(semua.some((r) => r.nama === 'Siti Aminah') && semua.some((r) => r.id === id));
});

test('ajukan permintaan: validasi dan pembersihan foto bila gagal', async () => {
  const s = await siti();
  const post = (token = s) => request(app).post('/api/requests').set(as(token));

  assert.strictEqual((await post(await admin()).send({ catatan: 'x', waktu_jemput: '2099-01-01' })).status, 403);
  assert.strictEqual((await post().send({ waktu_jemput: '2099-01-01' })).status, 400);
  assert.strictEqual((await post().send({ catatan: '   ', waktu_jemput: '2099-01-01' })).status, 400);
  assert.strictEqual((await post().send({ catatan: 'cucian' })).status, 400);

  // foto yang sudah terunggah dihapus kembali bila data tidak lengkap
  const sebelum = fs.readdirSync(UPLOADS).length;
  const gagal = await post().field('waktu_jemput', '2099-01-01').attach('foto', JPG, jpg());
  assert.strictEqual(gagal.status, 400);
  assert.ok(await until(() => fs.readdirSync(UPLOADS).length === sebelum));

  const ok = await post().field('catatan', '  3 kaos  ').field('waktu_jemput', '2099-01-01')
    .attach('foto', JPG, jpg('a.jpg')).attach('foto', JPG, jpg('b.jpg'));
  assert.strictEqual(ok.status, 201);
  const mine = (await request(app).get('/api/requests').set(as(s))).body.find((r) => r.id === ok.body.id);
  assert.strictEqual(mine.catatan, '3 kaos');
  assert.strictEqual(mine.foto.length, 2);

  const notif = (await request(app).get('/api/notifications').set(as(await admin()))).body;
  assert.ok(notif.some((n) => n.judul === 'Permintaan jemput baru' && n.pesan.includes('Siti Aminah')));
});

test('petugas memproses permintaan jemput', async () => {
  const a = await admin();
  const id = await newRequest(await andre());
  const patch = (rid, body) => request(app).patch(`/api/requests/${rid}`).set(as(a)).send(body);

  assert.strictEqual((await patch(id, { status: 'diorder' })).status, 400);
  assert.strictEqual((await patch(9999, { status: 'disetujui' })).status, 404);

  assert.strictEqual((await patch(id, { status: 'disetujui', tanggapan: 'Dijemput jam 4' })).status, 200);
  assert.strictEqual((await patch(id, { status: 'ditolak' })).status, 200);

  const mine = (await request(app).get('/api/requests').set(as(await andre()))).body.find((r) => r.id === id);
  assert.strictEqual(mine.status, 'ditolak');
  assert.strictEqual(mine.tanggapan, null);

  const pesan = (await request(app).get('/api/notifications').set(as(await andre()))).body.map((n) => n.pesan);
  assert.ok(pesan.some((p) => p.includes('Catatan petugas: Dijemput jam 4')));
  assert.ok(pesan.some((p) => p === 'Permintaan jemput kamu belum bisa diterima.'));

  // permintaan yang sudah jadi order tidak bisa diubah lagi
  const diorder = await newRequest(await andre());
  await request(app).post('/api/orders').set(as(a)).send({
    user_id: idOf('andre'), estimasi_selesai: '2099-01-01', items: [{ jenis: 'Kaos' }], request_id: diorder,
  });
  assert.strictEqual((await patch(diorder, { status: 'disetujui' })).status, 400);
  const lihat = (await request(app).get('/api/requests').set(as(a))).body.find((r) => r.id === diorder);
  assert.ok(lihat.order_kode);
});

test('batalkan atau hapus permintaan jemput', async () => {
  const a = await admin();
  const s = await siti();
  const del = (id, token) => request(app).delete(`/api/requests/${id}`).set(as(token));

  assert.strictEqual((await del(9999, s)).status, 404);
  assert.strictEqual((await del(await newRequest(await andre()), s)).status, 404);

  // penghuni tidak bisa membatalkan yang sudah diproses, petugas bisa menghapus
  const diproses = await newRequest(s);
  await request(app).patch(`/api/requests/${diproses}`).set(as(a)).send({ status: 'disetujui' });
  assert.strictEqual((await del(diproses, s)).status, 400);
  assert.strictEqual((await del(diproses, a)).status, 200);

  // hapus permintaan beserta fotonya
  const dengan = await request(app).post('/api/requests').set(as(s))
    .field('catatan', 'ada foto').field('waktu_jemput', '2099-01-01').attach('foto', JPG, jpg());
  const sebelum = fs.readdirSync(UPLOADS).length;
  assert.strictEqual((await del(dengan.body.id, s)).status, 200);
  assert.ok(await until(() => fs.readdirSync(UPLOADS).length === sebelum - 1));
});

// ---------- board & notifications ----------
test('papan cucian untuk petugas dan penghuni', async () => {
  const a = (await request(app).get('/api/board').set(as(await admin()))).body;
  assert.ok(a.length >= 1 && a.every((b) => b.milikku === 0));
  const b = (await request(app).get('/api/board').set(as(await budi()))).body;
  assert.ok(b.some((x) => x.milikku === 1) && b.some((x) => x.milikku === 0));
  assert.ok(b.every((x) => x.status !== 'selesai'));
});

test('notifikasi: daftar, jumlah belum dibaca, tandai satu, tandai semua', async () => {
  const bt = await budi();
  const list = (await request(app).get('/api/notifications').set(as(bt))).body;
  assert.ok(list.length >= 1 && list.some((n) => n.dibaca === 0));
  const count = async () => (await request(app).get('/api/notifications/unread-count').set(as(bt))).body.total;
  const awal = await count();
  assert.ok(awal >= 1);

  const target = list.find((n) => n.dibaca === 0);
  assert.strictEqual((await request(app).patch(`/api/notifications/${target.id}/read`).set(as(bt))).status, 200);
  assert.strictEqual(await count(), awal - 1);

  // menandai notifikasi milik orang lain tidak berpengaruh
  const milikSiti = db.prepare('SELECT id FROM notifications WHERE user_id=? AND dibaca=0').get(idOf('siti'));
  assert.ok(milikSiti);
  assert.strictEqual((await request(app).patch(`/api/notifications/${milikSiti.id}/read`).set(as(bt))).status, 200);
  assert.strictEqual(db.prepare('SELECT dibaca FROM notifications WHERE id=?').get(milikSiti.id).dibaca, 0);

  assert.strictEqual((await request(app).post('/api/notifications/read-all').set(as(bt))).status, 200);
  assert.strictEqual(await count(), 0);
});

// ---------- penanganan error ----------
test('error unggah foto: terlalu besar, terlalu banyak, field salah, bukan gambar', async (t) => {
  const s = await siti();
  const base = () => request(app).post('/api/requests').set(as(s)).field('catatan', 'x').field('waktu_jemput', '2099-01-01');

  const besar = await base().attach('foto', Buffer.alloc(5 * 1024 * 1024 + 16), jpg('besar.jpg'));
  assert.strictEqual(besar.status, 400);
  assert.strictEqual(besar.body.error, 'Ukuran setiap foto maksimal 5 MB');

  let banyak = base();
  for (let i = 0; i < 5; i++) banyak = banyak.attach('foto', JPG, jpg(`f${i}.jpg`));
  const rb = await banyak;
  assert.strictEqual(rb.status, 400);
  assert.strictEqual(rb.body.error, 'Maksimal 4 foto per permintaan');

  const salah = await base().attach('berkas', JPG, jpg());
  assert.strictEqual(salah.status, 400);
  assert.strictEqual(salah.body.error, 'Maksimal 4 foto per permintaan');

  const txt = await base().attach('foto', Buffer.from('bukan gambar'), { filename: 'a.txt', contentType: 'text/plain' });
  assert.strictEqual(txt.status, 400);
  assert.match(txt.body.error, /JPG, PNG, atau WebP/);

  // kesalahan tak terduga (JSON rusak) menjadi 500 dan dicatat ke console.error
  const err = t.mock.method(console, 'error', () => {});
  const rusak = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{rusak');
  assert.strictEqual(rusak.status, 500);
  assert.strictEqual(rusak.body.error, 'Terjadi kesalahan pada server');
  assert.strictEqual(err.mock.calls.length, 1);
});