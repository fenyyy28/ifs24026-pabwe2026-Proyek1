<script setup>
import { useRequests } from '../composables/useRequests'
import { REQ_STEPS, REQ_LABEL } from '../constants'
import { tgl } from '../utils/format'
import { auth } from '../auth'
import ProgressSteps from '../components/ProgressSteps.vue'
import PhotoGallery from '../components/PhotoGallery.vue'
import OrderTag from '../components/OrderTag.vue'
import FormField from '../components/FormField.vue'
import LoadingState from '../components/LoadingState.vue'

const { memuat, today, list, error, errors, sukses, loading, form, files, tanggapan, pilih, buang, kirim, batal, putus, buatOrder } = useRequests()
</script>

<template>
  <h1>{{ auth.isAdmin ? 'Permintaan jemput' : 'Jemput cucian' }}</h1>

  <form v-if="!auth.isAdmin" class="form card" @submit.prevent="kirim">
    <h2 class="h-sub">Ajukan permintaan jemput</h2>
    <p class="hint">Foto pakaian kotor membantu petugas mencatat kondisi awal, jadi lebih mudah dibuktikan kalau ada barang hilang atau rusak.</p>
    <div class="grid2">
      <FormField label="Tanggal jemput" name="waktu_jemput" :error="errors.waktu_jemput" v-slot="{ attrs }">
        <input type="date" v-model="form.waktu_jemput" :min="today" required v-bind="attrs" />
      </FormField>
      <FormField label="Isi cucian" name="catatan" :error="errors.catatan" v-slot="{ attrs }">
        <input v-model="form.catatan" placeholder="Contoh: 5 kaos, 2 celana, 1 jaket" required v-bind="attrs" />
      </FormField>
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
  <LoadingState :loading="memuat" />
  <p v-if="!memuat && !list.length" class="empty">{{ auth.isAdmin ? 'Belum ada permintaan jemput.' : 'Belum ada permintaan. Ajukan lewat form di atas.' }}</p>
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
