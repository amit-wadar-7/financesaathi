const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const getToken = () => localStorage.getItem('token')
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'))

export const getRefreshToken = () => localStorage.getItem('refresh_token')
export const setRefreshToken = (t) => (t ? localStorage.setItem('refresh_token', t) : localStorage.removeItem('refresh_token'))

export const clearAuthTokens = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
}

let refreshPromise = null

async function requestTokenRefresh() {
  const rt = getRefreshToken()
  if (!rt) return null
  try {
    const res = await fetch(BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    })
    if (!res.ok) {
      clearAuthTokens()
      return null
    }
    const data = await res.json()
    if (data?.access_token) {
      setToken(data.access_token)
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token)
      }
      return data.access_token
    }
    clearAuthTokens()
    return null
  } catch {
    clearAuthTokens()
    return null
  }
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  let token = getToken()
  if (auth && token) headers.Authorization = 'Bearer ' + token
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running on ' + BASE + '?')
  }

  // Handle 401 with silent token refresh
  if (res.status === 401 && auth && path !== '/auth/login' && path !== '/auth/refresh') {
    if (getRefreshToken()) {
      if (!refreshPromise) {
        refreshPromise = requestTokenRefresh().finally(() => {
          refreshPromise = null
        })
      }
      const newToken = await refreshPromise
      if (newToken) {
        headers.Authorization = 'Bearer ' + newToken
        try {
          res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
        } catch {
          throw new Error('Cannot reach the server. Is the backend running on ' + BASE + '?')
        }
      } else {
        clearAuthTokens()
        window.dispatchEvent(new Event('auth-expired'))
      }
    } else {
      clearAuthTokens()
      window.dispatchEvent(new Event('auth-expired'))
    }
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
