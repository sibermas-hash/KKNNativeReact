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
    title: 'PERSIAPAN & DATA MASTER',
    items: [
      { label: 'Tahun Akademik', href: safeRoute('admin.tahun-akademik.index'), icon: Calendar },
      { label: 'Periode Program', href: safeRoute('admin.periode.index'), icon: History },
      { label: 'Jenis KKN', href: safeRoute('admin.jenis-kkn.index'), icon: Layers },
      { label: 'Wilayah Penugasan', href: safeRoute('admin.locations.index'), icon: MapPin },
      { label: 'Direktori Mahasiswa', href: safeRoute('admin.mahasiswa.index'), icon: Users },
      { label: 'Direktori Dosen', href: safeRoute('admin.dpl.index'), icon: UserCheck },
      { label: 'Workshop & Pembekalan', href: safeRoute('admin.workshops.index'), icon: GraduationCap },
    ],
  },
  {
    title: 'SELEKSI & PENDAFTARAN',
    items: [
      { label: 'Audit Kelayakan', href: safeRoute('admin.cek-kelayakan.index'), icon: ShieldCheck },
      { label: 'Dispensasi & Izin', href: safeRoute('admin.dispensasi.index'), icon: Shield },
      { label: 'Pendaftaran Mahasiswa', href: safeRoute('admin.pendaftaran.index'), icon: ClipboardList },
      { label: 'Pendaftaran DPL', href: safeRoute('admin.dpl.pendaftaran'), icon: UserCheck },
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
    title: 'PELAKSANAAN & MONITORING',
    items: [
      { label: 'Laporan Harian', href: safeRoute('admin.laporan.harian.index'), icon: Activity },
      { label: 'Program Kerja', href: safeRoute('admin.laporan.program-kerja.index'), icon: BookOpen },
    ],
  },
  {
    title: 'PELAPORAN & PENILAIAN',
    items: [
      { label: 'Laporan Akhir', href: safeRoute('admin.laporan.akhir.index'), icon: FileCheck },
      { label: 'Evaluasi Kinerja', href: safeRoute('admin.evaluasi.index'), icon: Star },
      { label: 'Nilai Peserta', href: safeRoute('admin.nilai.index'), icon: FileText },
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
    title: 'PENGATURAN & SINKRONISASI',
    items: [
      { label: 'Manajemen Pengguna', href: safeRoute('admin.pengguna.index'), icon: UserCog },
      { label: 'Konfigurasi Penilaian', href: safeRoute('admin.konfigurasi-penilaian.index'), icon: Settings },
      { label: 'Sinkronisasi Data', href: safeRoute('admin.database-sync.index'), icon: RefreshCw },
      { label: 'Pengaturan Sistem', href: safeRoute('admin.pengaturan.sistem'), icon: Cpu },
    ],
  },
];

function getDosenNav(hasDplRole: boolean): NavGroup[] {
  const base: NavGroup = {
    title: 'PORTAL DOSEN',
    items: [
      { label: 'Beranda Dosen', href: safeRoute('dosen.dashboard'), icon: LayoutDashboard },
      { label: 'Workshop & Pembekalan', href: safeRoute('dosen.workshops.index'), icon: GraduationCap },
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
          'fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-emerald-50 flex flex-col transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0 shadow-xl' : '-translate-x-full',
        )}
      >
        {/* LOGO AREA */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-emerald-50">
          <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/images/logo_kkn.png" alt="Logo UIN SAIZU" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-emerald-950 leading-tight">KKN UIN SAIZU</h1>
            <p className="text-xs font-semibold text-[#1a7a4a] mt-0.5">
              {roles.some(r => ['admin', 'superadmin'].includes(r))
                ? 'Portal Admin'
                : roles.includes('dpl')
                  ? 'Portal DPL'
                  : roles.includes('dosen')
                    ? 'Portal Dosen'
                    : 'Portal Mahasiswa'}
            </p>
          </div>
        </div>

        {/* USER INFO - untuk student */}
        {(roles.includes('student') || roles.includes('dosen')) && auth.user && (
          <div className="px-4 py-4 border-b border-emerald-50 bg-gradient-to-b from-emerald-50 to-white">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-200 flex items-center justify-center overflow-hidden shrink-0 border-4 border-white shadow-md mb-3">
                {auth.user.avatar ? (
                  <img src={`/storage/${auth.user.avatar}`} alt="Foto" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-emerald-700">{auth.user.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-emerald-950 truncate">{auth.user.name}</p>
                <p className="text-xs font-semibold text-emerald-600 truncate">
                  {roles.includes('dosen') ? 'NIP' : 'NIM'}: {auth.user.nim || auth.user.username}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <nav
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide scroll-smooth"
        >
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className={clsx(groupIdx > 0 && 'mt-6')}>
              <h3 className="px-4 mb-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
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
                        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200',
                        isActive
                          ? 'bg-[#e8f5ee] text-[#1a7a4a] font-semibold'
                          : 'text-emerald-950 hover:bg-gray-50 font-medium',
                      )}
                    >
                      <item.icon
                        className={clsx(
                          'h-5 w-5 shrink-0',
                          isActive
                            ? 'text-[#1a7a4a]'
                            : 'text-emerald-800',
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
        <div className="p-4 border-t border-emerald-50">
          <Link
            href={safeRoute('profile.show')}
            preserveScroll
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
          >
            <div className="h-9 w-9 rounded-full bg-[#e8f5ee] flex items-center justify-center text-[#1a7a4a] shrink-0">
              <UserCog size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-emerald-950 truncate">
                Pengaturan Profil
              </span>
              <span className="text-xs font-medium text-emerald-800 mt-0.5">
                Akun & Sistem
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
