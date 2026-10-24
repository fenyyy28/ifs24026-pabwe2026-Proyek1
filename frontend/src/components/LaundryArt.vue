<template>
  <svg viewBox="0 0 360 280" role="img" aria-label="Ilustrasi mesin cuci dan jemuran" class="art">
    <ellipse cx="180" cy="250" rx="140" ry="14" fill="var(--sage-300)" opacity=".45" />
    <!-- tali jemuran -->
    <path d="M20 34 Q180 62 340 30" fill="none" stroke="var(--sage-900)" stroke-width="2" stroke-linecap="round" />
    <path d="M60 44 l0 34 q18 8 36 0 l0 -34 z" fill="var(--paper)" stroke="var(--sage-900)" stroke-width="2" stroke-linejoin="round" />
    <path d="M250 50 l-4 40 q20 8 40 0 l-4 -40 z" fill="var(--sage-300)" stroke="var(--sage-900)" stroke-width="2" stroke-linejoin="round" />
    <path d="M300 40 l-6 26 l22 0 z" fill="var(--paper)" stroke="var(--sage-900)" stroke-width="2" stroke-linejoin="round" />
    <!-- mesin cuci -->
    <rect x="100" y="96" width="160" height="150" rx="16" fill="var(--paper)" stroke="var(--sage-900)" stroke-width="3" />
    <rect x="100" y="96" width="160" height="30" rx="16" fill="var(--sage-500)" stroke="var(--sage-900)" stroke-width="3" />
    <circle cx="124" cy="111" r="5" fill="var(--paper)" />
    <circle cx="144" cy="111" r="5" fill="var(--paper)" />
    <rect x="196" y="105" width="50" height="12" rx="6" fill="var(--paper)" />
    <circle cx="180" cy="185" r="44" fill="var(--sage-100)" stroke="var(--sage-900)" stroke-width="3" />
    <circle cx="180" cy="185" r="32" fill="var(--sage-300)" stroke="var(--sage-900)" stroke-width="2" />
    <g class="drum">
      <path d="M150 188 q10 -12 20 0 t20 0 t20 0 v14 a30 30 0 0 1 -60 0 z" fill="var(--paper)" opacity=".85" />
      <circle cx="165" cy="175" r="4" fill="var(--paper)" />
      <circle cx="195" cy="170" r="3" fill="var(--paper)" />
    </g>
    <!-- gelembung -->
    <circle cx="300" cy="170" r="14" fill="none" stroke="var(--sage-700)" stroke-width="2.5" />
    <circle cx="322" cy="140" r="8" fill="none" stroke="var(--sage-700)" stroke-width="2.5" />
    <circle cx="62" cy="170" r="11" fill="none" stroke="var(--sage-700)" stroke-width="2.5" />
    <circle cx="44" cy="206" r="6" fill="none" stroke="var(--sage-700)" stroke-width="2.5" />
    <!-- keranjang -->
    <path d="M270 214 h56 l-6 32 h-44 z" fill="var(--cream-2)" stroke="var(--sage-900)" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M276 214 q22 -22 44 0" fill="var(--paper)" stroke="var(--sage-900)" stroke-width="2.5" />
  </svg>
</template>

<style scoped>
.art { width: 100%; height: auto; display: block; }
.drum { transform-origin: 180px 185px; animation: spin 14s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .drum { animation: none; } }
</style>
