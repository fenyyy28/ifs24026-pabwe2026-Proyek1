// Menyegarkan jumlah notifikasi belum dibaca secara berkala selama pengguna login.
import { watch, onBeforeUnmount } from 'vue'
import { auth } from '../auth'
import { getUnreadCount } from '../services/notificationService'

const INTERVAL_MS = 20000

export function useUnreadPolling() {
  let timer

  async function poll() {
    if (!auth.token) return
    try { auth.unread = await getUnreadCount() } catch { /* polling gagal tidak perlu mengganggu pengguna */ }
  }

  watch(() => auth.token, (t) => {
    clearInterval(timer)
    if (t) { poll(); timer = setInterval(poll, INTERVAL_MS) }
  }, { immediate: true })

  onBeforeUnmount(() => clearInterval(timer))
}
