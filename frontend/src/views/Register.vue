<script setup>
import { useRegister } from '../composables/useAuthForm'
import LaundryArt from '../components/LaundryArt.vue'
import FormField from '../components/FormField.vue'

const { form, ulang, error, errors, loading, daftar } = useRegister()
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
        <FormField label="Nama lengkap" name="nama" :error="errors.nama" v-slot="{ attrs }">
          <input id="nama" name="nama" v-model="form.nama" autocomplete="name" required v-bind="attrs" />
        </FormField>
        <div class="grid2">
          <FormField label="Nomor kamar" name="kamar" :error="errors.kamar" v-slot="{ attrs }">
            <input id="kamar" name="kamar" v-model="form.kamar" placeholder="A-101" required v-bind="attrs" />
          </FormField>
          <FormField label="Kontak (opsional)" name="kontak" :error="errors.kontak" v-slot="{ attrs }">
            <input id="kontak" name="kontak" v-model="form.kontak" inputmode="tel" v-bind="attrs" />
          </FormField>
        </div>
        <FormField label="Username" name="username" :error="errors.username" v-slot="{ attrs }">
          <input id="username" name="username" v-model="form.username" autocomplete="username" placeholder="huruf kecil, angka, titik" required v-bind="attrs" />
        </FormField>
        <div class="grid2">
          <FormField label="Kata sandi" name="password" :error="errors.password" v-slot="{ attrs }">
            <input id="password" name="password" type="password" v-model="form.password" autocomplete="new-password" minlength="6" required v-bind="attrs" />
          </FormField>
          <FormField label="Ulangi kata sandi" name="ulang" :error="errors.ulang" v-slot="{ attrs }">
            <input id="password-confirm" name="password_confirm" type="password" v-model="ulang" autocomplete="new-password" required v-bind="attrs" />
          </FormField>
        </div>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button id="btn-submit" class="btn" type="submit" :disabled="loading">{{ loading ? 'Memproses…' : 'Daftar' }}</button>
        <p class="alt">Sudah punya akun? <RouterLink to="/auth/login">Masuk</RouterLink></p>
      </form>
    </section>
  </main>
</template>
