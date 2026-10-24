<script setup>
import { useOrderForm } from '../composables/useOrderForm'
import { rupiah, tgl } from '../utils/format'
import { auth } from '../auth'
import PhotoGallery from '../components/PhotoGallery.vue'
import FormField from '../components/FormField.vue'
import FieldError from '../components/FieldError.vue'
import LoadingState from '../components/LoadingState.vue'

const { memuat, permintaan, users, error, errors, form, items, tambah, hapus, simpan } = useOrderForm()
</script>

<template>
  <p v-if="!auth.isAdmin" class="error" role="alert">Halaman ini hanya untuk petugas laundry.</p>
  <template v-else>
  <h1>Order baru</h1>
  <LoadingState :loading="memuat" />
  <p v-if="!memuat && !users.length" class="empty">Belum ada penghuni terdaftar. Penghuni mendaftar sendiri lewat halaman Daftar.</p>
  <section v-if="permintaan" class="card">
    <h2 class="h-sub">Dari permintaan jemput {{ permintaan.nama }}</h2>
    <p>{{ permintaan.catatan }} <small class="muted">(jemput {{ tgl(permintaan.waktu_jemput) }})</small></p>
    <PhotoGallery v-if="permintaan.foto.length" :fotos="permintaan.foto" />
    <p class="hint">Catat pakaian satu per satu di bawah. Foto ini otomatis tersimpan di order sebagai kondisi awal.</p>
  </section>
  <form @submit.prevent="simpan" class="form card">
    <FormField label="Penghuni" name="user_id" :error="errors.user_id" v-slot="{ attrs }">
      <select v-model="form.user_id" required v-bind="attrs">
        <option value="" disabled>Pilih penghuni</option>
        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.nama }} ({{ u.kamar }})</option>
      </select>
    </FormField>
    <div class="grid2">
      <FormField label="Berat (kg)" name="berat_kg" :error="errors.berat_kg" v-slot="{ attrs }">
        <input type="number" min="0.5" step="0.5" v-model="form.berat_kg" required v-bind="attrs" />
      </FormField>
      <FormField label="Estimasi selesai" name="estimasi_selesai" :error="errors.estimasi_selesai" v-slot="{ attrs }">
        <input type="date" v-model="form.estimasi_selesai" required v-bind="attrs" />
      </FormField>
    </div>
    <p class="hint">Perkiraan biaya: {{ rupiah(form.berat_kg * 5000) }} (Rp 5.000 per kg)</p>

    <h2>Daftar pakaian</h2>
    <p class="hint">Catat semua item saat diserahkan. Daftar ini dipakai untuk mengecek saat cucian diambil.</p>
    <div v-for="(it, i) in items" :key="i" class="item-row">
      <input v-model="it.jenis" placeholder="Jenis (kemeja, celana, ...)" required />
      <input type="number" min="1" v-model="it.jumlah" aria-label="Jumlah" />
      <input v-model="it.warna" placeholder="Warna" />
      <input v-model="it.catatan" placeholder="Ciri khusus (nama, noda, ...)" />
      <button type="button" class="link danger" @click="hapus(i)" :disabled="items.length === 1">Hapus</button>
    </div>
    <FieldError id="err-items" :message="errors.items" />
    <button type="button" class="btn ghost" @click="tambah">Tambah item</button>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn" type="submit">Simpan order</button>
  </form>
  </template>
</template>
