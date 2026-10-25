// Pembersihan input teks sebelum dikirim ke server. Vue sudah meng-escape keluaran,
// jadi tujuan di sini adalah data yang rapi: tanpa karakter kontrol dan spasi berlebih.

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g

export function bersihkan(value) {
  return String(value ?? '').replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim()
}

// Mengembalikan salinan objek dengan field tertentu sudah dibersihkan.
export function bersihkanField(obj, keys) {
  const out = { ...obj }
  for (const k of keys) out[k] = bersihkan(out[k])
  return out
}
