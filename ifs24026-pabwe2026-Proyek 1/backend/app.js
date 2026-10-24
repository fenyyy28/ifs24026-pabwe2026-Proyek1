const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const STATUSES = ['diterima', 'dicuci', 'disetrika', 'siap_diambil', 'selesai'];
const JENIS_KOMPLAIN = ['hilang', 'tertukar', 'terlambat', 'lainnya'];
const HARGA_PER_KG = 5000;

const LATE = `CASE WHEN o.status NOT IN ('siap_diambil','selesai')
  AND o.estimasi_selesai < date('now','localtime') THEN 1 ELSE 0 END`;
const ORDER_SELECT = `SELECT o.*, u.nama, u.kamar, ${LATE} AS terlambat
  FROM orders o JOIN users u ON u.id = o.user_id`;

const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---------- STATS ----------
app.get('/api/stats', (req, res) => {
  const one = (sql) => db.prepare(sql).get().c;
  res.json({
    total_order: one('SELECT COUNT(*) c FROM orders'),
    aktif: one("SELECT COUNT(*) c FROM orders WHERE status != 'selesai'"),
    terlambat: one(`SELECT COUNT(*) c FROM orders o WHERE ${LATE} = 1`),
    komplain_terbuka: one("SELECT COUNT(*) c FROM complaints WHERE status != 'selesai'"),
  });
});

// ---------- USERS ----------
app.get('/api/users', (req, res) => {
  res.json(db.prepare('SELECT * FROM users ORDER BY nama').all());
});

app.post('/api/users', (req, res) => {
  const { nama, kamar, kontak } = req.body;
  if (!nama || !kamar) return bad(res, 'Nama dan kamar wajib diisi');
  const r = db.prepare('INSERT INTO users(nama,kamar,kontak) VALUES (?,?,?)').run(nama, kamar, kontak || null);
  res.status(201).json(db.prepare('SELECT * FROM users WHERE id=?').get(r.lastInsertRowid));
});

app.put('/api/users/:id', (req, res) => {
  const { nama, kamar, kontak } = req.body;
  if (!nama || !kamar) return bad(res, 'Nama dan kamar wajib diisi');
  const r = db.prepare('UPDATE users SET nama=?, kamar=?, kontak=? WHERE id=?').run(nama, kamar, kontak || null, req.params.id);
  if (!r.changes) return bad(res, 'Penghuni tidak ditemukan', 404);
  res.json(db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id));
});

app.delete('/api/users/:id', (req, res) => {
  const r = db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  if (!r.changes) return bad(res, 'Penghuni tidak ditemukan', 404);
  res.json({ ok: true });
});

// ---------- ORDERS ----------
app.get('/api/orders', (req, res) => {
  const { status, terlambat, q } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('o.status = ?'); params.push(status); }
  if (terlambat === '1') where.push(`${LATE} = 1`);
  if (q) { where.push('(o.kode LIKE ? OR u.nama LIKE ? OR u.kamar LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const sql = `${ORDER_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.id DESC`;
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(req.params.id);
  if (!order) return bad(res, 'Order tidak ditemukan', 404);
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id=? ORDER BY id').all(order.id);
  order.complaints = db.prepare('SELECT * FROM complaints WHERE order_id=? ORDER BY id DESC').all(order.id);
  res.json(order);
});

const createOrder = db.transaction((b) => {
  const berat = Number(b.berat_kg) || 0;
  const r = db.prepare('INSERT INTO orders(kode,user_id,estimasi_selesai,berat_kg,total_harga) VALUES (?,?,?,?,?)')
    .run('TMP' + Date.now() + Math.random(), b.user_id, b.estimasi_selesai, berat, Math.round(berat * HARGA_PER_KG));
  const id = r.lastInsertRowid;
  const kode = 'LDR-' + String(id).padStart(4, '0');
  db.prepare('UPDATE orders SET kode=? WHERE id=?').run(kode, id);
  const ins = db.prepare('INSERT INTO order_items(order_id,jenis,jumlah,warna,catatan) VALUES (?,?,?,?,?)');
  for (const i of b.items) ins.run(id, i.jenis, Number(i.jumlah) || 1, i.warna || null, i.catatan || null);
  return id;
});

app.post('/api/orders', (req, res) => {
  const b = req.body;
  if (!b.user_id || !b.estimasi_selesai) return bad(res, 'Penghuni dan estimasi selesai wajib diisi');
  if (!db.prepare('SELECT id FROM users WHERE id=?').get(b.user_id)) return bad(res, 'Penghuni tidak ditemukan', 404);
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.some((i) => !i.jenis))
    return bad(res, 'Minimal satu item pakaian dengan jenis terisi');
  const id = createOrder(b);
  res.status(201).json({ id });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return bad(res, 'Status tidak valid');
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return bad(res, 'Order tidak ditemukan', 404);
  if (status === 'selesai') {
    const belum = db.prepare('SELECT COUNT(*) c FROM order_items WHERE order_id=? AND dikembalikan=0').get(order.id).c;
    if (belum > 0) return bad(res, `Masih ada ${belum} item yang belum dicek saat pengembalian`);
  }
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, order.id);
  res.json({ ok: true, status });
});

