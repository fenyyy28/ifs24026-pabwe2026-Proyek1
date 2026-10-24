// Daftar komplain dan tindakan petugas (ubah status, beri tanggapan, hapus).
import { ref, onMounted } from 'vue'
import { listComplaints, updateComplaint, deleteComplaint } from '../services/complaintService'

export function useComplaints() {
  const list = ref([])
  const draft = ref({})
  const error = ref('')

  async function load() {
    try {
      list.value = await listComplaints()
      for (const c of list.value) draft.value[c.id] = { status: c.status, tanggapan: c.tanggapan || '' }
    } catch (e) { error.value = e.message }
  }

  async function simpan(c) {
    error.value = ''
    try { await updateComplaint(c.id, draft.value[c.id]); load() } catch (e) { error.value = e.message }
  }

  async function remove(c) {
    try { await deleteComplaint(c.id); load() } catch (e) { error.value = e.message }
  }

  onMounted(load)

  return { list, draft, error, simpan, remove }
}
