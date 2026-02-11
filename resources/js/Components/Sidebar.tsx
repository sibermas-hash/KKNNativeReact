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
    if (roles.includes('admin')) return adminNav;
    if (roles.includes('dpl')) return dplNav;
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
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                        K
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">KKN UIN SAIZU</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Sistem Informasi</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {navGroups.map((group) => (
                        <div key={group.title} className="mb-4">
                            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                {group.title}
                            </p>
                            {group.items.map((item) => {
                                const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive
                                            ? 'bg-sidebar-active text-white font-medium'
                                            : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}

                    <div className="mt-4 pt-4 border-t border-white/10">
                        <Link
                            href="/profile"
                            onClick={onClose}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${currentPath === '/profile'
                                ? 'bg-sidebar-active text-white font-medium'
                                : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                                }`}
                        >
                            <UsersIcon className="h-5 w-5 flex-shrink-0" />
                            Profil Saya
                        </Link>
                    </div>
                </nav>

                {/* User */}
                <div className="border-t border-white/10 px-5 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-white">
                            {auth.user?.name?.charAt(0) ?? '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{auth.user?.name}</p>
                            <p className="truncate text-xs text-slate-400 capitalize">{roles[0] ?? 'user'}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
