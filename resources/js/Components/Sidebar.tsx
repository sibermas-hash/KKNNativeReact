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
    FolderKanban,
    Cpu,
    BarChart3,
    ShieldCheck,
    Award,
    Hammer,
    RefreshCw,
    Shuffle,
    FileSpreadsheet, 
    Image as ImageIcon,
    SlidersHorizontal,
    GraduationCap,
    Globe,
    Download,
    Megaphone,
    Presentation,
    Layers,
    CalendarOff,
    Activity,
    Eye,
    UserCircle,
    Fingerprint,
    Command,
    Terminal,
    ChevronRight,
    Search,
    Inbox
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

const safeRoute = (name: string, params?: any) => {
    try {
        return route(name, params);
    } catch (e) {
        return '#';
    }
};

const getAdminNav = (): NavGroup[] => [
    {
        title: 'Core Engine',
        items: [
            { label: 'Dashboard Utama', href: safeRoute('admin.dashboard'), icon: LayoutDashboard },
        ],
    },
    {
        title: 'Master Matrix',
        items: [
            { label: 'Timeline Akademik', href: safeRoute('admin.tahun-akademik.index'), icon: Calendar },
            { label: 'Windows Periode', href: safeRoute('admin.periode.index'), icon: Activity },
            { label: 'Skema KKN', href: safeRoute('admin.jenis-kkn.index'), icon: Layers },
            { label: 'Database Lokasi', href: safeRoute('admin.lokasi.index'), icon: MapPin },
            { label: 'Sinkronisasi DPL', href: safeRoute('admin.dpl.sync'), icon: RefreshCw },
            { label: 'Dossier Mahasiswa', href: safeRoute('admin.mahasiswa.index'), icon: FolderKanban },
            { label: 'Eligibility Check', href: safeRoute('admin.cek-kelayakan.index'), icon: ShieldCheck },
            { label: 'Dispensasi KKN', href: safeRoute('admin.dispensasi.index'), icon: Award },
        ],
    },
    {
        title: 'Operations',
        items: [
            { label: 'Registrasi Berkas', href: safeRoute('admin.pendaftaran.index'), icon: ClipboardList },
            { label: 'Kelompok Matrix', href: safeRoute('admin.kelompok.index'), icon: Users },
            { label: 'Penugasan DPL', href: safeRoute('admin.dpl.penugasan'), icon: Hammer },
            { label: 'Mutasi Peserta', href: safeRoute('admin.peserta.pindah.index'), icon: Shuffle },
            { label: 'Security & Akses', href: safeRoute('admin.pengguna.index'), icon: Fingerprint },
        ],
    },
    {
        title: 'Audit & Analysis',
        items: [
            { label: 'Logbook Harian', href: safeRoute('admin.laporan.harian.index'), icon: FileText },
            { label: 'Progam Kerja', href: safeRoute('admin.laporan.program-kerja.index'), icon: Presentation },
            { label: 'Activity Audit', href: safeRoute('admin.activity-audit.index'), icon: Cpu },
            { label: 'Evaluasi & Nilai', href: safeRoute('admin.evaluasi.index'), icon: BarChart3 },
            { label: 'Official Grades', href: safeRoute('admin.grade-reports.index'), icon: Award },
        ],
    },
    {
        title: 'Deployment Konten',
        items: [
            { label: 'Profil LPPM', href: safeRoute('admin.konten.profil.index'), icon: Globe },
            { label: 'Warta Utama', href: safeRoute('admin.warta-utama.index'), icon: Megaphone },
            { label: 'Repository', href: safeRoute('admin.unduhan.index'), icon: Inbox },
        ],
    },
    {
        title: 'System Config',
        items: [
            { label: 'Requirement Matrix', href: safeRoute('admin.kkn-requirements.index'), icon: SlidersHorizontal },
            { label: 'API & Parameters', href: safeRoute('admin.pengaturan.sistem'), icon: Terminal },
        ],
    },
];

