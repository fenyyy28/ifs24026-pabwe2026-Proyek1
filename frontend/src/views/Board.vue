<script setup>
import { useBoard } from '../composables/useBoard'
import { STATUS } from '../constants'
import { tgl } from '../utils/format'
import OrderTag from '../components/OrderTag.vue'
import StatusPill from '../components/StatusPill.vue'
import LoadingState from '../components/LoadingState.vue'

const { memuat, rows, error, filter, tahap, tampil, semua, toggleTahap } = useBoard()
</script>

<template>
  <h1>Papan cucian</h1>
  <p class="hint">Status cucian yang sedang diproses di asrama. Yang ditampilkan hanya kode, nama depan, kamar, dan tahapnya.</p>
  <p v-if="error" class="error">{{ error }}</p>

  <div class="chips" role="group" aria-label="Filter tahap">
    <button class="chip" :class="{ on: !filter }" @click="semua">Semua <b>{{ rows.length }}</b></button>
    <button v-for="t in tahap" :key="t.v" class="chip" :class="{ on: filter === t.v }" @click="toggleTahap(t.v)">
      {{ t.l }} <b>{{ t.n }}</b>
    </button>
  </div>

  <LoadingState :loading="memuat" />
  <p v-if="!memuat && !tampil.length" class="empty">Tidak ada cucian di tahap ini.</p>
  <ul class="list">
    <li v-for="r in tampil" :key="r.kode" :class="{ mine: r.milikku }">
      <OrderTag :kode="r.kode" :terlambat="r.terlambat" />
      <b>{{ r.nama }}</b><span>kamar {{ r.kamar }}</span>
      <span>Estimasi {{ tgl(r.estimasi_selesai) }}</span>
      <StatusPill :status="r.status" />
      <span v-if="r.milikku" class="me">Punyamu</span>
    </li>
  </ul>
</template>
