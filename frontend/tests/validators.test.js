import { describe, it, expect } from 'vitest'
import {
  validateLogin, validateRegister, validateRequestForm, validateComplaintForm, validateOrderForm, hasErrors,
} from '../src/utils/validators'

describe('hasErrors', () => {
  it('false untuk objek kosong, true bila ada pesan', () => {
    expect(hasErrors({})).toBe(false)
    expect(hasErrors({ nama: 'wajib' })).toBe(true)
  })
})

describe('validateLogin', () => {
  it('memberi pesan terpisah untuk username dan kata sandi', () => {
    const e = validateLogin({ username: '', password: '' })
    expect(e.username).toMatch(/wajib/)
    expect(e.password).toMatch(/wajib/)
  })
  it('hanya menandai field yang salah', () => {
    const e = validateLogin({ username: 'budi', password: '' })
    expect(e.username).toBeUndefined()
    expect(e.password).toMatch(/wajib/)
  })
  it('menerima input lengkap', () => {
    expect(hasErrors(validateLogin({ username: 'budi', password: 'budi123' }))).toBe(false)
  })
})

describe('validateRegister', () => {
  const ok = { nama: 'Budi', kamar: 'A-101', kontak: '0812', username: 'budi_1', password: 'rahasia' }
  it('menerima data valid', () => expect(hasErrors(validateRegister(ok, 'rahasia'))).toBe(false))
  it('menandai kata sandi pendek pada field password', () => {
    expect(validateRegister({ ...ok, password: '123' }, '123').password).toMatch(/minimal 6/)
  })
  it('menandai konfirmasi berbeda pada field ulang', () => {
    expect(validateRegister(ok, 'beda').ulang).toMatch(/tidak sama/)
  })
  it('menandai username tidak valid', () => {
    expect(validateRegister({ ...ok, username: 'a b' }, 'rahasia').username).toMatch(/Username/)
  })
  it('menandai nama dan kamar kosong secara terpisah', () => {
    const e = validateRegister({ ...ok, nama: ' ', kamar: '' }, 'rahasia')
    expect(e.nama).toMatch(/wajib/)
    expect(e.kamar).toMatch(/wajib/)
  })
  it('mengumpulkan beberapa error sekaligus', () => {
    const e = validateRegister({ nama: '', kamar: '', kontak: '', username: '', password: '' }, 'x')
    expect(Object.keys(e).length >= 4).toBe(true)
  })
})

describe('validateRequestForm', () => {
  const today = '2026-10-24'
  it('menandai tanggal sebelum hari ini', () => {
    expect(validateRequestForm({ waktu_jemput: '2026-10-01', catatan: 'kaos' }, today).waktu_jemput).toMatch(/sebelum hari ini/)
  })
  it('menandai keterangan kosong atau terlalu panjang', () => {
    expect(validateRequestForm({ waktu_jemput: today, catatan: ' ' }, today).catatan).toMatch(/wajib/)
    expect(validateRequestForm({ waktu_jemput: today, catatan: 'x'.repeat(301) }, today).catatan).toMatch(/maksimal 300/)
  })
  it('menerima data valid', () => {
    expect(hasErrors(validateRequestForm({ waktu_jemput: today, catatan: '5 kaos' }, today))).toBe(false)
  })
})

describe('validateComplaintForm', () => {
  it('menandai jenis di luar daftar', () => expect(validateComplaintForm({ jenis: 'xxx', deskripsi: 'a' }).jenis).toMatch(/tidak valid/))
  it('menandai deskripsi kosong', () => expect(validateComplaintForm({ jenis: 'hilang', deskripsi: '' }).deskripsi).toMatch(/wajib/))
  it('menerima data valid', () => expect(hasErrors(validateComplaintForm({ jenis: 'hilang', deskripsi: 'kaos hilang' }))).toBe(false))
})

describe('validateOrderForm', () => {
  const form = { user_id: 2, estimasi_selesai: '2026-10-30', berat_kg: 2 }
  const items = [{ jenis: 'Kemeja', jumlah: 2 }]
  it('menerima data valid', () => expect(hasErrors(validateOrderForm(form, items))).toBe(false))
  it('menandai penghuni belum dipilih', () => expect(validateOrderForm({ ...form, user_id: '' }, items).user_id).toMatch(/penghuni/))
  it('menandai item tanpa jenis', () => expect(validateOrderForm(form, [{ jenis: ' ', jumlah: 1 }]).items).toMatch(/Minimal satu item/))
  it('menandai jumlah kurang dari 1', () => expect(validateOrderForm(form, [{ jenis: 'Kaos', jumlah: 0 }]).items).toMatch(/minimal 1/))
  it('menandai berat tidak valid', () => expect(validateOrderForm({ ...form, berat_kg: 'abc' }, items).berat_kg).toMatch(/Berat/))
})
