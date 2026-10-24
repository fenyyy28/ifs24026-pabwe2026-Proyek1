import { describe, it, expect } from 'vitest'
import { bersihkan, bersihkanField } from '../src/utils/sanitize'

describe('bersihkan', () => {
  it('memangkas dan merapikan spasi berlebih', () => {
    expect(bersihkan('  kaos   biru \n putih ')).toBe('kaos biru putih')
  })
  it('membuang karakter kontrol', () => {
    expect(bersihkan('abc\u0000def\u0007')).toBe('abc def')
  })
  it('aman untuk null dan undefined', () => {
    expect(bersihkan(null)).toBe('')
    expect(bersihkan(undefined)).toBe('')
  })
  it('tidak mengubah teks yang sudah bersih', () => {
    expect(bersihkan('Kemeja putih')).toBe('Kemeja putih')
  })
})

describe('bersihkanField', () => {
  it('hanya membersihkan field yang diminta dan tidak mengubah objek asli', () => {
    const asli = { nama: '  Budi  ', password: '  spasi  ' }
    const hasil = bersihkanField(asli, ['nama'])
    expect(hasil).toEqual({ nama: 'Budi', password: '  spasi  ' })
    expect(asli.nama).toBe('  Budi  ')
  })
})
