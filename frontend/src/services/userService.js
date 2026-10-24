import { api } from '../api'

export const listUsers = () => api('/api/users')
export const updateUser = (id, body) => api('/api/users/' + id, { method: 'PUT', body })
export const deleteUser = (id) => api('/api/users/' + id, { method: 'DELETE' })
