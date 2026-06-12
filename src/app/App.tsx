import { LoginPage } from '../features/auth/LoginPage'
import { AdminLayout } from '../layouts/AdminLayout'
import { DosenLayout } from '../layouts/DosenLayout'
import { ExternalLayout } from '../layouts/ExternalLayout'
import { StudentLayout } from '../layouts/StudentLayout'
import { NotFoundPage } from '../shared/components/NotFoundPage'
import { useAuth } from '../shared/auth/auth'
import { getNavItems, matchRoute } from './routes'

export function App() {
  const { user, loading, logout } = useAuth()
  const path = window.location.pathname
  const isLogin = path === '/login' || path === '/'

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-600">Memuat sesi...</div>
  if (!user || isLogin) return <LoginPage />

  const route = matchRoute(path, user)
  const layout = route?.layout ?? 'student'
  const navItems = getNavItems(user, layout)
  const shellProps = { title: route?.title ?? 'SIBERMAS', user, navItems, currentPath: path, onLogout: logout }
  const page = route?.isAllowed ? route.element : <NotFoundPage />

  if (layout === 'admin') return <AdminLayout {...shellProps}>{page}</AdminLayout>
  if (layout === 'dosen') return <DosenLayout {...shellProps}>{page}</DosenLayout>
  if (layout === 'external') return <ExternalLayout {...shellProps}>{page}</ExternalLayout>
  return <StudentLayout {...shellProps}>{page}</StudentLayout>
}
