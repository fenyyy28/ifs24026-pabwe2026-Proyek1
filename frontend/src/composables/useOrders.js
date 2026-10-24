// Daftar order dengan pencarian dan filter; memuat ulang otomatis saat filter berubah.
import { ref, onMounted, watch } from 'vue'
import { listOrders, deleteOrder } from '../services/orderService'
import { useAsyncAction } from './useAsyncAction'
import { requireAdmin } from '../utils/guard'
import { konfirmasi } from '../utils/dialog'

export function useOrders() {
  const orders = ref([])
  const q = ref('')
  const status = ref('')
  const late = ref(false)
  const { error, loading: memuat, run } = useAsyncAction()

  const fetchOrders = async () => { orders.value = await listOrders({ q: q.value, status: status.value, late: late.value }) }
  const load = () => run(fetchOrders)

  function hapus(o) {
    if (!konfirmasi(`Hapus order ${o.kode}?`)) return
    return run(async () => { requireAdmin(); await deleteOrder(o.id); await fetchOrders() })
  }

  onMounted(load)
  watch([q, status, late], load)

  return { memuat, orders, q, status, late, error, hapus }
}
