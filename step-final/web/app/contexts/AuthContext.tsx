import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, AuthResponse, getMe, refreshTokens } from '../lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  loading: boolean
  login: (tokens: AuthResponse) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const STORAGE_KEY = 'auth_tokens'

interface StoredTokens {
  accessToken: string
  refreshToken: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setLoading(false)
      return
    }
    const { accessToken: at, refreshToken: rt } = JSON.parse(raw) as StoredTokens
    getMe(at)
      .then((u) => {
        setUser(u)
        setAccessToken(at)
      })
      .catch(() =>
        refreshTokens(rt)
          .then((res) => {
            storeTokens(res.accessToken, res.refreshToken)
            setUser(res.user)
            setAccessToken(res.accessToken)
          })
          .catch(() => localStorage.removeItem(STORAGE_KEY)),
      )
      .finally(() => setLoading(false))
  }, [])

  function storeTokens(at: string, rt: string) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: at, refreshToken: rt }))
  }

  function login(tokens: AuthResponse) {
    storeTokens(tokens.accessToken, tokens.refreshToken)
    setUser(tokens.user)
    setAccessToken(tokens.accessToken)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setAccessToken(null)
  }

  async function refreshUser() {
    if (!accessToken) return
    try {
      const u = await getMe(accessToken)
      setUser(u)
    } catch {
      // ignore — user stays as-is
    }
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
