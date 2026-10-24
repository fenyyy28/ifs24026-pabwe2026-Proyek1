// Logika permintaan jemput: daftar, form pengajuan, foto, dan tindakan petugas.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { listRequests, createRequest, deleteRequest, reviewRequest } from '../services/requestService'
import { compressImage } from '../utils/image'
import { validateRequestForm } from '../utils/validators'
import { bersihkan } from '../utils/sanitize'
import { requireAdmin } from '../utils/guard'
import { konfirmasi } from '../utils/dialog'
import { useAsyncAction } from './useAsyncAction'
import { MAX_PHOTOS } from '../constants'

export function useRequests() {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const list = ref([])
  const sukses = ref(false)
  const loading = ref(false)
  const form = ref({ waktu_jemput: today, catatan: '' })
  const files = ref([]) // { file, url }
  const tanggapan = ref({})
  const { error, run } = useAsyncAction()

  const fetchList = async () => { list.value = await listRequests() }
  const load = () => run(fetchList)

  function clearPhotos() {
    files.value.forEach((f) => URL.revokeObjectURL(f.url))
    files.value = []
  }

  const pilih = (e) => run(async () => {
    const picked = [...e.target.files]
    e.target.value = ''
    for (const f of picked) {
      if (files.value.length >= MAX_PHOTOS) throw new Error(`Maksimal ${MAX_PHOTOS} foto per permintaan`)
      const small = await compressImage(f)
      files.value.push({ file: small, url: URL.createObjectURL(small) })
    }
  })

  function buang(i) {
    URL.revokeObjectURL(files.value[i].url)
    files.value.splice(i, 1)
  }

  async function kirim() {
    error.value = ''; sukses.value = false
    const data = { ...form.value, catatan: bersihkan(form.value.catatan) }
    const invalid = validateRequestForm(data, today)
    if (invalid) { error.value = invalid; return }
    loading.value = true
    await run(async () => {
      await createRequest(data, files.value.map((f) => f.file))
      form.value.catatan = ''
      clearPhotos()
      sukses.value = true
      await fetchList()
    })
    loading.value = false
  }

  function batal(r) {
    if (!konfirmasi('Batalkan permintaan jemput ini?')) return
    return run(async () => { await deleteRequest(r.id); await fetchList() })
  }

  const putus = (r, status) => run(async () => {
    requireAdmin()
    await reviewRequest(r.id, status, bersihkan(tanggapan.value[r.id]))
    await fetchList()
  })

  const buatOrder = (r) => router.push({ path: '/order/baru', query: { permintaan: r.id } })

  onMounted(load)
  onBeforeUnmount(clearPhotos)

  return { today, list, error, sukses, loading, form, files, tanggapan, pilih, buang, kirim, batal, putus, buatOrder }
}
