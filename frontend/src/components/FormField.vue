<script setup>
// Satu field form: label, kontrol input (lewat slot), dan pesan error-nya.
// Slot menerima `attrs` berisi aria-invalid dan aria-describedby untuk di-bind ke kontrol.
import { computed } from 'vue'
import FieldError from './FieldError.vue'

const props = defineProps({
  label: { type: String, required: true },
  name: { type: String, required: true },
  error: { type: String, default: '' },
})

const errorId = computed(() => `err-${props.name}`)
const attrs = computed(() => (props.error ? { 'aria-invalid': 'true', 'aria-describedby': errorId.value } : {}))
</script>

<template>
  <label>{{ label }} <slot :attrs="attrs" /><FieldError :id="errorId" :message="error" /></label>
</template>
