// Pola error handling seragam: setiap aksi async dijalankan lewat `run`, yang
// mengosongkan pesan lama dan menangkap error menjadi teks untuk ditampilkan.
import { ref } from 'vue'

export function useAsyncAction() {
  const error = ref('')

  async function run(fn) {
    error.value = ''
    try {
      return await fn()
    } catch (e) {
      error.value = e?.message || 'Terjadi kesalahan'
      return undefined
    }
  }

  return { error, run }
}
