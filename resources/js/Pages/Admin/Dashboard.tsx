import { Link, Head, Deferred, usePage } from '@inertiajs/react';
import GisMap from '@/Components/GisMap';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import type { LucideIcon } from 'lucide-react';
import { 
    Users, 
    Users2, 
    FileText, 
    ClipboardList,
    Clock,
    AlertCircle,
    GraduationCap,
    ArrowRight,
    BarChart3,
    Globe,
    Download,
    Megaphone,
    FolderKanban,
    Zap,
    TrendingUp,
    ShieldCheck,
    Navigation,
    Layers,
    Activity,
    MapPin,
    FileCheck,
    Unlock,
    ArrowUpRight,
    ShieldAlert,
    Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
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
    activity_trend: { date: string; count: number }[];
    intelligence?: {
        high_risk_count: number;
    };
    gis_locations?: Array<{
        id: number;
        name: string;
        lat: number;
        lng: number;
        members_count: number;
        village: string;
    }>;
    ui?: {
        is_faculty_admin?: boolean;
        can_manage_public_content?: boolean;
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
        pending: { variant: 'warning', label: 'Menunggu' },
        approved: { variant: 'success', label: 'Disetujui' },
        rejected: { variant: 'danger', label: 'Ditolak' },
    }[status] || { variant: 'default', label: status.toUpperCase() };

    return (
        <span className={clsx(
            "px-3 py-1 rounded-full text-[10px] font-bold tracking-tight border",
            status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
            status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
            'bg-rose-50 text-rose-700 border-rose-100'
        )}>
            {config.label}
        </span>
    );
}

