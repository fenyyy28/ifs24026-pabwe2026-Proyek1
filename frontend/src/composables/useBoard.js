// Papan cucian: status cucian semua penghuni dengan data terbatas.
import { ref, computed, onMounted } from 'vue'
import { getBoard } from '../services/orderService'
import { STATUS } from '../constants'
import { useAsyncAction } from './useAsyncAction'

export function useBoard() {
  const rows = ref([])
  const filter = ref('')
  const { error, loading: memuat, run } = useAsyncAction()

  onMounted(() => run(async () => { rows.value = await getBoard() }))

  const semua = () => { filter.value = '' }
  // Memilih tahap yang sama sekali lagi membatalkan filter.
  const toggleTahap = (v) => { filter.value = filter.value === v ? '' : v }

  const tahap = computed(() => STATUS.slice(0, 4).map((s) => ({ ...s, n: rows.value.filter((r) => r.status === s.v).length })))
  const tampil = computed(() => (filter.value ? rows.value.filter((r) => r.status === filter.value) : rows.value))

  return { memuat, rows, error, filter, tahap, tampil, semua, toggleTahap }
}
