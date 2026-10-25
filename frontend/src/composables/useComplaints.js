// Daftar komplain dan tindakan petugas (ubah status, beri tanggapan, hapus).
import { ref, onMounted } from 'vue'
import { listComplaints, updateComplaint, deleteComplaint } from '../services/complaintService'
import { useAsyncAction } from './useAsyncAction'
import { requireAdmin } from '../utils/guard'
import { konfirmasi } from '../utils/dialog'
import { bersihkan } from '../utils/sanitize'

export function useComplaints() {
  const list = ref([])
  const draft = ref({})
  const { error, loading: memuat, run } = useAsyncAction()

  async function fetchList() {
    list.value = await listComplaints()
    for (const c of list.value) draft.value[c.id] = { status: c.status, tanggapan: c.tanggapan || '' }
  }
  const load = () => run(fetchList)

  const simpan = (c) => run(async () => {
    requireAdmin()
    const d = draft.value[c.id]
    await updateComplaint(c.id, { ...d, tanggapan: bersihkan(d.tanggapan) })
    await fetchList()
  })

  function hapus(c) {
    if (!konfirmasi('Hapus komplain ini?')) return
    return run(async () => { requireAdmin(); await deleteComplaint(c.id); await fetchList() })
  }

  onMounted(load)

  return { memuat, list, draft, error, simpan, hapus }
}
