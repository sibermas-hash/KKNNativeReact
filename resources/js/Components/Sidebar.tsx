import { useRef } from 'react';
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
  BookOpen,
  Activity,
  History,
  Cpu,
  UserCheck,
  FileCheck,
  GraduationCap,
  Settings,
  UserCog,
  MessageSquareQuote,
  Globe,
  Terminal,
  Newspaper,
  Download
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
  } catch {
    return '#';
  }
};

// ── CONTEXTUAL NAVIGATION DEFINITIONS ────────────────────────────────

// 1. OPERATIONAL CONTEXT (DASHBOARD ADMIN)
const getOperationsNav = (): NavGroup[] => [
  {
    title: 'SENTRAL OPERASIONAL',
    items: [{ label: 'Statistik KKN', href: safeRoute('admin.dashboard'), icon: LayoutDashboard }],
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
    title: 'MANAJEMEN PESERTA',
    items: [
      { label: 'Audit Kelayakan', href: safeRoute('admin.cek-kelayakan.index'), icon: ShieldCheck },
      { label: 'Registrasi Mahasiswa', href: safeRoute('admin.pendaftaran.index'), icon: ClipboardList },
      { label: 'Direktori Mahasiswa', href: safeRoute('admin.mahasiswa.index'), icon: Users },
      { label: 'Direktori Dosen', href: safeRoute('admin.dpl.index'), icon: UserCheck },
    ],
  },
  {
    title: 'PENEMPATAN & MONITORING',
    items: [
      { label: 'Manajemen Kelompok', href: safeRoute('admin.kelompok.index'), icon: Users },
      { label: 'Penugasan DPL', href: safeRoute('admin.dpl.penugasan'), icon: MapPin },
      { label: 'Wilayah Penugasan', href: safeRoute('admin.locations.index'), icon: MapPin },
      { label: 'Laporan Harian', href: safeRoute('admin.laporan.harian.index'), icon: Activity },
      { label: 'Program Kerja', href: safeRoute('admin.laporan.program-kerja.index'), icon: BookOpen },
    ],
  },
  {
    title: 'PENILAIAN & OUTPUT',
    items: [
      { label: 'Laporan Akhir', href: safeRoute('admin.laporan.akhir.index'), icon: FileCheck },
      { label: 'Input Nilai', href: safeRoute('admin.nilai.index'), icon: FileText },
      { label: 'Rekapitulasi Nilai', href: safeRoute('admin.grade-reports.index'), icon: BarChart3 },
      { label: 'Yudisium', href: safeRoute('admin.yudisium.index'), icon: GraduationCap },
    ],
  },
];

// 2. BLOG/CONTENT CONTEXT (DASHBOARD BLOG)
const getBlogNav = (): NavGroup[] => [
  {
    title: 'MANAJEMEN KONTEN',
    items: [
      { label: 'Warta Utama', href: safeRoute('admin.warta-utama.index'), icon: Newspaper },
      { label: 'Pusat Unduhan', href: safeRoute('admin.unduhan.index'), icon: Download },
    ],
  },
  {
    title: 'INFORMASI LEMBAGA',
    items: [
      { label: 'Profil Lembaga', href: safeRoute('admin.konten.profil.index'), icon: Globe },
      { label: 'Skema KKN Publik', href: safeRoute('admin.konten.skema.index'), icon: Layers },
    ],
  },
];

// 3. SYSTEM/API CONTEXT (PENGATURAN SISTEM)
const getSystemNav = (): NavGroup[] => [
  {
    title: 'INTELIJEN & SYNC',
    items: [
      { label: 'Intelijen Sistem', href: safeRoute('admin.audit-log.index'), icon: Terminal },
      { label: 'Sinkronisasi Master', href: safeRoute('admin.database-sync.index'), icon: RefreshCw },
    ],
  },
  {
    title: 'KONFIGURASI GLOBAL',
    items: [
      { label: 'Manajemen Pengguna', href: safeRoute('admin.pengguna.index'), icon: UserCog },
      { label: 'Pengaturan Global', href: safeRoute('admin.pengaturan.sistem'), icon: Cpu },
      { label: 'Skema Penilaian', href: safeRoute('admin.konfigurasi-penilaian.index'), icon: Settings },
      { label: 'Template Sertifikat', href: safeRoute('admin.pengaturan.sertifikat.index'), icon: Award },
    ],
  },
];

// 4. OTHER ROLES
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
        ...(!isApproved ? [{ label: 'Daftar KKN', href: '/mahasiswa/daftar', icon: ClipboardList }] : []),
        ...(isApproved || isExecutionOrLater ? [
          { label: 'Logbook Masuk', href: safeRoute('student.laporan-harian.index'), icon: FileText },
          { label: 'Target Proker', href: safeRoute('student.program-kerja.index'), icon: BookOpen },
        ] : []),
        ...(isGradingOrLater ? [
          { label: 'Evaluasi DPL', href: safeRoute('student.evaluasi-dpl.index'), icon: MessageSquareQuote },
          { label: 'Sertifikat KKN', href: safeRoute('student.certificate.index'), icon: Award },
          { label: 'Sertifikat Workshop', href: safeRoute('student.workshops.my-certificates'), icon: GraduationCap },
        ] : []),
      ],
    },
  ];
}

