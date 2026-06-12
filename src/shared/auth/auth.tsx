import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'

export type UserRole = 'student' | 'dosen' | 'dpl' | 'admin' | 'faculty_admin' | 'superadmin' | 'external_lppm_admin' | string

export type CurrentUser = {
  id: number
  name?: string
  email?: string
  role?: UserRole
  roles?: UserRole[]
  must_change_password?: boolean
  profile_completed?: boolean
}

type AuthContextValue = {
  user: CurrentUser | null
  loading: boolean
  isAuthenticated: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchMe(): Promise<CurrentUser | null> {
  try {
    return await api.get<CurrentUser>('/auth/me').then((r) => r.data)
  } catch (error) {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    setUser(await fetchMe())
    setLoading(false)
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } finally { setUser(null); window.location.href = '/login' }
  }

  useEffect(() => { void refresh() }, [])

  const value = useMemo(() => ({ user, loading, isAuthenticated: !!user, refresh, logout }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function hasAnyRole(user: CurrentUser | null, roles: string[]) {
  if (!user) return false
  const all = new Set([user.role, ...(user.roles ?? [])].filter(Boolean) as string[])
  return roles.some((role) => all.has(role))
}
