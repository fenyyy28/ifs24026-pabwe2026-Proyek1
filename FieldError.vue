<script setup>
// Pesan error untuk satu field form; tidak menampilkan apa pun bila pesan kosong.
defineProps({ id: { type: String, required: true }, message: { type: String, default: '' } })
</script>

<template>
  <small v-if="message" :id="id" class="field-error" role="alert">{{ message }}</small>
</template>
