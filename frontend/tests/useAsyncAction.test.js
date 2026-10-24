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
})
