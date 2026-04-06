import { Link, Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import { 
    Users, 
    Users2, 
    FileText, 
    ClipboardList,
    GraduationCap,
    BarChart3,
    Globe,
    Download,
    Megaphone,
    FolderKanban,
    Cpu,
    ShieldAlert,
    Activity,
    FileCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Registration {
    id: number;
    status: string;
    mahasiswa?: { nim: string; user?: { name: string; }; };
    periode?: { name: string; };
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
    recentRegistrations?: Registration[];
    intelligence?: {
        high_risk_count: number;
    };
    ui?: {
        is_faculty_admin?: boolean;
        can_manage_public_content?: boolean;
    };
}

export default function AdminDashboard({ stats, recentRegistrations, intelligence, ui }: Props) {
    const { auth } = usePage<PageProps>().props;
    const roles = auth.user?.roles?.map((role) => role.toLowerCase()) ?? [];
    const isFacultyAdmin = ui?.is_faculty_admin ?? roles.includes('faculty_admin');
    const canManagePublic = (ui?.can_manage_public_content ?? false) || roles.includes('superadmin') || roles.includes('admin');

    const quickActions = isFacultyAdmin ? [
        { label: 'REKAP NILAI', href: '/admin/grade-reports', icon: BarChart3 },
    ] : [
        { label: 'REGISTRASI', href: '/admin/pendaftaran', icon: ClipboardList },
        { label: 'KELOMPOK', href: '/admin/kelompok', icon: Users2 },
        { label: 'PENILAIAN', href: '/admin/nilai', icon: GraduationCap },
        { label: 'REKAP NILAI', href: '/admin/grade-reports', icon: BarChart3 },
        { label: 'MAHASISWA', href: '/admin/mahasiswa', icon: Users },
        { label: 'DOSEN DPL', href: '/admin/dosen', icon: Users },
        { label: 'AUDIT MUTU', href: '/admin/auditor-aktivitas', icon: Cpu },
        { label: 'PENGATURAN', href: '/admin/pengaturan/sistem', icon: ShieldAlert },
    ];

    const publicContentActions = canManagePublic ? [
        { label: 'PROFIL LPPM', href: '/admin/konten-publik/profil', icon: Globe },
        { label: 'SKEMA KKN', href: '/admin/konten-publik/skema', icon: FolderKanban },
        { label: 'WARTA UTAMA', href: '/admin/warta-utama', icon: Megaphone },
        { label: 'FILE MANAGER', href: '/admin/unduhan', icon: Download },
    ] : [];

    return (
        <AppLayout title="Ringkasan Sistem">
            <Head title="Dashboard | POS-KKN" />
            
            <div className="space-y-8 font-sans antialiased">
                {/* SYSTEM BANNER (CLEAN WHITE) */}
                <div className="bg-white border border-slate-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                            SELAMAT DATANG, <span className="text-emerald-600">{auth.user?.name}</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                             OPERATING IN {stats?.active_period || 'NO ACTIVE PERIOD'} 
                             <span className="h-1 w-1 bg-emerald-500 rounded-full" />
                             STATION: ADMIN-PRIMARY
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                         <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                         SYSTEM STATUS: OPERATIONAL
                    </div>
                </div>

                {/* STATS STRIP (CLEAN WHITE) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatBox title="TOTAL MAHASISWA" value={stats?.total_students || 0} icon={Users} />
                    <StatBox title="TOTAL KELOMPOK" value={stats?.total_groups || 0} icon={Users2} />
                    <StatBox title="LOG HARIAN" value={stats?.total_reports || 0} icon={FileText} />
                    <StatBox title="LAPORAN FINAL" value={stats?.total_final_reports || 0} icon={FileCheck} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* ACTION PANEL */}
                    <div className="xl:col-span-8 space-y-10">
                        <div>
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">INSTRUMEN OPERASIONAL</h3>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {quickActions.map((action) => (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="h-32 bg-white border border-slate-100 flex flex-col items-center justify-center gap-3 transition-all hover:bg-emerald-600 hover:text-white group shadow-sm active:scale-95"
                                    >
                                        <div className="p-3 bg-emerald-50 text-emerald-600 group-hover:bg-transparent group-hover:text-white transition-all">
                                            <action.icon size={20} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider">{action.label}</span>
                                    </Link>
                                ))}
                             </div>
                        </div>

                        {canManagePublic && (
                        <div>
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-100 pb-2">MANAJEMEN PUBLIK</h3>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {publicContentActions.map((action) => (
                                    <Link
                                        key={action.href}
                                        href={action.href}
                                        className="py-6 bg-white border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-600 transition-all font-black text-[9px] uppercase tracking-widest shadow-sm"
                                    >
                                        <action.icon size={16} />
                                        {action.label}
                                    </Link>
                                ))}
                             </div>
                        </div>
                        )}
                    </div>

                    {/* TRACKER PANEL */}
                    <div className="xl:col-span-4 space-y-8">
                         {/* INTEL BLOCK (WHITE STYLE) */}
                         <div className="bg-emerald-600 p-8 text-white space-y-6 shadow-lg shadow-emerald-600/10">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-emerald-100 uppercase tracking-[0.3em]">ANOMALI SISTEM</span>
                                <Activity size={14} className="text-emerald-50" />
                            </div>
                            <div className="flex items-baseline gap-4">
                                <span className="text-6xl font-black text-white tabular-nums leading-none tracking-tighter">{intelligence?.high_risk_count ?? 0}</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-emerald-100 uppercase">RISIKO</span>
                                    <span className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest">TERDETEKSI</span>
                                </div>
                            </div>
                            <Link 
                                href="/admin/auditor-aktivitas"
                                className="block w-full py-3 bg-white text-emerald-600 text-center text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all border border-transparent active:scale-95 shadow-sm"
                            >
                                PERIKSA DISINI
                            </Link>
                         </div>

                         {/* NOTIFICATION FEED */}
                         <div className="bg-white border border-slate-100 shadow-sm">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">REGISTRASI TERAKHIR</span>
                                <Activity size={12} className="text-emerald-500" />
                            </div>
                            <div className="divide-y divide-slate-50">
                                {recentRegistrations?.slice(0, 6).map((reg) => (
                                    <div key={reg.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate w-40">{reg.mahasiswa?.user?.name}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{reg.mahasiswa?.nim}</span>
                                        </div>
                                        <StatusTag status={reg.status} />
                                    </div>
                                ))}
                            </div>
                            <Link 
                                href="/admin/pendaftaran" 
                                className="block w-full py-4 text-center text-[9px] font-black text-emerald-600 hover:bg-emerald-50 uppercase tracking-[0.2em] border-t border-slate-100 transition-all"
                            >
                                VIEW ALL RECORDS
                            </Link>
                         </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatBox({ title, value, icon: Icon }: { title: string; value: number; icon: any; }) {
    return (
        <div className="bg-white border border-slate-100 p-8 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:border-emerald-500 transition-all group">
             <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                 <Icon size={18} strokeWidth={2.5} />
             </div>
             <div className="flex flex-col">
                 <span className="text-3xl font-black text-slate-800 tabular-nums leading-none mb-1 tracking-tighter">{value.toLocaleString()}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
             </div>
        </div>
    );
}

function StatusTag({ status }: { status: string }) {
    return (
        <span className={clsx(
            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
            status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
            status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
            'bg-rose-50 text-rose-700 border-rose-100'
        )}>
            {status === 'approved' ? 'OK' : status === 'pending' ? 'WAIT' : 'FAIL'}
        </span>
    );
}
