// Validasi input di sisi front-end. Setiap fungsi mengembalikan pesan error,
// atau string kosong bila input valid. Aturannya selaras dengan validasi back-end,
// jadi pengguna mendapat pesan lebih cepat tanpa menunggu respons server.
import { JENIS_KOMPLAIN } from '../constants'

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/
const text = (v) => String(v ?? '').trim()

export function validateLogin({ username, password }) {
  if (!text(username) || !password) return 'Username dan kata sandi wajib diisi'
  return ''
}

export function validateRegister({ nama, kamar, kontak, username, password }, ulang) {
  if (!text(nama) || !text(kamar)) return 'Nama dan nomor kamar wajib diisi'
  if (text(nama).length > 60) return 'Nama maksimal 60 karakter'
  if (text(kontak).length > 30) return 'Kontak maksimal 30 karakter'
  if (!USERNAME_RE.test(text(username).toLowerCase())) return 'Username 3-20 karakter: huruf, angka, titik, atau garis bawah'
  if (String(password ?? '').length < 6) return 'Kata sandi minimal 6 karakter'
  if (password !== ulang) return 'Konfirmasi kata sandi tidak sama'
  return ''
}

export function validateRequestForm({ waktu_jemput, catatan }, today) {
  if (!waktu_jemput) return 'Tanggal jemput wajib diisi'
  if (waktu_jemput < today) return 'Tanggal jemput tidak boleh sebelum hari ini'
  if (!text(catatan)) return 'Keterangan cucian wajib diisi'
  if (text(catatan).length > 300) return 'Keterangan cucian maksimal 300 karakter'
  return ''
}

export function validateComplaintForm({ jenis, deskripsi }) {
  if (!Object.keys(JENIS_KOMPLAIN).includes(jenis)) return 'Jenis komplain tidak valid'
  if (!text(deskripsi)) return 'Deskripsi komplain wajib diisi'
  if (text(deskripsi).length > 500) return 'Deskripsi komplain maksimal 500 karakter'
  return ''
}

export function validateOrderForm({ user_id, estimasi_selesai, berat_kg }, items) {
  if (!user_id) return 'Pilih penghuni terlebih dahulu'
  if (!estimasi_selesai) return 'Estimasi selesai wajib diisi'
  if (Number.isNaN(Number(berat_kg)) || Number(berat_kg) < 0) return 'Berat tidak valid'
  if (!items.length || items.some((i) => !text(i.jenis))) return 'Minimal satu item pakaian dengan jenis terisi'
  if (items.some((i) => Number(i.jumlah) < 1)) return 'Jumlah pakaian minimal 1'
  return ''
}
