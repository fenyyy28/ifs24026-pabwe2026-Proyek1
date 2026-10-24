<script setup>
import { ref, onMounted, computed } from 'vue'
import { api, STATUS, rupiah } from '../api'
import OrderTag from '../components/OrderTag.vue'

const props = defineProps({ id: String })
const o = ref(null)
const error = ref('')
const komplain = ref({ jenis: 'hilang', deskripsi: '' })

async function load() { o.value = await api('/api/orders/' + props.id) }
onMounted(() => load().catch((e) => (error.value = e.message)))

const idx = computed(() => STATUS.findIndex((s) => s.v === o.value?.status))
const next = computed(() => STATUS[idx.value + 1])

async function setStatus(v) {
  error.value = ''
  try { await api(`/api/orders/${props.id}/status`, { method: 'PATCH', body: { status: v } }); await load() }
  catch (e) { error.value = e.message }
}
async function cek(item) {
  await api('/api/items/' + item.id, { method: 'PATCH', body: { dikembalikan: !item.dikembalikan } })
  load()
}
async function kirimKomplain() {
  error.value = ''
  try {
    await api('/api/complaints', { method: 'POST', body: { order_id: props.id, ...komplain.value } })
    komplain.value.deskripsi = ''
    load()
  } catch (e) { error.value = e.message }
}
const belum = computed(() => o.value?.items.filter((i) => !i.dikembalikan).length ?? 0)
</script>

<template>
  <p v-if="error" class="error">{{ error }}</p>
  <template v-if="o">
    <div class="row-between">
      <h1><OrderTag :kode="o.kode" :terlambat="o.terlambat" /></h1>
      <RouterLink to="/order">Kembali ke daftar</RouterLink>
    </div>
    <p>{{ o.nama }} · kamar {{ o.kamar }} · masuk {{ o.tanggal_masuk }} · estimasi {{ o.estimasi_selesai }}
      · {{ o.berat_kg }} kg · {{ rupiah(o.total_harga) }}</p>
    <p v-if="o.terlambat" class="error">Order ini melewati estimasi selesai.</p>

    <ol class="steps">
      <li v-for="(s, i) in STATUS" :key="s.v" :class="{ done: i < idx, now: i === idx }">{{ s.l }}</li>
    </ol>
    <button v-if="next" class="btn" @click="setStatus(next.v)">Ubah ke "{{ next.l }}"</button>

    <h2>Cek pakaian saat pengambilan</h2>
    <p class="hint">Centang setiap item yang sudah diterima kembali. Order baru bisa diselesaikan setelah semua tercentang
      <span v-if="belum">(tersisa {{ belum }})</span>.</p>
    <ul class="list">
      <li v-for="i in o.items" :key="i.id">
        <label class="check"><input type="checkbox" :checked="!!i.dikembalikan" @change="cek(i)" />
          {{ i.jumlah }}× {{ i.jenis }}</label>
        <span>{{ i.warna }}</span><span>{{ i.catatan }}</span>
      </li>
    </ul>

    <h2>Komplain</h2>
    <ul class="list">
      <li v-for="c in o.complaints" :key="c.id"><b>{{ c.jenis }}</b><span>{{ c.deskripsi }}</span><span>{{ c.status }}</span></li>
    </ul>
    <p v-if="!o.complaints.length" class="empty">Belum ada komplain untuk order ini.</p>
    <form class="form inline" @submit.prevent="kirimKomplain">
      <select v-model="komplain.jenis">
        <option value="hilang">Barang hilang</option>
        <option value="tertukar">Barang tertukar</option>
        <option value="terlambat">Terlambat</option>
        <option value="lainnya">Lainnya</option>
      </select>
      <input v-model="komplain.deskripsi" placeholder="Jelaskan masalahnya" required />
      <button class="btn" type="submit">Kirim komplain</button>
    </form>
  </template>
</template>
