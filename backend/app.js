const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const cors = require('cors');
const db = require('./db');
const { hashPassword, verifyPassword } = require('./security');
const { sign, auth, adminOnly } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- UPLOAD FOTO ----------
const UPLOAD_DIR = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads'));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
class UploadError extends Error {}
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(new UploadError('Foto harus berupa JPG, PNG, atau WebP')),
});
const removeFiles = (names) => names.forEach((n) => fs.unlink(path.join(UPLOAD_DIR, n), () => {}));
app.use('/uploads', express.static(UPLOAD_DIR));

const STATUSES = ['diterima', 'dicuci', 'disetrika', 'siap_diambil', 'selesai'];
const COMPLAINT_STATUSES = ['diajukan', 'ditangani', 'selesai'];
const JENIS_KOMPLAIN = ['hilang', 'tertukar', 'terlambat', 'lainnya'];
const HARGA_PER_KG = 5000;

const NOTIF = {
  diterima: ['Cucian diterima', (k) => `Cucian ${k} sudah diterima petugas dan menunggu giliran dicuci.`],
  dicuci: ['Cucian sedang dicuci', (k) => `Cucian ${k} sedang dicuci.`],
  disetrika: ['Cucian sedang disetrika', (k) => `Cucian ${k} sudah dicuci dan sekarang sedang disetrika.`],
  siap_diambil: ['Cucian siap diambil', (k) => `Cucian ${k} sudah selesai. Silakan ambil dan cek pakaian bersama petugas.`],
  selesai: ['Cucian sudah diterima', (k) => `Cucian ${k} sudah kamu terima kembali. Terima kasih!`],
};
const COMPLAINT_NOTIF = {
  diajukan: 'Komplain kamu tercatat dan menunggu petugas.',
  ditangani: 'Komplain kamu sedang ditangani petugas.',
  selesai: 'Komplain kamu sudah diselesaikan.',
};

const LATE = `CASE WHEN o.status NOT IN ('siap_diambil','selesai')
  AND o.estimasi_selesai < date('now','localtime') THEN 1 ELSE 0 END`;
const ORDER_SELECT = `SELECT o.*, u.nama, u.kamar, ${LATE} AS terlambat
  FROM orders o JOIN users u ON u.id = o.user_id`;

const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const isAdmin = (req) => req.user.role === 'admin';

function notify(userId, judul, pesan, orderId = null) {
  db.prepare('INSERT INTO notifications(user_id,order_id,judul,pesan) VALUES (?,?,?,?)').run(userId, orderId, judul, pesan);
}
const logStatus = (orderId, status) =>
  db.prepare('INSERT INTO status_log(order_id,status) VALUES (?,?)').run(orderId, status);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---------- AUTH ----------
const register = (req, res) => {
  const { nama, kamar, kontak, password } = req.body;
  const username = String(req.body.username || '').trim().toLowerCase();
  if (!nama || !kamar) return bad(res, 'Nama dan nomor kamar wajib diisi');
  if (!/^[a-z0-9_.]{3,20}$/.test(username)) return bad(res, 'Username 3-20 karakter: huruf, angka, titik, atau garis bawah');
  if (!password || password.length < 6) return bad(res, 'Kata sandi minimal 6 karakter');
  if (db.prepare('SELECT id FROM users WHERE username=?').get(username)) return bad(res, 'Username sudah dipakai, coba yang lain', 409);
  const r = db.prepare('INSERT INTO users(nama,kamar,kontak,username,password_hash,role) VALUES (?,?,?,?,?,?)')
    .run(nama.trim(), kamar.trim(), kontak || null, username, hashPassword(password), 'penghuni');
  const user = db.prepare('SELECT id,nama,kamar,kontak,username,role FROM users WHERE id=?').get(r.lastInsertRowid);
  res.status(201).json({ token: sign(user), user });
};
app.post('/api/auth/register', register);
app.post('/auth/register', register);

