import { Link, usePage } from '@inertiajs/react';
import { useLayoutEffect, useRef } from 'react';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';
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
  Settings,
  History,
  CheckCircle2,
  AlertCircle,
  Activity,
  Building2
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
    return route(name, params);
  } catch (_e) {
    return '#';
  }
};

const getAdminNav = (): NavGroup[] => [
  {
    title: 'Menu Utama',
    items: [
      { label: 'Beranda Utama', href: safeRoute('admin.dashboard'), icon: LayoutDashboard },
    ],
  },
  {
    title: 'Data Master',
    items: [
      { label: 'Tahun Akademik', href: safeRoute('admin.tahun-akademik.index'), icon: Calendar },
      { label: 'Periode Program', href: safeRoute('admin.periode.index'), icon: History },
      { label: 'Kategori KKN', href: safeRoute('admin.jenis-kkn.index'), icon: Layers },
      { label: 'Daftar Fakultas', href: safeRoute('admin.fakultas.index'), icon: Building2 },
      { label: 'Program Studi', href: safeRoute('admin.prodi.index'), icon: BookOpen },
      { label: 'Wilayah Penugasan', href: safeRoute('admin.lokasi.index'), icon: MapPin },
      { label: 'Direktori Mahasiswa', href: safeRoute('admin.mahasiswa.index'), icon: Users },
      { label: 'Syarat Pendaftaran', href: safeRoute('admin.kkn-requirements.index'), icon: ClipboardList },
      { label: 'Kelayakan Peserta', href: safeRoute('admin.cek-kelayakan.index'), icon: CheckCircle2 },
      { label: 'Dispensasi KKN', href: safeRoute('admin.dispensasi.index'), icon: AlertCircle },
    ],
  },
  {
    title: 'Operasional',
    items: [
      { label: 'Pendaftaran Peserta', href: safeRoute('admin.pendaftaran.index'), icon: ClipboardList },
      { label: 'Kelompok KKN', href: safeRoute('admin.kelompok.index'), icon: Users },
      { label: 'Penugasan DPL', href: safeRoute('admin.dpl.penugasan'), icon: Hammer },
      { label: 'Mutasi Peserta', href: safeRoute('admin.peserta.pindah.index'), icon: Shuffle },
      { label: 'Kontrol Pengguna', href: safeRoute('admin.pengguna.index'), icon: ShieldCheck },
      { label: 'Sinkronisasi DPL', href: safeRoute('admin.dpl.sync'), icon: RefreshCw },
    ],
  },
  {
    title: 'Monitoring & Nilai',
    items: [
      { label: 'Logbook Mahasiswa', href: safeRoute('admin.laporan.harian.index'), icon: FileText },
      { label: 'Program Kerja', href: safeRoute('admin.laporan.program-kerja.index'), icon: BookOpen },
      { label: 'Evaluasi & Nilai', href: safeRoute('admin.evaluasi.index'), icon: BarChart3 },
      { label: 'Rekapitulasi Nilai', href: safeRoute('admin.grade-reports.index'), icon: Award },
    ],
  },
  {
    title: 'Konten & Portal',
    items: [
      { label: 'Profil LPPM', href: safeRoute('admin.konten.profil.index'), icon: Globe },
      { label: 'Warta Utama', href: safeRoute('admin.warta-utama.index'), icon: Megaphone },
      { label: 'Repositori Berkas', href: safeRoute('admin.unduhan.index'), icon: Inbox },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { label: 'Konfigurasi Sistem', href: safeRoute('admin.pengaturan.sistem'), icon: Settings },
    ],
  },
];

const getDplNav = (): NavGroup[] => [
  {
    title: 'DPL Dashboard',
    items: [
      { label: 'Beranda DPL', href: safeRoute('dpl.dashboard'), icon: LayoutDashboard },
      { label: 'Daftar Kelompok', href: safeRoute('dpl.kelompok.index'), icon: Users },
    ],
  },
  {
    title: 'Bimbingan Lapangan',
    items: [
      { label: 'Laporan Harian', href: safeRoute('dpl.daily-reports.index'), icon: FileText },
      { label: 'Monitoring Status', href: safeRoute('dpl.monitoring.index'), icon: Activity },
    ],
  },
  {
    title: 'Penilaian',
    items: [
      { label: 'Laporan Akhir', href: safeRoute('dpl.final-reports.index'), icon: FileText },
      { label: 'Input Evaluasi', href: safeRoute('dpl.evaluations.index'), icon: Star },
    ],
  },
];

