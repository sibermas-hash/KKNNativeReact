'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, usePeriodStore } from '@/stores';
import { ROLE_LABELS, PHASE_LABELS } from '@sibermas/constants';
import Link from 'next/link';
import Image from 'next/image';
import { clsx } from 'clsx';
import { ThemeSwitcher, useTheme } from '@/components/ui/theme-provider';
import { NotificationBell } from '@/components/ui/notification-bell';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import { ProfileIncompleteGuard } from "@/components/ui/profile-incomplete-guard";
import {
  LayoutDashboard, ClipboardList, Target, FileText, FileCheck,
  Star, BookOpen, Plane, Home, UserCircle, Image as ImageIcon,
  Menu, Power, Award, GraduationCap, MessageCircle,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Phases where this item is visible. null = always visible */
  phases: string[] | null;
  external?: boolean;
  requiresApproval?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/mahasiswa', label: 'Dashboard', icon: LayoutDashboard, phases: null },
  { href: '/mahasiswa/pendaftaran', label: 'Daftar KKN', icon: ClipboardList, phases: ['registration', 'placement'] },
  { href: '/mahasiswa/cek-pendaftaran', label: 'Status Pendaftaran', icon: FileCheck, phases: ['registration', 'placement'] },
  { href: '/mahasiswa/posko', label: 'Posko', icon: Home, phases: ['placement', 'execution', 'grading', 'finished'], requiresApproval: true },
  { href: '/mahasiswa/laporan-harian', label: 'Logbook Harian', icon: FileText, phases: ['execution', 'grading'], requiresApproval: true },
  { href: '/mahasiswa/program-kerja', label: 'Program Kerja', icon: Target, phases: ['execution', 'grading'], requiresApproval: true },
  { href: '/mahasiswa/izin', label: 'Izin', icon: Plane, phases: ['execution', 'grading'], requiresApproval: true },
  { href: '/mahasiswa/poster', label: 'Poster Potensi Desa', icon: ImageIcon, phases: ['execution', 'grading'], requiresApproval: true },
  { href: '/mahasiswa/laporan-akhir', label: 'Laporan Akhir', icon: BookOpen, phases: ['grading', 'finished'], requiresApproval: true },
  { href: '/mahasiswa/evaluasi-dpl', label: 'Evaluasi DPL', icon: Star, phases: ['grading', 'finished'], requiresApproval: true },
  { href: '/mahasiswa/sertifikat', label: 'Sertifikat', icon: Award, phases: ['grading', 'finished'], requiresApproval: true },
  { href: '/profil', label: 'Profil', icon: UserCircle, phases: null },
];

