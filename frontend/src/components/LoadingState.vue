<script setup>
// Indikator memuat yang seragam di semua halaman; tersembunyi saat tidak ada proses berjalan.
defineProps({ loading: { type: Boolean, default: false } })
</script>

<template>
  <p v-if="loading" class="loading" role="status" aria-live="polite">Memuat…</p>
</template>
