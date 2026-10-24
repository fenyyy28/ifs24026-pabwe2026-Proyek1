<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const users = ref([])
const error = ref('')
const form = ref(null)

async function load() { users.value = await api('/api/users') }
onMounted(() => load().catch((e) => (error.value = e.message)))

async function simpan() {
  error.value = ''
  try { await api('/api/users/' + form.value.id, { method: 'PUT', body: form.value }); form.value = null; load() }
  catch (e) { error.value = e.message }
}
async function hapus(u) {
  if (!confirm(`Hapus ${u.nama}? Semua order miliknya ikut terhapus.`)) return
  await api('/api/users/' + u.id, { method: 'DELETE' }); load()
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
