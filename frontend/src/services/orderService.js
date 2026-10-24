import { api } from '../api'

export function listOrders({ q, status, late } = {}) {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  if (status) p.set('status', status)
  if (late) p.set('terlambat', '1')
  return api('/api/orders?' + p)
}
export const getOrder = (id) => api('/api/orders/' + id)
export const createOrder = (body) => api('/api/orders', { method: 'POST', body })
export const deleteOrder = (id) => api('/api/orders/' + id, { method: 'DELETE' })
export const updateOrderStatus = (id, status) => api(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } })
export const setItemReturned = (itemId, dikembalikan) => api('/api/items/' + itemId, { method: 'PATCH', body: { dikembalikan } })
export const getStats = () => api('/api/stats')
export const getBoard = () => api('/api/board')
