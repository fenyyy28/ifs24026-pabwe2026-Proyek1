<script setup>
import { useNotifications } from '../composables/useNotifications'
import { tgl } from '../utils/format'
import { auth } from '../auth'

const { list, error, buka, tandaiSemua } = useNotifications()
</script>

<template>
  <div class="row-between">
    <h1>Notifikasi</h1>
    <button v-if="auth.unread" class="btn ghost" @click="tandaiSemua">Tandai semua dibaca</button>
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