const login = (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!row || !verifyPassword(String(req.body.password || ''), row.password_hash))
    return bad(res, 'Username atau kata sandi salah', 401);
  const { password_hash, ...user } = row;
  res.json({ token: sign(user), user });
};
app.post('/api/auth/login', login);
app.post('/auth/login', login);

app.get('/api/auth/me', auth, (req, res) => res.json(req.user));

// semua endpoint di bawah ini wajib login
app.use('/api', auth);

// ---------- STATS ----------
app.get('/api/stats', (req, res) => {
  const adm = isAdmin(req);
  const p = adm ? [] : [req.user.id];
  const w = adm ? '' : ' AND o.user_id = ?';
  const one = (sql) => db.prepare(sql).get(...p).c;
  res.json({
    total_order: one(`SELECT COUNT(*) c FROM orders o WHERE 1=1${w}`),
    aktif: one(`SELECT COUNT(*) c FROM orders o WHERE o.status != 'selesai'${w}`),
    siap_diambil: one(`SELECT COUNT(*) c FROM orders o WHERE o.status = 'siap_diambil'${w}`),
    terlambat: one(`SELECT COUNT(*) c FROM orders o WHERE ${LATE} = 1${w}`),
    komplain_terbuka: one(`SELECT COUNT(*) c FROM complaints c JOIN orders o ON o.id=c.order_id
      WHERE c.status != 'selesai'${w}`),
    permintaan: adm
      ? one("SELECT COUNT(*) c FROM requests WHERE status = 'menunggu'")
      : db.prepare("SELECT COUNT(*) c FROM requests WHERE user_id=? AND status IN ('menunggu','disetujui')").get(req.user.id).c,
  });
});

// ---------- USERS (petugas) ----------
app.get('/api/users', adminOnly, (req, res) => {
  res.json(db.prepare("SELECT id,nama,kamar,kontak,username FROM users WHERE role='penghuni' ORDER BY nama").all());
});

app.put('/api/users/:id', adminOnly, (req, res) => {
  const { nama, kamar, kontak } = req.body;
  if (!nama || !kamar) return bad(res, 'Nama dan kamar wajib diisi');
  const r = db.prepare("UPDATE users SET nama=?, kamar=?, kontak=? WHERE id=? AND role='penghuni'")
    .run(nama, kamar, kontak || null, req.params.id);
  if (!r.changes) return bad(res, 'Penghuni tidak ditemukan', 404);
  res.json({ ok: true });
});

app.delete('/api/users/:id', adminOnly, (req, res) => {
  const r = db.prepare("DELETE FROM users WHERE id=? AND role='penghuni'").run(req.params.id);
  if (!r.changes) return bad(res, 'Penghuni tidak ditemukan', 404);
  res.json({ ok: true });
});

