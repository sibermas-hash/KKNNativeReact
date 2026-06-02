'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import Link from 'next/link';
import { clsx } from 'clsx';
import { ThemeSwitcher, useTheme } from '@/components/ui/theme-provider';
import { NotificationBell } from '@/components/ui/notification-bell';

const CommandPalette = dynamic(
  () => import('@/components/ui/command-palette').then(m => ({ default: m.CommandPalette })),
  { ssr: false }
);
import {
  LayoutDashboard, Calendar, MapPin, Users, ClipboardList, FileText,
  Layers, BarChart3, ShieldCheck, Award, RefreshCw, Shuffle, BookOpen,
  Activity, History, Cpu, UserCheck, FileCheck, GraduationCap, Settings,
  UserCog, Globe, Terminal, Newspaper, Download, Menu, Power, Building2,
  Play, Megaphone, Bell, Camera, Sparkles, MessageCircle, ArrowRightLeft,
} from 'lucide-react';

const getNavGroups = (pathname: string, roles: string[]) => {
  const isSuperadmin = roles.includes('superadmin');
  const isBlog = pathname.includes('/admin/warta') || pathname.includes('/admin/unduhan') || pathname.includes('/admin/notifikasi') || pathname.includes('/admin/chat') || pathname.includes('/admin/konten-publik');
  const isSystem = pathname.includes('/admin/audit-log') || pathname.includes('/admin/activity-log') || pathname.includes('/admin/playground') || pathname.includes('/admin/database-sync') || pathname.includes('/admin/sinkron-siakad') || pathname.includes('/admin/pengaturan') || pathname.includes('/admin/pengguna') || pathname.includes('/admin/prodi') || pathname.includes('/admin/fakultas') || pathname.includes('/admin/profile-change-requests') || pathname.includes('/admin/avatar-moderation') || pathname.includes('/admin/konfigurasi-penilaian') || pathname.includes('/admin/monitoring');

  const operationalGroups = [
    { title: 'SENTRAL OPERASIONAL', items: [
      { label: 'Statistik KKN', href: '/admin/dashboard', icon: LayoutDashboard },
    ]},
    { title: 'STRUKTUR PROGRAM', items: [
      { label: 'Tahun Akademik', href: '/admin/tahun-akademik', icon: Calendar },
      { label: 'Jenis KKN', href: '/admin/jenis-kkn', icon: Layers },
      { label: 'Periode Pelaksanaan', href: '/admin/periode', icon: History },
      { label: 'Template Dokumen', href: '/admin/template-dokumen', icon: FileText },
    ]},
    { title: 'MANAJEMEN MAHASISWA', items: [
      { label: 'Direktori Mahasiswa', href: '/admin/mahasiswa', icon: Users },
      { label: 'Audit Kelayakan', href: '/admin/audit-kualifikasi', icon: ShieldCheck },
      { label: 'Dispensasi', href: '/admin/dispensasi', icon: Award },
      { label: 'Registrasi Mahasiswa', href: '/admin/pendaftaran', icon: ClipboardList },
      { label: 'Wawancara', href: '/admin/wawancara', icon: FileCheck },
      { label: 'Peserta KKN', href: '/admin/peserta-kkn', icon: UserCheck },
      { label: 'Transfer Peserta', href: '/admin/transfer-peserta', icon: ArrowRightLeft },
    ]},
    { title: 'MANAJEMEN DOSEN', items: [
      { label: 'Direktori Dosen', href: '/admin/dosen', icon: GraduationCap },
      { label: 'Workshop & Pembekalan', href: '/admin/workshops', icon: Play },
      { label: 'Pendaftaran DPL', href: '/admin/dosen/pendaftaran-dpl', icon: FileCheck },
      { label: 'Evaluasi DPL', href: '/admin/evaluasi-dpl', icon: FileText },
    ]},
    { title: 'PENEMPATAN', items: [
      { label: 'Penempatan KKN', href: '/admin/penempatan', icon: MapPin },
      { label: 'Wilayah Reguler', href: '/admin/lokasi?jenis_kkn=reguler', icon: MapPin },
      { label: 'Plotting Otomatis Reguler', href: '/admin/plotting-otomatis?jenis_kkn=reguler', icon: Shuffle },
      { label: 'Manajemen Kelompok', href: '/admin/kelompok', icon: Users },
      { label: 'Penugasan DPL', href: '/admin/dosen/penugasan', icon: MapPin },
    ]},
    { title: 'MONITORING KEGIATAN', items: [
      { label: 'Laporan Harian', href: '/admin/laporan/harian', icon: Activity },
      { label: 'Program Kerja', href: '/admin/laporan/program-kerja', icon: BookOpen },
    ]},
    { title: 'PENILAIAN & OUTPUT', items: [
      { label: 'Laporan Akhir', href: '/admin/laporan/akhir', icon: FileCheck },
      { label: 'Input Nilai', href: '/admin/nilai', icon: FileText },
      { label: 'Generator Nilai', href: '/admin/generator-nilai', icon: Cpu },
      { label: 'Rekapitulasi Nilai', href: '/admin/rekapitulasi', icon: BarChart3 },
      { label: 'Evaluasi Peserta', href: '/admin/evaluasi', icon: UserCheck },
      { label: 'Yudisium', href: '/admin/yudisium', icon: GraduationCap },
    ]},
  ];

  const contentGroups = [
    { title: 'MANAJEMEN KONTEN', items: [
      { label: 'Warta Utama', href: '/admin/warta-utama', icon: Newspaper },
      { label: 'Kirim Pengumuman', href: '/admin/notifikasi/broadcast', icon: Megaphone },
      { label: 'Chat Konsultasi', href: '/admin/chat', icon: MessageCircle },
      { label: 'Pusat Unduhan', href: '/admin/unduhan', icon: Download },
    ]},
    { title: 'INFORMASI LEMBAGA', items: [
      { label: 'Profil Lembaga', href: '/admin/konten-publik/profil', icon: Globe },
      { label: 'Skema KKN Publik', href: '/admin/konten-publik/skema', icon: Layers },
    ]},
  ];

  const systemGroups = [
    { title: 'INTELIJEN & SYNC', items: [
      { label: 'Intelijen Sistem', href: '/admin/audit-log', icon: Terminal },
      { label: 'Log Aktivitas User', href: '/admin/activity-log', icon: Activity },
      { label: 'AI Playground', href: '/admin/playground', icon: Sparkles },
      { label: 'Sinkron SIAKAD', href: '/admin/sinkron-siakad', icon: Play },
      { label: 'Log Sinkronisasi', href: '/admin/database-sync', icon: RefreshCw },
      { label: 'Monitoring Sistem', href: '/admin/monitoring', icon: Activity },
    ]},
    { title: 'KONFIGURASI GLOBAL', items: [
      { label: 'Manajemen Pengguna', href: '/admin/pengguna', icon: UserCog },
      { label: 'Perubahan Profil', href: '/admin/profile-change-requests', icon: UserCheck },
      { label: 'Moderasi Foto', href: '/admin/avatar-moderation', icon: Camera },
      { label: 'Fakultas & Prodi', href: '/admin/fakultas', icon: Building2 },
      { label: 'Pengaturan Global', href: '/admin/pengaturan/sistem', icon: Cpu },
      { label: 'Pengaturan Notifikasi', href: '/admin/pengaturan/notifikasi', icon: Bell },
      { label: 'Skema Penilaian', href: '/admin/pengaturan/penilaian', icon: Settings },
      { label: 'Template Sertifikat', href: '/admin/pengaturan/sertifikat', icon: Award },
    ]},
  ];

  if (isSystem) return isSuperadmin ? systemGroups : [];
  if (isBlog) return contentGroups;
  return operationalGroups;
};

