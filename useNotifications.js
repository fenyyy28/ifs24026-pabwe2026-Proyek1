// Daftar notifikasi; jumlah belum dibaca disimpan di store global `auth`.
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../auth'
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationService'
import { useAsyncAction } from './useAsyncAction'

export function useNotifications() {
  const router = useRouter()
  const list = ref([])
  const { error, run } = useAsyncAction()

  async function fetchList() {
    list.value = await listNotifications()
    auth.unread = list.value.filter((n) => !n.dibaca).length
  }
  const load = () => run(fetchList)

  async function tandaiDibaca(n) {
    if (n.dibaca) return
    await markNotificationRead(n.id)
    n.dibaca = 1
    auth.unread = Math.max(0, auth.unread - 1)
  }

  // Menandai dibaca lalu membuka order terkait (bila ada).
  const buka = (n) => run(async () => {
    await tandaiDibaca(n)
    if (n.order_id) await router.push('/order/' + n.order_id)
  })

  const tandaiSemua = () => run(async () => { await markAllNotificationsRead(); await fetchList() })

  onMounted(load)

  return { list, error, buka, tandaiSemua }
}
