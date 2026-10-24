// Logika form masuk dan daftar: validasi, panggilan API, lalu simpan sesi.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../auth'
import { login, register } from '../services/authService'
import { validateLogin, validateRegister } from '../utils/validators'
import { bersihkanField } from '../utils/sanitize'
import { useAsyncAction } from './useAsyncAction'

function useSubmit(onSuccess) {
  const loading = ref(false)
  const { error, run: jalankan } = useAsyncAction()

  async function run(validate, request) {
    error.value = ''
    const invalid = validate()
    if (invalid) { error.value = invalid; return }
    loading.value = true
    await jalankan(async () => onSuccess(await request()))
    loading.value = false
  }
  return { error, loading, run }
}

export function useLogin() {
  const router = useRouter()
  const form = ref({ username: '', password: '' })
  const { error, loading, run } = useSubmit((r) => { auth.setSession(r.token, r.user); router.push('/') })

  const masuk = () => {
    const data = { ...form.value, username: form.value.username.trim() } // kata sandi dikirim apa adanya
    return run(() => validateLogin(data), () => login(data))
  }
  return { form, error, loading, masuk }
}

export function useRegister() {
  const router = useRouter()
  const form = ref({ nama: '', kamar: '', kontak: '', username: '', password: '' })
  const ulang = ref('')
  const { error, loading, run } = useSubmit((r) => { auth.setSession(r.token, r.user); router.push('/') })

  const daftar = () => {
    const data = bersihkanField(form.value, ['nama', 'kamar', 'kontak', 'username'])
    return run(() => validateRegister(data, ulang.value), () => register(data))
  }
  return { form, ulang, error, loading, daftar }
}