export default function AdminDashboard({ stats, sdg_distribution, recentRegistrations, activity_trend, intelligence, gis_locations, ui }: Props) {
    const { auth } = usePage<PageProps>().props;
    const roles = auth.user?.roles?.map((role) => role.toLowerCase()) ?? [];
    const isFacultyAdmin = ui?.is_faculty_admin ?? roles.includes('faculty_admin');
    const canManagePublic = (ui?.can_manage_public_content ?? false) || roles.includes('superadmin') || roles.includes('admin');


    const quickActions = isFacultyAdmin ? [
        { label: 'Rekap Nilai', href: '/admin/grade-reports', icon: FileText },
    ] : [
        { label: 'Kelola Pendaftaran', href: '/admin/pendaftaran', icon: Users },
        { label: 'Kelola Kelompok', href: '/admin/kelompok', icon: Users2 },
        { label: 'Input Nilai', href: '/admin/nilai', icon: GraduationCap },
        { label: 'Rekap Nilai', href: '/admin/grade-reports', icon: FileText },
    ];

    const publicContentActions = canManagePublic ? [
        { label: 'Profil LPPM', href: '/admin/konten-publik/profil', icon: Globe },
        { label: 'Skema KKN', href: '/admin/konten-publik/skema', icon: FolderKanban },
        { label: 'Warta Utama', href: '/admin/warta-utama', icon: Megaphone },
        { label: 'Repositori Berkas', href: '/admin/unduhan', icon: Download },
    ] : [];

    return (
        <AppLayout title="Dashboard Utama">
            <Head title="Dashboard Admin" />
            
            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Sistem Informasi KKN UIN SAIZU
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Selamat Datang, <span className="text-emerald-600">Administrator</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-3">
                             <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                                 <Clock className="w-4 h-4 text-emerald-600" />
                                 <span className="text-xs font-semibold text-emerald-700">
                                     Periode Aktif: {stats?.active_period || 'Tidak ada periode aktif'}
                                 </span>
                             </div>
                             <p className="text-xs text-slate-400">Monitoring sistem berjalan normal</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 shadow-inner" role="tablist" aria-label="Dashboard view tabs">
                             {['Dashboard', 'Analitik', 'Log'].map((tab) => (
                                 <button
                                     key={tab}
                                     role="tab"
                                     aria-selected={tab === 'Dashboard'}
                                     aria-controls={`dashboard-panel-${tab.toLowerCase()}`}
                                     className={clsx(
                                         "px-5 py-2 rounded-lg text-xs font-bold transition-all",
                                         tab === 'Dashboard' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                     )}
                                 >
                                     {tab}
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Mahasiswa Terdaftar"
                        value={stats?.total_students || 0}
                        icon={Users}
                        subtitle={`${stats?.assigned_students || 0} sudah berkelompok`}
                        index={0}
                        link="/admin/mahasiswa"
                    />
                    <StatCard 
                        title="Kelompok KKN"
                        value={stats?.total_groups || 0}
                        icon={Users2}
                        subtitle="Unit kelompok aktif"
                        index={1}
                        link="/admin/kelompok"
                    />
                    <StatCard 
                        title="Laporan Harian"
                        value={stats?.total_reports || 0}
                        icon={FileText}
                        subtitle="Log aktivitas mahasiswa"
                        index={2}
                        link="/admin/laporan/harian"
                    />
                    <StatCard 
                        title="Laporan Akhir"
                        value={stats?.total_final_reports || 0}
                        icon={ClipboardList}
                        subtitle="Dokumen finalisasi"
                        index={3}
                        link="/admin/laporan/akhir"
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Quick Actions Panel */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Zap className="w-24 h-24 text-emerald-600" />
                           </div>
                           <div className="relative z-10 space-y-6">
                                <h2 className="text-slate-900 text-sm font-bold uppercase tracking-wider flex items-center gap-3">
                                    <Layers className="w-5 h-5 text-emerald-600" />
                                    Aksi Cepat
                                </h2>
                                <div className="grid grid-cols-1 gap-3">
                                    {quickActions.map((action) => (
                                        <Link
                                            key={action.href}
                                            href={action.href}
                                            className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50 transition-all active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                    <action.icon className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 transition-colors group-hover:text-emerald-800">{action.label}</span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                                        </Link>
                                    ))}
                                </div>
                                {publicContentActions.length > 0 && (
                                <div className="pt-6 border-t border-slate-100">
                                     <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">Pengaturan Konten Publik</h3>
                                     <div className="grid grid-cols-2 gap-3">
                                         {publicContentActions.map((action) => (
                                             <Link
                                                 key={action.href}
                                                 href={action.href}
                                                 className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                                             >
                                                 <action.icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                                                 <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{action.label}</span>
                                             </Link>
                                         ))}
                                     </div>
                                </div>
                                )}
                           </div>
                        </div>

                        {/* Critical Alert Card */}
                        {stats?.unassigned_students && stats.unassigned_students > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-3xl p-8 border-l-4 border-l-rose-500 border-slate-200 shadow-sm relative overflow-hidden"
                            >
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-4">
                                         <div>
                                            <h3 className="text-rose-600 text-[10px] font-bold uppercase tracking-widest">Atensi Penempatan</h3>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                                {stats.unassigned_students} <span className="text-sm font-medium text-slate-500">Mahasiswa</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Ditemukan mahasiswa terdaftar yang belum ditempatkan ke dalam kelompok.</p>
                                         </div>
                                         <Link 
                                             href="/admin/pendaftaran"
                                             className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-lg active:scale-95"
                                         >
                                             Proses Sekarang
                                             <ArrowRight className="w-3.5 h-3.5" />
                                         </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* System Activity Pulse */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden group/pulse">
                            <div className="flex items-center gap-4 mb-8">
                                <Activity className="h-5 w-5 text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic opacity-60">System Activity Pulse &bull; 14 Days</span>
                            </div>
                            <div className="space-y-3">
                                {activity_trend && activity_trend.length > 0 ? (
                                    activity_trend.slice(-7).reverse().map((item) => (
                                        <div
                                            key={item.date}
                                            className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-3 border border-transparent hover:border-emerald-100 hover:bg-white transition-all duration-300 group/feed"
                                        >
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">{item.date}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-slate-900 italic tracking-tighter uppercase leading-none">
                                                    {item.count} Reports
                                                </span>
                                                <ArrowUpRight size={12} className="text-emerald-500 opacity-0 group-hover/feed:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 italic">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">NO_ACTIVITY_LOGGED</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- INTELLIGENCE & SECURITY OVERRIDE --- */}
                        <Link href="/admin/auditor-aktivitas" className="group/intel">
                            <div className="bg-slate-950 rounded-[3rem] p-10 border border-slate-800 relative overflow-hidden shadow-2xl transition-all hover:bg-rose-950/20 hover:border-rose-500/30">
                                <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 transition-transform group-hover/intel:rotate-0 pointer-events-none">
                                    <Cpu size={240} className="text-white" />
                                </div>
                                <div className="relative z-10 flex flex-col gap-10">
                                    <div className="flex items-center justify-between">
                                        <div className="h-16 w-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-rose-500 shadow-inner group-hover/intel:scale-110 transition-transform">
                                            <ShieldAlert size={32} />
                                        </div>
                                        <div className="px-5 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[9px] font-black text-rose-500 tracking-[0.2em] italic uppercase">
                                            SYSTEM_AUDIT_READY
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-3">Intelligence_Monitor</h4>
                                        <div className="flex items-baseline gap-6">
                                            <span className="text-5xl font-black text-white italic tracking-tighter">
                                                {intelligence?.high_risk_count ?? 0}
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Anomalies Detected</span>
                                                <div className="h-1 w-12 bg-rose-500/30 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-emerald-500/50 bg-white/5 p-4 rounded-2xl w-fit">
                                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                         <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Heuristic Engine Active</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Main Content Area (Map & Table) */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Map View */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                        <Globe className="w-5 h-5 animate-spin-slow" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 leading-none">Sebaran Sektor KKN</h2>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase">Visualisasi Geografis Titik Posko</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[500px] relative bg-slate-50">
                                <Deferred data="gis_locations" fallback={
                                    <div className="h-full bg-slate-50 flex flex-col items-center justify-center gap-4 animate-pulse">
                                        <Navigation size={40} className="text-slate-200" />
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Menyiapkan Peta Geospatial...</span>
                                    </div>
                                }>
                                    <GisMap locations={gis_locations || []} className="h-full w-full" />
                                </Deferred>
                                
                                <div className="absolute bottom-6 left-6 z-[1000] p-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg">
                                     <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                                         <MapPin className="w-4 h-4 text-emerald-600" />
                                         <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Informasi Peta</span>
                                     </div>
                                     <div className="space-y-2">
                                         <div className="flex items-center justify-between gap-8">
                                             <span className="text-[9px] font-medium text-slate-500 uppercase">Titik Aktif:</span>
                                             <span className="text-[9px] font-bold text-emerald-700">{(gis_locations || []).length} Lokasi</span>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Table */}
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-emerald-600" />
                                    Pendaftaran Terbaru
                                </h2>
                                <Link href="/admin/pendaftaran" className="text-[10px] font-bold uppercase text-emerald-700 hover:text-emerald-800 transition-colors">
                                    Lihat Semua
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mahasiswa</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Periode</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {recentRegistrations && recentRegistrations.length > 0 ? (
                                            recentRegistrations.map((reg) => (
                                                <tr key={reg.id} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-sm">
                                                                {reg.mahasiswa?.user?.name?.charAt(0) || 'M'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-slate-900 leading-none mb-1">{reg.mahasiswa?.user?.name || 'Mahasiswa'}</span>
                                                                <span className="text-xs text-slate-400">NIM: {reg.mahasiswa?.nim || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-xs font-semibold text-slate-600">{reg.periode?.name || '-'}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <StatusBadge status={reg.status} />
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <Link 
                                                            href={`/admin/pendaftaran/${reg.id}`}
                                                            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 hover:text-emerald-700 transition-colors"
                                                        >
                                                            Detail
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                                        <FileCheck className="w-12 h-12 text-slate-200" />
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada pendaftaran baru</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SDG Analytics Section */}
                {sdg_distribution && sdg_distribution.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                <div className="space-y-1">
                                    <h2 className="text-slate-900 text-lg font-bold uppercase tracking-wider flex items-center gap-3">
                                        <BarChart3 className="w-6 h-6 text-emerald-600" />
                                        Distribusi SDGs
                                    </h2>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Kontribusi Kegiatan Terhadap Tujuan Pembangunan Berkelanjutan</p>
                                </div>
                                <Link href="/admin/laporan/program-kerja" className="text-xs font-bold text-emerald-700">
                                    Lihat Statistik Lengkap
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-4">
                                {sdg_distribution.map((sdg) => (
                                    <div 
                                        key={sdg.id} 
                                        className="flex flex-col items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-white transition-all cursor-default group"
                                    >
                                        <div 
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                                            style={{ backgroundColor: SDG_COLORS[sdg.id - 1] || '#666' }}
                                        >
                                            {sdg.id}
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <span className="text-sm font-bold text-slate-900">{sdg.count}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                                {SDG_NAMES[sdg.id] || `SDG ${sdg.id}`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon: Icon, index, link, subtitle }: { title: string; value: number; icon: LucideIcon; index: number; link?: string; subtitle?: string }) {
    const CardContent = (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col gap-6 group hover:border-emerald-500 hover:shadow-lg transition-all relative overflow-hidden"
            role={link ? undefined : 'article'}
            aria-label={`${title}: ${typeof value === 'number' ? value.toLocaleString() : value}`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Icon size={100} aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between">
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500 opacity-20 group-hover:opacity-100" aria-hidden="true" />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{value.toLocaleString()}</p>
                {subtitle && <p className="text-[10px] font-medium text-slate-500 mt-2">{subtitle}</p>}
            </div>
        </motion.div>
    );

    if (link) {
        return <Link href={link}>{CardContent}</Link>;
    }

    return CardContent;
}
