process.env.DB_PATH = ':memory:';
const fs = require('fs');
const os = require('os');
const path = require('path');
const UPLOADS = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-unit-'));
process.env.UPLOAD_DIR = UPLOADS;

const { test } = require('node:test');
const assert = require('node:assert');
const { hashPassword, verifyPassword } = require('../security');
const { sign, auth, adminOnly } = require('../auth');
const app = require('../app');
const db = require('../db');

const BACKEND = path.resolve(__dirname, '..');

// ---------- security.js ----------
test('hashPassword menghasilkan salt:hash yang berbeda tiap panggilan dan bisa diverifikasi', () => {
  const a = hashPassword('rahasia1');
  const b = hashPassword('rahasia1');
  assert.notStrictEqual(a, b);
  assert.match(a, /^[0-9a-f]{32}:[0-9a-f]{128}$/);
  assert.strictEqual(verifyPassword('rahasia1', a), true);
  assert.strictEqual(verifyPassword('salah', a), false);
});

test('verifyPassword menolak format tersimpan yang rusak', () => {
  assert.strictEqual(verifyPassword('x', 'tanpa-pemisah'), false);
  assert.strictEqual(verifyPassword('x', 'salt:'), false);
  assert.strictEqual(verifyPassword('x', ':hash'), false);
  assert.strictEqual(verifyPassword('x', undefined), false);
  assert.strictEqual(verifyPassword('x', 'salt:aa'), false); // panjang hash tidak sama
});

// ---------- auth.js ----------
test('auth dan adminOnly sebagai middleware', () => {
  const res = () => {
    const r = { code: null, body: null };
    r.status = (c) => { r.code = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
  };

  const tanpa = res();
  auth({ headers: {} }, tanpa, () => assert.fail('tidak boleh lanjut'));
  assert.strictEqual(tanpa.code, 401);

  const token = sign({ id: 9999, role: 'penghuni' });
  const hantu = res();
  auth({ headers: { authorization: `Bearer ${token}` } }, hantu, () => assert.fail('tidak boleh lanjut'));
  assert.strictEqual(hantu.code, 401);

  let lanjut = 0;
  adminOnly({ user: { role: 'admin' } }, res(), () => lanjut++);
  assert.strictEqual(lanjut, 1);
  const tolak = res();
  adminOnly({ user: { role: 'penghuni' } }, tolak, () => assert.fail('tidak boleh lanjut'));
  assert.strictEqual(tolak.code, 403);
});

// ---------- db.js ----------
test('seed hanya mengisi data sekali', () => {
  db.seed();
  const jumlah = () => db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const awal = jumlah();
  assert.ok(awal >= 4);
  db.seed();
  assert.strictEqual(jumlah(), awal);
});

test('db.js memakai laundry.db bawaan dan tidak mereset skema yang sudah baru', () => {
  const sqlitePath = require.resolve('better-sqlite3');
  const Real = require('better-sqlite3');
  const cached = require.cache[sqlitePath];
  const dbPath = require.resolve('../db');
  const sebelumnya = require.cache[dbPath];
  const dibuka = [];
  let dropped = null;

  // Database palsu: mencatat path dan memakai database memori dengan skema versi 3
  cached.exports = function FakeDatabase(file) {
    dibuka.push(file);
    const d = new Real(':memory:');
    d.pragma('user_version = 3');
    d.exec('CREATE TABLE users (id INTEGER)');
    d.exec('INSERT INTO users VALUES (1)');
    dropped = d;
    return d;
  };
  const dbPathEnv = process.env.DB_PATH;
  delete process.env.DB_PATH;
  delete require.cache[dbPath];
  try {
    require('../db');
  } finally {
    cached.exports = Real;
    process.env.DB_PATH = dbPathEnv;
    require.cache[dbPath] = sebelumnya;
  }
  assert.deepStrictEqual(dibuka, [path.join(BACKEND, 'laundry.db')]);
  // skema sudah versi >= 2, jadi tabel lama tidak dihapus
  assert.strictEqual(dropped.prepare('SELECT COUNT(*) c FROM users').get().c, 1);
});

// ---------- app.js ----------
test('app.js memakai folder uploads bawaan bila UPLOAD_DIR tidak diisi', (t) => {
  const appPath = require.resolve('../app');
  const sebelumnya = require.cache[appPath];
  const dibuat = [];
  t.mock.method(fs, 'mkdirSync', (dir) => { dibuat.push(dir); });

  delete process.env.UPLOAD_DIR;
  delete require.cache[appPath];
  try {
    require('../app');
  } finally {
    process.env.UPLOAD_DIR = UPLOADS;
    require.cache[appPath] = sebelumnya;
  }
  assert.ok(dibuat.includes(path.join(BACKEND, 'uploads')));
});

// ---------- server.js ----------
test('server.js mengisi data contoh lalu listen di PORT atau 3000', (t) => {
  const serverPath = require.resolve('../server');
  const port = [];
  t.mock.method(app, 'listen', (p, cb) => { port.push(p); cb(); return {}; });
  const log = t.mock.method(console, 'log', () => {});
  const sebelumnya = process.env.PORT;

  try {
    delete process.env.PORT;
    delete require.cache[serverPath];
    require('../server');

    process.env.PORT = '4321';
    delete require.cache[serverPath];
    require('../server');
  } finally {
    if (sebelumnya === undefined) delete process.env.PORT; else process.env.PORT = sebelumnya;
    delete require.cache[serverPath];
  }

  assert.deepStrictEqual(port, [3000, '4321']);
  assert.strictEqual(log.mock.calls[0].arguments[0], 'LaundryTrack API berjalan di http://localhost:3000');
  assert.strictEqual(log.mock.calls[1].arguments[0], 'LaundryTrack API berjalan di http://localhost:4321');
});