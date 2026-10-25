<script setup>
import { computed } from 'vue'
const props = defineProps({ steps: Array, current: String, compact: Boolean })
const idx = computed(() => props.steps.findIndex((s) => s.v === props.current))
</script>
<template>
  <ol class="progress" :class="{ compact }">
    <li v-for="(s, i) in steps" :key="s.v" :class="{ done: i < idx, now: i === idx }">
      <span class="dot">{{ i < idx ? '✓' : i + 1 }}</span>
      <span class="lbl">{{ s.l }}</span>
    </li>
  </ol>
</template>
