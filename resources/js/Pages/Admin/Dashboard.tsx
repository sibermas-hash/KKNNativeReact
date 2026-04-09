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
    ArrowRight,
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
    const roles = auth.user?.roles?.map((role: string | { name: string }) => 
        (typeof role === 'string' ? role : role.name).toLowerCase()
    ) ?? [];
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
        { label: 'KELOLA FILE', href: '/admin/unduhan', icon: Download },
    ] : [];

    return (
        <AppLayout title="Komando Transaksi & Data">
            <Head title="Pusat Komando Operasional | KKN UIN SAIZU" />
            
            <div className="space-y-12 pb-20">
                {/* STRUKTUR HEADER TACTICAL */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 -mx-12 -mt-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    {/* Background Visual Element */}
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/10 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Core Systems Operational</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter italic">
                            SELAMAT DATANG, <span className="text-emerald-500">{auth.user?.name}</span>
                        </h1>
                        <div className="flex items-center gap-6 mt-3">
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic">PERIODE AKTIF</span>
                                <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">{stats?.active_period || 'OPERASIONAL TERHENTI'}</span>
                             </div>
                             <div className="h-8 w-[1px] bg-emerald-50" />
                             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950 text-white text-[9px] font-black uppercase italic tracking-widest">
                                 SISTEM AKTIF: {new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase()}
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-12 relative z-10">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic">INTEGRITAS DATA</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Activity size={14} className="text-emerald-500" />
                                <span className="text-sm font-black text-emerald-950 italic uppercase tracking-widest tracking-tighter">SINYAL STABIL</span>
                            </div>
                        </div>
                        <div className="h-12 w-[1px] bg-emerald-100 hidden xl:block" />
                        <div className="p-4 bg-emerald-50 border border-emerald-100">
                             <Cpu className="text-emerald-500" size={24} />
                        </div>
                    </div>
                </div>

                {/* TELEMETRI STATS STRIP ( PREMIUM HIGH-CONTRAST ) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                    <StatBox title="MAHASISWA TERDAFTAR" value={stats?.total_students || 0} icon={Users} trend="DATA VALID" />
                    <StatBox title="KELOMPOK TERVERIFIKASI" value={stats?.total_groups || 0} icon={Users2} trend="TOTAL AKTIF" />
                    <StatBox title="LAPORAN HARIAN" value={stats?.total_reports || 0} icon={FileText} trend="REALTIME" />
                    <StatBox title="DOKUMEN AKHIR" value={stats?.total_final_reports || 0} icon={FileCheck} trend="TERKUMPUL" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    {/* COMMAND CENTER ACTION PANEL */}
                    <div className="xl:col-span-8 space-y-12">
                        <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                             <div className="px-8 py-5 border-b border-emerald-50 bg-emerald-50/10 flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-950 text-emerald-400">
                                    <ClipboardList size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em] italic leading-none">Otoritas Menu Utama</h3>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Instrumental Operasional Sistem</p>
                                </div>
                             </div>
                             
                             <div className="p-8 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-emerald-50/5">
                                {quickActions.map((action) => (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="h-36 bg-white border border-emerald-100 flex flex-col items-center justify-center gap-4 transition-all hover:bg-emerald-950 hover:text-white hover:-translate-y-1 group group active:scale-95 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                                        <div className="p-4 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600/10 group-hover:text-emerald-400 transition-all">
                                            <action.icon size={22} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">{action.label}</span>
                                    </Link>
                                ))}
                             </div>
                        </section>

                        {canManagePublic && (
                         <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                             <div className="px-8 py-5 border-b border-emerald-50 bg-emerald-50/10 flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-950 text-emerald-400">
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.3em] italic leading-none">Manajemen Publikasi</h3>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Pengaturan Informasi Eksternal</p>
                                </div>
                             </div>
                             
                             <div className="p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {publicContentActions.map((action) => (
                                    <Link
                                        key={action.href}
                                        href={action.href}
                                        className="py-6 border border-emerald-50 bg-white flex flex-col items-center justify-center gap-3 hover:border-emerald-500 hover:text-emerald-600 transition-all group shadow-sm active:scale-95"
                                    >
                                        <div className="text-emerald-300 group-hover:text-emerald-600 transition-colors">
                                            <action.icon size={18} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest italic">{action.label}</span>
                                    </Link>
                                ))}
                             </div>
                         </section>
                        )}
                    </div>

                    {/* TRACKER PANEL (TACTICAL SIDEBAR) */}
                    <div className="xl:col-span-4 space-y-12">
                         {/* INTEL BLOCK (COMMAND CENTER STYLE) */}
                         <div className="bg-emerald-950 p-10 text-white space-y-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 scale-150 group-hover:scale-110 transition-transform duration-1000">
                                <ShieldAlert size={120} />
                            </div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">Anomali Terdeteksi</span>
                                    <p className="text-[8px] font-bold text-emerald-500/40 uppercase mt-1">Audit Integritas Data</p>
                                </div>
                                <div className="p-2 bg-rose-500/20 text-rose-500 border border-rose-500/30">
                                    <Activity size={14} className="animate-pulse" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-6">
                                <span className="text-8xl font-black text-white tabular-nums leading-none tracking-tighter italic">{intelligence?.high_risk_count ?? 0}</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-rose-500 uppercase italic">High Risk</span>
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest italic mt-1 leading-none tracking-tighter">Anomali Sistem</span>
                                </div>
                            </div>
                            <Link 
                                href="/admin/auditor-aktivitas"
                                className="block w-full py-5 bg-emerald-500 text-white text-center text-[11px] font-black uppercase tracking-[0.3em] italic hover:bg-emerald-400 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 group/btn"
                            >
                                TINJAU ANOMALI
                                <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform" />
                            </Link>
                         </div>

                         {/* NOTIFICATION FEED */}
                         <div className="bg-white border border-emerald-50 shadow-sm">
                            <div className="p-4 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                                <span className="text-[9px] font-black text-emerald-600/40 uppercase tracking-widest">Registrasi terbaru</span>
                                <Activity size={12} className="text-emerald-500" />
                            </div>
                            <div className="divide-y divide-emerald-50/30">
                                {recentRegistrations?.slice(0, 6).map((reg) => (
                                    <div key={reg.id} className="p-4 flex items-center justify-between hover:bg-emerald-50/20 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight truncate w-40">{reg.mahasiswa?.user?.name}</span>
                                            <span className="text-[9px] font-bold text-emerald-600/40 uppercase tracking-widest leading-none mt-1">{reg.mahasiswa?.nim}</span>
                                        </div>
                                        <StatusTag status={reg.status} />
                                    </div>
                                ))}
                            </div>
                            <Link 
                                href="/admin/pendaftaran" 
                                className="block w-full py-4 text-center text-[9px] font-black text-emerald-600 hover:bg-emerald-50 uppercase tracking-[0.2em] border-t border-emerald-50 transition-all"
                            >
                                Lihat semua
                            </Link>
                         </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

import type { LucideIcon } from 'lucide-react';

function StatBox({ title, value, icon: Icon, trend }: { title: string; value: number; icon: LucideIcon; trend: string }) {
    return (
        <div className="bg-white border border-emerald-100 p-8 flex flex-col gap-5 shadow-sm hover:border-emerald-500 transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                 <Icon size={48} />
             </div>
             <div className="flex items-center justify-between">
                <div className="p-2.5 bg-emerald-950 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg">
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                <div className="px-2 py-1 bg-emerald-50 text-[8px] font-black text-emerald-600 uppercase tracking-widest italic border border-emerald-100">
                    {trend}
                </div>
             </div>
             <div className="flex flex-col">
                 <span className="text-4xl font-black text-emerald-950 tabular-nums leading-none mb-1 tracking-tighter italic">{value.toLocaleString()}</span>
                 <span className="text-[9px] font-black text-emerald-200 uppercase tracking-[0.2em] italic mt-1">{title}</span>
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
            {status === 'approved' ? 'Disetujui' : status === 'pending' ? 'Menunggu' : 'Ditolak'}
        </span>
    );
}
