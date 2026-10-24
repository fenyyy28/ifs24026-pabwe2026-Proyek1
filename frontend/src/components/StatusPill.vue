<script setup>
import { statusLabel, komplainLabel } from '../api'
const props = defineProps({ status: String, komplain: Boolean })
</script>
<template>
  <span class="pill" :class="'s-' + status">{{ komplain ? komplainLabel(status) : statusLabel(status) }}</span>
</template>
