<script setup>
import { ref, computed, onMounted } from 'vue'
import { api, STATUS, tgl } from '../api'
import OrderTag from '../components/OrderTag.vue'
import StatusPill from '../components/StatusPill.vue'

const rows = ref([])
const error = ref('')
const filter = ref('')

onMounted(async () => {
  try { rows.value = await api('/api/board') } catch (e) { error.value = e.message }
})

const tahap = computed(() => STATUS.slice(0, 4).map((s) => ({ ...s, n: rows.value.filter((r) => r.status === s.v).length })))
const tampil = computed(() => (filter.value ? rows.value.filter((r) => r.status === filter.value) : rows.value))
</script>

<template>
  <h1>Papan cucian</h1>
  <p class="hint">Status cucian yang sedang diproses di asrama. Yang ditampilkan hanya kode, nama depan, kamar, dan tahapnya.</p>
  <p v-if="error" class="error">{{ error }}</p>

  <div class="chips" role="group" aria-label="Filter tahap">
    <button class="chip" :class="{ on: !filter }" @click="filter = ''">Semua <b>{{ rows.length }}</b></button>
    <button v-for="t in tahap" :key="t.v" class="chip" :class="{ on: filter === t.v }" @click="filter = filter === t.v ? '' : t.v">
      {{ t.l }} <b>{{ t.n }}</b>
    </button>
  </div>

  <p v-if="!tampil.length" class="empty">Tidak ada cucian di tahap ini.</p>
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
