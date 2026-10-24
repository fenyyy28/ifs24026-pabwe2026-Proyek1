<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'
import OrderTag from '../components/OrderTag.vue'
import StatusPill from '../components/StatusPill.vue'

const stats = ref({})
const late = ref([])
const error = ref('')

onMounted(async () => {
  try {
    stats.value = await api('/api/stats')
    late.value = await api('/api/orders?terlambat=1')
  } catch (e) { error.value = e.message }
})
</script>

<template>
  <h1>Beranda</h1>
  <p v-if="error" class="error">{{ error }}</p>
  <div class="stats">
    <div><b>{{ stats.aktif ?? '-' }}</b><span>Order aktif</span></div>
    <div class="warn"><b>{{ stats.terlambat ?? '-' }}</b><span>Terlambat</span></div>
    <div><b>{{ stats.komplain_terbuka ?? '-' }}</b><span>Komplain terbuka</span></div>
    <div><b>{{ stats.total_order ?? '-' }}</b><span>Total order</span></div>
  </div>

  <div class="row-between">
    <h2>Order yang melewati estimasi</h2>
    <RouterLink class="btn" to="/order/baru">Buat order baru</RouterLink>
  </div>
  <p v-if="!late.length" class="empty">Tidak ada order yang terlambat. Semua cucian sesuai jadwal.</p>
  <ul class="list">
    <li v-for="o in late" :key="o.id">
      <RouterLink :to="'/order/' + o.id"><OrderTag :kode="o.kode" :terlambat="1" /></RouterLink>
      <span>{{ o.nama }} · kamar {{ o.kamar }}</span>
      <span>Estimasi {{ o.estimasi_selesai }}</span>
      <StatusPill :status="o.status" />
    </li>
  </ul>
</template>
