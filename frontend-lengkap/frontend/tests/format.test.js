import { describe, it, expect } from 'vitest'
import { statusLabel, komplainLabel, rupiah, tgl } from '../src/utils/format'

describe('format', () => {
  it('statusLabel memetakan kode ke label, atau mengembalikan kode asli', () => {
    expect(statusLabel('siap_diambil')).toBe('Siap diambil')
    expect(statusLabel('tidak-ada')).toBe('tidak-ada')
  })
  it('komplainLabel memetakan status komplain', () => {
    expect(komplainLabel('ditangani')).toBe('Sedang ditangani')
  })
  it('rupiah memberi awalan Rp dan menangani nilai kosong', () => {
    expect(rupiah(15000)).toMatch(/^Rp 15[.,]000$/)
    expect(rupiah(null)).toBe('Rp 0')
  })
  it('tgl mengembalikan string kosong atau teks asli bila tidak valid', () => {
    expect(tgl('')).toBe('')
    expect(tgl('bukan tanggal')).toBe('bukan tanggal')
  })
  it('tgl memformat tanggal valid', () => {
    expect(tgl('2026-10-24')).toMatch(/2026/)
  })
})
