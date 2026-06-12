import { Award, ClipboardList, FileText, Home, Image, LayoutDashboard, Shield, UploadCloud, UserRound, UsersRound } from 'lucide-react'
import { StudentDashboard } from '../features/mahasiswa/StudentDashboard'
import { CertificatePage } from '../features/mahasiswa/CertificatePage'
import { FinalReportPage } from '../features/mahasiswa/final-report/FinalReportPage'
import { LeavePage } from '../features/mahasiswa/leave/LeavePage'
import { PoskoPage } from '../features/mahasiswa/posko/PoskoPage'
import { PosterPage } from '../features/mahasiswa/poster/PosterPage'
import { DailyReportsPage } from '../features/mahasiswa/reports/DailyReportsPage'
import { WorkProgramsPage } from '../features/mahasiswa/work-programs/WorkProgramsPage'
import { PlaceholderPage } from '../shared/components/PlaceholderPage'
import { ADMIN_ROLES, DOSEN_ROLES, EXTERNAL_ROLES, STUDENT_ROLES, canSee, type AppRoute, type LayoutKind, type NavItem, type RouteMatch, type UserLike } from '../shared/navigation'

export const appRoutes: AppRoute[] = [
  {
    id: 'student-dashboard',
    path: '/mahasiswa',
    title: 'Dashboard Mahasiswa',
    layout: 'student',
    roles: STUDENT_ROLES,
    nav: { id: 'student-dashboard', path: '/mahasiswa', label: 'Dashboard', icon: LayoutDashboard, roles: STUDENT_ROLES },
    element: <StudentDashboard currentPath="/mahasiswa" />,
  },
  {
    id: 'student-profile',
    path: '/mahasiswa/profil',
    title: 'Profil Mahasiswa',
    layout: 'student',
    roles: STUDENT_ROLES,
    nav: { id: 'student-profile', path: '/mahasiswa/profil', label: 'Profil', icon: UserRound, roles: STUDENT_ROLES },
    element: <StudentDashboard currentPath="/mahasiswa/profil" />,
  },
  {
    id: 'student-certificate',
    path: '/mahasiswa/sertifikat',
    title: 'Sertifikat & Nilai',
    layout: 'student',
    roles: STUDENT_ROLES,
    nav: { id: 'student-certificate', path: '/mahasiswa/sertifikat', label: 'Sertifikat & Nilai', icon: Award, roles: STUDENT_ROLES, phase: 'grading' },
    element: <CertificatePage />,
  },
  {
    id: 'student-daily-report',
    path: '/mahasiswa/laporan-harian',
    title: 'Laporan Harian',
    layout: 'student',
    roles: STUDENT_ROLES,
    nav: { id: 'student-daily-report', path: '/mahasiswa/laporan-harian', label: 'Laporan Harian', icon: FileText, roles: STUDENT_ROLES },
    element: <DailyReportsPage />,
  },
  {
    id: 'student-posko',
    path: '/mahasiswa/posko',
    title: 'Posko Mahasiswa',
    layout: 'student',
    roles: STUDENT_ROLES,
    nav: { id: 'student-posko', path: '/mahasiswa/posko', label: 'Posko', icon: Home, roles: STUDENT_ROLES },
    element: <PoskoPage />,
  },
  {
    id: 'student-poster',
    path: '/mahasiswa/poster',
    title: 'Poster KKN',
    layout: 'student',
    roles: STUDENT_ROLES,
    nav: { id: 'student-poster', path: '/mahasiswa/poster', label: 'Poster', icon: Image, roles: STUDENT_ROLES },
    element: <PosterPage />,
  },
  {
    id: 'student-leave',
    path: '/mahasiswa/izin',
    title: 'Izin Mahasiswa',
    layout: 'student',
    roles: STUDENT_ROLES,
    nav: { id: 'student-leave', path: '/mahasiswa/izin', label: 'Izin', icon: ClipboardList, roles: STUDENT_ROLES },
    element: <LeavePage />,
  },
  {
    id: 'student-final-report',
    path: '/mahasiswa/laporan-akhir',
    title: 'Laporan Akhir',
    layout: 'student',
    roles: STUDENT_ROLES,
    nav: { id: 'student-final-report', path: '/mahasiswa/laporan-akhir', label: 'Laporan Akhir', icon: UploadCloud, roles: STUDENT_ROLES },
    element: <FinalReportPage />,
  },
  {
    id: 'student-work-programs',
    path: '/mahasiswa/program-kerja',
    title: 'Program Kerja',
    layout: 'student',
    roles: STUDENT_ROLES,
    nav: { id: 'student-work-programs', path: '/mahasiswa/program-kerja', label: 'Program Kerja', icon: ClipboardList, roles: STUDENT_ROLES },
    element: <WorkProgramsPage mode={window.location.pathname.endsWith('/buat') ? 'create' : (/\/mahasiswa\/program-kerja\/[^/]+$/.test(window.location.pathname) ? 'detail' : 'list')} id={window.location.pathname.split('/').pop()} />,
  },
  {
    id: 'admin-dashboard',
    path: '/admin',
    title: 'Dashboard Admin',
    layout: 'admin',
    roles: ADMIN_ROLES,
    nav: { id: 'admin-dashboard', path: '/admin', label: 'Dashboard Admin', icon: Shield, roles: ADMIN_ROLES },
    element: <PlaceholderPage title="Dashboard Admin" />,
  },
  {
    id: 'dosen-dashboard',
    path: '/dosen',
    title: 'Dashboard Dosen',
    layout: 'dosen',
    roles: DOSEN_ROLES,
    nav: { id: 'dosen-dashboard', path: '/dosen', label: 'Dashboard Dosen', icon: ClipboardList, roles: DOSEN_ROLES },
    element: <PlaceholderPage title="Dashboard Dosen" />,
  },
  {
    id: 'external-dashboard',
    path: '/external',
    title: 'Dashboard External',
    layout: 'external',
    roles: EXTERNAL_ROLES,
    nav: { id: 'external-dashboard', path: '/external', label: 'Dashboard External', icon: UsersRound, roles: EXTERNAL_ROLES },
    element: <PlaceholderPage title="Dashboard External" />,
  },
]

export function matchRoute(pathname: string, user: UserLike): RouteMatch | null {
  const route = [...appRoutes].sort((a, b) => b.path.length - a.path.length).find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
  return route ? { ...route, isAllowed: canSee(user, route.roles) } : null
}

export function getNavItems(user: UserLike, layout: LayoutKind): NavItem[] {
  return appRoutes.filter((route) => route.layout === layout && route.nav && canSee(user, route.nav.roles ?? route.roles)).map((route) => route.nav!)
}
