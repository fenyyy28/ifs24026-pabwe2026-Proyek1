// Konstanta domain yang dipakai bersama oleh view, composable, dan komponen.

export const MAX_PHOTOS = 4

export const STATUS = [
  { v: 'diterima', l: 'Diterima' },
  { v: 'dicuci', l: 'Dicuci' },
  { v: 'disetrika', l: 'Disetrika' },
  { v: 'siap_diambil', l: 'Siap diambil' },
  { v: 'selesai', l: 'Selesai' },
]

export const STATUS_PESAN = {
  diterima: 'Cucianmu sudah diterima petugas dan menunggu giliran dicuci.',
  dicuci: 'Pakaianmu sedang dicuci.',
  disetrika: 'Pakaianmu sudah dicuci dan sekarang sedang disetrika.',
  siap_diambil: 'Cucianmu sudah selesai. Silakan ambil dan cek pakaian bersama petugas.',
  selesai: 'Cucian sudah kamu terima kembali.',
}

export const KOMPLAIN_STATUS = [
  { v: 'diajukan', l: 'Diajukan' },
  { v: 'ditangani', l: 'Sedang ditangani' },
  { v: 'selesai', l: 'Selesai' },
]

export const JENIS_KOMPLAIN = { hilang: 'Barang hilang', tertukar: 'Barang tertukar', terlambat: 'Terlambat', lainnya: 'Lainnya' }

export const REQ_STEPS = [
  { v: 'menunggu', l: 'Menunggu' },
  { v: 'disetujui', l: 'Disetujui' },
  { v: 'diorder', l: 'Jadi order' },
]

export const REQ_LABEL = { menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak', diorder: 'Sudah jadi order' }
