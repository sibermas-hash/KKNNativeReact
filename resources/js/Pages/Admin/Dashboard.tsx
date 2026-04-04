import { Link, Head, Deferred } from '@inertiajs/react';
import GisMap from '@/Components/GisMap';
import AppLayout from '@/Layouts/AppLayout';
import type { LucideIcon } from 'lucide-react';
import { 
    Users, 
    Users2, 
    FileText, 
    ClipboardList,
    Clock,
    AlertCircle,
    GraduationCap,
    BookOpen,
    ArrowRight,
    BarChart3,
    Target,
    Globe,
    Download,
    Megaphone,
    FolderKanban
} from 'lucide-react';
import { clsx } from 'clsx';

interface Registration {
    id: number;
    status: string;
    mahasiswa?: { nim: string; user?: { name: string; }; };
    periode?: { name: string; };
}

interface SdgDistributionItem {
    id: number;
    count: number;
}

interface DashboardStats {
    total_students: number;
    total_groups: number;
    total_reports: number;
    pending_registrations: number;
    total_work_programs: number;
    total_final_reports: number;
    assigned_students: number;
    unassigned_students: number;
    reported_posko: number;
    active_period: string;
}

interface Props {
    stats?: DashboardStats;
    sdg_distribution?: SdgDistributionItem[];
    recentRegistrations?: Registration[];
    gis_locations?: Array<{
        id: number;
        name: string;
        lat: number;
        lng: number;
        members_count: number;
        village: string;
    }>;
    demoPreview?: {
        stats: {
            total_students: number;
            total_groups: number;
            total_reports: number;
            pending_registrations: number;
        };
        recentRegistrations: Registration[];
    };
}

const SDG_COLORS = [
    '#E5243B', '#DDA63A', '#4C9F38', '#C42130', '#FF3A21',
    '#28BCE1', '#FCC30B', '#A21942', '#FD6925', '#DD1367',
    '#FD9D24', '#BF8B2E', '#497D00', '#0A97D9', '#56C02B',
    '#00689D', '#1F907D', '#703115', '#E5C83E', '#0073A5',
    '#E5243B', '#56C02B', '#1F907D'
];

const SDG_NAMES: Record<number, string> = {
    1: 'Tanpa Kemiskinan',
    2: 'Tanpa Kelaparan',
    3: 'Kehidupan Sehat',
    4: 'Pendidikan Berkualitas',
    5: 'Kesetaraan Gender',
    6: 'Air Bersih & Sanitasi',
    7: 'Energi Bersih',
    8: 'Pekerjaan Layak',
    9: 'Industri & Infrastruktur',
    10: 'Berkurangnya Kesenjangan',
    11: 'Kota Berkelanjutan',
    12: 'Konsumsi Bertanggung Jawab',
    13: 'Penanganan Perubahan Iklim',
    14: 'Ekosistem Lautan',
    15: 'Ekosistem Daratan',
    16: 'Perdamaian & Keadilan',
    17: 'Kemitraan'
};