const getFacultyAdminNav = (): NavGroup[] => [
  {
    title: 'Fakultas',
    items: [
      { label: 'Beranda Utama', href: safeRoute('admin.dashboard'), icon: LayoutDashboard },
      { label: 'Rekapitulasi Nilai', href: safeRoute('admin.grade-reports.index'), icon: Award },
    ],
  },
];

function buildStudentNav(currentPhase: string): NavGroup[] {
  const isRegistration = currentPhase === 'registration';
  const isExecutionOrLater = ['execution', 'grading', 'finished'].includes(currentPhase);
  const isGradingOrLater = ['grading', 'finished'].includes(currentPhase);

  return [
    {
      title: 'Menu Mahasiswa',
      items: [
        { label: 'Beranda Utama', href: safeRoute('student.dashboard'), icon: LayoutDashboard },
        ...(isRegistration
          ? [
              {
                label: 'Daftar KKN',
                href: safeRoute('student.registration.create'),
                icon: ClipboardList,
              },
            ]
          : []),
      ],
    },
    ...(isExecutionOrLater
      ? [
          {
            title: 'Kegiatan Lapangan',
            items: [
              { label: 'Data Posko', href: safeRoute('student.posko.index'), icon: MapPin },
              { label: 'Logbook Harian', href: safeRoute('student.laporan-harian.index'), icon: FileText },
              { label: 'Program Kerja', href: safeRoute('student.program-kerja.index'), icon: BookOpen },
            ],
          },
        ]
      : []),
    ...(isGradingOrLater
      ? [
          {
            title: 'Hasil Akhir',
            items: [
              { label: 'Laporan Akhir', href: safeRoute('student.laporan-akhir.index'), icon: FileText },
              { label: 'Sertifikat KKN', href: safeRoute('student.certificate.index'), icon: Award },
            ],
          },
        ]
      : []),
  ];
}

function getNavForRole(roles: string[], currentPhase: string): NavGroup[] {
  const norm = roles.map((r) => r.toLowerCase());
  if (norm.includes('admin') || norm.includes('superadmin')) return getAdminNav();
  if (norm.includes('faculty_admin')) return getFacultyAdminNav();
  if (norm.includes('dpl') || norm.includes('dosen')) return getDplNav();
  return buildStudentNav(currentPhase);
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const SIDEBAR_SCROLL_KEY = 'kkn-saizu-sidebar-scroll';

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { auth, url } = usePage<PageProps & { url: string }>().props;

  const rawRoles = auth.user?.roles ?? [];
  const roles = Array.isArray(rawRoles)
    ? rawRoles.map((r) =>
        typeof r === 'object' && r !== null ? (r as { name: string }).name : String(r),
      )
    : [];
  const currentPhase = (usePage<PageProps>().props.auth as Record<string, unknown>)?.active_phase ?? 'upcoming';

  const navGroups = getNavForRole(roles, currentPhase);
  const currentPath = typeof url === 'string' ? url : window.location.pathname;
  const navRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const savedScrollTop = window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    nav.scrollTop = savedScrollTop ? Number(savedScrollTop) : 0;
  }, [currentPath]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-emerald-950/10 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-slate-200 transition-all duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* --- BRANDING --- */}
        <Link href={safeRoute('admin.dashboard')} className="h-20 px-6 flex items-center gap-3 border-b border-slate-50 bg-white group">
          <div className="h-10 w-10 flex items-center justify-center p-1 bg-white group-hover:scale-110 transition-transform">
            <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-emerald-700 leading-none group-hover:text-emerald-800 transition-colors">KKN UIN SAIZU</span>
            <span className="text-[11px] font-medium text-emerald-400 mt-1">Panel Kontrol</span>
          </div>
        </Link>

        {/* --- NAVIGATION --- */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto py-5 px-4 space-y-6 scrollbar-hide"
        >
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 pb-1 text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentPath === item.href || (item.href !== safeRoute('admin.dashboard') && currentPath.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => window.innerWidth < 1024 && onClose()}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all group relative',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                      )}
                    >
                      {isActive && (
                          <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-full" />
                      )}
                      <item.icon className={clsx('w-[18px] h-[18px] transition-colors', isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600')} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* --- PROFILE FOOTER --- */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/30">
          <Link
            href={safeRoute('profile.show')}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white transition-all group"
          >
            <div className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-600">
              <UserCircle size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-900 uppercase">Profil Saya</span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
