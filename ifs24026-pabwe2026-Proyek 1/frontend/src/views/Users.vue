<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const users = ref([])
const error = ref('')
const blank = () => ({ id: null, nama: '', kamar: '', kontak: '' })
const form = ref(blank())

async function load() { users.value = await api('/api/users') }
onMounted(() => load().catch((e) => (error.value = e.message)))

async function simpan() {
  error.value = ''
  try {
    const f = form.value
    if (f.id) await api('/api/users/' + f.id, { method: 'PUT', body: f })
    else await api('/api/users', { method: 'POST', body: f })
    form.value = blank(); load()
  } catch (e) { error.value = e.message }
}
async function hapus(u) {
  if (!confirm(`Hapus ${u.nama}? Semua order miliknya ikut terhapus.`)) return
  await api('/api/users/' + u.id, { method: 'DELETE' }); load()
}
</script>

<template>
  <h1>Penghuni</h1>
  <form class="form inline" @submit.prevent="simpan">
    <input v-model="form.nama" placeholder="Nama" required />
    <input v-model="form.kamar" placeholder="Kamar (mis. A-101)" required />
    <input v-model="form.kontak" placeholder="Kontak" />
    <button class="btn" type="submit">{{ form.id ? 'Simpan perubahan' : 'Tambah penghuni' }}</button>
    <button v-if="form.id" type="button" class="btn ghost" @click="form = blank()">Batal</button>
  </form>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="!users.length" class="empty">Belum ada penghuni. Tambahkan penghuni pertama di atas.</p>
  <ul class="list">
    <li v-for="u in users" :key="u.id">
      <b>{{ u.nama }}</b><span>Kamar {{ u.kamar }}</span><span>{{ u.kontak }}</span>
      <button class="link" @click="form = { ...u }">Ubah</button>
      <button class="link danger" @click="hapus(u)">Hapus</button>
    </li>
  </ul>
</template>
