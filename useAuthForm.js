// Logika form masuk dan daftar: validasi, panggilan API, lalu simpan sesi.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../auth'
import { login, register } from '../services/authService'
import { validateLogin, validateRegister, hasErrors } from '../utils/validators'
import { bersihkanField } from '../utils/sanitize'
import { useAsyncAction } from './useAsyncAction'

function useSubmit(onSuccess) {
  const loading = ref(false)
  const errors = ref({})
  const { error, run: jalankan } = useAsyncAction()

  async function run(validate, request) {
    error.value = ''
    errors.value = validate()
    if (hasErrors(errors.value)) return
    loading.value = true
    await jalankan(async () => onSuccess(await request()))
    loading.value = false
  }
  return { error, errors, loading, run }
}

export function useLogin() {
  const router = useRouter()
  const form = ref({ username: '', password: '' })
  const { error, errors, loading, run } = useSubmit((r) => { auth.setSession(r.token, r.user); router.push('/') })

  const masuk = () => {
    const data = { ...form.value, username: form.value.username.trim() } // kata sandi dikirim apa adanya
    return run(() => validateLogin(data), () => login(data))
  }
  return { form, error, errors, loading, masuk }
}

export function useRegister() {
  const router = useRouter()
  const form = ref({ nama: '', kamar: '', kontak: '', username: '', password: '' })
  const ulang = ref('')
  const { error, errors, loading, run } = useSubmit((r) => { auth.setSession(r.token, r.user); router.push('/') })

  const daftar = () => {
    const data = bersihkanField(form.value, ['nama', 'kamar', 'kontak', 'username'])
    return run(() => validateRegister(data, ulang.value), () => register(data))
  }
  return { form, ulang, error, errors, loading, daftar }
}
