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
    title: 'DASBOR',
    items: [{ label: 'Beranda', href: safeRoute('admin.dashboard'), icon: LayoutDashboard }],
  },
  {
    title: 'DATA MASTER',
    items: [
      { label: 'Tahun Akademik', href: safeRoute('admin.tahun-akademik.index'), icon: Calendar },
      { label: 'Periode Program', href: safeRoute('admin.periode.index'), icon: History },
      { label: 'Jenis KKN', href: safeRoute('admin.jenis-kkn.index'), icon: Layers },
      { label: 'Wilayah Penugasan', href: safeRoute('admin.locations.index'), icon: MapPin },
      { label: 'Mahasiswa', href: safeRoute('admin.mahasiswa.index'), icon: Users },
      { label: 'Dosen', href: safeRoute('admin.dpl.index'), icon: UserCheck },
      { label: 'Workshop & Pembekalan', href: safeRoute('admin.workshops.index'), icon: GraduationCap },
    ],
  },
  {
    title: 'PENDAFTARAN & PESERTA',
    items: [
      {
        label: 'Pendaftaran Peserta',
        href: safeRoute('admin.pendaftaran.index'),
        icon: ClipboardList,
      },
      { label: 'Cek Kelayakan', href: safeRoute('admin.cek-kelayakan.index'), icon: ShieldCheck },
      { label: 'Dispensasi & Izin', href: safeRoute('admin.dispensasi.index'), icon: Shield },
    ],
  },
  {
    title: 'KELOMPOK & PENUGASAN',
    items: [
      { label: 'Kelompok KKN', href: safeRoute('admin.kelompok.index'), icon: Users },
      { label: 'Penugasan DPL', href: safeRoute('admin.dpl.penugasan'), icon: UserCheck },
      { label: 'Transfer Peserta', href: safeRoute('admin.peserta.pindah.index'), icon: Shuffle },
    ],
  },
  {
    title: 'PENILAIAN',
    items: [
      { label: 'Nilai Peserta', href: safeRoute('admin.nilai.index'), icon: FileText },
      { label: 'Laporan Nilai', href: safeRoute('admin.grade-reports.index'), icon: BarChart3 },
      { label: 'Evaluasi', href: safeRoute('admin.evaluasi.index'), icon: Star },
      { label: 'Yudisium', href: safeRoute('admin.yudisium.index'), icon: GraduationCap },
    ],
  },
  {
    title: 'LAPORAN',
    items: [
      { label: 'Laporan Harian', href: safeRoute('admin.laporan.harian.index'), icon: Calendar },
      {
        label: 'Program Kerja',
        href: safeRoute('admin.laporan.program-kerja.index'),
        icon: BookOpen,
      },
      { label: 'Laporan Akhir', href: safeRoute('admin.laporan.akhir.index'), icon: FileCheck },
      { label: 'Rekapitulasi', href: safeRoute('admin.rekapitulasi.index'), icon: BarChart3 },
    ],
  },
  {
    title: 'PENGATURAN & SINKRONISASI',
    items: [
      { label: 'Pengguna', href: safeRoute('admin.pengguna.index'), icon: Shield },
      {
        label: 'Konfigurasi Nilai',
        href: safeRoute('admin.konfigurasi-penilaian.index'),
        icon: Settings,
      },
      { label: 'Sinkronisasi Data', href: safeRoute('admin.database-sync.index'), icon: RefreshCw },
      { label: 'Pengaturan Sistem', href: safeRoute('admin.pengaturan.sistem'), icon: Settings },
    ],
  },
];

const getDplNav = (): NavGroup[] => [
  {
    title: 'AKSES DPL',
    items: [
      { label: 'Beranda DPL', href: safeRoute('dpl.dashboard'), icon: LayoutDashboard },
      { label: 'Workshop & Pembekalan', href: safeRoute('dpl.workshops.index'), icon: GraduationCap },
      { label: 'Data Kelompok', href: safeRoute('dpl.kelompok.index'), icon: Users },
      { label: 'Monitoring Mahasiswa', href: safeRoute('dpl.monitoring.index'), icon: Activity },
      { label: 'Penilaian Akhir', href: safeRoute('dpl.evaluations.index'), icon: Star },
    ],
  },
];

function buildStudentNav(currentPhase: string): NavGroup[] {
  const isRegistration = currentPhase === 'registration';
  const isExecutionOrLater = ['execution', 'grading', 'finished'].includes(currentPhase);
  const isGradingOrLater = ['grading', 'finished'].includes(currentPhase);

  return [
    {
      title: 'SENTRAL MAHASISWA',
      items: [
        { label: 'Beranda Mahasiswa', href: safeRoute('student.dashboard'), icon: LayoutDashboard },
        ...(isRegistration
          ? [
              {
                label: 'Daftar KKN',
                href: safeRoute('student.registration.create'),
                icon: ClipboardList,
              },
            ]
          : []),
        ...(isExecutionOrLater
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
                label: 'Unduh Sertifikat',
                href: safeRoute('student.certificate.index'),
                icon: Award,
              },
            ]
          : []),
      ],
    },
  ];
}

function getNavForRole(roles: string[], currentPhase: string): NavGroup[] {
  const norm = roles.map((r) => r.toLowerCase());
  if (norm.includes('admin') || norm.includes('superadmin')) return getAdminNav();
  if (norm.includes('dpl')) return getDplNav();
  return buildStudentNav(currentPhase);
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
  const navGroups = getNavForRole(roles, currentPhase);
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
          'fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0 shadow-xl' : '-translate-x-full',
        )}
      >
        {/* LOGO AREA */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-gray-200">
          <div className="h-12 w-12 bg-[#1a7a4a] rounded-full flex items-center justify-center shadow-sm shrink-0">
            <img src="/images/logo_kkn.png" alt="Logo" className="h-6 w-6 object-contain brightness-0 invert" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">KKN UIN SAIZU</h1>
            <p className="text-xs font-semibold text-[#1a7a4a] mt-0.5">
              Portal Administrasi
            </p>
          </div>
        </div>
 
        {/* NAVIGATION */}
        <nav 
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide scroll-smooth"
        >
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className={clsx(groupIdx > 0 && 'mt-6')}>
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-0.5">
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
                  
                  const isActive = 
                    normalizedCurrentPath === itemPath || 
                    (itemPath !== '/admin' && normalizedCurrentPath.startsWith(itemPath));

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
                        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200',
                        isActive
                          ? 'bg-[#e8f5ee] text-[#1a7a4a] font-semibold'
                          : 'text-gray-900 hover:bg-gray-50 font-medium',
                      )}
                    >
                      <item.icon
                        className={clsx(
                          'h-5 w-5 shrink-0',
                          isActive
                            ? 'text-[#1a7a4a]'
                            : 'text-gray-700',
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
 
        {/* USER PROFILE SECTION */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href={safeRoute('profile.show')}
            preserveScroll
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
          >
            <div className="h-9 w-9 rounded-full bg-[#e8f5ee] flex items-center justify-center text-[#1a7a4a] shrink-0">
              <UserCircle size={20} strokeWidth={2} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-gray-900 truncate">
                Pengaturan Profil
              </span>
              <span className="text-xs font-medium text-gray-700 mt-0.5">
                Akun & Sistem
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
