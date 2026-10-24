<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api, rupiah, tgl } from '../api'
import PhotoGallery from '../components/PhotoGallery.vue'

const router = useRouter()
const route = useRoute()
const permintaan = ref(null)
const users = ref([])
const error = ref('')
const d = new Date(); d.setDate(d.getDate() + 3)
const form = ref({ user_id: '', berat_kg: 1, estimasi_selesai: d.toISOString().slice(0, 10) })
const items = ref([{ jenis: '', jumlah: 1, warna: '', catatan: '' }])

onMounted(async () => {
  users.value = await api('/api/users')
  const id = Number(route.query.permintaan)
  if (id) {
    permintaan.value = (await api('/api/requests')).find((r) => r.id === id) || null
    if (permintaan.value) form.value.user_id = permintaan.value.user_id
  }
})

const tambah = () => items.value.push({ jenis: '', jumlah: 1, warna: '', catatan: '' })
const hapus = (i) => items.value.splice(i, 1)

async function simpan() {
  error.value = ''
  try {
    const r = await api('/api/orders', { method: 'POST', body: { ...form.value, items: items.value, request_id: permintaan.value?.id } })
    router.push('/order/' + r.id)
  } catch (e) { error.value = e.message }
}
</script>

<template>
  <h1>Order baru</h1>
  <p v-if="!users.length" class="empty">Belum ada penghuni terdaftar. Penghuni mendaftar sendiri lewat halaman Daftar.</p>
  <section v-if="permintaan" class="card">
    <h2 class="h-sub">Dari permintaan jemput {{ permintaan.nama }}</h2>
    <p>{{ permintaan.catatan }} <small class="muted">(jemput {{ tgl(permintaan.waktu_jemput) }})</small></p>
    <PhotoGallery v-if="permintaan.foto.length" :fotos="permintaan.foto" />
    <p class="hint">Catat pakaian satu per satu di bawah. Foto ini otomatis tersimpan di order sebagai kondisi awal.</p>
  </section>
  <form @submit.prevent="simpan" class="form card">
    <label>Penghuni
      <select v-model="form.user_id" required>
        <option value="" disabled>Pilih penghuni</option>
        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.nama }} ({{ u.kamar }})</option>
      </select>
    </label>
    <div class="grid2">
      <label>Berat (kg) <input type="number" min="0.5" step="0.5" v-model="form.berat_kg" required /></label>
      <label>Estimasi selesai <input type="date" v-model="form.estimasi_selesai" required /></label>
    </div>
    <p class="hint">Perkiraan biaya: {{ rupiah(form.berat_kg * 5000) }} (Rp 5.000 per kg)</p>

    <h2>Daftar pakaian</h2>
    <p class="hint">Catat semua item saat diserahkan. Daftar ini dipakai untuk mengecek saat cucian diambil.</p>
    <div v-for="(it, i) in items" :key="i" class="item-row">
      <input v-model="it.jenis" placeholder="Jenis (kemeja, celana, ...)" required />
      <input type="number" min="1" v-model="it.jumlah" aria-label="Jumlah" />
      <input v-model="it.warna" placeholder="Warna" />
      <input v-model="it.catatan" placeholder="Ciri khusus (nama, noda, ...)" />
      <button type="button" class="link danger" @click="hapus(i)" :disabled="items.length === 1">Hapus</button>
    </div>
    <button type="button" class="btn ghost" @click="tambah">Tambah item</button>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn" type="submit">Simpan order</button>
  </form>
</template>