app.delete('/api/orders/:id', (req, res) => {
  const r = db.prepare('DELETE FROM orders WHERE id=?').run(req.params.id);
  if (!r.changes) return bad(res, 'Order tidak ditemukan', 404);
  res.json({ ok: true });
});

// ---------- ITEMS ----------
app.patch('/api/items/:id', (req, res) => {
  const val = req.body.dikembalikan ? 1 : 0;
  const r = db.prepare('UPDATE order_items SET dikembalikan=? WHERE id=?').run(val, req.params.id);
  if (!r.changes) return bad(res, 'Item tidak ditemukan', 404);
  res.json({ ok: true, dikembalikan: val });
});

// ---------- COMPLAINTS ----------
app.get('/api/complaints', (req, res) => {
  res.json(db.prepare(`SELECT c.*, o.kode, u.nama, u.kamar FROM complaints c
    JOIN orders o ON o.id=c.order_id JOIN users u ON u.id=o.user_id ORDER BY c.id DESC`).all());
});

app.post('/api/complaints', (req, res) => {
  const { order_id, jenis, deskripsi } = req.body;
  if (!order_id || !deskripsi) return bad(res, 'Order dan deskripsi wajib diisi');
  if (!JENIS_KOMPLAIN.includes(jenis)) return bad(res, 'Jenis komplain tidak valid');
  if (!db.prepare('SELECT id FROM orders WHERE id=?').get(order_id)) return bad(res, 'Order tidak ditemukan', 404);
  const r = db.prepare('INSERT INTO complaints(order_id,jenis,deskripsi) VALUES (?,?,?)').run(order_id, jenis, deskripsi);
  res.status(201).json({ id: r.lastInsertRowid });
});

app.patch('/api/complaints/:id', (req, res) => {
  const { status } = req.body;
  if (!['baru', 'diproses', 'selesai'].includes(status)) return bad(res, 'Status tidak valid');
  const r = db.prepare('UPDATE complaints SET status=? WHERE id=?').run(status, req.params.id);
  if (!r.changes) return bad(res, 'Komplain tidak ditemukan', 404);
  res.json({ ok: true });
});

app.delete('/api/complaints/:id', (req, res) => {
  const r = db.prepare('DELETE FROM complaints WHERE id=?').run(req.params.id);
  if (!r.changes) return bad(res, 'Komplain tidak ditemukan', 404);
  res.json({ ok: true });
});

// ---------- ERROR ----------
app.use((req, res) => bad(res, 'Endpoint tidak ditemukan', 404));
app.use((err, req, res, next) => {
  console.error(err);
  bad(res, 'Terjadi kesalahan pada server', 500);
});

module.exports = app;
