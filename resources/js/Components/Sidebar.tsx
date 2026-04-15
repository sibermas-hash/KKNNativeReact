import { Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
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
  Hammer,
  RefreshCw,
  Shuffle,
  Globe,
  Megaphone,
  Inbox,
  UserCircle,
  BookOpen,
  Activity,
  Building2,
  History,
  CheckCircle2,
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
    title: 'DASHBOARD',
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
      { label: 'Cek Kelayakan', href: safeRoute('admin.cek-kelayakan.index'), icon: CheckCircle2 },
      { label: 'Dispensasi', href: safeRoute('admin.dispensasi.index'), icon: ShieldCheck },
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
      { label: 'Grade Reports', href: safeRoute('admin.grade-reports.index'), icon: BarChart3 },
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
      { label: 'Dashboard AI', href: safeRoute('admin.ai.monitor'), icon: Cpu },
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
    title: 'DPL ACCESS',
    items: [
      { label: 'Beranda DPL', href: safeRoute('dpl.dashboard'), icon: LayoutDashboard },
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
  const { auth, url } = usePage<PageProps & { url: string }>().props;
  const roles =
    (auth.user?.roles as any[])?.map((r) => (typeof r === 'string' ? r : (r as any).name)) || [];
  const currentPhase = (auth as any)?.active_phase ?? 'upcoming';
  const navGroups = getNavForRole(roles, currentPhase);
  const currentPath = typeof url === 'string' ? url : window.location.pathname;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-emerald-950/20 backdrop-blur-md lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-[270px] bg-white/80 backdrop-blur-2xl border-r border-emerald-100/50 flex flex-col transition-transform duration-500 lg:translate-x-0',
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
      >
        {/* BRANDING PREMIUM */}
        <div className="h-20 px-8 flex items-center gap-4 border-b border-emerald-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/30 blur-2xl -mr-10 -mt-10" />
          <div className="h-9 w-9 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl flex items-center justify-center border border-emerald-100/80 shadow-sm relative z-10">
            <img src="/images/logo_kkn.png" alt="Logo" className="h-5 w-5 object-contain" />
          </div>
          <div className="relative z-10">
            <h1 className="text-sm font-semibold text-black  tracking-tight">KKN UIN SAIZU</h1>
            <p className="text-xs font-bold text-emerald-600  tracking-normal mt-0.5">
              Portal Administrasi
            </p>
          </div>
        </div>

        {/* NAVIGATION LAYER */}
        <nav className="flex-1 overflow-y-auto px-5 py-8 space-y-8 scrollbar-hide relative z-10">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 mb-3 text-[12px] font-semibold text-emerald-950  tracking-normal">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    currentPath === item.href ||
                    (item.href !== safeRoute('admin.dashboard') &&
                      currentPath.startsWith(item.href));
                  const isValidHref = item.href && item.href !== '#';
                  return (
                    <Link
                      key={item.href}
                      href={isValidHref ? item.href : '#'}
                      method={isValidHref ? 'get' : undefined}
                      onClick={(e) => {
                        if (!isValidHref) {
                          e.preventDefault();
                        }
                        if (isValidHref && window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group',
                        isActive
                          ? 'bg-gradient-to-r from-emerald-50/80 to-transparent shadow-[inset_3px_0_0_0_rgba(16,185,129,1)] font-bold'
                          : 'text-black hover:bg-emerald-50/50 font-medium',
                      )}
                    >
                      <item.icon
                        className={clsx(
                          'h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110',
                          isActive
                            ? 'text-emerald-600'
                            : 'text-emerald-950 group-hover:text-emerald-600',
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span
                        className={clsx(
                          'transition-colors',
                          isActive ? 'text-emerald-950' : 'text-black group-hover:text-emerald-900',
                        )}
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* USER PROFILE SECTION LUXURY */}
        <div className="p-5 border-t border-emerald-100/50 bg-gradient-to-t from-white to-transparent relative z-10">
          <Link
            href={safeRoute('profile.show')}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-emerald-100/60 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300 group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300 border border-emerald-100/50">
              <UserCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-black tracking-tight">
                Pengaturan Profil
              </span>
              <span className="text-[12px] font-bold text-emerald-950  tracking-wider mt-0.5">
                Akun & Sistem
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