const getDplNav = (): NavGroup[] => [
    {
        title: 'DPL Matrix',
        items: [
            { label: 'Dashboard DPL', href: safeRoute('dpl.dashboard'), icon: LayoutDashboard },
            { label: 'Platoon Saya', href: safeRoute('dpl.kelompok.index'), icon: Users },
        ],
    },
    {
        title: 'Field Oversight',
        items: [
            { label: 'Logbook Harian', href: safeRoute('dpl.daily-reports.index'), icon: FileText },
            { label: 'Izin Keluar/Masuk', href: safeRoute('dpl.izin.index'), icon: CalendarOff },
            { label: 'Monitoring Status', href: safeRoute('dpl.monitoring.index'), icon: Activity },
        ],
    },
    {
        title: 'Grading Engine',
        items: [
            { label: 'Laporan Akhir', href: safeRoute('dpl.final-reports.index'), icon: FileText },
            { label: 'Submit Evaluasi', href: safeRoute('dpl.evaluations.index'), icon: Star },
        ],
    },
];

const getFacultyAdminNav = (): NavGroup[] => [
    {
        title: 'Faculty Hub',
        items: [
            { label: 'Overview Dasbor', href: safeRoute('admin.dashboard'), icon: LayoutDashboard },
            { label: 'Reports & Grades', href: safeRoute('admin.grade-reports.index'), icon: Award },
        ],
    },
];

function buildStudentNav(currentPhase: string): NavGroup[] {
    const isRegistration = currentPhase === 'registration';
    const isExecutionOrLater = ['execution', 'grading', 'finished'].includes(currentPhase);
    const isGradingOrLater = ['grading', 'finished'].includes(currentPhase);

    return [
        {
            title: 'Personal Unit',
            items: [
                { label: 'HQ Dashboard', href: safeRoute('student.dashboard'), icon: LayoutDashboard },
                ...(isRegistration ? [{ label: 'Apply KKN', href: safeRoute('student.registration.create'), icon: ClipboardList }] : []),
            ],
        },
        ...(isExecutionOrLater ? [{
            title: 'Operation Field',
            items: [
                { label: 'Base Camp (Posko)', href: safeRoute('student.posko.index'), icon: MapPin },
                { label: 'Logbook Harian', href: safeRoute('student.laporan-harian.index'), icon: Activity },
                { label: 'Permission/Izin', href: safeRoute('student.izin.index'), icon: CalendarOff },
                { label: 'Work Program', href: safeRoute('student.program-kerja.index'), icon: Presentation },
                { label: 'Village Media', href: safeRoute('student.poster.index'), icon: ImageIcon },
            ],
        }] : []),
        ...(isGradingOrLater ? [{
            title: 'Results & Certification',
            items: [
                { label: 'Final Dossier', href: safeRoute('student.laporan-akhir.index'), icon: FileText },
                { label: 'Service Certificate', href: safeRoute('student.certificate.index'), icon: Award },
            ],
        }] : []),
    ];
}

function getNavForRole(roles: string[], currentPhase: string): NavGroup[] {
    const norm = roles.map(r => r.toLowerCase());
    if (norm.includes('admin') || norm.includes('superadmin')) return getAdminNav();
    if (norm.includes('faculty_admin')) return getFacultyAdminNav();
    if (norm.includes('dpl') || norm.includes('dosen')) return getDplNav();
    return buildStudentNav(currentPhase);
}

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const SIDEBAR_SCROLL_KEY = 'kkn-command-sidebar-scroll';

