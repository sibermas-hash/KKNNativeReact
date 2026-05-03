'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, usePeriodStore } from '@/stores';
import { ROLE_LABELS, PHASE_LABELS } from '@sibermas/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_SECTIONS = [
  {
    title: 'Dashboard',
    items: [
      { href: '/admin', label: 'Hub', icon: '🏠' },
      { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { href: '/admin/tahun-akademik', label: 'Tahun Akademik', icon: '📅' },
      { href: '/admin/periode', label: 'Periode KKN', icon: '📋' },
      { href: '/admin/jenis-kkn', label: 'Jenis KKN', icon: '🏷️' },
      { href: '/admin/fakultas', label: 'Fakultas', icon: '🏛️' },
      { href: '/admin/prodi', label: 'Prodi', icon: '📚' },
      { href: '/admin/lokasi', label: 'Lokasi', icon: '📍' },
    ],
  },
  {
    title: 'Operasional',
    items: [
      { href: '/admin/pendaftaran', label: 'Pendaftaran', icon: '📝' },
      { href: '/admin/kelompok', label: 'Kelompok', icon: '👥' },
      { href: '/admin/dosen/penugasan', label: 'Penugasan DPL', icon: '👨‍🏫' },
      { href: '/admin/peserta/pindah', label: 'Transfer Mahasiswa', icon: '🔄' },
      { href: '/admin/dispensasi', label: 'Dispensasi', icon: '📋' },
    ],
  },
  {
    title: 'Akademik',
    items: [
      { href: '/admin/nilai', label: 'Nilai', icon: '📝' },
      { href: '/admin/evaluasi', label: 'Evaluasi', icon: '📊' },
      { href: '/admin/yudisium', label: 'Yudisium', icon: '🎓' },
      { href: '/admin/laporan/harian', label: 'Laporan Harian', icon: '📋' },
      { href: '/admin/laporan/akhir', label: 'Laporan Akhir', icon: '📄' },
    ],
  },
  {
    title: 'Konten',
    items: [
      { href: '/admin/warta-utama', label: 'Berita', icon: '📰' },
      { href: '/admin/unduhan', label: 'Unduhan', icon: '📥' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { href: '/admin/pengguna', label: 'Pengguna', icon: '👤' },
      { href: '/admin/pengaturan/sistem', label: 'Pengaturan', icon: '⚙️' },
      { href: '/admin/audit-log', label: 'Audit Log', icon: '📜' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const { currentPhase, activePeriod, fetchPeriodContext } = usePeriodStore();

  useEffect(() => { fetchUser(); fetchPeriodContext(); }, [fetchUser, fetchPeriodContext]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
    if (!isLoading && isAuthenticated && user) {
      const roles = user.roles || [];
      if (!roles.includes('superadmin') && !roles.includes('admin') && !roles.includes('faculty_admin')) router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;
  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 overflow-y-auto border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <h1 className="text-xl font-bold text-indigo-700">SIBERMAS</h1>
          <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Admin</span>
        </div>
        <div className="px-4 py-3">
          <div className="rounded-xl bg-indigo-50 p-3">
            <p className="text-xs font-medium text-indigo-600">{ROLE_LABELS[user.roles?.[0] || 'admin']}</p>
            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
          </div>
        </div>
        {activePeriod && (
          <div className="mx-4 mb-3 rounded-lg bg-amber-50 px-3 py-2">
            <p className="text-xs font-medium text-amber-600">{activePeriod.name}</p>
            <p className="text-xs text-amber-500">Fase: {PHASE_LABELS[currentPhase] || currentPhase}</p>
          </div>
        )}
        <nav className="space-y-4 px-3 pb-8">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{section.title}</p>
              {section.items.map((item) => (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${pathname === item.href ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
