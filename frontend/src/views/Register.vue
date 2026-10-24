<script setup>
import { useRegister } from '../composables/useAuthForm'
import LaundryArt from '../components/LaundryArt.vue'

const { form, ulang, error, loading, daftar } = useRegister()
</script>

<template>
  <main class="auth">
    <section class="auth-art">
      <h1>Daftar penghuni</h1>
      <p>Satu akun untuk memantau semua cucianmu selama tinggal di asrama.</p>
      <LaundryArt />
    </section>
    <section class="auth-form">
      <form @submit.prevent="daftar" class="form">
        <h2>Buat akun</h2>
        <label>Nama lengkap <input id="nama" name="nama" v-model="form.nama" autocomplete="name" required /></label>
        <div class="grid2">
          <label>Nomor kamar <input id="kamar" name="kamar" v-model="form.kamar" placeholder="A-101" required /></label>
          <label>Kontak (opsional) <input id="kontak" name="kontak" v-model="form.kontak" inputmode="tel" /></label>
        </div>
        <label>Username <input id="username" name="username" v-model="form.username" autocomplete="username" placeholder="huruf kecil, angka, titik" required /></label>
        <div class="grid2">
          <label>Kata sandi <input id="password" name="password" type="password" v-model="form.password" autocomplete="new-password" minlength="6" required /></label>
          <label>Ulangi kata sandi <input id="password-confirm" name="password_confirm" type="password" v-model="ulang" autocomplete="new-password" required /></label>
        </div>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button id="btn-submit" class="btn" type="submit" :disabled="loading">{{ loading ? 'Memproses…' : 'Daftar' }}</button>
        <p class="alt">Sudah punya akun? <RouterLink to="/auth/login">Masuk</RouterLink></p>
      </form>
    </section>
  </main>
</template>
