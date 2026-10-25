// Lapisan transport HTTP. Hanya mengurus request, header token, dan error;
// pengetahuan tentang endpoint ada di folder services/.
import { auth } from './auth'

const BASE = import.meta.env.VITE_API_URL || ''

export async function api(path, options = {}) {
  const headers = {}
  const isForm = options.body instanceof FormData
  if (!isForm) headers['Content-Type'] = 'application/json'
  if (auth.token) headers.Authorization = 'Bearer ' + auth.token
  const res = await fetch(BASE + path, {
    ...options,
    headers,
    body: options.body ? (isForm ? options.body : JSON.stringify(options.body)) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && auth.token) {
    auth.logout()
    window.location.href = '/auth/login'
  }
  if (!res.ok) throw new Error(data.error || 'Permintaan gagal')
  return data
}

export const fotoUrl = (p) => BASE + p
