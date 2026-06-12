import { useMemo } from 'react'
import { LogOut, UserRound, LayoutDashboard, Award, FileText } from 'lucide-react'
import { useAuth } from '../shared/auth/auth'
import { LoginPage } from '../features/auth/LoginPage'
import { StudentDashboard } from '../features/mahasiswa/StudentDashboard'

const nav = [
  { href: '/mahasiswa', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mahasiswa/profil', label: 'Profil', icon: UserRound },
  { href: '/mahasiswa/sertifikat', label: 'Sertifikat & Nilai', icon: Award },
  { href: '/mahasiswa/laporan-harian', label: 'Laporan Harian', icon: FileText },
]

export function App() {
  const { user, loading, logout } = useAuth()
  const path = window.location.pathname
  const isLogin = path === '/login' || path === '/'

  const title = useMemo(() => {
    if (path.includes('sertifikat')) return 'Sertifikat & Nilai'
    if (path.includes('laporan-harian')) return 'Laporan Harian'
    if (path.includes('profil')) return 'Profil Mahasiswa'
    return 'Dashboard Mahasiswa'
  }, [path])

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-600">Memuat sesi...</div>
  if (!user || isLogin) return <LoginPage />

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-white p-5 md:block">
        <div className="mb-8">
          <div className="text-lg font-bold text-emerald-700">SIBERMAS</div>
          <div className="text-xs text-slate-500">Frontend SPA Beta</div>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => <a key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"><item.icon className="h-4 w-4" />{item.label}</a>)}
        </nav>
      </aside>
      <main className="md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-white/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div><h1 className="text-xl font-semibold">{title}</h1><p className="text-sm text-slate-500">{user.name || user.email}</p></div>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"><LogOut className="h-4 w-4" />Keluar</button>
          </div>
        </header>
        <div className="p-5"><StudentDashboard currentPath={path} /></div>
      </main>
    </div>
  )
}
