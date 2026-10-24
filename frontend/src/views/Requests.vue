<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { api, REQ_STEPS, REQ_LABEL, tgl } from '../api'
import { auth } from '../auth'
import { compressImage } from '../image'
import ProgressSteps from '../components/ProgressSteps.vue'
import PhotoGallery from '../components/PhotoGallery.vue'
import OrderTag from '../components/OrderTag.vue'

const router = useRouter()
const list = ref([])
const error = ref('')
const sukses = ref(false)
const loading = ref(false)
const today = new Date().toISOString().slice(0, 10)
const form = ref({ waktu_jemput: today, catatan: '' })
const files = ref([]) // { file, url }
const tanggapan = ref({})

async function load() {
  try { list.value = await api('/api/requests') } catch (e) { error.value = e.message }
}
onMounted(load)
onBeforeUnmount(() => files.value.forEach((f) => URL.revokeObjectURL(f.url)))

async function pilih(e) {
  error.value = ''
  const picked = [...e.target.files]
  e.target.value = ''
  for (const f of picked) {
    if (files.value.length >= 4) { error.value = 'Maksimal 4 foto per permintaan'; break }
    const small = await compressImage(f)
    files.value.push({ file: small, url: URL.createObjectURL(small) })
  }
}
function buang(i) { URL.revokeObjectURL(files.value[i].url); files.value.splice(i, 1) }

async function kirim() {
  error.value = ''; sukses.value = false; loading.value = true
  try {
    const fd = new FormData()
    fd.append('waktu_jemput', form.value.waktu_jemput)
    fd.append('catatan', form.value.catatan)
    files.value.forEach((f) => fd.append('foto', f.file, f.file.name || 'foto.jpg'))
    await api('/api/requests', { method: 'POST', body: fd })
    form.value.catatan = ''
    files.value.forEach((f) => URL.revokeObjectURL(f.url)); files.value = []
    sukses.value = true
    load()
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

async function batal(r) {
  if (!confirm('Batalkan permintaan jemput ini?')) return
  try { await api('/api/requests/' + r.id, { method: 'DELETE' }); load() } catch (e) { error.value = e.message }
}
async function putus(r, status) {
  error.value = ''
  try { await api('/api/requests/' + r.id, { method: 'PATCH', body: { status, tanggapan: tanggapan.value[r.id] } }); load() }
  catch (e) { error.value = e.message }
}
const buatOrder = (r) => router.push({ path: '/order/baru', query: { permintaan: r.id } })
</script>

<template>
  <h1>{{ auth.isAdmin ? 'Permintaan jemput' : 'Jemput cucian' }}</h1>

  <form v-if="!auth.isAdmin" class="form card" @submit.prevent="kirim">
    <h2 class="h-sub">Ajukan permintaan jemput</h2>
    <p class="hint">Foto pakaian kotor membantu petugas mencatat kondisi awal, jadi lebih mudah dibuktikan kalau ada barang hilang atau rusak.</p>
    <div class="grid2">
      <label>Tanggal jemput <input type="date" v-model="form.waktu_jemput" :min="today" required /></label>
      <label>Isi cucian <input v-model="form.catatan" placeholder="Contoh: 5 kaos, 2 celana, 1 jaket" required /></label>
    </div>
    <div>
      <label class="upload">
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple @change="pilih" :disabled="files.length >= 4" />
        <span>Tambah foto cucian ({{ files.length }}/4)</span>
      </label>
      <div v-if="files.length" class="gallery top-gap">
        <figure v-for="(f, i) in files" :key="f.url" class="thumb">
          <img :src="f.url" alt="Pratinjau foto" />
          <button type="button" class="x" @click="buang(i)" aria-label="Hapus foto">×</button>
        </figure>
      </div>
    </div>
    <p v-if="sukses" class="ok-text" role="status">Permintaan terkirim. Petugas akan menanggapi, dan kamu dapat notifikasi.</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button class="btn" type="submit" :disabled="loading">{{ loading ? 'Mengirim…' : 'Kirim permintaan' }}</button>
  </form>
  <p v-else-if="error" class="error">{{ error }}</p>

  <h2>{{ auth.isAdmin ? 'Semua permintaan' : 'Permintaan saya' }}</h2>
  <p v-if="!list.length" class="empty">{{ auth.isAdmin ? 'Belum ada permintaan jemput.' : 'Belum ada permintaan. Ajukan lewat form di atas.' }}</p>
  <article v-for="r in list" :key="r.id" class="card">
    <div class="row-between">
      <b v-if="auth.isAdmin">{{ r.nama }} · kamar {{ r.kamar }}</b>
      <b v-else>Jemput {{ tgl(r.waktu_jemput) }}</b>
      <small class="muted">Diajukan {{ tgl(r.dibuat) }}</small>
    </div>
    <p v-if="auth.isAdmin" class="muted">Jemput {{ tgl(r.waktu_jemput) }}</p>
    <p>{{ r.catatan }}</p>
    <PhotoGallery v-if="r.foto.length" :fotos="r.foto" />
    <ProgressSteps v-if="r.status !== 'ditolak'" :steps="REQ_STEPS" :current="r.status" compact />
    <p v-else class="error">{{ REQ_LABEL.ditolak }}</p>
    <p v-if="r.tanggapan" class="note"><b>Catatan petugas:</b> {{ r.tanggapan }}</p>
    <p v-if="r.order_id" class="note">Sudah menjadi order
      <RouterLink :to="'/order/' + r.order_id"><OrderTag :kode="r.order_kode" /></RouterLink></p>

    <div v-if="auth.isAdmin && r.status !== 'diorder'" class="form inline top-gap">
      <template v-if="r.status === 'disetujui'">
        <button class="btn" @click="buatOrder(r)">Buat order dari permintaan ini</button>
      </template>
      <input v-if="r.status !== 'ditolak'" v-model="tanggapan[r.id]" class="grow" placeholder="Catatan untuk penghuni (opsional)" :aria-label="'Catatan untuk ' + r.nama" />
      <button v-if="r.status === 'menunggu'" class="btn" @click="putus(r, 'disetujui')">Setujui</button>
      <button v-if="r.status !== 'ditolak'" class="btn ghost" @click="putus(r, 'ditolak')">Tolak</button>
    </div>
    <div v-if="!auth.isAdmin && r.status === 'menunggu'" class="top-gap">
      <button class="link danger" @click="batal(r)">Batalkan permintaan</button>
    </div>
  </article>
</template>
