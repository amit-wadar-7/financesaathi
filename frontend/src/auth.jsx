import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearAuthTokens, getRefreshToken, getToken, setRefreshToken, setToken } from './api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!getToken())

  const refresh = useCallback(async () => {
    try { setUser(await api('/auth/me')) } catch { setUser(null) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (getToken()) refresh()
    const onExpired = () => setUser(null)
    window.addEventListener('auth-expired', onExpired)
    return () => window.removeEventListener('auth-expired', onExpired)
  }, [refresh])

  const login = async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false })
    setToken(r.access_token)
    if (r.refresh_token) setRefreshToken(r.refresh_token)
    await refresh()
  }

  const register = async (body) => {
    await api('/auth/register', { method: 'POST', body, auth: false })
    await login(body.email, body.password)
  }

  const logout = async () => {
    const rt = getRefreshToken()
    if (rt) {
      try {
        await api('/auth/logout', { method: 'POST', body: { refresh_token: rt } })
      } catch {
        // Logout gracefully regardless of network error
      }
    }
    clearAuthTokens()
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
