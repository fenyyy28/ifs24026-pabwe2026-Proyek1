import { reactive } from 'vue'

const saved = (() => {
  try { return JSON.parse(localStorage.getItem('lt_session')) } catch { return null }
})()

export const auth = reactive({
  token: saved?.token || '',
  user: saved?.user || null,
  unread: 0,
  get isAdmin() { return this.user?.role === 'admin' },
  setSession(token, user) {
    this.token = token
    this.user = user
    try { localStorage.setItem('lt_session', JSON.stringify({ token, user })) } catch {}
  },
  logout() {
    this.token = ''
    this.user = null
    this.unread = 0
    try { localStorage.removeItem('lt_session') } catch {}
  },
})
