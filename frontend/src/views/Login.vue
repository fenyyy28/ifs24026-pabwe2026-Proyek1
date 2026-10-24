<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { auth } from '../auth'
import LaundryArt from '../components/LaundryArt.vue'

const router = useRouter()
const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function masuk() {
  error.value = ''; loading.value = true
  try {
    const r = await api('/api/auth/login', { method: 'POST', body: form.value })
    auth.setSession(r.token, r.user)
    router.push('/')
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
</script>

<template>
  <div class="auth">
    <section class="auth-art">
      <h1>LaundryTrack Asrama</h1>
      <p>Pantau cucianmu dari kamar, tanpa bolak-balik ke ruang laundry.</p>
      <LaundryArt />
      <ul>
        <li>Lihat tahap cucian: diterima, dicuci, disetrika, siap diambil</li>
        <li>Dapat pemberitahuan saat pakaianmu selesai</li>
        <li>Ajukan komplain dan pantau penanganannya</li>
      </ul>
    </section>
    <section class="auth-form">
      <form @submit.prevent="masuk" class="form">
        <h2>Masuk</h2>
        <p class="hint">Gunakan akun yang kamu daftarkan.</p>
        <label>Username <input name="username" v-model="form.username" autocomplete="username" required autofocus /></label>
        <label>Kata sandi <input name="password" type="password" v-model="form.password" autocomplete="current-password" required /></label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="btn" type="submit" :disabled="loading">{{ loading ? 'Memproses…' : 'Masuk' }}</button>
        <p class="alt">Belum punya akun? <RouterLink to="/daftar">Daftar sebagai penghuni</RouterLink></p>
        <p class="demo">Akun contoh: <b>budi</b> / budi123 (penghuni) · <b>petugas</b> / petugas123 (petugas laundry)</p>
      </form>
    </section>
  </div>
</template>
