import { describe, it, expect, afterEach } from 'vitest'
import { auth } from '../src/auth'
import { requireAdmin } from '../src/utils/guard'

afterEach(() => auth.logout())

describe('requireAdmin', () => {
  it('melempar error bila belum login', () => {
    expect(() => requireAdmin()).toThrow(/petugas/)
  })
  it('melempar error untuk penghuni', () => {
    auth.setSession('t', { id: 2, role: 'penghuni' })
    expect(() => requireAdmin()).toThrow(/petugas/)
  })
  it('lolos untuk admin', () => {
    auth.setSession('t', { id: 1, role: 'admin' })
    expect(() => requireAdmin()).not.toThrow()
  })
})

describe('auth store', () => {
  it('isAdmin mengikuti peran pengguna', () => {
    auth.setSession('t', { role: 'admin' })
    expect(auth.isAdmin).toBe(true)
    auth.logout()
    expect(auth.isAdmin).toBe(false)
    expect(auth.token).toBe('')
  })
})
