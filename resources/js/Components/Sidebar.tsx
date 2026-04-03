import { Link, usePage } from '@inertiajs/react';
import { useLayoutEffect, useRef } from 'react';
import type { PageProps } from '@/types';
import {
    LayoutDashboard,
    Calendar,
    GraduationCap,
    MapPin,
    Users2,
    Users,
    ClipboardList,
    FileText,
    Star,
    FolderKanban,
    BarChart3,
    ShieldCheck,
    Award,
    Hammer,
    UserCircle,
    RefreshCw,
    Shuffle,
    FileSpreadsheet,
    SlidersHorizontal
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const adminNav: NavGroup[] = [
    {
        title: 'Utama',
        items: [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Data Master',
        items: [
            { label: 'Tahun Akademik', href: '/admin/academic-years', icon: Calendar },
            { label: 'Periode KKN', href: '/admin/periods', icon: Calendar },
            { label: 'Lokasi KKN', href: '/admin/locations', icon: MapPin },
            { label: 'Dosen (DPL)', href: '/admin/dpl', icon: Users },
            { label: 'Mahasiswa', href: '/admin/mahasiswa', icon: GraduationCap },
        ],
    },
    {
        title: 'Operasional',
        items: [
            { label: 'Kelompok', href: '/admin/groups', icon: Users2 },
            { label: 'Penugasan DPL', href: '/admin/dpl/assignment', icon: Users },
            { label: 'Transfer Peserta', href: '/admin/peserta/transfer', icon: Shuffle },
            { label: 'Pengguna', href: '/admin/users', icon: Users },
            { label: 'Pendaftaran', href: '/admin/registrations', icon: ClipboardList },
        ],
    },
    {
        title: 'Integrasi',
        items: [
            { label: 'Sinkronisasi Mahasiswa', href: '/admin/mahasiswa/sync', icon: RefreshCw },
            { label: 'Sinkronisasi DPL', href: '/admin/dpl/sync', icon: RefreshCw },
        ],
    },
    {
        title: 'Aktivitas & Laporan',
        items: [
            { label: 'Pusat Laporan', href: '/admin/reports', icon: FileText },
            { label: 'Laporan Harian', href: '/admin/reports/daily', icon: FileText },
            { label: 'Proker', href: '/admin/reports/work-programs', icon: FolderKanban },
            { label: 'Laporan Akhir', href: '/admin/reports/final', icon: FileText },
            { label: 'Evaluasi & Nilai', href: '/admin/evaluations', icon: BarChart3 },
            { label: 'Generator Nilai', href: '/admin/grade-generator', icon: FileSpreadsheet },
            { label: 'Rekap Nilai', href: '/admin/rekap-nilai', icon: Award },
            { label: 'Input Nilai Manual', href: '/admin/grades', icon: BarChart3 },
            { label: 'Workshop', href: '/admin/workshops', icon: Calendar },
            { label: 'Log Audit', href: '/admin/audit-log', icon: ShieldCheck },
        ],
    },
    {
        title: 'Pengaturan',
        items: [
            { label: 'Sistem Nilai', href: '/admin/grading-settings', icon: Hammer },
            { label: 'Sertifikat', href: '/admin/settings/certificate', icon: Award },
            { label: 'Pengaturan Sistem', href: '/admin/settings/system', icon: SlidersHorizontal },
        ],
    },
];

const dplNav: NavGroup[] = [
    {
        title: 'Dashboard',
        items: [
            { label: 'Beranda DPL', href: '/dpl', icon: LayoutDashboard },
            { label: 'Kelompok Saya', href: '/dpl/groups', icon: Users2 },
        ],
    },
    {
        title: 'Kegiatan Bimbingan',
        items: [
            { label: 'Laporan Harian', href: '/dpl/daily-reports', icon: FileText },
            { label: 'Evaluasi Mahasiswa', href: '/dpl/evaluations', icon: Star },
            { label: 'Generator Nilai', href: '/admin/grade-generator', icon: FileSpreadsheet },
        ],
    },
];

const facultyAdminNav: NavGroup[] = [
    {
        title: 'Manajemen Fakultas',
        items: [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { label: 'Mahasiswa', href: '/admin/mahasiswa', icon: GraduationCap },
            { label: 'Kelompok', href: '/admin/groups', icon: Users2 },
        ],
    },
    {
        title: 'Monitoring Lapangan',
        items: [
            { label: 'Laporan Harian', href: '/admin/reports/daily', icon: FileText },
            { label: 'Program Kerja', href: '/admin/reports/work-programs', icon: FolderKanban },
        ],
    },
    {
        title: 'Hasil & Evaluasi',
        items: [
            { label: 'Evaluasi & Nilai', href: '/admin/evaluations', icon: BarChart3 },
            { label: 'Rekap Nilai', href: '/admin/rekap-nilai', icon: Award },
        ],
    },
];

const studentNav: NavGroup[] = [
    {
        title: 'Dashboard',
        items: [
            { label: 'Beranda Ku', href: '/student', icon: LayoutDashboard },
            { label: 'Pendaftaran', href: '/student/register', icon: ClipboardList },
        ],
    },
    {
        title: 'Kegiatan KKN',
        items: [
            { label: 'Posko Kelompok', href: '/student/posko', icon: MapPin },
            { label: 'Laporan Harian', href: '/student/daily-reports', icon: FileText },
            { label: 'Program Kerja', href: '/student/work-programs', icon: FolderKanban },
            { label: 'Laporan Akhir', href: '/student/final-report', icon: FileText },
            { label: 'Cek Nilai', href: '/student/evaluations', icon: Award },
        ],
    },
];

function getNavForRole(roles: string[]): NavGroup[] {
    const norm = roles.map(r => r.toLowerCase());
    if (norm.includes('superadmin')) return adminNav;
    if (norm.includes('faculty_admin')) return facultyAdminNav;
    if (norm.includes('dpl')) return dplNav;
    return studentNav;
}

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const SIDEBAR_SCROLL_KEY = 'kkn-sidebar-scroll-top';

export default function Sidebar({ open, onClose }: SidebarProps) {
    const { auth, url } = usePage<PageProps & { url: string }>().props;
    const roles = (auth.user?.roles as unknown as string[]) ?? [];
    const navGroups = getNavForRole(roles);
    const currentPath = typeof url === 'string' ? url : window.location.pathname;
    const navRef = useRef<HTMLElement | null>(null);

    useLayoutEffect(() => {
        const nav = navRef.current;

        if (!nav) {
            return;
        }

        const savedScrollTop = window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
        const targetScrollTop = savedScrollTop !== null ? Number(savedScrollTop) : 0;

        nav.scrollTop = targetScrollTop;

        const restoreOnNextFrame = window.requestAnimationFrame(() => {
            nav.scrollTop = targetScrollTop;
        });

        const persistScrollPosition = () => {
            window.sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
        };

        nav.addEventListener('scroll', persistScrollPosition);

        return () => {
            window.cancelAnimationFrame(restoreOnNextFrame);
            persistScrollPosition();
            nav.removeEventListener('scroll', persistScrollPosition);
        };
    }, [currentPath]);

    return (
        <>
            {/* Mobile Overlay */}
            {open && (
                <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm lg:hidden transition-opacity" onClick={onClose} />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-100 transition-transform duration-500 ease-in-out lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl shadow-slate-200' : '-translate-x-full'}`}>
                
                {/* LOGO AREA */}
                <div className="flex h-20 items-center gap-3 px-8 border-b border-slate-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 text-white">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-900 leading-none tracking-tight">UIN SAIZU</span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">SIM-KKN PORTAL</span>
                    </div>
                </div>

                {/* NAVIGATION AREA */}
                <nav
                    ref={navRef}
                    className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scrollbar-hide"
                >
                    {navGroups.map((group) => (
                        <div key={group.title} className="space-y-2">
                            <h3 className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => {
                                                if (navRef.current) {
                                                    window.sessionStorage.setItem(
                                                        SIDEBAR_SCROLL_KEY,
                                                        String(navRef.current.scrollTop),
                                                    );
                                                }

                                                if (window.innerWidth < 1024) {
                                                    onClose();
                                                }
                                            }}
                                            className={`group flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[13px] font-bold transition-all duration-300 ${
                                                isActive 
                                                ? 'bg-primary/10 text-primary-dark shadow-sm' 
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                            }`}
                                        >
                                            <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-slate-300 group-hover:text-primary/70'}`} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* USER CARD AREA */}
                <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                           <UserCircle className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-slate-900 truncate">{auth.user?.name}</span>
                            <Link href="/logout" method="post" as="button" className="text-[10px] font-bold text-red-400 hover:text-red-500 text-left uppercase tracking-wider">
                                Keluar Sesi
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