export default function AdminLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { user, isAuthenticated, isLoading, clearUser, fetchUser } = useAuthStore();
  const { config: themeConfig } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Must be before any early returns — Rules of Hooks
  const navGroups = useMemo(() => getNavGroups(pathname, user?.roles || []), [pathname, user?.roles]);
  const activeNav = useMemo(() => {
    for (const group of navGroups) {
      const item = group.items.find(i => pathname === i.href || pathname.startsWith(i.href + '/'));
      if (item) return { group: group.title, item };
    }
    return null;
  }, [navGroups, pathname]);
  const pageTitle = activeNav?.item.label ?? (pathname === '/admin' ? 'Hub Utama' : 'SIBERMAS');
  const pageContext = activeNav?.group ?? (pathname === '/admin' ? 'Pusat Navigasi' : 'Operasional');
  const ActiveHeaderIcon = activeNav?.item.icon ?? LayoutDashboard;
  const isBlog = useMemo(() => pathname.includes('/admin/warta') || pathname.includes('/admin/unduhan') || pathname.includes('/admin/notifikasi') || pathname.includes('/admin/chat'), [pathname]);
  const isSystem = useMemo(() => pathname.includes('/admin/audit-log') || pathname.includes('/admin/activity-log') || pathname.includes('/admin/playground') || pathname.includes('/admin/database-sync') || pathname.includes('/admin/sinkron-siakad') || pathname.includes('/admin/pengaturan') || pathname.includes('/admin/pengguna') || pathname.includes('/admin/prodi') || pathname.includes('/admin/fakultas') || pathname.includes('/admin/profile-change-requests') || pathname.includes('/admin/avatar-moderation') || pathname.includes('/admin/monitoring'), [pathname]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void fetchUser(true).then((result) => {
        if (result !== 'authenticated') router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      });
      return;
    }
    if (user) {
      const r = user.roles || [];
      const isSuperadmin = r.includes('superadmin');
      if (!isSuperadmin && !user.password_changed_at) { router.replace('/ganti-password'); return; }
      if (!isSuperadmin && (!user.profile_complete || user.must_change_password)) { router.replace('/profil'); return; }
      if (!r.includes('superadmin') && !r.includes('admin') && !r.includes('faculty_admin')) router.replace('/');
      if (!isSuperadmin && isSystem) { router.replace('/admin'); return; }
    }
  }, [isLoading, isAuthenticated, user, router, pathname, isSystem, fetchUser]);

  const roles = user?.roles || [];
  const hasAdminRole = roles.includes('superadmin') || roles.includes('admin') || roles.includes('faculty_admin');

  const handleLogout = async () => {
    try { await (await import('@/lib/api')).api.post('/auth/logout'); } catch { /* noop */ }
    clearUser();
    router.replace('/');
  };

  if (isLoading || !isAuthenticated || !user || !hasAdminRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Hub page: full-page, no sidebar (after auth guard)
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  return (
    <div className="app-readable min-h-screen font-sans transition-colors duration-500" style={{ ...themeConfig.vars, background: themeConfig.backdrop }}>
      <CommandPalette />
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 border-r border-[color:var(--profile-border)] bg-[color:var(--profile-surface-strong)] backdrop-blur-xl shadow-sm flex flex-col transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
      )}>
        {/* Logo */}
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
              {isBlog ? 'CONTENT HUB' : isSystem ? 'SYSTEM REGISTRY' : (
                <span><span className="text-[color:var(--profile-primary)]">SIBER</span><span className="text-[color:var(--profile-accent)]">MAS</span></span>
              )}
              <span className={clsx('h-1.5 w-1.5 rounded-full animate-pulse bg-[color:var(--profile-accent)]')} />
            </h1>
            <p className="text-[9px] font-bold text-[color:var(--profile-muted)] mt-2 font-sans tracking-wider leading-relaxed uppercase">
              {isBlog ? 'Eksistensi Digital' : isSystem ? 'Infrastruktur Data' : 'Otomasi Operasional'}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          {/* Cmd+K hint */}
          <button
            onClick={() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })); }}
            className="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-input)] text-xs text-[color:var(--profile-muted)] hover:text-[color:var(--profile-text)] transition-all font-sans">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span className="flex-1 text-left">Cari halaman...</span>
            <kbd className="text-[9px] bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)] px-1.5 py-0.5 rounded font-bold">⌘K</kbd>
          </button>
          {navGroups.map((group, index) => (
            <div key={group.title} className={clsx('space-y-2', index > 0 && 'mt-4')}>
              {index > 0 && <div className="h-[2px] w-[80%] bg-[color:var(--profile-accent)] opacity-30 mb-3 ml-2 rounded-full" />}
              <h3 className="px-4 text-[10px] font-black text-[color:var(--profile-text)] uppercase tracking-widest font-sans">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden',
                        isActive
                          ? 'bg-[color:var(--profile-soft)] text-[color:var(--profile-text)] font-bold shadow-sm border border-[color:var(--profile-border)] shadow-[inset_3px_0_0_0_var(--profile-accent)]'
                          : 'text-[color:var(--profile-muted)] hover:text-[color:var(--profile-text)] hover:bg-[color:var(--profile-soft)]',
                      )}
                    >
                      <item.icon className={clsx('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-[color:var(--profile-accent)]' : 'text-[color:var(--profile-muted)] group-hover:text-[color:var(--profile-primary)]')} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="truncate font-display font-black uppercase tracking-tight text-[11px]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Hub switcher */}
        <div className="px-4 py-2 border-t border-[color:var(--profile-border)]">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-widest hover:bg-[color:var(--profile-soft)] hover:text-[color:var(--profile-text)] transition-all group border border-transparent hover:border-[color:var(--profile-border)]">
            <Shuffle className="h-4 w-4 text-[color:var(--profile-muted)] group-hover:text-[color:var(--profile-primary)] transition-colors" />
            Kembali ke Hub Utama
          </Link>
        </div>

        {/* Profile */}
        <div className="p-4">
          <Link href="/profil" className="flex items-center gap-3 p-3 rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] shadow-sm hover:shadow-md transition-all group">
            <div className="h-10 w-10 rounded-xl bg-[color:var(--profile-primary)] flex items-center justify-center text-white shrink-0 shadow-inner group-hover:rotate-6 transition-transform">
              <span className="text-xs font-black uppercase">{user.name.substring(0, 2)}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-[color:var(--profile-text)] truncate leading-none mb-1 font-display">{user.name}</span>
              <span className="text-[9px] font-bold text-[color:var(--profile-muted)] uppercase tracking-wider flex items-center gap-1 font-sans">
                <div className="w-1 h-1 rounded-full bg-[color:var(--profile-accent)] animate-pulse" />
                {roles[0] || 'admin'}
              </span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 min-h-16 bg-[color:var(--profile-surface-strong)] border-b border-[color:var(--profile-border)] px-4 sm:px-6 flex items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-[color:var(--profile-muted)] hover:text-[color:var(--profile-text)] hover:bg-[color:var(--profile-soft)] rounded-lg lg:hidden transition-colors" title="Buka Menu Sidebar" aria-label="Buka Menu Sidebar">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <ActiveHeaderIcon className="h-4 w-4 shrink-0 text-[color:var(--profile-accent)]" />
                <h2 className="truncate text-[1.05rem] font-black text-[color:var(--profile-text)] uppercase tracking-tighter font-display leading-none">
                  {pageTitle}
                </h2>
              </div>
              <p className="mt-1 hidden truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--profile-muted)] sm:block">
                {pageContext}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeSwitcher className="hidden md:flex" />
            {(roles.includes('admin') || roles.includes('superadmin') || roles.includes('faculty_admin')) && (
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] rounded-md text-xs font-medium text-[color:var(--profile-soft-text)]">
                <ShieldCheck size={12} /> Admin
              </span>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[color:var(--profile-muted)] hover:text-[color:var(--profile-danger-text)] hover:bg-[color:var(--profile-danger)] rounded-lg transition-colors">
              <Power className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 text-[color:var(--profile-text)]">{children}</main>
      </div>
    </div>
  );
}
// cache-bust 1779479400
