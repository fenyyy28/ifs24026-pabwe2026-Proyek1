// Logika form masuk dan daftar: validasi, panggilan API, lalu simpan sesi.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../auth'
import { login, register } from '../services/authService'
import { validateLogin, validateRegister } from '../utils/validators'

function useSubmit(onSuccess) {
  const error = ref('')
  const loading = ref(false)

  async function run(validate, request) {
    error.value = ''
    const invalid = validate()
    if (invalid) { error.value = invalid; return }
    loading.value = true
    try {
      const r = await request()
      onSuccess(r)
    } catch (e) { error.value = e.message } finally { loading.value = false }
  }
  return { error, loading, run }
}

export function useLogin() {
  const router = useRouter()
  const form = ref({ username: '', password: '' })
  const { error, loading, run } = useSubmit((r) => { auth.setSession(r.token, r.user); router.push('/') })

  const masuk = () => run(() => validateLogin(form.value), () => login(form.value))
  return { form, error, loading, masuk }
}

export function useRegister() {
  const router = useRouter()
  const form = ref({ nama: '', kamar: '', kontak: '', username: '', password: '' })
  const ulang = ref('')
  const { error, loading, run } = useSubmit((r) => { auth.setSession(r.token, r.user); router.push('/') })

  const daftar = () => run(() => validateRegister(form.value, ulang.value), () => register(form.value))
  return { form, ulang, error, loading, daftar }
}
