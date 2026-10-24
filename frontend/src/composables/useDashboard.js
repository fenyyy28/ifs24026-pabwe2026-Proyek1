// Data beranda untuk penghuni maupun petugas, beserta ringkasan turunannya.
import { ref, computed, onMounted } from 'vue'
import { auth } from '../auth'
import { getStats, listOrders } from '../services/orderService'
import { listComplaints } from '../services/complaintService'
import { listRequests } from '../services/requestService'
import { listNotifications } from '../services/notificationService'

export function useDashboard() {
  const stats = ref({})
  const orders = ref([])
  const notifs = ref([])
  const komplain = ref([])
  const permintaan = ref([])
  const error = ref('')

  async function load() {
    try {
      stats.value = await getStats()
      orders.value = await listOrders()
      if (auth.isAdmin) {
        komplain.value = (await listComplaints()).filter((c) => c.status !== 'selesai').slice(0, 5)
        permintaan.value = (await listRequests()).filter((r) => r.status === 'menunggu').slice(0, 5)
      } else {
        notifs.value = (await listNotifications()).slice(0, 4)
      }
    } catch (e) { error.value = e.message }
  }
  onMounted(load)

  const aktif = computed(() => orders.value.filter((o) => o.status !== 'selesai'))
  const siap = computed(() => orders.value.filter((o) => o.status === 'siap_diambil'))
  const terlambat = computed(() => orders.value.filter((o) => o.terlambat))
  const sapaan = computed(() => auth.user?.nama?.split(' ')[0])
  const ringkas = computed(() => {
    if (auth.isAdmin) return `${stats.value.aktif ?? 0} order sedang diproses, ${stats.value.terlambat ?? 0} melewati estimasi.`
    if (siap.value.length) return `${siap.value.length} cucian sudah selesai dan siap kamu ambil.`
    if (aktif.value.length) return `${aktif.value.length} cucianmu sedang diproses.`
    return 'Belum ada cucian aktif. Serahkan cucianmu ke petugas dan statusnya akan muncul di sini.'
  })

  return { stats, orders, notifs, komplain, permintaan, error, aktif, siap, terlambat, sapaan, ringkas }
}
