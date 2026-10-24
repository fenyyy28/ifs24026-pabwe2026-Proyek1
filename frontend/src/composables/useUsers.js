// Manajemen data penghuni oleh petugas.
import { ref, onMounted } from 'vue'
import { listUsers, updateUser, deleteUser } from '../services/userService'

export function useUsers() {
  const users = ref([])
  const error = ref('')
  const form = ref(null)

  async function load() { users.value = await listUsers() }
  onMounted(() => load().catch((e) => (error.value = e.message)))

  async function simpan() {
    error.value = ''
    try { await updateUser(form.value.id, form.value); form.value = null; load() } catch (e) { error.value = e.message }
  }

  async function remove(u) {
    try { await deleteUser(u.id); load() } catch (e) { error.value = e.message }
  }

  return { users, error, form, simpan, remove }
}
