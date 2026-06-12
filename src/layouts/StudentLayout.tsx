import type { ReactNode } from 'react'
import type { CurrentUser } from '../shared/auth/auth'
import type { NavItem } from '../shared/navigation'
import { AppShell } from './AppShell'

export function StudentLayout(props: { title: string; user: CurrentUser; navItems: NavItem[]; currentPath: string; onLogout: () => void | Promise<void>; children: ReactNode }) {
  return <AppShell {...props} />
}
