<script setup>
import { useOrders } from '../composables/useOrders'
import { STATUS } from '../constants'
import { rupiah, tgl } from '../utils/format'
import { auth } from '../auth'
import OrderTag from '../components/OrderTag.vue'
import StatusPill from '../components/StatusPill.vue'

const { orders, q, status, late, error, remove } = useOrders()

async function hapus(o) {
  if (confirm(`Hapus order ${o.kode}?`)) await remove(o)
}
</script>

<template>
  <div class="row-between">
    <h1>{{ auth.isAdmin ? 'Order' : 'Cucian saya' }}</h1>
    <RouterLink v-if="auth.isAdmin" class="btn" to="/order/baru">Buat order baru</RouterLink>
  </div>
  <div class="filters">
    <input v-model="q" :placeholder="auth.isAdmin ? 'Cari kode, nama, atau kamar' : 'Cari kode cucian'" aria-label="Cari" />
    <select v-model="status" aria-label="Filter status">
      <option value="">Semua status</option>
      <option v-for="s in STATUS" :key="s.v" :value="s.v">{{ s.l }}</option>
    </select>
    <label class="check"><input type="checkbox" v-model="late" /> Hanya yang terlambat</label>
  </div>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="!orders.length" class="empty">Belum ada cucian yang cocok dengan pencarian ini.</p>
  <ul class="list">
    <li v-for="o in orders" :key="o.id">
      <RouterLink :to="'/order/' + o.id"><OrderTag :kode="o.kode" :terlambat="o.terlambat" /></RouterLink>
      <span v-if="auth.isAdmin">{{ o.nama }} · {{ o.kamar }}</span>
      <span>Estimasi {{ tgl(o.estimasi_selesai) }} · {{ rupiah(o.total_harga) }}</span>
      <StatusPill :status="o.status" />
      <button v-if="auth.isAdmin" class="link danger push" @click="hapus(o)">Hapus</button>
    </li>
  </ul>
</template>
