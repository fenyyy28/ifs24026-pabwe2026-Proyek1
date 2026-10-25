// Validasi input di sisi front-end. Setiap fungsi mengembalikan objek pesan error
// per field, mis. { username: '...', password: '...' }; objek kosong berarti valid.
// Aturannya selaras dengan validasi back-end, jadi pengguna mendapat pesan yang
// spesifik tanpa menunggu respons server.
import { JENIS_KOMPLAIN } from '../constants'

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/
const text = (v) => String(v ?? '').trim()

export const hasErrors = (errors) => Object.keys(errors).length > 0

export function validateLogin({ username, password }) {
  const e = {}
  if (!text(username)) e.username = 'Username wajib diisi'
  if (!password) e.password = 'Kata sandi wajib diisi'
  return e
}

export function validateRegister({ nama, kamar, kontak, username, password }, ulang) {
  const e = {}
  if (!text(nama)) e.nama = 'Nama wajib diisi'
  else if (text(nama).length > 60) e.nama = 'Nama maksimal 60 karakter'
  if (!text(kamar)) e.kamar = 'Nomor kamar wajib diisi'
  if (text(kontak).length > 30) e.kontak = 'Kontak maksimal 30 karakter'
  if (!USERNAME_RE.test(text(username).toLowerCase())) e.username = 'Username 3-20 karakter: huruf, angka, titik, atau garis bawah'
  if (String(password ?? '').length < 6) e.password = 'Kata sandi minimal 6 karakter'
  if (password !== ulang) e.ulang = 'Konfirmasi kata sandi tidak sama'
  return e
}

export function validateRequestForm({ waktu_jemput, catatan }, today) {
  const e = {}
  if (!waktu_jemput) e.waktu_jemput = 'Tanggal jemput wajib diisi'
  else if (waktu_jemput < today) e.waktu_jemput = 'Tanggal jemput tidak boleh sebelum hari ini'
  if (!text(catatan)) e.catatan = 'Keterangan cucian wajib diisi'
  else if (text(catatan).length > 300) e.catatan = 'Keterangan cucian maksimal 300 karakter'
  return e
}

export function validateComplaintForm({ jenis, deskripsi }) {
  const e = {}
  if (!Object.keys(JENIS_KOMPLAIN).includes(jenis)) e.jenis = 'Jenis komplain tidak valid'
  if (!text(deskripsi)) e.deskripsi = 'Deskripsi komplain wajib diisi'
  else if (text(deskripsi).length > 500) e.deskripsi = 'Deskripsi komplain maksimal 500 karakter'
  return e
}

export function validateOrderForm({ user_id, estimasi_selesai, berat_kg }, items) {
  const e = {}
  if (!user_id) e.user_id = 'Pilih penghuni terlebih dahulu'
  if (!estimasi_selesai) e.estimasi_selesai = 'Estimasi selesai wajib diisi'
  if (Number.isNaN(Number(berat_kg)) || Number(berat_kg) < 0) e.berat_kg = 'Berat tidak valid'
  if (!items.length || items.some((i) => !text(i.jenis))) e.items = 'Minimal satu item pakaian dengan jenis terisi'
  else if (items.some((i) => Number(i.jumlah) < 1)) e.items = 'Jumlah pakaian minimal 1'
  return e
}