// ── SIDEBAR COMPONENT ────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { props, url } = usePage<PageProps & { url: string }>();
  const { auth } = props;

  const roles = (auth.user?.roles as any[])?.map((r) => (typeof r === 'string' ? r : (r as any).name)) || [];
  const currentPhase = (auth as any)?.active_phase ?? 'upcoming';
  const registrationStatus = (auth as any)?.user?.student_registration_status ?? 'none';
  const currentPath = url;

  // CONTEXT DETECTION LOGIC
  const getNavContext = () => {
    const isAdmin = roles.some(r => ['admin', 'superadmin', 'faculty_admin'].includes(r.toLowerCase()));
    if (!isAdmin) {
      const norm = roles.map((r) => r.toLowerCase());
      if (norm.includes('dosen') || norm.includes('dpl')) return getDosenNav(norm.includes('dpl'));
      return buildStudentNav(currentPhase, registrationStatus);
    }

    // Admin Contextual Logic
    if (currentPath.includes('/admin/warta') || 
        currentPath.includes('/admin/unduhan') || 
        currentPath.includes('/admin/konten-publik')) {
      return getBlogNav();
    }

    if (currentPath.includes('/admin/audit-log') || 
        currentPath.includes('/admin/database-sync') || 
        currentPath.includes('/admin/pengaturan') || 
        currentPath.includes('/admin/pengguna') ||
        currentPath.includes('/admin/konfigurasi-penilaian')) {
      return getSystemNav();
    }

    return getOperationsNav();
  };

  const navGroups = getNavContext();
  const navRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    sessionStorage.setItem('sidebar-scroll', e.currentTarget.scrollTop.toString());
  };

  const isBlogContext = currentPath.includes('/admin/warta') || currentPath.includes('/admin/unduhan') || currentPath.includes('/admin/konten-publik');
  const isSystemContext = currentPath.includes('/admin/audit-log') || currentPath.includes('/admin/database-sync') || currentPath.includes('/admin/pengaturan') || currentPath.includes('/admin/pengguna');

  return (
    <>
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
        {/* LOGO AREA */}
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
              {isBlogContext ? 'CONTENT HUB' : isSystemContext ? 'SYSTEM REGISTRY' : (
                <span><span className="text-sky-600">SIBER</span><span className="text-emerald-600">MAS</span></span>
              )}
              <span className={clsx("h-1.5 w-1.5 rounded-full animate-pulse", isBlogContext ? 'bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.5)]' : isSystemContext ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]')} />
            </h1>
            <p className="text-[9px] font-bold text-slate-600 mt-2 font-sans tracking-wider leading-relaxed uppercase">
               {isBlogContext ? 'Eksistensi Digital' : isSystemContext ? 'Infrastruktur Data' : 'Otomasi Operasional'}
            </p>
          </div>
        </div>

        {/* NAVIGATION AREA */}
        <nav
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide scroll-smooth"
        >
          {navGroups.map((group, index) => (
            <div key={group.title} className={clsx("space-y-2", index > 0 && "mt-4")}>
              {index > 0 && (
                <div className="h-[2px] w-[80%] bg-cyan-300/80 shadow-[0_2px_4px_rgba(6,182,212,0.4)] mb-3 ml-2 rounded-full" />
              )}
              <h3 className="px-4 text-[10px] font-black text-slate-800 uppercase tracking-widest font-sans">
                {group.title}
              </h3>
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const getPath = (href: string) => {
                    try { return new URL(href, window.location.origin).pathname; } 
                    catch { return href; }
                  };
                  const isActive = currentPath.split('?')[0] === getPath(item.href);
                  const isValidHref = item.href && item.href !== '#';

                  return (
                    <Link
                      key={item.href}
                      href={isValidHref ? item.href : '#'}
                      preserveScroll
                      onClick={(e) => {
                        if (!isValidHref) e.preventDefault();
                        if (isValidHref && window.innerWidth < 1024) onClose();
                      }}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden',
                        isActive
                          ? 'bg-white text-cyan-900 font-bold shadow-sm border border-cyan-100 shadow-[inset_3px_0_0_0_rgba(245,158,11,1)]'
                          : 'text-slate-600 hover:text-cyan-900 hover:bg-cyan-50/50',
                      )}
                    >
                      <item.icon
                        className={clsx(
                          'h-5 w-5 shrink-0 transition-colors z-10',
                          isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-cyan-500',
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="truncate font-display font-black uppercase tracking-tight text-[11px]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* HUB SWITCHER */}
        <div className="px-4 py-2 border-t border-emerald-50 bg-white/30 backdrop-blur-sm">
          <Link
            href={safeRoute('admin.hub')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black text-slate-700 uppercase tracking-widest hover:bg-white hover:text-cyan-700 transition-all group border border-transparent hover:border-cyan-100"
          >
            <Shuffle className="h-4 w-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
            Kembali ke Hub Utama
          </Link>
        </div>

        {/* PROFILE */}
        <div className="p-4">
          <Link
            href={safeRoute('profile.show')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-inner group-hover:rotate-6 transition-transform">
               <span className="text-xs font-black uppercase">{auth.user.name.substring(0, 2)}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-cyan-950 truncate leading-none mb-1 font-display">{auth.user.name}</span>
              <span className="text-[9px] font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1 font-sans">
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
