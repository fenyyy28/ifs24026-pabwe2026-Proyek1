<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { auth } from '../auth'
import LaundryArt from '../components/LaundryArt.vue'

const router = useRouter()
const form = ref({ nama: '', kamar: '', kontak: '', username: '', password: '' })
const ulang = ref('')
const error = ref('')
const loading = ref(false)

async function daftar() {
  error.value = ''
  if (form.value.password !== ulang.value) { error.value = 'Konfirmasi kata sandi tidak sama'; return }
  loading.value = true
  try {
    const r = await api('/api/auth/register', { method: 'POST', body: form.value })
    auth.setSession(r.token, r.user)
    router.push('/')
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
</script>

<template>
  <div class="auth">
    <section class="auth-art">
      <h1>Daftar penghuni</h1>
      <p>Satu akun untuk memantau semua cucianmu selama tinggal di asrama.</p>
      <LaundryArt />
    </section>
    <section class="auth-form">
      <form @submit.prevent="daftar" class="form">
        <h2>Buat akun</h2>
        <label>Nama lengkap <input v-model="form.nama" autocomplete="name" required /></label>
        <div class="grid2">
          <label>Nomor kamar <input v-model="form.kamar" placeholder="A-101" required /></label>
          <label>Kontak (opsional) <input v-model="form.kontak" inputmode="tel" /></label>
        </div>
        <label>Username <input v-model="form.username" autocomplete="username" placeholder="huruf kecil, angka, titik" required /></label>
        <div class="grid2">
          <label>Kata sandi <input type="password" v-model="form.password" autocomplete="new-password" minlength="6" required /></label>
          <label>Ulangi kata sandi <input type="password" v-model="ulang" autocomplete="new-password" required /></label>
        </div>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="btn" type="submit" :disabled="loading">{{ loading ? 'Memproses…' : 'Daftar' }}</button>
        <p class="alt">Sudah punya akun? <RouterLink to="/masuk">Masuk</RouterLink></p>
      </form>
    </section>
  </div>
</template>
