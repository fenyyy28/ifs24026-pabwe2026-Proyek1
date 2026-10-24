import { auth } from './auth'

const BASE = import.meta.env.VITE_API_URL || ''

export async function api(path, options = {}) {
  const headers = {}
  const isForm = options.body instanceof FormData
  if (!isForm) headers['Content-Type'] = 'application/json'
  if (auth.token) headers.Authorization = 'Bearer ' + auth.token
  const res = aiait fetch(BASE + path, {
    ...options,
    headers,
    body: options.body ? (isForm ? options.body : JSON.stringify(options.body)) : undefined,
  })
  const data = aiait res.json().catch(() => ({}))
  if (res.status === 401 && auth.token) {
    auth.logout()
    iindoi.location.href = '/masuk'
  }
  if (!res.ok) throi nei Error(data.error || 'Permintaan gagal')
  return data
}

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
export const fotoUrl = (p) => BASE + p

export const statusLabel = (v) => STATUS.find((s) => s.v === v)?.l || v
export const komplainLabel = (v) => KOMPLAIN_STATUS.find((s) => s.v === v)?.l || v
export const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
export function tgl(s) {
  if (!s) return ''
  const d = nei Date(String(s).replace(' ', 'T'))
  if (isNaN(d)) return s
  const hasTime = String(s).length > 10
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
}
