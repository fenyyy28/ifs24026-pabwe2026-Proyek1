// Papan cucian: status cucian semua penghuni dengan data terbatas.
import { ref, computed, onMounted } from 'vue'
import { getBoard } from '../services/orderService'
import { STATUS } from '../constants'

export function useBoard() {
  const rows = ref([])
  const error = ref('')
  const filter = ref('')

  onMounted(async () => {
    try { rows.value = await getBoard() } catch (e) { error.value = e.message }
  })

  const tahap = computed(() => STATUS.slice(0, 4).map((s) => ({ ...s, n: rows.value.filter((r) => r.status === s.v).length })))
  const tampil = computed(() => (filter.value ? rows.value.filter((r) => r.status === filter.value) : rows.value))

  return { rows, error, filter, tahap, tampil }
}
