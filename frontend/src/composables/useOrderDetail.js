// Detail satu order: status, pengecekan pakaian, dan pengajuan komplain.
import { ref, computed, onMounted } from 'vue'
import { getOrder, updateOrderStatus, setItemReturned } from '../services/orderService'
import { createComplaint } from '../services/complaintService'
import { validateComplaintForm } from '../utils/validators'
import { STATUS } from '../constants'

export function useOrderDetail(getId) {
  const o = ref(null)
  const error = ref('')
  const komplain = ref({ jenis: 'hilang', deskripsi: '' })
  const terkirim = ref(false)

  async function load() { o.value = await getOrder(getId()) }
  onMounted(() => load().catch((e) => (error.value = e.message)))

  const idx = computed(() => STATUS.findIndex((s) => s.v === o.value?.status))
  const next = computed(() => STATUS[idx.value + 1])
  const belum = computed(() => o.value?.items.filter((i) => !i.dikembalikan).length ?? 0)

  async function setStatus(v) {
    error.value = ''
    try { await updateOrderStatus(getId(), v); await load() } catch (e) { error.value = e.message }
  }

  async function cek(item) {
    try { await setItemReturned(item.id, !item.dikembalikan); load() } catch (e) { error.value = e.message }
  }

  async function kirimKomplain() {
    error.value = ''; terkirim.value = false
    const invalid = validateComplaintForm(komplain.value)
    if (invalid) { error.value = invalid; return }
    try {
      await createComplaint({ order_id: getId(), ...komplain.value })
      komplain.value.deskripsi = ''; terkirim.value = true
      load()
    } catch (e) { error.value = e.message }
  }

  return { o, error, komplain, terkirim, idx, next, belum, setStatus, cek, kirimKomplain }
}
