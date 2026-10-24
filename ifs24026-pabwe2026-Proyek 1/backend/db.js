const Database = require('better-sqlite3');
const path = require('path');

const file = process.env.DB_PATH || path.join(__dirname, 'laundry.db');
const db = new Database(file);
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  kamar TEXT NOT NULL,
  kontak TEXT
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
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('hilang','tertukar','terlambat','lainnya')),
  deskripsi TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','diproses','selesai')),
  dibuat TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`);

function seed() {
  const n = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (n > 0) return;
  const u = db.prepare('INSERT INTO users(nama,kamar,kontak) VALUES (?,?,?)');
  u.run('Budi Santoso', 'A-101', '081200000001');
  u.run('Siti Aminah', 'B-205', '081200000002');
  u.run('Andre Silalahi', 'C-310', '081200000003');

  const day = (d) => {
    const t = new Date(); t.setDate(t.getDate() + d);
    return t.toISOString().slice(0, 10);
  };
  const o = db.prepare('INSERT INTO orders(kode,user_id,estimasi_selesai,status,berat_kg,total_harga) VALUES (?,?,?,?,?,?)');
  const it = db.prepare('INSERT INTO order_items(order_id,jenis,jumlah,warna,catatan,dikembalikan) VALUES (?,?,?,?,?,?)');
  o.run('LDR-0001', 1, day(-2), 'dicuci', 3, 15000);      // terlambat
  o.run('LDR-0002', 2, day(2), 'diterima', 2, 10000);
  o.run('LDR-0003', 3, day(-5), 'selesai', 4, 20000);
  it.run(1, 'Kemeja', 3, 'Putih', 'Ada nama di kerah', 0);
  it.run(1, 'Celana panjang', 2, 'Hitam', '', 0);
  it.run(2, 'Kaos', 4, 'Biru', '', 0);
  it.run(3, 'Jaket', 1, 'Abu-abu', 'Resleting rusak', 1);
  db.prepare("INSERT INTO complaints(order_id,jenis,deskripsi) VALUES (1,'terlambat','Sudah lewat estimasi, belum dikembalikan')").run();
}

module.exports = db;
module.exports.seed = seed;
