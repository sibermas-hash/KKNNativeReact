'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, usePeriodStore } from '@/stores';
import { ROLE_LABELS, PHASE_LABELS } from '@sibermas/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/mahasiswa', label: 'Dashboard', icon: '📊' },
  { href: '/mahasiswa/daftar', label: 'Daftar KKN', icon: '📝' },
  { href: '/mahasiswa/laporan-harian', label: 'Laporan Harian', icon: '📋' },
  { href: '/mahasiswa/program-kerja', label: 'Program Kerja', icon: '🎯' },
  { href: '/mahasiswa/izin', label: 'Izin', icon: '✈️' },
  { href: '/mahasiswa/posko', label: 'Posko', icon: '🏠' },
  { href: '/mahasiswa/laporan-akhir', label: 'Laporan Akhir', icon: '📄' },
  { href: '/mahasiswa/evaluasi-dpl', label: 'Evaluasi DPL', icon: '⭐' },
  { href: '/mahasiswa/sertifikat', label: 'Sertifikat', icon: '🎓' },
  { href: '/mahasiswa/workshops', label: 'Workshop', icon: '📚' },
  { href: '/profil', label: 'Profil', icon: '👤' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const { currentPhase, fetchPeriodContext } = usePeriodStore();

  useEffect(() => {
    fetchUser();
    fetchPeriodContext();
  }, [fetchUser, fetchPeriodContext]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!isLoading && isAuthenticated && user && !user.roles?.includes('student')) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <h1 className="text-xl font-bold text-teal-700">SIBERMAS</h1>
        </div>
        <div className="px-4 py-3">
          <div className="rounded-xl bg-teal-50 p-3">
            <p className="text-xs font-medium text-teal-600">{ROLE_LABELS[user.roles?.[0] || 'student']}</p>
            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
            {user.nim && <p className="text-xs text-slate-500">{user.nim}</p>}
          </div>
        </div>
        {currentPhase && (
          <div className="mx-4 mb-3 rounded-lg bg-amber-50 px-3 py-2">
            <p className="text-xs font-medium text-amber-600">Fase: {PHASE_LABELS[currentPhase] || currentPhase}</p>
          </div>
        )}
        <nav className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                pathname === item.href
                  ? 'bg-teal-50 font-semibold text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
