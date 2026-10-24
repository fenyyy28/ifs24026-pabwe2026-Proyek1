// Manajemen data penghuni oleh petugas.
import { ref, onMounted } from 'vue'
import { listUsers, updateUser, deleteUser } from '../services/userService'
import { useAsyncAction } from './useAsyncAction'
import { requireAdmin } from '../utils/guard'
import { konfirmasi } from '../utils/dialog'
import { bersihkanField } from '../utils/sanitize'

export function useUsers() {
  const users = ref([])
  const form = ref(null)
  const { error, run } = useAsyncAction()

  const fetchUsers = async () => { requireAdmin(); users.value = await listUsers() }
  const load = () => run(fetchUsers)

  const ubah = (u) => { form.value = { ...u } }
  const batalUbah = () => { form.value = null }

  const simpan = () => run(async () => {
    requireAdmin()
    const data = bersihkanField(form.value, ['nama', 'kamar', 'kontak'])
    await updateUser(data.id, data)
    form.value = null
    await fetchUsers()
  })

  function hapus(u) {
    if (!konfirmasi(`Hapus ${u.nama}? Semua order miliknya ikut terhapus.`)) return
    return run(async () => { requireAdmin(); await deleteUser(u.id); await fetchUsers() })
  }

  onMounted(load)

  return { users, error, form, ubah, batalUbah, simpan, hapus }
}
