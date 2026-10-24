<script setup>
import { useRouter } from 'vue-router'
import { useNotifications } from '../composables/useNotifications'
import { tgl } from '../utils/format'
import { auth } from '../auth'

const router = useRouter()
const { list, error, markRead, markAll } = useNotifications()

async function buka(n) {
  await markRead(n)
  if (n.order_id) router.push('/order/' + n.order_id)
}
const semua = markAll
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
