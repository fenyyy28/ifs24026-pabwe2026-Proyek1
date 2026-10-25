import { api } from '../api'

export const listNotifications = () => api('/api/notifications')
export const getUnreadCount = async () => (await api('/api/notifications/unread-count')).total
export const markNotificationRead = (id) => api(`/api/notifications/${id}/read`, { method: 'PATCH' })
export const markAllNotificationsRead = () => api('/api/notifications/read-all', { method: 'POST' })
