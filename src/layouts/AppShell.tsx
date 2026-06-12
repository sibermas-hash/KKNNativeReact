import { Menu, LogOut, UserRound, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { CurrentUser } from '../shared/auth/auth'
import type { NavItem } from '../shared/navigation'
import { usePhaseDisabled } from '../shared/navigation'

type Props = {
  title: string
  user: CurrentUser
  navItems: NavItem[]
  currentPath: string
  onLogout: () => void | Promise<void>
  children: ReactNode
}

export function AppShell({ title, user, navItems, currentPath, onLogout, children }: Props) {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r bg-white p-5 shadow-xl shadow-slate-900/5 md:shadow-none">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-emerald-700">SIBERMAS</div>
          <div className="text-xs text-slate-500">Frontend SPA Beta</div>
        </div>
        <button className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => <NavLink key={item.id} item={item} active={currentPath === item.path || currentPath.startsWith(`${item.path}/`)} onNavigate={() => setOpen(false)} />)}
      </nav>
    </aside>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed inset-y-0 left-0 z-30 hidden md:block">{sidebar}</div>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/40 md:hidden" onClick={() => setOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform md:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</div>

      <main className="md:pl-72">
        <header className="sticky top-0 z-20 border-b bg-white/90 px-4 py-3 backdrop-blur sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-xl border p-2 text-slate-600 md:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu className="h-5 w-5" /></button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">{title}</h1>
                <p className="truncate text-xs text-slate-500 sm:text-sm">{user.name || user.email || 'User'}</p>
              </div>
            </div>
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><UserRound className="h-4 w-4" /><span className="hidden sm:inline">Akun</span></button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white p-2 shadow-lg">
                  <div className="border-b px-3 py-2 text-xs text-slate-500">{user.email || user.name || 'Akun aktif'}</div>
                  <button onClick={onLogout} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Keluar</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-5">{children}</div>
      </main>
    </div>
  )
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  const Icon = item.icon
  const phase = usePhaseDisabled(item)
  const disabled = phase.disabled
  const cls = `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`

  if (disabled) return <span className={cls} title={phase.reason}>{Icon && <Icon className="h-4 w-4" />}{item.label}</span>
  return <a href={item.path} onClick={onNavigate} className={cls}>{Icon && <Icon className="h-4 w-4" />}{item.label}</a>
}
