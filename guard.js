// Otorisasi defensif di sisi komponen. Guard router dan API back-end tetap menjadi
// pertahanan utama; fungsi ini mencegah aksi khusus petugas jalan dari halaman yang salah.
import { auth } from '../auth'

export function requireAdmin() {
  if (!auth.isAdmin) throw new Error('Aksi ini hanya untuk petugas laundry')
}
