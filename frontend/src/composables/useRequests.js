// Logika permintaan jemput: daftar, form pengajuan, foto, dan tindakan petugas.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { listRequests, createRequest, deleteRequest, reviewRequest } from '../services/requestService'
import { compressImage } from '../utils/image'
import { validateRequestForm } from '../utils/validators'
import { MAX_PHOTOS } from '../constants'

export function useRequests() {
  const today = new Date().toISOString().slice(0, 10)
  const list = ref([])
  const error = ref('')
  const sukses = ref(false)
  const loading = ref(false)
  const form = ref({ waktu_jemput: today, catatan: '' })
  const files = ref([]) // { file, url }
  const tanggapan = ref({})

  async function load() {
    try { list.value = await listRequests() } catch (e) { error.value = e.message }
  }

  function clearPhotos() {
    files.value.forEach((f) => URL.revokeObjectURL(f.url))
    files.value = []
  }

  async function pilih(e) {
    error.value = ''
    const picked = [...e.target.files]
    e.target.value = ''
    for (const f of picked) {
      if (files.value.length >= MAX_PHOTOS) { error.value = `Maksimal ${MAX_PHOTOS} foto per permintaan`; break }
      const small = await compressImage(f)
      files.value.push({ file: small, url: URL.createObjectURL(small) })
    }
  }

  function buang(i) {
    URL.revokeObjectURL(files.value[i].url)
    files.value.splice(i, 1)
  }

  async function kirim() {
    error.value = ''; sukses.value = false
    const invalid = validateRequestForm(form.value, today)
    if (invalid) { error.value = invalid; return }
    loading.value = true
    try {
      await createRequest(form.value, files.value.map((f) => f.file))
      form.value.catatan = ''
      clearPhotos()
      sukses.value = true
      load()
    } catch (e) { error.value = e.message } finally { loading.value = false }
  }

  async function batalkan(r) {
    try { await deleteRequest(r.id); load() } catch (e) { error.value = e.message }
  }

  async function putus(r, status) {
    error.value = ''
    try { await reviewRequest(r.id, status, tanggapan.value[r.id]); load() } catch (e) { error.value = e.message }
  }

  onMounted(load)
  onBeforeUnmount(clearPhotos)

  return { today, list, error, sukses, loading, form, files, tanggapan, pilih, buang, kirim, batalkan, putus }
}