// ---------- ORDERS ----------
app.get('/api/orders', (req, res) => {
  const { status, terlambat, q } = req.query;
  const where = [];
  const params = [];
  if (!isAdmin(req)) { where.push('o.user_id = ?'); params.push(req.user.id); }
  if (status) { where.push('o.status = ?'); params.push(status); }
  if (terlambat === '1') where.push(`${LATE} = 1`);
  if (q) { where.push('(o.kode LIKE ? OR u.nama LIKE ? OR u.kamar LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const sql = `${ORDER_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.id DESC`;
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(req.params.id);
  if (!order || (!isAdmin(req) && order.user_id !== req.user.id)) return bad(res, 'Order tidak ditemukan', 404);
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id=? ORDER BY id').all(order.id);
  order.riwayat = db.prepare('SELECT status, waktu FROM status_log WHERE order_id=? ORDER BY id').all(order.id);
  order.complaints = db.prepare('SELECT * FROM complaints WHERE order_id=? ORDER BY id DESC').all(order.id);
  order.foto = db.prepare(`SELECT p.file FROM request_photos p JOIN requests r ON r.id=p.request_id
    WHERE r.order_id=? ORDER BY p.id`).all(order.id).map((p) => '/uploads/' + p.file);
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
  logStatus(id, 'diterima');
  notify(b.user_id, NOTIF.diterima[0], NOTIF.diterima[1](kode), id);
  if (b.request_id) db.prepare("UPDATE requests SET status='diorder', order_id=? WHERE id=?").run(id, b.request_id);
  return id;
});

app.post('/api/orders', adminOnly, (req, res) => {
  const b = req.body;
  if (!b.user_id || !b.estimasi_selesai) return bad(res, 'Penghuni dan estimasi selesai wajib diisi');
  if (!db.prepare("SELECT id FROM users WHERE id=? AND role='penghuni'").get(b.user_id)) return bad(res, 'Penghuni tidak ditemukan', 404);
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.some((i) => !i || !i.jenis))
    return bad(res, 'Minimal satu item pakaian dengan jenis terisi');
  if (b.request_id) {
    const rq = db.prepare('SELECT * FROM requests WHERE id=?').get(b.request_id);
    if (!rq || rq.user_id !== Number(b.user_id)) return bad(res, 'Permintaan jemput tidak cocok dengan penghuni', 400);
    if (rq.status === 'diorder' || rq.status === 'ditolak') return bad(res, 'Permintaan ini sudah diproses atau ditolak');
  }
  res.status(201).json({ id: createOrder(b) });
});

app.patch('/api/orders/:id/status', adminOnly, (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return bad(res, 'Status tidak valid');
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return bad(res, 'Order tidak ditemukan', 404);
  if (status === 'selesai') {
    const belum = db.prepare('SELECT COUNT(*) c FROM order_items WHERE order_id=? AND dikembalikan=0').get(order.id).c;
    if (belum > 0) return bad(res, `Masih ada ${belum} item yang belum dicek saat pengembalian`);
  }
  if (order.status !== status) {
    db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, order.id);
    logStatus(order.id, status);
    notify(order.user_id, NOTIF[status][0], NOTIF[status][1](order.kode), order.id);
  }
  res.json({ ok: true, status });
});

app.delete('/api/orders/:id', adminOnly, (req, res) => {
  const r = db.prepare('DELETE FROM orders WHERE id=?').run(req.params.id);
  if (!r.changes) return bad(res, 'Order tidak ditemukan', 404);
  res.json({ ok: true });
});

// ---------- ITEMS ----------
app.patch('/api/items/:id', adminOnly, (req, res) => {
  const val = req.body.dikembalikan ? 1 : 0;
  const r = db.prepare('UPDATE order_items SET dikembalikan=? WHERE id=?').run(val, req.params.id);
  if (!r.changes) return bad(res, 'Item tidak ditemukan', 404);
  res.json({ ok: true, dikembalikan: val });
});

// ---------- COMPLAINTS ----------
app.get('/api/complaints', (req, res) => {
  const adm = isAdmin(req);
  res.json(db.prepare(`SELECT c.*, o.kode, u.nama, u.kamar FROM complaints c
    JOIN orders o ON o.id=c.order_id JOIN users u ON u.id=o.user_id
    ${adm ? '' : 'WHERE o.user_id = ?'} ORDER BY c.id DESC`).all(...(adm ? [] : [req.user.id])));
});

app.post('/api/complaints', (req, res) => {
  if (isAdmin(req)) return bad(res, 'Komplain diajukan oleh penghuni', 403);
  const { order_id, jenis, deskripsi } = req.body;
  if (!order_id || !deskripsi) return bad(res, 'Order dan deskripsi wajib diisi');
  if (!JENIS_KOMPLAIN.includes(jenis)) return bad(res, 'Jenis komplain tidak valid');
  const order = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(order_id, req.user.id);
  if (!order) return bad(res, 'Order tidak ditemukan', 404);
  const r = db.prepare('INSERT INTO complaints(order_id,user_id,jenis,deskripsi) VALUES (?,?,?,?)')
    .run(order_id, req.user.id, jenis, deskripsi);
  for (const a of db.prepare("SELECT id FROM users WHERE role='admin'").all())
    notify(a.id, 'Komplain baru', `${req.user.nama} mengajukan komplain ${jenis} untuk ${order.kode}.`, order.id);
  res.status(201).json({ id: r.lastInsertRowid });
});

