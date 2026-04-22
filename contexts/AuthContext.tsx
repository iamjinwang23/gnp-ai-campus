'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/lib/users'

const AUTH_KEY = 'gnp_auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = (u: User) => {
    setUser(u)
    localStorage.setItem(AUTH_KEY, JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
