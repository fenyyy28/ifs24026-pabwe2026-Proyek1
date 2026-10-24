<script setup>
import { useOrderDetail } from '../composables/useOrderDetail'
import { STATUS, STATUS_PESAN, KOMPLAIN_STATUS, JENIS_KOMPLAIN } from '../constants'
import { statusLabel, rupiah, tgl } from '../utils/format'
import { auth } from '../auth'
import OrderTag from '../components/OrderTag.vue'
import ProgressSteps from '../components/ProgressSteps.vue'
import PhotoGallery from '../components/PhotoGallery.vue'
import FieldError from '../components/FieldError.vue'

const props = defineProps({ id: String })
const { o, error, errors, komplain, terkirim, idx, next, belum, setStatus, cek, kirimKomplain } = useOrderDetail(() => props.id)
</script>

<template>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <template v-if="o">
    <div class="row-between">
      <h1><OrderTag :kode="o.kode" :terlambat="o.terlambat" /></h1>
      <RouterLink to="/order">Kembali ke daftar</RouterLink>
    </div>
    <p class="muted">{{ auth.isAdmin ? `${o.nama} · kamar ${o.kamar} · ` : '' }}masuk {{ tgl(o.tanggal_masuk) }} · estimasi selesai {{ tgl(o.estimasi_selesai) }}
      · {{ o.berat_kg }} kg · {{ rupiah(o.total_harga) }}</p>
    <div v-if="o.terlambat" class="banner late" role="status">Order ini melewati estimasi selesai.</div>

    <section class="card">
      <ProgressSteps :steps="STATUS" :current="o.status" />
      <p class="note">{{ STATUS_PESAN[o.status] }}</p>
      <div v-if="auth.isAdmin" class="filters">
        <button v-if="next" class="btn" @click="setStatus(next.v)">Ubah ke "{{ next.l }}"</button>
        <select :value="o.status" @change="setStatus($event.target.value)" aria-label="Atur status langsung">
          <option v-for="s in STATUS" :key="s.v" :value="s.v">{{ s.l }}</option>
        </select>
      </div>
    </section>

    <template v-if="o.foto.length">
      <h2>Foto cucian saat diserahkan</h2>
      <PhotoGallery :fotos="o.foto" />
    </template>

    <h2>Riwayat status</h2>
    <ul class="timeline">
      <li v-for="r in [...o.riwayat].reverse()" :key="r.waktu + r.status">
        <b>{{ statusLabel(r.status) }}</b><span>{{ tgl(r.waktu) }}</span>
      </li>
    </ul>

    <h2>Daftar pakaian</h2>
    <p v-if="auth.isAdmin" class="hint">Centang setiap item yang sudah diterima kembali. Order baru bisa diselesaikan setelah semua tercentang
      <span v-if="belum">(tersisa {{ belum }})</span>.</p>
    <p v-else class="hint">Cocokkan daftar ini dengan pakaian yang kamu terima saat mengambil cucian.</p>
    <ul class="list">
      <li v-for="i in o.items" :key="i.id">
        <label v-if="auth.isAdmin" class="check"><input type="checkbox" :checked="!!i.dikembalikan" @change="cek(i)" />
          {{ i.jumlah }}× {{ i.jenis }}</label>
        <b v-else>{{ i.jumlah }}× {{ i.jenis }}</b>
        <span>{{ i.warna }}</span><span>{{ i.catatan }}</span>
        <small v-if="!auth.isAdmin && i.dikembalikan" class="ok-text">Sudah dikembalikan</small>
      </li>
    </ul>

    <h2>Komplain untuk order ini</h2>
    <p v-if="!o.complaints.length" class="empty">Belum ada komplain.</p>
    <article v-for="c in o.complaints" :key="c.id" class="card slim">
      <div class="row-between"><b>{{ JENIS_KOMPLAIN[c.jenis] }}</b><small>{{ tgl(c.dibuat) }}</small></div>
      <p>{{ c.deskripsi }}</p>
      <ProgressSteps :steps="KOMPLAIN_STATUS" :current="c.status" compact />
      <p v-if="c.tanggapan" class="note"><b>Tanggapan petugas:</b> {{ c.tanggapan }}</p>
    </article>

    <form v-if="!auth.isAdmin" class="form card" @submit.prevent="kirimKomplain">
      <h3>Ada masalah dengan cucian ini?</h3>
      <div class="grid2">
        <label>Jenis masalah
          <select v-model="komplain.jenis" :aria-invalid="!!errors.jenis" :aria-describedby="errors.jenis ? 'err-jenis' : undefined">
            <option v-for="(l, k) in JENIS_KOMPLAIN" :key="k" :value="k">{{ l }}</option>
          </select>
          <FieldError id="err-jenis" :message="errors.jenis" />
        </label>
        <label>Ceritakan masalahnya <input v-model="komplain.deskripsi" placeholder="Contoh: kaos biru hanya kembali 3 dari 4" required :aria-invalid="!!errors.deskripsi" :aria-describedby="errors.deskripsi ? 'err-deskripsi' : undefined" /><FieldError id="err-deskripsi" :message="errors.deskripsi" /></label>
      </div>
      <p v-if="terkirim" class="ok-text" role="status">Komplain diajukan. Pantau statusnya di halaman Komplain.</p>
      <button class="btn" type="submit">Ajukan komplain</button>
    </form>
  </template>
</template>