export default function Sidebar({ open, onClose }: SidebarProps) {
    const { auth, url } = usePage<PageProps & { url: string }>().props;

    const rawRoles = auth.user?.roles ?? [];
    const roles = Array.isArray(rawRoles)
        ? rawRoles.map(r => typeof r === 'object' && r !== null ? (r as { name: string }).name : String(r))
        : [];
    const currentPhase = (usePage<PageProps>().props as any).auth?.active_phase ?? 'upcoming';

    const navGroups = getNavForRole(roles, currentPhase);
    const currentPath = typeof url === 'string' ? url : window.location.pathname;
    const navRef = useRef<HTMLElement | null>(null);

    useLayoutEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const savedScrollTop = window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
        nav.scrollTop = savedScrollTop ? Number(savedScrollTop) : 0;

        const persist = () => window.sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
        nav.addEventListener('scroll', persist);
        return () => nav.removeEventListener('scroll', persist);
    }, [currentPath]);

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white border-r border-white/5 transition-all duration-500 lg:translate-x-0 shadow-2xl shadow-slate-900/50",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* --- BRANDING ENGINE --- */}
                <div className="h-24 px-8 flex items-center gap-4 border-b border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-24 bg-emerald-500 opacity-0 group-hover:opacity-10 skew-x-12 translate-x-12 transition-all duration-700" />
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl shadow-white/10 ring-4 ring-white/5">
                        <img src="/images/logo_kkn.png" alt="Logo KKN" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tighter uppercase leading-none">UIN SAIZU</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-1.5">Command Center</span>
                    </div>
                </div>

                {/* --- NAVIGATION MATRIX --- */}
                <nav ref={navRef} className="flex-1 overflow-y-auto pt-10 pb-20 px-6 scrollbar-hide space-y-12">
                    {/* Operation Status */}
                    <div className="px-2">
                         <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900">
                                    <Command size={16} strokeWidth={3} />
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">{auth.user?.name}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{roles[0] || 'Member'}</p>
                            </div>
                         </div>
                    </div>

                    {navGroups.map((group, gIndex) => (
                        <div key={group.title} className="space-y-4">
                            <h3 className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none mb-6">
                                {group.title}
                            </h3>
                            <motion.div 
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: { transition: { staggerChildren: 0.05, delayChildren: gIndex * 0.1 } }
                                }}
                                className="space-y-1"
                            >
                                {group.items.map((item) => {
                                    const isActive = currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href));
                                    return (
                                        <motion.div key={item.href} variants={itemVariants}>
                                            <Link
                                                href={item.href}
                                                onClick={() => window.innerWidth < 1024 && onClose()}
                                                className={clsx(
                                                    "flex items-center gap-3 px-5 py-3 rounded-2xl text-[11px] font-black transition-all group/link relative overflow-hidden uppercase tracking-widest",
                                                    isActive
                                                        ? "bg-white text-slate-900 shadow-2xl shadow-white/5"
                                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <item.icon 
                                                    className={clsx("w-4 h-4", isActive ? "text-slate-900" : "text-slate-600 group-hover/link:text-emerald-400 transition-colors")} 
                                                    strokeWidth={2.5} 
                                                />
                                                <span className="flex-1 truncate">{item.label}</span>
                                                {isActive && (
                                                    <motion.div layoutId="activeDot" className="h-1 w-1 bg-slate-900 rounded-full" />
                                                )}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </div>
                    ))}

                    {/* Operational Tip */}
                    <div className="px-2 pt-10">
                         <div className="p-6 rounded-[2rem] bg-emerald-600/10 border border-emerald-500/10 space-y-4 relative overflow-hidden group/tip">
                            <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-emerald-500/10 rounded-full blur-xl group-hover/tip:scale-150 transition-transform duration-700" />
                            <div className="flex items-center gap-3 text-emerald-500">
                                <ShieldCheck size={18} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Security Active</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                                Sesi anda aman dan diaudit oleh sistem integritas LPPM.
                            </p>
                         </div>
                    </div>
                </nav>

                <div className="p-8 border-t border-white/5 flex items-center justify-between">
                     <Link 
                        href="/profil-saya" 
                        className="h-10 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center gap-2 group/profile"
                     >
                        <UserCircle size={16} className="group-hover/profile:text-emerald-400 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
                     </Link>
                     <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
            </aside>
        </>
    );
}
