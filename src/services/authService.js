import { api } from '../api'

export const login = (body) => api('/api/auth/login', { method: 'POST', body })
export const register = (body) => api('/api/auth/register', { method: 'POST', body })
