<script setup>
import { fotoUrl } from '../api'
defineProps({ fotos: Array })
</script>
<template>
  <div class="gallery">
    <a v-for="f in fotos" :key="f" :href="fotoUrl(f)" target="_blank" rel="noopener">
      <img :src="fotoUrl(f)" alt="Foto cucian" loading="lazy" />
    </a>
  </div>
</template>
