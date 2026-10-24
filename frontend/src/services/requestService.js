import { api } from '../api'

export const listRequests = () => api('/api/requests')

// Permintaan jemput dikirim sebagai multipart karena membawa foto.
export function createRequest({ waktu_jemput, catatan }, photos = []) {
  const fd = new FormData()
  fd.append('waktu_jemput', waktu_jemput)
  fd.append('catatan', catatan.trim())
  photos.forEach((f) => fd.append('foto', f, f.name || 'foto.jpg'))
  return api('/api/requests', { method: 'POST', body: fd })
}
export const deleteRequest = (id) => api('/api/requests/' + id, { method: 'DELETE' })
export const reviewRequest = (id, status, tanggapan) =>
  api('/api/requests/' + id, { method: 'PATCH', body: { status, tanggapan } })
