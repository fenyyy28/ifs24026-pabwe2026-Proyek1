<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'
import OrderTag from '../components/OrderTag.vue'

const list = ref([])
const error = ref('')
async function load() { try { list.value = await api('/api/complaints') } catch (e) { error.value = e.message } }
onMounted(load)

async function ubah(c, status) { await api('/api/complaints/' + c.id, { method: 'PATCH', body: { status } }); load() }
async function hapus(c) {
  if (!confirm('Hapus komplain ini?')) return
  await api('/api/complaints/' + c.id, { method: 'DELETE' }); load()
}
</script>

<template>
  <h1>Komplain</h1>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="!list.length" class="empty">Belum ada komplain. Komplain dibuat dari halaman detail order.</p>
  <ul class="list">
    <li v-for="c in list" :key="c.id">
      <RouterLink :to="'/order/' + c.order_id"><OrderTag :kode="c.kode" /></RouterLink>
      <span><b>{{ c.jenis }}</b> · {{ c.nama }} ({{ c.kamar }})</span>
      <span>{{ c.deskripsi }}</span>
      <select :value="c.status" @change="ubah(c, $event.target.value)">
        <option value="baru">Baru</option><option value="diproses">Diproses</option><option value="selesai">Selesai</option>
      </select>
      <button class="link danger" @click="hapus(c)">Hapus</button>
    </li>
  </ul>
</template>
