import { api } from '../api'

export const listComplaints = () => api('/api/complaints')
export const createComplaint = (body) => api('/api/complaints', { method: 'POST', body })
export const updateComplaint = (id, body) => api('/api/complaints/' + id, { method: 'PATCH', body })
export const deleteComplaint = (id) => api('/api/complaints/' + id, { method: 'DELETE' })
