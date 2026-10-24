process.env.DB_PATH = ':memory:';
const { test } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');

test('alur lengkap: penghuni -> order -> cek item -> selesai', async () => {
  const u = await request(app).post('/api/users').send({ nama: 'Uji', kamar: 'A-1' });
  assert.strictEqual(u.status, 201);

  const o = await request(app).post('/api/orders').send({
    user_id: u.body.id, estimasi_selesai: '2099-01-01', berat_kg: 2,
    items: [{ jenis: 'Kemeja', jumlah: 2, warna: 'Putih' }],
  });
  assert.strictEqual(o.status, 201);

  const detail = await request(app).get(`/api/orders/${o.body.id}`);
  assert.strictEqual(detail.body.kode, 'LDR-0001');
  assert.strictEqual(detail.body.total_harga, 10000);

  // tidak boleh selesai sebelum semua item dicek
  const gagal = await request(app).patch(`/api/orders/${o.body.id}/status`).send({ status: 'selesai' });
  assert.strictEqual(gagal.status, 400);

  await request(app).patch(`/api/items/${detail.body.items[0].id}`).send({ dikembalikan: true });
  const ok = await request(app).patch(`/api/orders/${o.body.id}/status`).send({ status: 'selesai' });
  assert.strictEqual(ok.status, 200);
});

test('order tanpa item ditolak', async () => {
  const r = await request(app).post('/api/orders').send({ user_id: 1, estimasi_selesai: '2099-01-01', items: [] });
  assert.strictEqual(r.status, 400);
});

test('komplain dan statistik', async () => {
  const c = await request(app).post('/api/complaints').send({ order_id: 1, jenis: 'hilang', deskripsi: 'Kaos hilang' });
  assert.strictEqual(c.status, 201);
  const s = await request(app).get('/api/stats');
  assert.strictEqual(s.body.komplain_terbuka, 1);
});
