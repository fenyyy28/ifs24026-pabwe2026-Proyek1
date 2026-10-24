<script setup>
import { statusLabel } from '../api'
defineProps({ status: String })
</script>
<template>
  <span class="pill" :class="'s-' + status">{{ statusLabel(status) }}</span>
</template>
