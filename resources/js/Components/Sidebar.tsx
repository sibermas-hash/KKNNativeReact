import { Link, usePage } from '@inertiajs/react';
import { useLayoutEffect, useRef } from 'react';
import type { PageProps } from '@/types';
import {
    LayoutDashboard,
    Calendar,
    MapPin,
    Users2,
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
    SlidersHorizontal,
    GraduationCap,
    Globe,
    Download,
    Megaphone,
    LogOut,
    User,
    Presentation
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

const adminNav: NavGroup[] = [
    {
        title: 'Utama',
        items: [
            { label: 'Dasbor', href: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Data Master',
        items: [
            { label: 'Tahun Akademik', href: '/admin/tahun-akademik', icon: Calendar },
            { label: 'Periode KKN', href: '/admin/periode', icon: Calendar },
            { label: 'Lokasi KKN', href: '/admin/lokasi', icon: MapPin },
            { label: 'Dosen (DPL)', href: '/admin/dosen', icon: Users },
            { label: 'Mahasiswa', href: '/admin/mahasiswa', icon: GraduationCap },
            { label: 'Cek Eligibility', href: '/admin/cek-kelayakan', icon: ShieldCheck },
        ],
    },
    {
        title: 'Operasional',
        items: [
            { label: 'Kelompok', href: '/admin/kelompok', icon: Users2 },
            { label: 'Penugasan DPL', href: '/admin/dosen/penugasan', icon: Users },
            { label: 'Transfer Peserta', href: '/admin/peserta/pindah', icon: Shuffle },
            { label: 'Pengguna', href: '/admin/pengguna', icon: Users },
            { label: 'Pendaftaran', href: '/admin/pendaftaran', icon: ClipboardList },
        ],
    },
    {
        title: 'Integrasi',
        items: [
            { label: 'Sinkronisasi Mahasiswa', href: '/admin/mahasiswa/sinkron', icon: RefreshCw },
            { label: 'Sinkronisasi DPL', href: '/admin/dosen/sinkron', icon: RefreshCw },
        ],
    },
    {
        title: 'Laporan & Nilai',
        items: [
            { label: 'Laporan Harian', href: '/admin/laporan/harian', icon: FileText },
            { label: 'Program Kerja', href: '/admin/laporan/program-kerja', icon: FolderKanban },
            { label: 'Intelligence', href: '/admin/auditor-aktivitas', icon: Cpu },
            { label: 'Laporan Akhir', href: '/admin/laporan/akhir', icon: FileText },
            { label: 'Evaluasi & Nilai', href: '/admin/evaluasi', icon: BarChart3 },
            { label: 'Generator Nilai', href: '/admin/generator-nilai', icon: FileSpreadsheet },
            { label: 'Rekap Nilai', href: '/admin/grade-reports', icon: Award },
            { label: 'Input Nilai Manual', href: '/admin/nilai', icon: BarChart3 },
            { label: 'Log Audit', href: '/admin/audit-log', icon: ShieldCheck },
            { label: 'Seminar/Workshop', href: '/admin/workshop', icon: Presentation },
        ],
    },
    {
        title: 'Konten Publik',
        items: [
            { label: 'Profil LPPM', href: '/admin/konten-publik/profil', icon: Globe },
            { label: 'Skema KKN', href: '/admin/konten-publik/skema', icon: FolderKanban },
            { label: 'Warta Utama', href: '/admin/warta-utama', icon: Megaphone },
            { label: 'Repositori Berkas', href: '/admin/unduhan', icon: Download },
        ],
    },
    {
        title: 'Pengaturan',
        items: [
            { label: 'Konfigurasi Nilai', href: '/admin/konfigurasi-penilaian', icon: Hammer },
            { label: 'Sistem', href: '/admin/pengaturan/sistem', icon: SlidersHorizontal },
        ],
    },
];

const dplNav: NavGroup[] = [
    {
        title: 'Dasbor',
        items: [
            { label: 'Dasbor DPL', href: '/dpl', icon: LayoutDashboard },
            { label: 'Kelompok Saya', href: '/dpl/kelompok', icon: Users2 },
        ],
    },
    {
        title: 'Bimbingan',
        items: [
            { label: 'Laporan Harian', href: '/dpl/laporan-harian', icon: FileText },
            { label: 'Laporan Akhir', href: '/dpl/laporan-akhir', icon: FileText },
            { label: 'Evaluasi Mahasiswa', href: '/dpl/evaluasi', icon: Star },
        ],
    },
];

const facultyAdminNav: NavGroup[] = [
    {
        title: 'Utama',
        items: [
            { label: 'Dasbor', href: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Operasional',
        items: [
            { label: 'Rekap Nilai', href: '/admin/grade-reports', icon: Award },
        ],
    },
];

function buildStudentNav(isRegistrationLocked: boolean): NavGroup[] {
    return [
        {
            title: 'Utama',
            items: [
                { label: 'Dasbor Saya', href: '/mahasiswa', icon: LayoutDashboard },
                { label: 'Profil Saya', href: '/profil-saya', icon: User },
                ...(isRegistrationLocked ? [] : [{ label: 'Pendaftaran', href: '/mahasiswa/pendaftaran', icon: ClipboardList }]),
            ],
        },
        {
            title: 'Kegiatan KKN',
            items: [
                { label: 'Posko Kelompok', href: '/mahasiswa/posko', icon: MapPin },
                { label: 'Laporan Harian', href: '/mahasiswa/laporan-harian', icon: FileText },
                { label: 'Laporan Akhir', href: '/mahasiswa/laporan-akhir', icon: FileText },
                { label: 'Hasil Nilai', href: '/mahasiswa/evaluasi', icon: Award },
            ],
        },
    ];
}

function getNavForRole(roles: string[], isStudentRegistrationLocked: boolean): NavGroup[] {
    const norm = roles.map(r => r.toLowerCase());
    if (norm.includes('admin') || norm.includes('superadmin')) return adminNav;
    if (norm.includes('faculty_admin')) return facultyAdminNav;
    if (norm.includes('dpl') || norm.includes('dosen')) return dplNav;
    return buildStudentNav(isStudentRegistrationLocked);
}

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const SIDEBAR_SCROLL_KEY = 'kkn-sidebar-scroll-top';

interface RoleObject {
    name: string;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const { auth, url } = usePage<PageProps & { url: string }>().props;

    const rawRoles = auth.user?.roles ?? [];
    const roles = Array.isArray(rawRoles)
        ? rawRoles.map(r => typeof r === 'object' && r !== null ? (r as RoleObject).name : String(r))
        : [];
    const isStudentRegistrationLocked = !!auth.user?.student_registration_locked;

    const navGroups = getNavForRole(roles, isStudentRegistrationLocked);
    const currentPath = typeof url === 'string' ? url : window.location.pathname;
    const navRef = useRef<HTMLElement | null>(null);

    useLayoutEffect(() => {
        const nav = navRef.current;
        if (!nav) return;

        const savedScrollTop = window.sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
        const targetScrollTop = savedScrollTop !== null ? Number(savedScrollTop) : 0;
        nav.scrollTop = targetScrollTop;

        const persistScrollPosition = () => {
            window.sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
        };

        nav.addEventListener('scroll', persistScrollPosition);
        return () => nav.removeEventListener('scroll', persistScrollPosition);
    }, [currentPath]);

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
                aria-label="Main navigation sidebar"
            >
                {/* Brand Header */}
                <div className="p-8 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-4 group">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-600/20 group-hover:scale-110 transition-transform duration-500">
                            <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-slate-800 leading-tight">KKN<span className="font-normal text-slate-400">UIN Saizu</span></h1>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5 leading-none">Sistem Informasi KKN</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Scroll Area */}
                <nav ref={navRef} className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide" role="navigation" aria-label="Primary navigation">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
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
                                                if (window.innerWidth < 1024) onClose();
                                            }}
                                            className={clsx(
                                                "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                                                isActive
                                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                                                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                                            )}
                                            aria-current={isActive ? 'page' : undefined}
                                        >
                                            <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-400")} aria-hidden="true" />
                                            <span>{item.label}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-50" aria-hidden="true" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Account Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
                                <User className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{auth.user?.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium">Administrator</span>
                            </div>
                        </div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            aria-label="Log out of your account"
                            title="Keluar"
                        >
                            <LogOut className="h-5 w-5" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}