export default function StudentLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { user, isAuthenticated, isLoading, clearUser } = useAuthStore();
  const { currentPhase, activePeriod, isLoading: isPeriodLoading } = usePeriodStore();
  const { config: themeConfig } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: dashboardData } = useQuery<Record<string, unknown> | null>({
    queryKey: QUERY_KEYS.student.dashboard,
    queryFn: () => studentApi.dashboard() as unknown as Promise<Record<string, unknown> | null>,
    enabled: isAuthenticated && !!user?.roles?.includes('student'),
  });
  const registration = dashboardData?.registration as { status?: string } | null | undefined;
  const registrationStatus = String(registration?.status || '').toLowerCase();
  const isRegistrationApproved = ['approved', 'completed', 'disetujui', 'selesai', 'verifikasi_pusat'].includes(registrationStatus);
  const isProfilePage = pathname === '/profil';
  const currentNavItem = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const phaseValue = String(currentPhase || activePeriod?.current_phase || '');
  const phaseReady = !isPeriodLoading && Boolean(phaseValue);
  const isPhaseAllowed = !currentNavItem?.phases || !phaseReady || currentNavItem.phases.includes(phaseValue);
  const isApprovalAllowed = !currentNavItem?.requiresApproval || isRegistrationApproved;
  const canUseStudentChat = phaseReady && isRegistrationApproved && ['registration', 'placement', 'execution', 'grading', 'finished'].includes(phaseValue);
  const whatsappAdminUrl = `https://wa.me/6285161122030?text=${encodeURIComponent(`Assalamu'alaikum, saya peserta KKN SIBERMAS ingin bertanya.\n\nNama: ${user?.name ?? '-'}\nUsername: ${user?.username ?? '-'}\nPertanyaan:`)}`;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (user) {
      if (!user.password_changed_at) { router.replace('/ganti-password'); return; }
      if (user.must_change_password && !isProfilePage) { router.replace('/profil'); return; }
      if (isProfilePage) return;
      if (!user.roles?.includes('student')) { router.replace('/'); return; }
      if (phaseReady && (!isPhaseAllowed || !isApprovalAllowed) && currentNavItem) {
        router.replace(`/phase-blocked?phase=${encodeURIComponent(phaseValue || 'upcoming')}&required=${encodeURIComponent(currentNavItem.phases?.join(',') || '')}`);
      }
    }
  }, [isLoading, isAuthenticated, isProfilePage, user, router, isPhaseAllowed, isApprovalAllowed, currentNavItem, phaseValue, phaseReady]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }
  const handleLogout = async () => {
    try { await (await import('@/lib/api')).api.post('/auth/logout'); } catch { /* noop */ }
    clearUser();
    router.replace('/');
  };

  return (
    <div className="app-readable min-h-screen font-sans transition-colors duration-500" style={{ ...themeConfig.vars, background: themeConfig.backdrop }}>
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup sidebar"
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 border-r border-[color:var(--profile-border)] bg-[color:var(--profile-surface-strong)] backdrop-blur-xl shadow-sm flex flex-col transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
      )}>
        {/* Logo / Brand */}
        <div className="h-28 px-6 flex flex-col justify-center sticky top-0 z-10 bg-[color:var(--profile-surface-strong)]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-input)] p-1.5 shadow-sm shrink-0">
              <Image src="/images/logo_uinsaizu.png" alt="Logo UIN" width={48} height={48} className="h-full w-full object-contain" />
            </div>
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-input)] p-1 shadow-sm shrink-0">
              <Image src="/images/Logo_SIBERMAS.png" alt="Logo SIBERMAS" width={48} height={48} className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-base font-black leading-none tracking-tight flex items-center gap-2 font-display uppercase text-[color:var(--profile-text)]">
              <span><span className="text-[color:var(--profile-primary)]">SIBER</span><span className="text-[color:var(--profile-accent)]">MAS</span></span>
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--profile-accent)] animate-pulse" />
            </h1>
            <p className="text-[9px] font-bold text-[color:var(--profile-muted)] mt-2 font-sans tracking-wider leading-relaxed uppercase">
              Portal Mahasiswa
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 py-2">
          <div className="rounded-xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] p-3">
            <p className="text-[9px] font-black text-[color:var(--profile-soft-text)] uppercase tracking-[0.15em]">
              {ROLE_LABELS[user.roles?.[0] || 'student']}
            </p>
            <p className="text-sm font-black text-[color:var(--profile-text)] truncate mt-0.5">{user.name}</p>
            {user.nim && <p className="text-[10px] font-bold text-[color:var(--profile-muted)] mt-0.5">{user.nim}</p>}
          </div>
        </div>

        {/* Phase indicator */}
        {phaseReady && (
          <div className="mx-4 mb-2 rounded-lg bg-[color:var(--profile-warning)] border border-[color:var(--profile-border)] px-3 py-2">
            <p className="text-[9px] font-black text-[color:var(--profile-warning-text)] uppercase tracking-wider">
              Fase: {PHASE_LABELS[phaseValue] || phaseValue}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-3">
          <h3 className="px-3 mb-2 text-[10px] font-black text-[color:var(--profile-text)] uppercase tracking-widest font-sans">
            MENU UTAMA
          </h3>
          <div className="space-y-1">
            {NAV_ITEMS.filter((item) => (!item.requiresApproval || isRegistrationApproved) && (item.phases === null || item.phases.includes(phaseValue || 'upcoming'))).map((item) => {
              const isActive = !item.external && (pathname === item.href || ((item.href !== '/mahasiswa' && item.href !== '/dosen') && pathname.startsWith(item.href + '/')));
              const linkProps = item.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => !item.external && setSidebarOpen(false)}
                  {...linkProps}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden',
                    isActive
                      ? 'bg-[color:var(--profile-soft)] text-[color:var(--profile-text)] font-bold shadow-sm border border-[color:var(--profile-border)] shadow-[inset_3px_0_0_0_var(--profile-accent)]'
                      : 'text-[color:var(--profile-muted)] hover:text-[color:var(--profile-text)] hover:bg-[color:var(--profile-soft)]',
                  )}
                >
                  <item.icon
                    className={clsx(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive ? 'text-[color:var(--profile-accent)]' : 'text-[color:var(--profile-muted)] group-hover:text-[color:var(--profile-primary)]'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="truncate font-display font-black uppercase tracking-tight text-[11px]">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Profile Card */}
        <div className="p-4">
          <Link href="/profil" className="flex items-center gap-3 p-3 rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] shadow-sm hover:shadow-md transition-all group">
            <div className="h-10 w-10 rounded-xl bg-[color:var(--profile-primary)] flex items-center justify-center text-white shrink-0 shadow-inner group-hover:rotate-6 transition-transform">
              <span className="text-xs font-black uppercase">{user.name.substring(0, 2)}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-[color:var(--profile-text)] truncate leading-none mb-1 font-display">{user.name}</span>
              <span className="text-[9px] font-bold text-[color:var(--profile-muted)] uppercase tracking-wider flex items-center gap-1 font-sans">
                <div className="w-1 h-1 rounded-full bg-[color:var(--profile-accent)] animate-pulse" />
                Mahasiswa
              </span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 min-h-14 bg-[color:var(--profile-surface-strong)] border-b border-[color:var(--profile-border)] px-4 sm:px-6 py-2 flex items-center justify-between gap-3 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[color:var(--profile-muted)] hover:text-[color:var(--profile-text)] hover:bg-[color:var(--profile-soft)] rounded-lg lg:hidden transition-colors"
              title="Buka Menu Sidebar"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="min-w-0 truncate text-sm sm:text-[1.1rem] font-black text-[color:var(--profile-text)] uppercase tracking-tighter font-display leading-tight">
              {activePeriod ? activePeriod.name : 'SIBERMAS'}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
            <ThemeSwitcher className="hidden md:flex" />
            <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] rounded-md text-xs font-medium text-[color:var(--profile-soft-text)]">
              <GraduationCap size={12} /> Mahasiswa
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[color:var(--profile-muted)] hover:text-[color:var(--profile-danger-text)] hover:bg-[color:var(--profile-danger)] rounded-lg transition-colors">
              <Power className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <ProfileIncompleteGuard />
        <main className="flex-1 p-4 lg:p-8 text-[color:var(--profile-text)]">{children}</main>
      </div>

      {canUseStudentChat && (
        <a
          href={whatsappAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hubungi Admin via WhatsApp"
          title="Hubungi Admin via WhatsApp"
          className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-black/20 ring-4 ring-[color:var(--profile-surface)] transition-all hover:-translate-y-0.5 hover:bg-[#1ebe5d] focus:outline-none focus:ring-4 focus:ring-emerald-200 md:bottom-6 md:right-6"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-rose-500" />
          <span className="sr-only">Hubungi Admin via WhatsApp</span>
        </a>
      )}
    </div>
  );
}
