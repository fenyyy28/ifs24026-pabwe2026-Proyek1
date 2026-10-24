# LaundryTrack Asrama

Aplikasi pelacak laundry asrama: kode order unik, daftar pakaian per order, penanda keterlambatan, dan komplain.
Proyek 1 PABWE 2026-2027 (ifs24026).

- Back-end: Express.js + SQLite (better-sqlite3)
- Front-end: Vue 3 + Vite + Vue Router

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

Database `backend/laundry.db` dibuat otomatis beserta data contoh.

## Tes API

```bash
cd backend && npm test
```

## Variabel lingkungan

- Backend: `PORT` (default 3000), `DB_PATH` (default `backend/laundry.db`)
- Frontend: `VITE_API_URL` = URL API saat deploy (kosong saat lokal, karena memakai proxy Vite)
