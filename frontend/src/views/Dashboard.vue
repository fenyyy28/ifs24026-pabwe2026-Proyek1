<script setup>
import { useDashboard } from '../composables/useDashboard'
import { STATUS, STATUS_PESAN, JENIS_KOMPLAIN } from '../constants'
import { tgl } from '../utils/format'
import { auth } from '../auth'
import LaundryArt from '../components/LaundryArt.vue'
import ProgressSteps from '../components/ProgressSteps.vue'
import OrderTag from '../components/OrderTag.vue'
import StatusPill from '../components/StatusPill.vue'

const { stats, orders, notifs, komplain, permintaan, error, aktif, siap, terlambat, sapaan, ringkas } = useDashboard()
</script>

<template>
  <section class="hero">
    <div>
      <h1>{{ auth.isAdmin ? 'Ruang kerja petugas' : `Halo, ${sapaan}` }}</h1>
      <p>{{ ringkas }}</p>
      <RouterLink v-if="auth.isAdmin" class="btn" to="/order/baru">Buat order baru</RouterLink>
      <div v-else class="actions">
        <RouterLink class="btn" to="/jemput">Ajukan jemput cucian</RouterLink>
        <RouterLink class="btn ghost" to="/order">Lihat semua cucian</RouterLink>
      </div>
    </div>
    <LaundryArt class="hero-art" />
  </section>
  <p v-if="error" class="error">{{ error }}</p>

  <div v-if="!auth.isAdmin && siap.length" class="banner ok" role="status">
    <b>Cucianmu sudah selesai!</b>
    <span v-for="o in siap" :key="o.id"><RouterLink :to="'/order/' + o.id">{{ o.kode }}</RouterLink> siap diambil.</span>
    Bawa daftar pakaianmu untuk dicek bersama petugas.
  </div>

  <div class="stats">
    <div><b>{{ stats.aktif ?? '-' }}</b><span>{{ auth.isAdmin ? 'Order aktif' : 'Cucian aktif' }}</span></div>
    <div><b>{{ stats.siap_diambil ?? '-' }}</b><span>Siap diambil</span></div>
    <div class="warn"><b>{{ stats.terlambat ?? '-' }}</b><span>Terlambat</span></div>
    <div><b>{{ stats.komplain_terbuka ?? '-' }}</b><span>Komplain terbuka</span></div>
    <div><b>{{ stats.permintaan ?? '-' }}</b><span>{{ auth.isAdmin ? 'Permintaan jemput baru' : 'Permintaan jemput aktif' }}</span></div>
  </div>

  <template v-if="!auth.isAdmin">
    <h2>Cucian yang sedang diproses</h2>
    <p v-if="!aktif.length" class="empty">Tidak ada cucian aktif saat ini.</p>
    <article v-for="o in aktif" :key="o.id" class="card">
      <div class="row-between">
        <RouterLink :to="'/order/' + o.id"><OrderTag :kode="o.kode" :terlambat="o.terlambat" /></RouterLink>
        <span class="muted">Estimasi selesai {{ tgl(o.estimasi_selesai) }}</span>
      </div>
      <ProgressSteps :steps="STATUS" :current="o.status" />
      <p class="note">{{ STATUS_PESAN[o.status] }}
        <b v-if="o.terlambat" class="late-text"> Sudah melewati estimasi. Kamu bisa mengajukan komplain dari halaman detail.</b></p>
    </article>

    <div class="row-between">
      <h2>Pemberitahuan terbaru</h2>
      <RouterLink to="/notifikasi">Lihat semua</RouterLink>
    </div>
    <p v-if="!notifs.length" class="empty">Belum ada pemberitahuan.</p>
    <ul class="list">
      <li v-for="n in notifs" :key="n.id" :class="{ unread: !n.dibaca }">
        <b>{{ n.judul }}</b><span>{{ n.pesan }}</span><small>{{ tgl(n.dibuat) }}</small>
      </li>
    </ul>
  </template>

  <template v-else>
    <div class="row-between"><h2>Permintaan jemput baru</h2><RouterLink to="/jemput">Semua permintaan</RouterLink></div>
    <p v-if="!permintaan.length" class="empty">Tidak ada permintaan jemput yang menunggu.</p>
    <ul class="list">
      <li v-for="r in permintaan" :key="r.id">
        <b>{{ r.nama }}</b><span>kamar {{ r.kamar }}</span><span>Jemput {{ tgl(r.waktu_jemput) }}</span>
        <span>{{ r.catatan }}</span><span v-if="r.foto.length">{{ r.foto.length }} foto</span>
      </li>
    </ul>
    <div class="row-between"><h2>Order yang melewati estimasi</h2><RouterLink to="/order">Semua order</RouterLink></div>
    <p v-if="!terlambat.length" class="empty">Tidak ada order yang terlambat. Semua cucian sesuai jadwal.</p>
    <ul class="list">
      <li v-for="o in terlambat" :key="o.id">
        <RouterLink :to="'/order/' + o.id"><OrderTag :kode="o.kode" :terlambat="1" /></RouterLink>
        <span>{{ o.nama }} · kamar {{ o.kamar }}</span><span>Estimasi {{ tgl(o.estimasi_selesai) }}</span>
        <StatusPill :status="o.status" />
      </li>
    </ul>
    <div class="row-between"><h2>Komplain yang perlu ditangani</h2><RouterLink to="/komplain">Semua komplain</RouterLink></div>
    <p v-if="!komplain.length" class="empty">Tidak ada komplain terbuka.</p>
    <ul class="list">
      <li v-for="c in komplain" :key="c.id">
        <RouterLink :to="'/order/' + c.order_id"><OrderTag :kode="c.kode" /></RouterLink>
        <span>{{ JENIS_KOMPLAIN[c.jenis] }} · {{ c.nama }}</span><span>{{ c.deskripsi }}</span>
        <StatusPill :status="c.status" komplain />
      </li>
    </ul>
  </template>
</template>
