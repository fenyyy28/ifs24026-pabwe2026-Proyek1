<script setup>
import { useComplaints } from '../composables/useComplaints'
import { KOMPLAIN_STATUS, JENIS_KOMPLAIN } from '../constants'
import { tgl } from '../utils/format'
import { auth } from '../auth'
import OrderTag from '../components/OrderTag.vue'
import ProgressSteps from '../components/ProgressSteps.vue'
import LoadingState from '../components/LoadingState.vue'

const { memuat, list, draft, error, simpan, hapus } = useComplaints()
</script>

<template>
  <h1>{{ auth.isAdmin ? 'Komplain penghuni' : 'Komplain saya' }}</h1>
  <p class="hint">Alur penyelesaian: Diajukan → Sedang ditangani → Selesai.</p>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <LoadingState :loading="memuat" />
  <p v-if="!memuat && !list.length" class="empty">
    {{ auth.isAdmin ? 'Belum ada komplain dari penghuni.' : 'Belum ada komplain. Ajukan dari halaman detail cucian jika ada masalah.' }}
  </p>
  <article v-for="c in list" :key="c.id" class="card">
    <div class="row-between">
      <RouterLink :to="'/order/' + c.order_id"><OrderTag :kode="c.kode" /></RouterLink>
      <small class="muted">{{ tgl(c.dibuat) }}<template v-if="c.diperbarui !== c.dibuat"> · diperbarui {{ tgl(c.diperbarui) }}</template></small>
    </div>
    <p><b>{{ JENIS_KOMPLAIN[c.jenis] }}</b><template v-if="auth.isAdmin"> · {{ c.nama }} (kamar {{ c.kamar }})</template></p>
    <p>{{ c.deskripsi }}</p>
    <ProgressSteps :steps="KOMPLAIN_STATUS" :current="c.status" />
    <p v-if="c.tanggapan && !auth.isAdmin" class="note"><b>Tanggapan petugas:</b> {{ c.tanggapan }}</p>

    <div v-if="auth.isAdmin && draft[c.id]" class="form inline top-gap">
      <select v-model="draft[c.id].status" aria-label="Status komplain">
        <option v-for="s in KOMPLAIN_STATUS" :key="s.v" :value="s.v">{{ s.l }}</option>
      </select>
      <input v-model="draft[c.id].tanggapan" placeholder="Tanggapan untuk penghuni (opsional)" class="grow" aria-label="Tanggapan" />
      <button class="btn" @click="simpan(c)">Simpan</button>
      <button class="link danger" @click="hapus(c)">Hapus</button>
    </div>
  </article>
</template>