app.patch('/api/complaints/:id', adminOnly, (req, res) => {
  const { status, tanggapan } = req.body;
  if (!COMPLAINT_STATUSES.includes(status)) return bad(res, 'Status tidak valid');
  const c = db.prepare(`SELECT c.*, o.kode, o.user_id AS pemilik FROM complaints c
    JOIN orders o ON o.id=c.order_id WHERE c.id=?`).get(req.params.id);
  if (!c) return bad(res, 'Komplain tidak ditemukan', 404);
  db.prepare("UPDATE complaints SET status=?, tanggapan=?, diperbarui=datetime('now','localtime') WHERE id=?")
    .run(status, tanggapan ?? c.tanggapan, c.id);
  const extra = tanggapan ? ` Tanggapan petugas: ${tanggapan}` : '';
  notify(c.pemilik, 'Status komplain diperbarui', `Komplain untuk ${c.kode}: ${COMPLAINT_NOTIF[status]}${extra}`, c.order_id);
  res.json({ ok: true });
});

app.delete('/api/complaints/:id', adminOnly, (req, res) => {
  const r = db.prepare('DELETE FROM complaints WHERE id=?').run(req.params.id);
  if (!r.changes) return bad(res, 'Komplain tidak ditemukan', 404);
  res.json({ ok: true });
});

// ---------- PERMINTAAN JEMPUT ----------
const REQUEST_NOTIF = {
  disetujui: 'Permintaan jemput kamu disetujui. Petugas akan menjemput cucian sesuai jadwal.',
  ditolak: 'Permintaan jemput kamu belum bisa diterima.',
};

function withPhotos(rows) {
  if (!rows.length) return rows;
  const ph = db.prepare(`SELECT request_id, file FROM request_photos
    WHERE request_id IN (${rows.map(() => '?').join(',')}) ORDER BY id`).all(...rows.map((r) => r.id));
  for (const r of rows) r.foto = ph.filter((p) => p.request_id === r.id).map((p) => '/uploads/' + p.file);
  return rows;
}

app.get('/api/requests', (req, res) => {
  const adm = isAdmin(req);
  const rows = db.prepare(`SELECT r.*, u.nama, u.kamar, o.kode AS order_kode FROM requests r
    JOIN users u ON u.id = r.user_id LEFT JOIN orders o ON o.id = r.order_id
    ${adm ? '' : 'WHERE r.user_id = ?'} ORDER BY r.id DESC`).all(...(adm ? [] : [req.user.id]));
  res.json(withPhotos(rows));
});

app.post('/api/requests',
  (req, res, next) => (isAdmin(req) ? bad(res, 'Permintaan jemput diajukan oleh penghuni', 403) : next()),
  upload.array('foto', 4),
  (req, res) => {
    const files = (req.files || []).map((f) => f.filename);
    const { catatan, waktu_jemput } = req.body;
    if (!catatan || !catatan.trim() || !waktu_jemput) {
      removeFiles(files);
      return bad(res, 'Tanggal jemput dan keterangan cucian wajib diisi');
    }
    const id = db.transaction(() => {
      const r = db.prepare('INSERT INTO requests(user_id,waktu_jemput,catatan) VALUES (?,?,?)')
        .run(req.user.id, waktu_jemput, catatan.trim());
      const ins = db.prepare('INSERT INTO request_photos(request_id,file) VALUES (?,?)');
      files.forEach((f) => ins.run(r.lastInsertRowid, f));
      return r.lastInsertRowid;
    })();
    for (const a of db.prepare("SELECT id FROM users WHERE role='admin'").all())
      notify(a.id, 'Permintaan jemput baru', `${req.user.nama} (kamar ${req.user.kamar}) meminta cucian dijemput.`);
    res.status(201).json({ id });
  });

