<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api, tgl } from '../api'
import { auth } from '../auth'

const router = useRouter()
const list = ref([])
const error = ref('')

async function load() {
  try {
    list.value = await api('/api/notifications')
    auth.unread = list.value.filter((n) => !n.dibaca).length
  } catch (e) { error.value = e.message }
}
onMounted(load)

async function buka(n) {
  if (!n.dibaca) { await api(`/api/notifications/${n.id}/read`, { method: 'PATCH' }); n.dibaca = 1; auth.unread = Math.max(0, auth.unread - 1) }
  if (n.order_id) router.push('/order/' + n.order_id)
}
async function semua() { await api('/api/notifications/read-all', { method: 'POST' }); load() }
</script>

<template>
  <div class="row-between">
    <h1>Notifikasi</h1>
    <button v-if="auth.unread" class="btn ghost" @click="semua">Tandai semua dibaca</button>
  </div>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="!list.length" class="empty">Belum ada notifikasi. Pemberitahuan tentang cucianmu akan muncul di sini.</p>
  <ul class="list">
    <li v-for="n in list" :key="n.id" :class="{ unread: !n.dibaca }">
      <button class="notif" @click="buka(n)">
        <b>{{ n.judul }}</b><span>{{ n.pesan }}</span><small>{{ tgl(n.dibuat) }}</small>
      </button>
    </li>
  </ul>
</template>
