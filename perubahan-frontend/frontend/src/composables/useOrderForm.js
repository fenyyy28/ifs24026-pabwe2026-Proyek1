// Form pembuatan order oleh petugas, bisa diisi awal dari permintaan jemput.
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createOrder } from '../services/orderService'
import { listRequests } from '../services/requestService'
import { listUsers } from '../services/userService'
import { validateOrderForm } from '../utils/validators'
import { bersihkanField } from '../utils/sanitize'
import { requireAdmin } from '../utils/guard'
import { useAsyncAction } from './useAsyncAction'

const ESTIMASI_HARI = 3
const itemKosong = () => ({ jenis: '', jumlah: 1, warna: '', catatan: '' })

export function useOrderForm() {
  const router = useRouter()
  const route = useRoute()
  const permintaan = ref(null)
  const users = ref([])
  const { error, run } = useAsyncAction()
  const d = new Date(); d.setDate(d.getDate() + ESTIMASI_HARI)
  const form = ref({ user_id: '', berat_kg: 1, estimasi_selesai: d.toISOString().slice(0, 10) })
  const items = ref([itemKosong()])

  onMounted(() => run(async () => {
    requireAdmin()
    users.value = await listUsers()
    const id = Number(route.query.permintaan)
    if (id) {
      permintaan.value = (await listRequests()).find((r) => r.id === id) || null
      if (permintaan.value) form.value.user_id = permintaan.value.user_id
    }
  }))

  const tambah = () => items.value.push(itemKosong())
  const hapus = (i) => items.value.splice(i, 1)

  async function simpan() {
    error.value = ''
    const bersih = items.value.map((i) => bersihkanField(i, ['jenis', 'warna', 'catatan']))
    const invalid = validateOrderForm(form.value, bersih)
    if (invalid) { error.value = invalid; return }
    await run(async () => {
      requireAdmin()
      const r = await createOrder({ ...form.value, items: bersih, request_id: permintaan.value?.id })
      await router.push('/order/' + r.id)
    })
  }

  return { permintaan, users, error, form, items, tambah, hapus, simpan }
}
