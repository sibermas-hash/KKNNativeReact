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
            { label: 'Generator Nilai', href: '/admin/grade-generator', icon: AdjustmentsVerticalIcon },
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
                className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar border-r border-white/5 transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full'
                    }`}
            >
                {/* Logo Section - Academic Prestige */}
                <div className="flex h-20 items-center gap-3 px-6 border-b border-white/5 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/20 transition-all group-hover:scale-110 group-hover:rotate-3">
                        {/* Placeholder for UIN Logo - Symbolic Book/Knowledge Icon */}
                        <AcademicCapIcon className="w-7 h-7 text-accent-gold" />
                    </div>
                    <div className="min-w-0 relative">
                        <p className="text-sm font-black text-white tracking-widest leading-none">UIN SAIZU</p>
                        <p className="text-[9px] font-black text-accent-gold mt-1 tracking-[0.2em] uppercase opacity-80">KKN INTELLIGENCE</p>
                    </div>
                </div>

                {/* Nav Section */}
                <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-8 custom-scrollbar">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <p className="mb-4 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
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
                                            className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-300 ${isActive
                                                ? 'bg-primary/10 text-accent-gold font-black shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]'
                                                : 'text-white/40 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent-gold shadow-[0_0_10px_rgba(212,175,55,1)]" />
                                            )}
                                            <item.icon className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'text-accent-gold scale-110 drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'text-white/20 group-hover:text-primary-light group-hover:scale-110'}`} />
                                            <span className="tracking-tight">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Profile Section - Bottom Elite Hook */}
                <div className="mt-auto border-t border-white/5 bg-white/5 p-6 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-white/5 to-white/10 border border-white/10 text-sm font-black text-accent-gold shadow-lg">
                                {auth.user?.name?.charAt(0) ?? '?'}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-sidebar flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-white tracking-tight leading-none uppercase">{auth.user?.name}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <p className="truncate text-[9px] font-black text-primary-light uppercase tracking-widest opacity-60">{roles[0] ?? 'operator'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
