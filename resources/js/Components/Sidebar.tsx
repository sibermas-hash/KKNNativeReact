import { Link, usePage } from '@inertiajs/react';
import { useLayoutEffect, useRef } from 'react';
import type { PageProps } from '@/types';
import { route } from 'ziggy-js';
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
        title: 'Dasbor',
        items: [
            { label: 'Ringkasan', href: route('admin.dashboard'), icon: LayoutDashboard },
        ],
    },
    {
        title: 'Data Master',
        items: [
            { label: 'Tahun Akademik', href: route('admin.academic-years.index'), icon: Calendar },
            { label: 'Periode KKN', href: route('admin.periode.index'), icon: Calendar },
            { label: 'Lokasi KKN', href: route('admin.lokasi.index'), icon: MapPin },
            { label: 'Dosen (DPL)', href: route('admin.dpl.sync'), icon: Users },
            { label: 'Mahasiswa', href: route('admin.mahasiswa.index'), icon: GraduationCap },
            { label: 'Cek Kelayakan', href: route('admin.cek-kelayakan.index'), icon: ShieldCheck },
        ],
    },
    {
        title: 'Operasional',
        items: [
            { label: 'Registrasi', href: route('admin.pendaftaran.index'), icon: ClipboardList },
            { label: 'Kelompok KKN', href: route('admin.kelompok.index'), icon: Users2 },
            { label: 'Penugasan DPL', href: route('admin.dpl.penugasan'), icon: Users },
            { label: 'Mutasi Peserta', href: route('admin.peserta.pindah.index'), icon: Shuffle },
            { label: 'Akses Pengguna', href: route('admin.pengguna.index'), icon: Users },
        ],
    },
    {
        title: 'Pelaporan',
        items: [
            { label: 'Log Aktivitas', href: route('admin.laporan.harian.index'), icon: FileText },
            { label: 'Progam Kerja', href: route('admin.laporan.program-kerja.index'), icon: FolderKanban },
            { label: 'Audit Kualitas', href: route('admin.activity-audit.index'), icon: Cpu },
            { label: 'Laporan Akhir', href: route('admin.laporan.akhir.index'), icon: FileText },
            { label: 'Evaluasi Mahasiswa', href: route('admin.evaluasi.index'), icon: BarChart3 },
            { label: 'Generator Nilai', href: route('admin.generator-nilai.index'), icon: FileSpreadsheet },
            { label: 'Rekapitulasi Nilai', href: route('admin.grade-reports.index'), icon: Award },
            { label: 'Kualifikasi DPL', href: route('admin.workshop.index'), icon: Presentation },
        ],
    },
    {
        title: 'Publikasi',
        items: [
            { label: 'Profil LPPM', href: route('admin.konten.profil.index'), icon: Globe },
            { label: 'Skema KKN', href: route('admin.konten.skema.index'), icon: FolderKanban },
            { label: 'Berita/Warta', href: route('admin.warta-utama.index'), icon: Megaphone },
            { label: 'Repositori Dokumen', href: route('admin.unduhan.index'), icon: Download },
        ],
    },
    {
        title: 'Konfigurasi',
        items: [
            { label: 'Persyaratan KKN', href: route('admin.kkn-requirements.index'), icon: ShieldCheck },
            { label: 'Aturan Nilai', href: route('admin.konfigurasi-penilaian.index'), icon: Hammer },
            { label: 'Parameter Sistem', href: route('admin.pengaturan.sistem'), icon: SlidersHorizontal },
            { label: 'Sinkronisasi', href: route('admin.mahasiswa.sinkron'), icon: RefreshCw },
        ],
    },
];

const dplNav: NavGroup[] = [
    {
        title: 'Dasbor',
        items: [
            { label: 'Dasbor DPL', href: '/dpl', icon: LayoutDashboard },
            { label: 'Daftar Kelompok', href: '/dpl/kelompok', icon: Users2 },
        ],
    },
    {
        title: 'Bimbingan',
        items: [
            { label: 'Laporan Harian', href: '/dpl/laporan-harian', icon: FileText },
            { label: 'Laporan Akhir', href: '/dpl/laporan-akhir', icon: FileText },
            { label: 'Entry Nilai', href: '/dpl/evaluasi', icon: Star },
        ],
    },
];

const facultyAdminNav: NavGroup[] = [
    {
        title: 'Dasbor',
        items: [
            { label: 'Ringkasan', href: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Evaluasi',
        items: [
            { label: 'Rekap Nilai', href: '/admin/grade-reports', icon: Award },
        ],
    },
];

function buildStudentNav(isRegistrationLocked: boolean): NavGroup[] {
    return [
        {
            title: 'Dasbor',
            items: [
                { label: 'Dasbor Saya', href: '/mahasiswa', icon: LayoutDashboard },
                ...(isRegistrationLocked ? [] : [{ label: 'Pendaftaran', href: '/mahasiswa/pendaftaran', icon: ClipboardList }]),
            ],
        },
        {
            title: 'Kegiatan KKN',
            items: [
                { label: 'Posko Kelompok', href: '/mahasiswa/posko', icon: MapPin },
                { label: 'Laporan Harian', href: '/mahasiswa/laporan-harian', icon: FileText },
                { label: 'Laporan Akhir', href: '/mahasiswa/laporan-akhir', icon: FileText },
                { label: 'Cek Nilai', href: '/mahasiswa/evaluasi', icon: Award },
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

const SIDEBAR_SCROLL_KEY = 'kkn-white-sidebar-scroll';

export default function Sidebar({ open, onClose }: SidebarProps) {
    const { auth, url } = usePage<PageProps & { url: string }>().props;

    const rawRoles = auth.user?.roles ?? [];
    const roles = Array.isArray(rawRoles)
        ? rawRoles.map(r => typeof r === 'object' && r !== null ? (r as { name: string }).name : String(r))
        : [];
    const isStudentRegistrationLocked = !!auth.user?.student_registration_locked;

    const navGroups = getNavForRole(roles, isStudentRegistrationLocked);
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

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-white/60 backdrop-blur-md lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-slate-900 border-r border-emerald-50 dark:border-slate-800 transition-transform duration-200 lg:translate-x-0 shadow-sm",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* BRAND SECTION (WHITE CLEAN STYLE) */}
                <div className="h-16 px-6 flex items-center border-b border-emerald-50/50 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-emerald-600 dark:bg-emerald-500 rounded flex items-center justify-center text-white font-black text-sm shadow-sm shadow-emerald-600/20 dark:shadow-emerald-500/20">S</div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-emerald-900 dark:text-slate-100 uppercase tracking-tighter">POS-KKN</span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">UIN SAIZU</span>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION AREA */}
                <nav ref={navRef} className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                    {navGroups.map((group) => (
                        <div key={group.title} className="mb-6 px-3">
                            <h3 className="px-3 mb-2 text-[10px] font-black text-emerald-600/40 dark:text-slate-600 uppercase tracking-widest">
                                {group.title}
                            </h3>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => window.innerWidth < 1024 && onClose()}
                                            className={clsx(
                                                "flex items-center gap-3 px-3 py-2.5 rounded text-xs font-black uppercase tracking-tight transition-all",
                                                isActive
                                                    ? "bg-emerald-600 dark:bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 dark:shadow-emerald-600/50 border border-transparent"
                                                    : "text-emerald-700/70 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <item.icon className={clsx("w-4 h-4", isActive ? "text-white" : "text-emerald-600/40 dark:text-slate-500")} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}
