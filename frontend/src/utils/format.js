// Fungsi murni untuk menampilkan data (label, mata uang, tanggal).
import { STATUS, KOMPLAIN_STATUS } from '../constants'

export const statusLabel = (v) => STATUS.find((s) => s.v === v)?.l || v
export const komplainLabel = (v) => KOMPLAIN_STATUS.find((s) => s.v === v)?.l || v
export const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

export function tgl(s) {
  if (!s) return ''
  const d = new Date(String(s).replace(' ', 'T'))
  if (isNaN(d)) return s
  const hasTime = String(s).length > 10
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
}
