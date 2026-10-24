<script setup>
import { useUsers } from '../composables/useUsers'

const { users, error, form, simpan, remove } = useUsers()

async function hapus(u) {
  if (confirm(`Hapus ${u.nama}? Semua order miliknya ikut terhapus.`)) await remove(u)
}
</script>

<template>
  <h1>Penghuni</h1>
  <p class="hint">Penghuni mendaftar sendiri lewat halaman Daftar. Di sini kamu bisa merapikan datanya.</p>
  <form v-if="form" class="form inline card" @submit.prevent="simpan">
    <input v-model="form.nama" placeholder="Nama" required aria-label="Nama" />
    <input v-model="form.kamar" placeholder="Kamar" required aria-label="Kamar" />
    <input v-model="form.kontak" placeholder="Kontak" aria-label="Kontak" />
    <button class="btn" type="submit">Simpan perubahan</button>
    <button type="button" class="btn ghost" @click="form = null">Batal</button>
  </form>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="!users.length" class="empty">Belum ada penghuni yang mendaftar.</p>
  <ul class="list">
    <li v-for="u in users" :key="u.id">
      <b>{{ u.nama }}</b><span>Kamar {{ u.kamar }}</span><span>{{ u.kontak }}</span><span>@{{ u.username }}</span>
      <button class="link push" @click="form = { ...u }">Ubah</button>
      <button class="link danger" @click="hapus(u)">Hapus</button>
    </li>
  </ul>
</template>
