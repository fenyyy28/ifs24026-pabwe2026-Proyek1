# LaundryTrack Asrama

Aplikasi pelacak laundry asrama: penghuni memantau tahap cucian, menerima notifikasi saat selesai, dan mengajukan komplain.
Proyek 1 PABWE 2026-2027 (ifs24026).

- Back-end: Express.js + SQLite (better-sqlite3), autentikasi JWT
- Front-end: Vue 3 + Vite + Vue Router

## Peran
- **Penghuni**: daftar sendiri, mengajukan permintaan jemput dengan foto cucian kotor, melihat cucian miliknya dan papan cucian (status penghuni lain, data terbatas), notifikasi, komplain.
- **Petugas laundry**: menyetujui/menolak permintaan jemput, membuat order (bisa langsung dari permintaan), mengubah status, mengecek pakaian, menangani komplain.

Akun contoh (dibuat otomatis): `petugas` / `petugas123`, `budi` / `budi123`, `siti` / `siti123`.

## Alur status
- Permintaan jemput: Menunggu → Disetujui → Jadi order (atau Ditolak)
- Cucian: Diterima → Dicuci → Disetrika → Siap diambil → Selesai
- Komplain: Diajukan → Sedang ditangani → Selesai

## Menjalankan di komputer lokal
```bash
# Terminal 1 - API (http://localhost:3000)
cd backend
npm install
npm start

# Terminal 2 - Front-end (http://localhost:5173)
cd frontend
npm install
npm run dev
```

## Tes API dan coverage
```bash
cd backend
npm test            # Node (node:test)
bun run coverage    # Bun, wajib 100% baris dan fungsi (batas di backend/bunfig.toml)
```
Database otomatis memakai `bun:sqlite` saat dijalankan dengan Bun dan `better-sqlite3` saat dijalankan dengan Node.

## Variabel lingkungan
- Backend: `PORT` (default 3000), `DB_PATH`, `UPLOAD_DIR` (folder foto, default `backend/uploads`), `JWT_SECRET` (wajib diganti saat deploy)
- Frontend: `VITE_API_URL` = URL API saat deploy (kosong saat lokal)

## Deploy (Render, satu layanan)
Backend otomatis menyajikan hasil build front-end (`frontend/dist`) jika ada, sehingga cukup satu URL.
- Build command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
- Start command: `cd backend && npm start`
- Env: `NODE_VERSION=22`, `JWT_SECRET=<acak>`
- Catatan: pada paket gratis, database SQLite dan foto unggahan direset saat layanan restart.

## Jenkins
`Jenkinsfile` di root: checkout, install back-end, uji (hasil JUnit), build front-end, arsipkan `frontend/dist`.
