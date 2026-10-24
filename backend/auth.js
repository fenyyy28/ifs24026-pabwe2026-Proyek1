const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRET = process.env.JWT_SECRET || 'dev-secret-laundrytrack-ganti-saat-deploy';

const sign = (user) => jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  try {
    if (!token) throw new Error('no token');
    const payload = jwt.verify(token, SECRET);
    const user = db.prepare('SELECT id,nama,kamar,kontak,username,role FROM users WHERE id=?').get(payload.id);
    if (!user) throw new Error('no user');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Silakan masuk terlebih dahulu' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role === 'admin') return next();
  res.status(403).json({ error: 'Hanya petugas laundry yang dapat melakukan ini' });
}

module.exports = { sign, auth, adminOnly };
