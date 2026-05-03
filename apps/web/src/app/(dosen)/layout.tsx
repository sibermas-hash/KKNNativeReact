'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, usePeriodStore } from '@/stores';
import { ROLE_LABELS, PHASE_LABELS } from '@sibermas/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dosen', label: 'Dashboard Dosen', icon: '📊' },
  { href: '/dosen/beranda-dpl', label: 'Dashboard DPL', icon: '🏠', dplOnly: true },
  { href: '/dosen/kelompok', label: 'Kelompok', icon: '👥', dplOnly: true },
  { href: '/dosen/laporan-harian', label: 'Review Laporan', icon: '📋', dplOnly: true },
  { href: '/dosen/evaluasi', label: 'Evaluasi', icon: '📝', dplOnly: true },
  { href: '/dosen/laporan-akhir', label: 'Laporan Akhir', icon: '📄', dplOnly: true },
  { href: '/dosen/monitoring', label: 'Monitoring', icon: '📍', dplOnly: true },
  { href: '/dosen/izin', label: 'Persetujuan Izin', icon: '✈️', dplOnly: true },
  { href: '/dosen/umpan-balik-peserta', label: 'Feedback Peserta', icon: '⭐', dplOnly: true },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export default function DosenLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const { currentPhase, fetchPeriodContext } = usePeriodStore();

  useEffect(() => {
    fetchUser();
    fetchPeriodContext();
  }, [fetchUser, fetchPeriodContext]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
    if (!isLoading && isAuthenticated && user) {
      const roles = user.roles || [];
      if (!roles.includes('dosen') && !roles.includes('dpl') && !roles.includes('superadmin')) {
        router.replace('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;
  }
  if (!isAuthenticated || !user) return null;

  const isDpl = (user.roles || []).includes('dpl') || (user.roles || []).includes('superadmin');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <h1 className="text-xl font-bold text-blue-700">SIBERMAS</h1>
          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Dosen</span>
        </div>
        <div className="px-4 py-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-600">{ROLE_LABELS[user.roles?.[0] || 'dosen']}</p>
            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
          </div>
        </div>
        {currentPhase && (
          <div className="mx-4 mb-3 rounded-lg bg-amber-50 px-3 py-2">
            <p className="text-xs font-medium text-amber-600">Fase: {PHASE_LABELS[currentPhase] || currentPhase}</p>
          </div>
        )}
        <nav className="space-y-1 px-3">
          {NAV_ITEMS.filter((item) => !item.dplOnly || isDpl).map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${pathname === item.href ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
