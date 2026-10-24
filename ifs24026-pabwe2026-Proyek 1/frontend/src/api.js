const BASE = import.meta.env.VITE_API_URL || ''

export async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Permintaan gagal')
  return data
}

export const STATUS = [
  { v: 'diterima', l: 'Diterima' },
  { v: 'dicuci', l: 'Dicuci' },
  { v: 'disetrika', l: 'Disetrika' },
  { v: 'siap_diambil', l: 'Siap diambil' },
  { v: 'selesai', l: 'Selesai' },
]
export const statusLabel = (v) => STATUS.find((s) => s.v === v)?.l || v
export const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
