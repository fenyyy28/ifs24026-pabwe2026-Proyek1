<script setup>
import { useLogin } from '../composables/useAuthForm'
import LaundryArt from '../components/LaundryArt.vue'
import FieldError from '../components/FieldError.vue'

const { form, error, errors, loading, masuk } = useLogin()
</script>

<template>
  <main class="auth">
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
        <label>Username <input id="username" name="username" v-model="form.username" autocomplete="username" required autofocus :aria-invalid="!!errors.username" :aria-describedby="errors.username ? 'err-username' : undefined" /><FieldError id="err-username" :message="errors.username" /></label>
        <label>Kata sandi <input id="password" name="password" type="password" v-model="form.password" autocomplete="current-password" required :aria-invalid="!!errors.password" :aria-describedby="errors.password ? 'err-password' : undefined" /><FieldError id="err-password" :message="errors.password" /></label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button id="btn-submit" class="btn" type="submit" :disabled="loading">{{ loading ? 'Memproses…' : 'Masuk' }}</button>
        <p class="alt">Belum punya akun? <RouterLink to="/auth/register">Daftar sebagai penghuni</RouterLink></p>
        <p class="demo">Akun contoh: <b>budi</b> / budi123 (penghuni) · <b>petugas</b> / petugas123 (petugas laundry)</p>
      </form>
    </section>
  </main>
</template>