app.patch('/api/requests/:id', adminOnly, (req, res) => {
  const { status, tanggapan } = req.body;
  if (!['disetujui', 'ditolak'].includes(status)) return bad(res, 'Status tidak valid');
  const r = db.prepare('SELECT * FROM requests WHERE id=?').get(req.params.id);
  if (!r) return bad(res, 'Permintaan tidak ditemukan', 404);
  if (r.status === 'diorder') return bad(res, 'Permintaan ini sudah dijadikan order');
  db.prepare('UPDATE requests SET status=?, tanggapan=? WHERE id=?').run(status, tanggapan || null, r.id);
  notify(r.user_id, 'Permintaan jemput ' + status, REQUEST_NOTIF[status] + (tanggapan ? ` Catatan petugas: ${tanggapan}` : ''));
  res.json({ ok: true });
});

app.delete('/api/requests/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM requests WHERE id=?').get(req.params.id);
  if (!r || (!isAdmin(req) && r.user_id !== req.user.id)) return bad(res, 'Permintaan tidak ditemukan', 404);
  if (!isAdmin(req) && r.status !== 'menunggu') return bad(res, 'Permintaan yang sudah diproses tidak bisa dibatalkan');
  const files = db.prepare('SELECT file FROM request_photos WHERE request_id=?').all(r.id).map((p) => p.file);
  db.prepare('DELETE FROM requests WHERE id=?').run(r.id);
  removeFiles(files);
  res.json({ ok: true });
});

// ---------- PAPAN CUCIAN (status penghuni lain, data terbatas) ----------
app.get('/api/board', (req, res) => {
  const rows = db.prepare(`SELECT o.kode, o.status, o.estimasi_selesai, o.user_id, u.nama, u.kamar, ${LATE} AS terlambat
    FROM orders o JOIN users u ON u.id = o.user_id WHERE o.status != 'selesai' ORDER BY o.id DESC`).all();
  res.json(rows.map((r) => ({
    kode: r.kode, status: r.status, estimasi_selesai: r.estimasi_selesai, terlambat: r.terlambat,
    nama: r.nama.split(' ')[0], kamar: r.kamar, milikku: r.user_id === req.user.id ? 1 : 0,
  })));
});

// ---------- NOTIFICATIONS ----------
app.get('/api/notifications', (req, res) => {
  res.json(db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50').all(req.user.id));
});
app.get('/api/notifications/unread-count', (req, res) => {
  res.json({ total: db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND dibaca=0').get(req.user.id).c });
});
app.post('/api/notifications/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET dibaca=1 WHERE user_id=?').run(req.user.id);
  res.json({ ok: true });
});
app.patch('/api/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET dibaca=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ---------- FRONT-END (produksi: satu URL untuk API + tampilan) ----------
const DIST = process.env.FRONTEND_DIST || path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(path.join(DIST, 'index.html'))) {
  app.use(express.static(DIST));
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

// ---------- ERROR ----------
app.use((req, res) => bad(res, 'Endpoint tidak ditemukan', 404));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return bad(res, 'Format JSON tidak valid');
  if (err instanceof UploadError) return bad(res, err.message);
  if (err.code === 'LIMIT_FILE_SIZE') return bad(res, 'Ukuran setiap foto maksimal 5 MB');
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return bad(res, 'Maksimal 4 foto per permintaan');
  console.error(err);
  bad(res, 'Terjadi kesalahan pada server', 500);
});

// Di Vercel tidak ada server.js yang memanggil seed(), jadi isi data awal saat dimuat.
if (process.env.VERCEL) db.seed();

module.exports = app;