function StatusBadge({ status }: { status: string }) {
    const config = {
        pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Menunggu' },
        approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Disetujui' },
        rejected: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Ditolak' },
    }[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status };

    return (
        <span className={clsx("text-xs px-2 py-1 rounded font-medium", config.bg, config.text)}>
            {config.label}
        </span>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color = "blue",
    link,
    subtitle
}: {
    title: string;
    value: number;
    icon: LucideIcon;
    color?: string;
    link?: string;
    subtitle?: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-rose-50 text-rose-600',
        cyan: 'bg-cyan-50 text-cyan-600',
    };

    const Card = (
        <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
                    {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
                </div>
                <div className={clsx("p-2 rounded-lg", colorClasses[color] || colorClasses.blue)}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );

    if (link) {
        return (
            <Link href={link} className="block cursor-pointer hover:border-slate-300 transition-colors">
                {Card}
            </Link>
        );
    }

    return Card;
}

export default function AdminDashboard({ stats, sdg_distribution, recentRegistrations, gis_locations }: Props) {
    const quickActions = [
        { label: 'Kelola Pendaftaran', href: '/admin/pendaftaran', icon: Users, color: 'blue' },
        { label: 'Kelola Kelompok', href: '/admin/kelompok', icon: Users2, color: 'green' },
        { label: 'Input Nilai', href: '/admin/nilai', icon: GraduationCap, color: 'orange' },
        { label: 'Rekap Nilai', href: '/admin/rekap-nilai', icon: FileText, color: 'purple' },
    ];

    const publicContentActions = [
        { label: 'Profil LPPM', href: '/admin/konten-publik/profil', icon: Globe },
        { label: 'Skema KKN', href: '/admin/konten-publik/skema', icon: FolderKanban },
        { label: 'Warta', href: '/admin/warta-utama', icon: Megaphone },
        { label: 'Repositori', href: '/admin/unduhan', icon: Download },
    ];

    return (
        <AppLayout title="Dasbor">
            <Head title="Dashboard Admin" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">Dasbor</h1>
                        {stats?.active_period && (
                            <p className="text-sm text-slate-500 mt-1">
                                Periode Aktif: <span className="font-medium text-slate-700">{stats.active_period}</span>
                            </p>
                        )}
                    </div>
                    <Link 
                        href="/admin/pratinjau-taktis" 
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Tampilan Taktis
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Aksi Cepat</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                            >
                                <action.icon className="w-4 h-4 text-slate-600" />
                                <span className="text-sm font-medium text-slate-700">{action.label}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Konten Publik</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {publicContentActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                            >
                                <action.icon className="w-4 h-4 text-slate-600" />
                                <span className="text-sm font-medium text-slate-700">{action.label}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title="Total Mahasiswa"
                        value={stats?.total_students || 0}
                        icon={Users}
                        color="blue"
                        link="/admin/mahasiswa"
                        subtitle={`${stats?.assigned_students || 0} sudah punya kelompok`}
                    />
                    <StatCard 
                        title="Kelompok Aktif"
                        value={stats?.total_groups || 0}
                        icon={Users2}
                        color="green"
                        link="/admin/kelompok"
                    />
                    <StatCard 
                        title="Laporan Masuk"
                        value={stats?.total_reports || 0}
                        icon={FileText}
                        color="orange"
                        link="/admin/laporan/harian"
                    />
                    <StatCard 
                        title="Laporan Akhir"
                        value={stats?.total_final_reports || 0}
                        icon={ClipboardList}
                        color="purple"
                        link="/admin/laporan/akhir"
                    />
                </div>

                {/* Additional Stats */}
                {(stats?.pending_registrations ?? 0) > 0 || (stats?.total_work_programs ?? 0) > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(stats?.pending_registrations ?? 0) > 0 && (
                            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                    <div>
                                        <p className="text-sm text-amber-700 font-medium">Pendaftaran Menunggu</p>
                                        <p className="text-2xl font-bold text-amber-900">{stats?.pending_registrations}</p>
                                        <Link href="/admin/pendaftaran?filter=pending" className="text-xs text-amber-600 hover:text-amber-700 mt-1 inline-block">
                                            Lihat semua →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                        <StatCard 
                            title="Program Kerja"
                            value={stats?.total_work_programs || 0}
                            icon={Target}
                            color="cyan"
                            link="/admin/laporan/program-kerja"
                        />
                        <StatCard 
                            title="Posko Terlapor"
                            value={stats?.reported_posko || 0}
                            icon={BookOpen}
                            color="red"
                        />
                    </div>
                ) : null}

                {/* GIS Mapping */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-emerald-600" />
                            <h2 className="font-semibold text-slate-900 uppercase tracking-tight italic">Peta Sebaran Kelompok <span className="text-slate-400 font-medium text-[0.8em]">KKN.</span></h2>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Visualisasi Real-time</span>
                        </div>
                    </div>
                    <div className="p-1">
                        <Deferred data="gis_locations" fallback={
                            <div className="h-[500px] bg-slate-50 flex items-center justify-center animate-pulse rounded-[1.5rem]">
                                <Globe size={48} className="text-slate-200 animate-spin-slow" />
                            </div>
                        }>
                            <GisMap locations={gis_locations || []} className="h-[500px] w-full rounded-[1.5rem]" />
                        </Deferred>
                    </div>
                </div>

                {/* SDG Distribution */}
                {sdg_distribution && sdg_distribution.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-slate-900">Distribusi Tujuan SDGs</h2>
                                <Link href="/admin/laporan/program-kerja" className="text-xs text-blue-600 hover:text-blue-700">
                                    Lihat Detail →
                                </Link>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex flex-wrap gap-3">
                                {sdg_distribution.map((sdg) => (
                                    <div key={sdg.id} className="flex flex-col items-center">
                                        <div 
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-1"
                                            style={{ backgroundColor: SDG_COLORS[sdg.id - 1] || '#666' }}
                                        >
                                            {sdg.id}
                                        </div>
                                        <span className="text-xs text-slate-600 font-medium text-center">{sdg.count}</span>
                                        <span className="text-[10px] text-slate-400 text-center max-w-[80px] leading-tight">
                                            {SDG_NAMES[sdg.id] || `SDG ${sdg.id}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Registrations */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-600" />
                                <h2 className="font-semibold text-slate-900">Pendaftaran Terbaru</h2>
                            </div>
                            <Link href="/admin/pendaftaran" className="text-xs text-blue-600 hover:text-blue-700">
                                Lihat Semua →
                            </Link>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">Nama</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">NIM</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">Periode</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {recentRegistrations && recentRegistrations.length > 0 ? (
                                    recentRegistrations.map((reg) => (
                                        <tr key={reg.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 font-medium text-slate-900">
                                                {reg.mahasiswa?.user?.name || '-'}
                                            </td>
                                            <td className="px-4 py-2 text-slate-500 font-mono text-xs">
                                                {reg.mahasiswa?.nim || '-'}
                                            </td>
                                            <td className="px-4 py-2 text-slate-500">
                                                {reg.periode?.name || '-'}
                                            </td>
                                            <td className="px-4 py-2">
                                                <StatusBadge status={reg.status} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Link 
                                                    href={`/admin/pendaftaran/${reg.id}`}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >Detail</Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="w-12 h-12 text-slate-300" />
                                                <p className="text-slate-500">Belum ada pendaftaran</p>
                                                <p className="text-xs text-slate-400">Pendaftaran akan muncul di sini</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Unassigned Students Alert */}
                {stats?.unassigned_students && stats.unassigned_students > 0 && (
                    <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                <div>
                                    <p className="text-sm text-orange-800 font-medium">
                                        {stats.unassigned_students} mahasiswa belum memiliki kelompok
                                    </p>
                                    <p className="text-xs text-orange-600 mt-1">
                                        Segera assign mahasiswa ke kelompok KKN
                                    </p>
                                </div>
                            </div>
                            <Link 
                                href="/admin/pendaftaran"
                                className="px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 transition-colors"
                            >
                                Assign Sekarang
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
