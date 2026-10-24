import { describe, it, expect } from 'vitest'
import {
  validateLogin, validateRegister, validateRequestForm, validateComplaintForm, validateOrderForm,
} from '../src/utils/validators'

describe('validateLogin', () => {
  it('menolak username atau kata sandi kosong', () => {
    expect(validateLogin({ username: '', password: 'x' })).not.toBe('')
    expect(validateLogin({ username: 'budi', password: '' })).not.toBe('')
  })
  it('menerima input lengkap', () => {
    expect(validateLogin({ username: 'budi', password: 'budi123' })).toBe('')
  })
})

describe('validateRegister', () => {
  const ok = { nama: 'Budi', kamar: 'A-101', kontak: '0812', username: 'budi_1', password: 'rahasia' }
  it('menerima data valid', () => expect(validateRegister(ok, 'rahasia')).toBe(''))
  it('menolak kata sandi pendek', () => expect(validateRegister({ ...ok, password: '123' }, '123')).toMatch(/minimal 6/))
  it('menolak konfirmasi yang berbeda', () => expect(validateRegister(ok, 'beda')).toMatch(/tidak sama/))
  it('menolak username tidak valid', () => expect(validateRegister({ ...ok, username: 'a b' }, 'rahasia')).toMatch(/Username/))
  it('menolak nama dan kamar kosong', () => expect(validateRegister({ ...ok, nama: '  ' }, 'rahasia')).toMatch(/wajib/))
})

describe('validateRequestForm', () => {
  const today = '2026-10-24'
  it('menolak tanggal sebelum hari ini', () => {
    expect(validateRequestForm({ waktu_jemput: '2026-10-01', catatan: 'kaos' }, today)).toMatch(/sebelum hari ini/)
  })
  it('menolak keterangan kosong atau terlalu panjang', () => {
    expect(validateRequestForm({ waktu_jemput: today, catatan: ' ' }, today)).toMatch(/wajib/)
    expect(validateRequestForm({ waktu_jemput: today, catatan: 'x'.repeat(301) }, today)).toMatch(/maksimal 300/)
  })
  it('menerima data valid', () => {
    expect(validateRequestForm({ waktu_jemput: today, catatan: '5 kaos' }, today)).toBe('')
  })
})

describe('validateComplaintForm', () => {
  it('menolak jenis di luar daftar', () => expect(validateComplaintForm({ jenis: 'xxx', deskripsi: 'a' })).toMatch(/tidak valid/))
  it('menolak deskripsi kosong', () => expect(validateComplaintForm({ jenis: 'hilang', deskripsi: '' })).toMatch(/wajib/))
  it('menerima data valid', () => expect(validateComplaintForm({ jenis: 'hilang', deskripsi: 'kaos hilang' })).toBe(''))
})

describe('validateOrderForm', () => {
  const form = { user_id: 2, estimasi_selesai: '2026-10-30', berat_kg: 2 }
  const items = [{ jenis: 'Kemeja', jumlah: 2 }]
  it('menerima data valid', () => expect(validateOrderForm(form, items)).toBe(''))
  it('menolak penghuni belum dipilih', () => expect(validateOrderForm({ ...form, user_id: '' }, items)).toMatch(/penghuni/))
  it('menolak item tanpa jenis', () => expect(validateOrderForm(form, [{ jenis: ' ', jumlah: 1 }])).toMatch(/Minimal satu item/))
  it('menolak jumlah kurang dari 1', () => expect(validateOrderForm(form, [{ jenis: 'Kaos', jumlah: 0 }])).toMatch(/minimal 1/))
  it('menolak berat tidak valid', () => expect(validateOrderForm({ ...form, berat_kg: 'abc' }, items)).toMatch(/Berat/))
})
