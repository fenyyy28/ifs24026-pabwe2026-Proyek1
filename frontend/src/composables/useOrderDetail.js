// Detail satu order: status, pengecekan pakaian, dan pengajuan komplain.
import { ref, computed, onMounted } from 'vue'
import { getOrder, updateOrderStatus, setItemReturned } from '../services/orderService'
import { createComplaint } from '../services/complaintService'
import { validateComplaintForm, hasErrors } from '../utils/validators'
import { bersihkan } from '../utils/sanitize'
import { requireAdmin } from '../utils/guard'
import { useAsyncAction } from './useAsyncAction'
import { STATUS } from '../constants'

export function useOrderDetail(getId) {
  const o = ref(null)
  const komplain = ref({ jenis: 'hilang', deskripsi: '' })
  const terkirim = ref(false)
  const errors = ref({})
  const { error, loading: memuat, run } = useAsyncAction()

  const fetchOrder = async () => { o.value = await getOrder(getId()) }
  const load = () => run(fetchOrder)
  onMounted(load)

  const idx = computed(() => STATUS.findIndex((s) => s.v === o.value?.status))
  const next = computed(() => STATUS[idx.value + 1])
  const belum = computed(() => o.value?.items.filter((i) => !i.dikembalikan).length ?? 0)

  const setStatus = (v) => run(async () => { requireAdmin(); await updateOrderStatus(getId(), v); await fetchOrder() })

  // Dipakai langsung oleh <select> di template, jadi view tidak perlu membaca $event.
  const pilihStatus = (e) => setStatus(e.target.value)

  const cek = (item) => run(async () => { requireAdmin(); await setItemReturned(item.id, !item.dikembalikan); await fetchOrder() })

  async function kirimKomplain() {
    error.value = ''; terkirim.value = false
    const data = { ...komplain.value, deskripsi: bersihkan(komplain.value.deskripsi) }
    errors.value = validateComplaintForm(data)
    if (hasErrors(errors.value)) return
    await run(async () => {
      await createComplaint({ order_id: getId(), ...data })
      komplain.value.deskripsi = ''; terkirim.value = true
      await fetchOrder()
    })
  }

  return { memuat, o, error, errors, komplain, terkirim, idx, next, belum, setStatus, pilihStatus, cek, kirimKomplain }
}
