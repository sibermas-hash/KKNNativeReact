import { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  ClipboardList,
  FileText,
  Star,
  Layers,
  BarChart3,
  ShieldCheck,
  Award,
  RefreshCw,
  Shuffle,
  UserCircle,
  BookOpen,
  Activity,
  History,
  Cpu,
  UserCheck,
  FileCheck,
  GraduationCap,
  Shield,
  Settings,
  UserCog,
  MessageSquareQuote,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const safeRoute = (name: string, params?: Record<string, unknown>) => {
  try {
    return (window as any).route ? (window as any).route(name, params) : '#';
  } catch (_e) {
    return '#';
  }
};

const getAdminNav = (): NavGroup[] => [
  {
    title: 'SENTRAL KENDALI',
    items: [{ label: 'Beranda', href: safeRoute('admin.dashboard'), icon: LayoutDashboard }],
  },
  {
    title: 'STRUKTUR PROGRAM',
    items: [
      { label: 'Tahun Akademik', href: safeRoute('admin.tahun-akademik.index'), icon: Calendar },
      { label: 'Jenis KKN', href: safeRoute('admin.jenis-kkn.index'), icon: Layers },
      { label: 'Periode Pelaksanaan', href: safeRoute('admin.periode.index'), icon: History },
      { label: 'Workshop & Pembekalan', href: safeRoute('admin.workshops.index'), icon: GraduationCap },
    ],
  },
  {
    title: 'INTEGRASI & INVENTORI',
    items: [
      { label: 'Sinkronisasi Master', href: safeRoute('admin.database-sync.index'), icon: RefreshCw },
      { label: 'Wilayah Penugasan', href: safeRoute('admin.locations.index'), icon: MapPin },
      { label: 'Direktori Mahasiswa', href: safeRoute('admin.mahasiswa.index'), icon: Users },
      { label: 'Direktori Dosen', href: safeRoute('admin.dpl.index'), icon: UserCheck },
    ],
  },
  {
    title: 'REKRUTMEN & PENDAFTARAN',
    items: [
      { label: 'Audit Kelayakan', href: safeRoute('admin.cek-kelayakan.index'), icon: ShieldCheck },
      { label: 'Dispensasi & Izin', href: safeRoute('admin.dispensasi.index'), icon: Shield },
      { label: 'Registrasi Mahasiswa', href: safeRoute('admin.pendaftaran.index'), icon: ClipboardList },
      { label: 'Seleksi DPL', href: safeRoute('admin.dpl.pendaftaran'), icon: UserCheck },
    ],
  },
  {
    title: 'PENEMPATAN & PENUGASAN',
    items: [
      { label: 'Manajemen Kelompok', href: safeRoute('admin.kelompok.index'), icon: Users },
      { label: 'Penugasan DPL', href: safeRoute('admin.dpl.penugasan'), icon: MapPin },
      { label: 'Transfer Peserta', href: safeRoute('admin.peserta.pindah.index'), icon: Shuffle },
    ],
  },
  {
    title: 'MONITORING & PELAKSANAAN',
    items: [
      { label: 'Laporan Harian', href: safeRoute('admin.laporan.harian.index'), icon: Activity },
      { label: 'Program Kerja', href: safeRoute('admin.laporan.program-kerja.index'), icon: BookOpen },
    ],
  },
  {
    title: 'EVALUASI & PENILAIAN',
    items: [
      { label: 'Laporan Akhir', href: safeRoute('admin.laporan.akhir.index'), icon: FileCheck },
      { label: 'Evaluasi Kinerja', href: safeRoute('admin.evaluasi.index'), icon: Star },
      { label: 'Evaluasi DPL Peserta', href: safeRoute('admin.evaluasi-dpl.index'), icon: MessageSquareQuote },
      { label: 'Input Nilai', href: safeRoute('admin.nilai.index'), icon: FileText },
    ],
  },
  {
    title: 'PENYELESAIAN (OUTPUT)',
    items: [
      { label: 'Rekapitulasi Nilai', href: safeRoute('admin.grade-reports.index'), icon: BarChart3 },
      { label: 'Yudisium & Kelulusan', href: safeRoute('admin.yudisium.index'), icon: GraduationCap },
      { label: 'Laporan Eksekutif', href: safeRoute('admin.rekapitulasi.index'), icon: Layers },
    ],
  },
  {
    title: 'ADMINISTRASI SISTEM',
    items: [
      { label: 'Manajemen Pengguna', href: safeRoute('admin.pengguna.index'), icon: UserCog },
      { label: 'Konfigurasi Penilaian', href: safeRoute('admin.konfigurasi-penilaian.index'), icon: Settings },
      { label: 'Pengaturan Sertifikat', href: safeRoute('admin.pengaturan.sertifikat.index'), icon: Award },
      { label: 'Pengaturan Global', href: safeRoute('admin.pengaturan.sistem'), icon: Cpu },
    ],
  },
];

function getDosenNav(hasDplRole: boolean): NavGroup[] {
  const base: NavGroup = {
    title: 'PORTAL DOSEN',
    items: [
      { label: 'Beranda Dosen', href: safeRoute('dosen.dashboard'), icon: LayoutDashboard },
      { label: 'Workshop & Pembekalan', href: safeRoute('dosen.workshops.index'), icon: GraduationCap },
      { label: 'Sertifikat Workshop', href: safeRoute('dosen.workshops.my-certificates'), icon: Award },
    ],
  };

  if (!hasDplRole) return [base];

  return [
    base,
    {
      title: 'BIMBINGAN DPL',
      items: [
        { label: 'Data Kelompok', href: safeRoute('dosen.kelompok.index'), icon: Users },
        { label: 'Monitoring Mahasiswa', href: safeRoute('dosen.monitoring.index'), icon: Activity },
        { label: 'Penilaian Akhir', href: safeRoute('dosen.evaluations.index'), icon: Star },
        { label: 'Umpan Balik Peserta', href: safeRoute('dosen.feedback-dpl.index'), icon: MessageSquareQuote },
      ],
    },
  ];
}

function buildStudentNav(currentPhase: string, registrationStatus: string = 'none'): NavGroup[] {
  const isExecutionOrLater = ['execution', 'grading', 'finished'].includes(currentPhase);
  const isGradingOrLater = ['grading', 'finished'].includes(currentPhase);

  const isApproved = registrationStatus === 'approved';

  return [
    {
      title: 'SENTRAL MAHASISWA',
      items: [
        { label: 'Beranda Mahasiswa', href: safeRoute('student.dashboard'), icon: LayoutDashboard },
        ...(!isApproved
          ? [
            { label: 'Daftar KKN', href: '/mahasiswa/daftar', icon: ClipboardList },
          ]
          : []),
        ...(isApproved || isExecutionOrLater
          ? [
            {
              label: 'Logbook Masuk',
              href: safeRoute('student.laporan-harian.index'),
              icon: FileText,
            },
            {
              label: 'Target Proker',
              href: safeRoute('student.program-kerja.index'),
              icon: BookOpen,
            },
          ]
          : []),
        ...(isGradingOrLater
          ? [
            {
              label: 'Evaluasi DPL',
              href: safeRoute('student.evaluasi-dpl.index'),
              icon: MessageSquareQuote,
            },
            {
              label: 'Sertifikat KKN',
              href: safeRoute('student.certificate.index'),
              icon: Award,
            },
            {
              label: 'Sertifikat Workshop',
              href: safeRoute('student.workshops.my-certificates'),
              icon: GraduationCap,
            },
          ]
          : []),
      ],
    },
  ];
}

function getNavForRole(roles: string[], currentPhase: string, registrationStatus: string = 'none'): NavGroup[] {
  const norm = roles.map((r) => r.toLowerCase());
  if (norm.includes('admin') || norm.includes('superadmin')) return getAdminNav();
  if (norm.includes('dosen') || norm.includes('dpl')) return getDosenNav(norm.includes('dpl'));
  return buildStudentNav(currentPhase, registrationStatus);
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { props, url } = usePage<PageProps & { url: string }>();
  const { auth } = props;

  const roles =
    (auth.user?.roles as any[])?.map((r) => (typeof r === 'string' ? r : (r as any).name)) || [];
  const currentPhase = (auth as any)?.active_phase ?? 'upcoming';
  const registrationStatus = (auth as any)?.user?.student_registration_status ?? 'none';
  const navGroups = getNavForRole(roles, currentPhase, registrationStatus);
  const currentPath = url;

  const navRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  // Restore scroll once on mount
  useEffect(() => {
    if (navRef.current) {
      const savedScroll = sessionStorage.getItem('sidebar-scroll');
      if (savedScroll) {
        navRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    sessionStorage.setItem('sidebar-scroll', e.currentTarget.scrollTop.toString());
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#F8FAF9] border-r border-emerald-100/50 shadow-sm flex flex-col transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0 shadow-xl' : '-translate-x-full',
        )}
      >
        {/* LOGO AREA - Brand Identity */}
        <div className="h-28 px-6 flex flex-col justify-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex items-center justify-center bg-white rounded-2xl border border-emerald-100 p-1.5 shadow-sm shrink-0">
              <img src="/images/logo_uin_saizu.png" alt="Logo UIN SAIZU" className="h-full w-full object-contain" />
            </div>
            <div className="h-12 w-12 flex items-center justify-center bg-white rounded-2xl border border-emerald-100 p-1 shadow-sm shrink-0">
              <img src="/images/logo_siberdaya.png" alt="Logo Siberdaya" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="mt-3">
            <h1 className="text-sm font-black text-emerald-950 leading-none tracking-tight flex items-center gap-1.5">
              SIBERDAYA <span className="h-1 w-1 rounded-full bg-emerald-500" />
            </h1>
            <p className="text-[9px] font-black text-emerald-600/60 mt-1 uppercase tracking-[0.15em] truncate">
               {roles.some(r => ['admin', 'superadmin'].includes(r))
                ? 'Sistem Manajemen KKN'
                : 'Portal Layanan KKN'}
            </p>
          </div>
        </div>

        {/* NAVIGATION AREA */}
        <nav
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide scroll-smooth space-y-8"
        >
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">
                {group.title}
              </h3>
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const getPath = (href: string) => {
                    try {
                      return new URL(href, window.location.origin).pathname;
                    } catch (e) {
                      return href;
                    }
                  };

                  const itemPath = getPath(item.href);
                  const normalizedCurrentPath = currentPath.split('?')[0];

                  const isActive = normalizedCurrentPath === itemPath;

                  const isValidHref = item.href && item.href !== '#';
                  return (
                    <Link
                      key={item.href}
                      ref={isActive ? activeItemRef : null}
                      href={isValidHref ? item.href : '#'}
                      method={isValidHref ? 'get' : undefined}
                      preserveScroll
                      onClick={(e) => {
                        if (!isValidHref) {
                          e.preventDefault();
                        }
                        if (isValidHref && window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative',
                        isActive
                          ? 'bg-white text-emerald-700 font-bold shadow-sm border border-emerald-100'
                          : 'text-slate-500 hover:text-emerald-900',
                      )}
                    >
                      <item.icon
                        className={clsx(
                          'h-5 w-5 shrink-0 transition-colors',
                          isActive
                            ? 'text-emerald-600'
                            : 'text-slate-400 group-hover:text-emerald-500',
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="truncate">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* BOTTOM PROFILE - Premium Style */}
        <div className="p-4 mt-auto">
          <Link
            href={safeRoute('profile.show')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-inner">
               <span className="text-xs font-black uppercase">{auth.user.name.substring(0, 2)}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-emerald-950 truncate leading-none mb-1">
                {auth.user.name}
              </span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                {roles[0] || 'User'}
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
