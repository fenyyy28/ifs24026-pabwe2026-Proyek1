// Menyegarkan jumlah notifikasi belum dibaca secara berkala selama pengguna login.
import { watch, onBeforeUnmount } from 'vue'
import { auth } from '../auth'
import { getUnreadCount } from '../services/notificationService'

const INTERVAL_MS = 20000

export function useUnreadPolling() {
  let timer
  let gagal = false // log hanya pada kegagalan pertama agar konsol tidak penuh saat offline

  async function poll() {
    if (!auth.token) return
    try {
      auth.unread = await getUnreadCount()
      gagal = false
    } catch (e) {
      // Tidak mengganggu pengguna, tapi dicatat sekali supaya masalah tetap bisa dilacak.
      if (!gagal) console.warn('Polling notifikasi gagal:', e.message)
      gagal = true
    }
  }

  watch(() => auth.token, (t) => {
    clearInterval(timer)
    if (t) { poll(); timer = setInterval(poll, INTERVAL_MS) }
  }, { immediate: true })

  onBeforeUnmount(() => clearInterval(timer))
}
