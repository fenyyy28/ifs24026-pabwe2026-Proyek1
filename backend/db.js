const Database = require('better-sqlite3');
const path = require('path');
const { hashPassword } = require('./security');

const file = process.env.DB_PATH || path.join(__dirname, 'laundry.db');
const db = new Database(file);

const SCHEMA_VERSION = 3;
// Versi lama (tanpa login) hanya berisi data contoh, jadi aman dibuat ulang.
if (db.pragma('user_version', { simple: true }) < 2) {
  db.pragma('foreign_keys = OFF');
  db.exec(`DROP TABLE IF EXISTS request_photos; DROP TABLE IF EXISTS requests; DROP TABLE IF EXISTS notifications; DROP TABLE IF EXISTS status_log;
    DROP TABLE IF EXISTS complaints; DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS orders; DROP TABLE IF EXISTS users;`);
}
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  kamar TEXT NOT NULL,
  kontak TEXT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'penghuni' CHECK (role IN ('admin','penghuni'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tanggal_masuk TEXT NOT NULL DEFAULT (date('now','localtime')),
  estimasi_selesai TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'diterima'
    CHECK (status IN ('diterima','dicuci','disetrika','siap_diambil','selesai')),
  berat_kg REAL NOT NULL DEFAULT 0,
  total_harga INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL,
  jumlah INTEGER NOT NULL DEFAULT 1,
  warna TEXT,
  catatan TEXT,
  dikembalikan INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS status_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  waktu TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('hilang','tertukar','terlambat','lainnya')),
  deskripsi TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'diajukan' CHECK (status IN ('diajukan','ditangani','selesai')),
  tanggapan TEXT,
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  diperbarui TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  waktu_jemput TEXT NOT NULL,
  catatan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu','disetujui','ditolak','diorder')),
  tanggapan TEXT,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS request_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  file TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  dibaca INTEGER NOT NULL DEFAULT 0,
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`);
db.pragma(`user_version = ${SCHEMA_VERSION}`);

function seed() {
  if (db.prepare('SELECT COUNT(*) c FROM users').get().c > 0) return;
  const u = db.prepare('INSERT INTO users(nama,kamar,kontak,username,password_hash,role) VALUES (?,?,?,?,?,?)');
  u.run('Petugas Laundry', '-', '081200000000', 'petugas', hashPassword('petugas123'), 'admin');
  u.run('Budi Santoso', 'A-101', '081200000001', 'budi', hashPassword('budi123'), 'penghuni');
  u.run('Siti Aminah', 'B-205', '081200000002', 'siti', hashPassword('siti123'), 'penghuni');
  u.run('Andre Silalahi', 'C-310', '081200000003', 'andre', hashPassword('andre123'), 'penghuni');

  const day = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
  const o = db.prepare('INSERT INTO orders(kode,user_id,estimasi_selesai,status,berat_kg,total_harga) VALUES (?,?,?,?,?,?)');
  const it = db.prepare('INSERT INTO order_items(order_id,jenis,jumlah,warna,catatan,dikembalikan) VALUES (?,?,?,?,?,?)');
  const log = db.prepare('INSERT INTO status_log(order_id,status) VALUES (?,?)');
  o.run('LDR-0001', 2, day(-2), 'dicuci', 3, 15000);       // Budi, terlambat
  o.run('LDR-0002', 3, day(2), 'diterima', 2, 10000);      // Siti
  o.run('LDR-0003', 4, day(-5), 'selesai', 4, 20000);      // Andre
  o.run('LDR-0004', 2, day(1), 'siap_diambil', 2, 10000);  // Budi, siap diambil
  it.run(1, 'Kemeja', 3, 'Putih', 'Ada nama di kerah', 0);
  it.run(1, 'Celana panjang', 2, 'Hitam', '', 0);
  it.run(2, 'Kaos', 4, 'Biru', '', 0);
  it.run(3, 'Jaket', 1, 'Abu-abu', 'Resleting rusak', 1);
  it.run(4, 'Kaos olahraga', 2, 'Hijau', '', 0);
  log.run(1, 'diterima'); log.run(1, 'dicuci');
  log.run(2, 'diterima');
  log.run(3, 'diterima'); log.run(3, 'dicuci'); log.run(3, 'disetrika'); log.run(3, 'siap_diambil'); log.run(3, 'selesai');
  log.run(4, 'diterima'); log.run(4, 'dicuci'); log.run(4, 'disetrika'); log.run(4, 'siap_diambil');

  const n = db.prepare('INSERT INTO notifications(user_id,order_id,judul,pesan) VALUES (?,?,?,?)');
  n.run(2, 4, 'Cucian siap diambil', 'Cucian LDR-0004 sudah selesai. Silakan ambil dan cek pakaian bersama petugas.');
  n.run(2, 1, 'Cucian sedang dicuci', 'Cucian LDR-0001 sedang dicuci.');
  db.prepare("INSERT INTO requests(user_id,waktu_jemput,catatan) VALUES (3, date('now','localtime','+1 day'), '5 kaos dan 2 celana, tolong dijemput sore hari')").run();
  db.prepare("INSERT INTO complaints(order_id,user_id,jenis,deskripsi) VALUES (1,2,'terlambat','Sudah lewat estimasi, cucian belum dikembalikan')").run();
}

module.exports = db;
module.exports.seed = seed;
