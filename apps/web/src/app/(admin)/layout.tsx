'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, usePeriodStore } from '@/stores';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Calendar, MapPin, Users, ClipboardList, FileText, Star,
  Layers, BarChart3, ShieldCheck, Award, RefreshCw, Shuffle, BookOpen,
  Activity, History, Cpu, UserCheck, FileCheck, GraduationCap, Settings,
  UserCog, MessageSquareQuote, Globe, Terminal, Newspaper, Download, Menu, Power, BadgeCheck,
} from 'lucide-react';

const getNavGroups = (pathname: string) => {
  const isBlog = pathname.includes('/admin/warta') || pathname.includes('/admin/unduhan');
  const isSystem = pathname.includes('/admin/audit-log') || pathname.includes('/admin/database-sync') || pathname.includes('/admin/pengaturan') || pathname.includes('/admin/pengguna') || pathname.includes('/admin/konfigurasi-penilaian');

  if (isBlog) return [
    { title: 'MANAJEMEN KONTEN', items: [
      { label: 'Warta Utama', href: '/admin/warta-utama', icon: Newspaper },
      { label: 'Pusat Unduhan', href: '/admin/unduhan', icon: Download },
    ]},
    { title: 'INFORMASI LEMBAGA', items: [
      { label: 'Profil Lembaga', href: '/admin/konten/profil', icon: Globe },
      { label: 'Skema KKN Publik', href: '/admin/konten/skema', icon: Layers },
    ]},
  ];

  if (isSystem) return [
    { title: 'INTELIJEN & SYNC', items: [
      { label: 'Intelijen Sistem', href: '/admin/audit-log', icon: Terminal },
      { label: 'Sinkronisasi Master', href: '/admin/database-sync', icon: RefreshCw },
    ]},
    { title: 'KONFIGURASI GLOBAL', items: [
      { label: 'Manajemen Pengguna', href: '/admin/pengguna', icon: UserCog },
      { label: 'Pengaturan Global', href: '/admin/pengaturan/sistem', icon: Cpu },
      { label: 'Skema Penilaian', href: '/admin/konfigurasi-penilaian', icon: Settings },
      { label: 'Template Sertifikat', href: '/admin/pengaturan/sertifikat', icon: Award },
    ]},
  ];

  return [
    { title: 'SENTRAL OPERASIONAL', items: [
      { label: 'Statistik KKN', href: '/admin/dashboard', icon: LayoutDashboard },
    ]},
    { title: 'STRUKTUR PROGRAM', items: [
      { label: 'Tahun Akademik', href: '/admin/tahun-akademik', icon: Calendar },
      { label: 'Jenis KKN', href: '/admin/jenis-kkn', icon: Layers },
      { label: 'Periode Pelaksanaan', href: '/admin/periode', icon: History },
      { label: 'Workshop & Pembekalan', href: '/admin/workshops', icon: GraduationCap },
    ]},
    { title: 'MANAJEMEN PESERTA', items: [
      { label: 'Audit Kelayakan', href: '/admin/audit-kualifikasi', icon: ShieldCheck },
      { label: 'Registrasi Mahasiswa', href: '/admin/pendaftaran', icon: ClipboardList },
      { label: 'Direktori Mahasiswa', href: '/admin/mahasiswa', icon: Users },
      { label: 'Direktori Dosen', href: '/admin/dosen', icon: UserCheck },
    ]},
    { title: 'PENEMPATAN & MONITORING', items: [
      { label: 'Manajemen Kelompok', href: '/admin/kelompok', icon: Users },
      { label: 'Penugasan DPL', href: '/admin/dosen/penugasan', icon: MapPin },
      { label: 'Wilayah Penugasan', href: '/admin/lokasi', icon: MapPin },
      { label: 'Laporan Harian', href: '/admin/laporan/harian', icon: Activity },
      { label: 'Program Kerja', href: '/admin/laporan/program-kerja', icon: BookOpen },
    ]},
    { title: 'PENILAIAN & OUTPUT', items: [
      { label: 'Laporan Akhir', href: '/admin/laporan/akhir', icon: FileCheck },
      { label: 'Input Nilai', href: '/admin/nilai', icon: FileText },
      { label: 'Rekapitulasi Nilai', href: '/admin/rekapitulasi', icon: BarChart3 },
      { label: 'Yudisium', href: '/admin/yudisium', icon: GraduationCap },
    ]},
  ];
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, clearUser } = useAuthStore();
  const { currentPhase, activePeriod } = usePeriodStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
    if (!isLoading && isAuthenticated && user) {
      const roles = user.roles || [];
      if (!roles.includes('superadmin') && !roles.includes('admin') && !roles.includes('faculty_admin')) router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Hub page: full-page, no sidebar
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const navGroups = getNavGroups(pathname);
  const isBlog = pathname.includes('/admin/warta') || pathname.includes('/admin/unduhan');
  const isSystem = pathname.includes('/admin/audit-log') || pathname.includes('/admin/database-sync') || pathname.includes('/admin/pengaturan') || pathname.includes('/admin/pengguna');
  const roles = user.roles || [];

  const handleLogout = async () => {
    try { await (await import('@/lib/api')).api.post('/auth/logout'); } catch { /* noop */ }
    clearUser();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-[#F8FAF9] border-r border-emerald-100/50 shadow-sm flex flex-col transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="h-28 px-6 flex flex-col justify-center sticky top-0 z-10 bg-[#F8FAF9]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex items-center justify-center bg-white rounded-2xl border border-emerald-100 p-1.5 shadow-sm shrink-0">
              <img src="/images/logo_uinsaizu.png" alt="Logo UIN" className="h-full w-full object-contain" />
            </div>
            <div className="h-12 w-12 flex items-center justify-center bg-white rounded-2xl border border-emerald-100 p-1 shadow-sm shrink-0">
              <img src="/images/Logo_SIBERMAS.png" alt="Logo SIBERMAS" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-base font-black leading-none tracking-tight flex items-center gap-2 font-display uppercase">
              {isBlog ? 'CONTENT HUB' : isSystem ? 'SYSTEM REGISTRY' : (
                <span><span className="text-sky-600">SIBER</span><span className="text-emerald-600">MAS</span></span>
              )}
              <span className={clsx('h-1.5 w-1.5 rounded-full animate-pulse',
                isBlog ? 'bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.5)]'
                : isSystem ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
              )} />
            </h1>
            <p className="text-[9px] font-bold text-slate-600 mt-2 font-sans tracking-wider leading-relaxed uppercase">
              {isBlog ? 'Eksistensi Digital' : isSystem ? 'Infrastruktur Data' : 'Otomasi Operasional'}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav ref={navRef} className="flex-1 overflow-y-auto px-4 py-4">
          {navGroups.map((group, index) => (
            <div key={group.title} className={clsx('space-y-2', index > 0 && 'mt-4')}>
              {index > 0 && <div className="h-[2px] w-[80%] bg-cyan-300/80 shadow-[0_2px_4px_rgba(6,182,212,0.4)] mb-3 ml-2 rounded-full" />}
              <h3 className="px-4 text-[10px] font-black text-slate-800 uppercase tracking-widest font-sans">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden',
                        isActive
                          ? 'bg-white text-cyan-900 font-bold shadow-sm border border-cyan-100 shadow-[inset_3px_0_0_0_rgba(245,158,11,1)]'
                          : 'text-slate-600 hover:text-cyan-900 hover:bg-cyan-50/50',
                      )}
                    >
                      <item.icon className={clsx('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-cyan-500')} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="truncate font-display font-black uppercase tracking-tight text-[11px]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Hub switcher */}
        <div className="px-4 py-2 border-t border-emerald-50 bg-white/30 backdrop-blur-sm">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black text-slate-700 uppercase tracking-widest hover:bg-white hover:text-cyan-700 transition-all group border border-transparent hover:border-cyan-100">
            <Shuffle className="h-4 w-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
            Kembali ke Hub Utama
          </Link>
        </div>

        {/* Profile */}
        <div className="p-4">
          <Link href="/profil" className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all group">
            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-inner group-hover:rotate-6 transition-transform">
              <span className="text-xs font-black uppercase">{user.name.substring(0, 2)}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-cyan-950 truncate leading-none mb-1 font-display">{user.name}</span>
              <span className="text-[9px] font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1 font-sans">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                {roles[0] || 'admin'}
              </span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden transition-colors" title="Buka Menu Sidebar" aria-label="Buka Menu Sidebar">
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-[1.1rem] font-black text-emerald-950 uppercase tracking-tighter font-display leading-none">
              {activePeriod ? activePeriod.name : 'SIBERMAS'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {(roles.includes('admin') || roles.includes('superadmin') || roles.includes('faculty_admin')) && (
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md text-xs font-medium text-emerald-700">
                <ShieldCheck size={12} /> Admin
              </span>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Power className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
