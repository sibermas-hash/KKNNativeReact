import type { ComponentType, ReactNode } from 'react'
import type { CurrentUser } from '../auth/auth'

export type AppRole = 'student' | 'dosen' | 'dpl' | 'admin' | 'faculty_admin' | 'superadmin' | 'external_lppm_admin' | string
export type LayoutKind = 'student' | 'admin' | 'dosen' | 'external'

export type NavItem = {
  id: string
  label: string
  path: string
  icon?: ComponentType<{ className?: string }>
  roles?: AppRole[]
  phase?: string
  disabled?: boolean
}

export type AppRoute = {
  id: string
  path: string
  title: string
  layout: LayoutKind
  roles?: AppRole[]
  nav?: NavItem
  element: ReactNode
}

export type RouteMatch = AppRoute & { isAllowed: boolean }
export type UserLike = CurrentUser | null
