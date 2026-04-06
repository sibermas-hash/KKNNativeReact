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
        title: 'Dashboard',
        items: [
            { label: 'Ringkasan', href: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Master Data',
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
            { label: 'Registrasi', href: '/admin/pendaftaran', icon: ClipboardList },
            { label: 'Kelompok KKN', href: '/admin/kelompok', icon: Users2 },
            { label: 'Penugasan DPL', href: '/admin/dosen/penugasan', icon: Users },
            { label: 'Mutasi Peserta', href: '/admin/peserta/pindah', icon: Shuffle },
            { label: 'Akses Pengguna', href: '/admin/pengguna', icon: Users },
        ],
    },
    {
        title: 'Pelaporan',
        items: [
            { label: 'Log Aktivitas', href: '/admin/laporan/harian', icon: FileText },
            { label: 'Progam Kerja', href: '/admin/laporan/program-kerja', icon: FolderKanban },
            { label: 'Audit Kualitas', href: '/admin/auditor-aktivitas', icon: Cpu },
            { label: 'Laporan Akhir', href: '/admin/laporan/akhir', icon: FileText },
            { label: 'Evaluasi Mahasiswa', href: '/admin/evaluasi', icon: BarChart3 },
            { label: 'Generator Nilai', href: '/admin/generator-nilai', icon: FileSpreadsheet },
            { label: 'Rekapitulasi Nilai', href: '/admin/grade-reports', icon: Award },
            { label: 'Kualifikasi DPL', href: '/admin/workshop', icon: Presentation },
        ],
    },
    {
        title: 'Publikasi',
        items: [
            { label: 'Profil LPPM', href: '/admin/konten-publik/profil', icon: Globe },
            { label: 'Skema KKN', href: '/admin/konten-publik/skema', icon: FolderKanban },
            { label: 'Berita/Warta', href: '/admin/warta-utama', icon: Megaphone },
            { label: 'File Manager', href: '/admin/unduhan', icon: Download },
        ],
    },
    {
        title: 'Konfigurasi',
        items: [
            { label: 'Persyaratan KKN', href: '/admin/kkn-requirements', icon: ShieldCheck },
            { label: 'Aturan Nilai', href: '/admin/konfigurasi-penilaian', icon: Hammer },
            { label: 'Parameter Sistem', href: '/admin/pengaturan/sistem', icon: SlidersHorizontal },
            { label: 'Sinkronisasi', href: '/admin/mahasiswa/sinkron', icon: RefreshCw },
        ],
    },
];

const dplNav: NavGroup[] = [
    {
        title: 'Dashboard',
        items: [
            { label: 'Monitoring DPL', href: '/dpl', icon: LayoutDashboard },
            { label: 'Daftar Kelompok', href: '/dpl/kelompok', icon: Users2 },
        ],
    },
    {
        title: 'Bimbingan',
        items: [
            { label: 'Log Harian', href: '/dpl/laporan-harian', icon: FileText },
            { label: 'Dokumen Akhir', href: '/dpl/laporan-akhir', icon: FileText },
            { label: 'Entry Nilai', href: '/dpl/evaluasi', icon: Star },
        ],
    },
];

const facultyAdminNav: NavGroup[] = [
    {
        title: 'Dashboard',
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
            title: 'Dashboard',
            items: [
                { label: 'Status Saya', href: '/mahasiswa', icon: LayoutDashboard },
                ...(isRegistrationLocked ? [] : [{ label: 'Pendaftaran', href: '/mahasiswa/pendaftaran', icon: ClipboardList }]),
            ],
        },
        {
            title: 'Kegiatan',
            items: [
                { label: 'Info Posko', href: '/mahasiswa/posko', icon: MapPin },
                { label: 'Jurnal Harian', href: '/mahasiswa/laporan-harian', icon: FileText },
                { label: 'Laporan Final', href: '/mahasiswa/laporan-akhir', icon: FileText },
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
        ? rawRoles.map(r => typeof r === 'object' && r !== null ? (r as any).name : String(r))
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
                    "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-200 transition-transform duration-200 lg:translate-x-0 shadow-sm",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* BRAND SECTION (WHITE CLEAN STYLE) */}
                <div className="h-16 px-6 flex items-center border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-emerald-600 rounded flex items-center justify-center text-white font-black text-sm">S</div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">POS-KKN</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">UIN SAIZU</span>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION AREA */}
                <nav ref={navRef} className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                    {navGroups.map((group) => (
                        <div key={group.title} className="mb-6 px-3">
                            <h3 className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                                                    ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50"
                                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                            )}
                                        >
                                            <item.icon className={clsx("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-400")} />
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
