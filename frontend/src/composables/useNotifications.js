// Daftar notifikasi; jumlah belum dibaca disimpan di store global `auth`.
import { ref, onMounted } from 'vue'
import { auth } from '../auth'
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationService'

export function useNotifications() {
  const list = ref([])
  const error = ref('')

  async function load() {
    try {
      list.value = await listNotifications()
      auth.unread = list.value.filter((n) => !n.dibaca).length
    } catch (e) { error.value = e.message }
  }

  async function markRead(n) {
    if (n.dibaca) return
    await markNotificationRead(n.id)
    n.dibaca = 1
    auth.unread = Math.max(0, auth.unread - 1)
  }

  async function markAll() {
    await markAllNotificationsRead()
    load()
  }

  onMounted(load)

  return { list, error, markRead, markAll }
}
