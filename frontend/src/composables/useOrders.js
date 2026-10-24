// Daftar order dengan pencarian dan filter; memuat ulang otomatis saat filter berubah.
import { ref, onMounted, watch } from 'vue'
import { listOrders, deleteOrder } from '../services/orderService'

export function useOrders() {
  const orders = ref([])
  const q = ref('')
  const status = ref('')
  const late = ref(false)
  const error = ref('')

  async function load() {
    try { orders.value = await listOrders({ q: q.value, status: status.value, late: late.value }) } catch (e) { error.value = e.message }
  }

  async function remove(o) {
    try { await deleteOrder(o.id); load() } catch (e) { error.value = e.message }
  }

  onMounted(load)
  watch([q, status, late], load)

  return { orders, q, status, late, error, remove }
}
