<script setup>
defineProps({ kode: String, terlambat: Number })
</script>
<template>
  <span class="tag" :class="{ late: terlambat }"><i></i>{{ kode }}</span>
</template>
