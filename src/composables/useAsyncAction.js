// Pola error handling dan loading seragam: setiap aksi async dijalankan lewat `run`,
// yang mengosongkan pesan lama, menandai `loading` selama proses berjalan, dan
// menangkap error menjadi teks untuk ditampilkan.
import { ref, computed } from 'vue'

export function useAsyncAction() {
  const error = ref('')
  const pending = ref(0) // dihitung, supaya beberapa aksi bersamaan tidak saling menimpa
  const loading = computed(() => pending.value > 0)

  async function run(fn) {
    error.value = ''
    pending.value++
    try {
      return await fn()
    } catch (e) {
      error.value = e?.message || 'Terjadi kesalahan'
      return undefined
    } finally {
      pending.value--
    }
  }

  return { error, loading, run }
}
