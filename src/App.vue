<script setup>
import { useRoute, useRouter } from 'vue-router'
import { auth } from './auth'
import { useUnreadPolling } from './composables/useUnreadPolling'

const route = useRoute()
const router = useRouter()
useUnreadPolling()

function keluar() { auth.logout(); router.push('/auth/login') }
</script>

<template>
  <RouterView v-if="route.meta.public" />
  <template v-else>
    <header class="top">
      <RouterLink to="/" class="brand">
        <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
          <rect x="3" y="3" width="26" height="26" rx="7" fill="var(--cream)" />
          <circle cx="16" cy="18" r="7" fill="var(--sage-300)" stroke="var(--sage-900)" stroke-width="2" />
          <circle cx="9" cy="8" r="1.6" fill="var(--sage-700)" /><circle cx="14" cy="8" r="1.6" fill="var(--sage-700)" />
        </svg>
        LaundryTrack <small>Asrama</small>
      </RouterLink>
      <nav aria-label="Menu utama">
        <RouterLink to="/">Beranda</RouterLink>
        <RouterLink to="/order">{{ auth.isAdmin ? 'Order' : 'Cucian saya' }}</RouterLink>
        <RouterLink to="/jemput">{{ auth.isAdmin ? 'Permintaan jemput' : 'Jemput cucian' }}</RouterLink>
        <RouterLink v-if="!auth.isAdmin" to="/papan">Papan cucian</RouterLink>
        <RouterLink to="/komplain">Komplain</RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/penghuni">Penghuni</RouterLink>
        <RouterLink to="/notifikasi" class="bell" :aria-label="auth.unread ? `Notifikasi ${auth.unread} belum dibaca` : 'Notifikasi'">
  Notifikasi <span v-if="auth.unread" class="badge">{{ auth.unread }}</span>
        </RouterLink>
      </nav>
      <div class="who">
        <span>{{ auth.user?.nama }}<small>{{ auth.isAdmin ? 'Petugas' : 'Kamar ' + auth.user?.kamar }}</small></span>
        <button class="link light" @click="keluar">Keluar</button>
      </div>
    </header>
    <main><RouterView /></main>
  </template>
</template>
