import { describe, it, expect } from 'vitest'
import { useAsyncAction } from '../src/composables/useAsyncAction'

describe('useAsyncAction', () => {
  it('mengembalikan hasil dan membiarkan error kosong bila sukses', async () => {
    const { error, run } = useAsyncAction()
    expect(await run(async () => 42)).toBe(42)
    expect(error.value).toBe('')
  })
  it('menangkap error menjadi pesan', async () => {
    const { error, run } = useAsyncAction()
    expect(await run(async () => { throw new Error('Gagal simpan') })).toBeUndefined()
    expect(error.value).toBe('Gagal simpan')
  })
  it('memakai pesan bawaan bila error tidak punya message', async () => {
    const { error, run } = useAsyncAction()
    await run(async () => { throw {} }) // eslint-disable-line no-throw-literal
    expect(error.value).toBe('Terjadi kesalahan')
  })
  it('mengosongkan pesan lama saat aksi berikutnya dijalankan', async () => {
    const { error, run } = useAsyncAction()
    await run(async () => { throw new Error('x') })
    await run(async () => 1)
    expect(error.value).toBe('')
  })

  it('loading menyala selama aksi berjalan dan mati setelah selesai, juga saat gagal', async () => {
    const { loading, run } = useAsyncAction()
    let selesai
    const tunggu = new Promise((r) => { selesai = r })
    const proses = run(() => tunggu)
    expect(loading.value).toBe(true)
    selesai()
    await proses
    expect(loading.value).toBe(false)
    await run(async () => { throw new Error('x') })
    expect(loading.value).toBe(false)
  })
  it('loading tetap menyala selama masih ada aksi lain yang berjalan', async () => {
    const { loading, run } = useAsyncAction()
    let a, b
    const p1 = run(() => new Promise((r) => { a = r }))
    const p2 = run(() => new Promise((r) => { b = r }))
    a(); await p1
    expect(loading.value).toBe(true)
    b(); await p2
    expect(loading.value).toBe(false)
  })
})
