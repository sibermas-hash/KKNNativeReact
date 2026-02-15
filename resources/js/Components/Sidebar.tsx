import { Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import {
    HomeIcon,
    AcademicCapIcon,
    CalendarDaysIcon,
    BuildingLibraryIcon,
    MapPinIcon,
    UserGroupIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
    StarIcon,
    FolderOpenIcon,
    DocumentChartBarIcon,
    ChartBarIcon,
    DocumentMagnifyingGlassIcon,
    AdjustmentsVerticalIcon,
    ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

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
            { label: 'Dashboard', href: '/admin', icon: HomeIcon },
        ],
    },
    {
        title: 'Master Data',
        items: [
            { label: 'Tahun Akademik', href: '/admin/academic-years', icon: CalendarDaysIcon },
            { label: 'Periode KKN', href: '/admin/periods', icon: CalendarDaysIcon },
            { label: 'Fakultas', href: '/admin/faculties', icon: BuildingLibraryIcon },
            { label: 'Program Studi', href: '/admin/programs', icon: AcademicCapIcon },
            { label: 'Lokasi KKN', href: '/admin/locations', icon: MapPinIcon },
            { label: 'Dosen (DPL)', href: '/admin/dpl', icon: UsersIcon },
            { label: 'Mahasiswa', href: '/admin/mahasiswa', icon: AcademicCapIcon },
        ],
    },
    {
        title: 'Kelola KKN',
        items: [
            { label: 'Kelompok', href: '/admin/groups', icon: UserGroupIcon },
            { label: 'Pengguna', href: '/admin/users', icon: UsersIcon },
            { label: 'Pendaftaran', href: '/admin/registrations', icon: ClipboardDocumentListIcon },
        ],
    },
    {
        title: 'Aktivitas Global',
        items: [
            { label: 'Laporan Harian', href: '/admin/reports/daily', icon: DocumentTextIcon },
            { label: 'Program Kerja', href: '/admin/reports/work-programs', icon: FolderOpenIcon },
            { label: 'Laporan Akhir', href: '/admin/reports/final', icon: DocumentChartBarIcon },
            { label: 'Evaluasi & Nilai', href: '/admin/evaluations', icon: ChartBarIcon },
            { label: 'Workshop', href: '/admin/workshops', icon: CalendarDaysIcon },
            { label: 'Proposal', href: '/admin/proposals', icon: DocumentMagnifyingGlassIcon },
            { label: 'Generator Nilai', href: '/admin/grade-generator', icon: AdjustmentsVerticalIcon },
            { label: 'Rekap Nilai', href: '/admin/rekap-nilai', icon: DocumentChartBarIcon },
            { label: 'Log Audit', href: '/admin/audit-log', icon: ShieldExclamationIcon },
            { label: 'Pengaturan Nilai', href: '/admin/grading-settings', icon: AdjustmentsVerticalIcon },
            { label: 'Konfig Sertifikat', href: '/admin/settings/certificate', icon: AdjustmentsVerticalIcon },
        ],
    },
];

const dplNav: NavGroup[] = [
    {
        title: 'Utama',
        items: [
            { label: 'Dashboard', href: '/dpl', icon: HomeIcon },
        ],
    },
    {
        title: 'Bimbingan',
        items: [
            { label: 'Kelompok Saya', href: '/dpl/groups', icon: UserGroupIcon },
            { label: 'Laporan Harian', href: '/dpl/daily-reports', icon: DocumentTextIcon },
            { label: 'Evaluasi', href: '/dpl/evaluations', icon: StarIcon },
        ],
    },
];

const studentNav: NavGroup[] = [
    {
        title: 'Utama',
        items: [
            { label: 'Dashboard', href: '/student', icon: HomeIcon },
        ],
    },
    {
        title: 'KKN Saya',
        items: [
            { label: 'Pendaftaran', href: '/student/register', icon: ClipboardDocumentListIcon },
            { label: 'Laporan Harian', href: '/student/daily-reports', icon: DocumentTextIcon },
            { label: 'Program Kerja', href: '/student/work-programs', icon: FolderOpenIcon },
            { label: 'Laporan Akhir', href: '/student/final-report', icon: DocumentChartBarIcon },
            { label: 'Nilai', href: '/student/evaluations', icon: ChartBarIcon },
            { label: 'Workshop', href: '/student/workshops', icon: CalendarDaysIcon },
            { label: 'Proposal', href: '/student/proposals', icon: DocumentMagnifyingGlassIcon },
        ],
    },
];

function getNavForRole(roles: string[]): NavGroup[] {
    const normalizedRoles = (roles || []).map(r => String(r).toLowerCase());
    if (normalizedRoles.includes('admin') || normalizedRoles.includes('superadmin')) return adminNav;
    if (normalizedRoles.includes('dpl')) return dplNav;
    return studentNav;
}

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const { auth, url } = usePage<PageProps & { url: string }>().props;
    const roles = (auth.user?.roles as unknown as string[]) ?? [];
    const navGroups = getNavForRole(roles);

    const currentPath = typeof url === 'string' ? url : window.location.pathname;

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                    }`}
            >
                {/* Logo Section */}
                <div className="flex h-20 items-center gap-3 px-6 border-b border-slate-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                        <span className="text-xl font-black">K</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">KKN SAIZU</p>
                        <p className="text-[10px] font-bold text-primary mt-1 tracking-[0.1em] uppercase opacity-70">Manajemen v2.2</p>
                    </div>
                </div>

                {/* Nav Section */}
                <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-8 custom-scrollbar">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <p className="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                {group.title}
                            </p>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${isActive
                                                ? 'bg-primary/10 text-primary font-bold shadow-sm'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                        >
                                            {isActive && (
                                                <div className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-primary" />
                                            )}
                                            <item.icon className={`h-5 w-5 flex-shrink-0 transition-all ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary group-hover:scale-110'}`} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <Link
                            href="/profile"
                            onClick={onClose}
                            className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${currentPath === '/profile'
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <UsersIcon className={`h-5 w-5 transition-all ${currentPath === '/profile' ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                            Profil Saya
                        </Link>
                    </div>
                </nav>

                {/* User Profile Section - Bottom Hook */}
                <div className="mt-auto border-t border-slate-100 bg-slate-50/50 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-sm font-black text-primary shadow-sm">
                            {auth.user?.name?.charAt(0) ?? '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-900 tracking-tight leading-none">{auth.user?.name}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <p className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-widest">{roles[0] ?? 'operator'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
