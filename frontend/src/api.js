const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const getToken = () => localStorage.getItem('token')
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'))

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (auth && token) headers.Authorization = 'Bearer ' + token
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running on ' + BASE + '?')
  }
  if (res.status === 401 && auth) {
    setToken(null)
    window.dispatchEvent(new Event('auth-expired'))
  }
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) {
    const d = data && data.detail
    const msg = typeof d === 'string' ? d
      : Array.isArray(d) ? d.map((e) => (e.loc || []).slice(1).join('.') + ': ' + e.msg).join('; ')
      : 'Request failed (' + res.status + ')'
    throw new Error(msg)
  }
  return data
}

export const qs = (obj) => new URLSearchParams(obj).toString()
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
