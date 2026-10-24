<template>
  <header class="top">
    <RouterLink to="/" class="brand">LaundryTrack <small>Asrama</small></RouterLink>
    <nav>
      <RouterLink to="/">Beranda</RouterLink>
      <RouterLink to="/order">Order</RouterLink>
      <RouterLink to="/komplain">Komplain</RouterLink>
      <RouterLink to="/penghuni">Penghuni</RouterLink>
    </nav>
  </header>
  <main><RouterView /></main>
</template>
