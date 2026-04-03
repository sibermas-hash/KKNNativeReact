import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Users,
    Users2,
    FileText,
    CheckCircle2,
    ArrowRight,
    Globe2,
    CalendarDays,
    Activity,
    ClipboardList,
    MoreHorizontal,
    ShieldCheck,
    Fingerprint,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';

const SDG_DETAILS: Record<number, { name: string; color: string; icon: string }> = {
    1: { name: 'Tanpa Kemiskinan', color: 'bg-[#E5243B]', icon: '💰' },
    2: { name: 'Tanpa Kelaparan', color: 'bg-[#DDA63A]', icon: '🌾' },
    3: { name: 'Kehidupan Sehat & Sejahtera', color: 'bg-[#4C9F38]', icon: '🏥' },
    4: { name: 'Pendidikan Berkualitas', color: 'bg-[#C5192D]', icon: '🎓' },
    5: { name: 'Kesetaraan Gender', color: 'bg-[#FF3A21]', icon: '⚖️' },
    6: { name: 'Air Bersih & Sanitasi', color: 'bg-[#26BDE2]', icon: '🚰' },
    7: { name: 'Energi Bersih & Terjangkau', color: 'bg-[#FCC30B]', icon: '⚡' },
    8: { name: 'Pekerjaan Layak & Pertumbuhan Ekonomi', color: 'bg-[#A21942]', icon: '📈' },
    9: { name: 'Industri, Inovasi & Infrastruktur', color: 'bg-[#FD6925]', icon: '🏗️' },
    10: { name: 'Berkurangnya Kesenjangan', color: 'bg-[#DD1367]', icon: '🤝' },
    11: { name: 'Kota & Permukiman Berkelanjutan', color: 'bg-[#FD9D24]', icon: '🏙️' },
    12: { name: 'Konsumsi & Produksi Bertanggung Jawab', color: 'bg-[#BF8B2E]', icon: '♻️' },
    13: { name: 'Penanganan Perubahan Iklim', color: 'bg-[#3F7E44]', icon: '🌡️' },
    14: { name: 'Ekosistem Laut', color: 'bg-[#0A97D9]', icon: '🌊' },
    15: { name: 'Ekosistem Daratan', color: 'bg-[#56C02B]', icon: '🌳' },
    16: { name: 'Perdamaian, Keadilan & Kelembagaan Kuat', color: 'bg-[#00689D]', icon: '🕊️' },
    17: { name: 'Kemitraan untuk Mencapai Tujuan', color: 'bg-[#19486A]', icon: '🌍' },
};

interface Registration {
    id: number;
    status: string;
    mahasiswa?: {
        nim: string;
        user?: { name: string; };
    };
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
    active_period: string;
    total_work_programs: number;
    total_final_reports: number;
    reported_posko: number;
}

interface Props {
    stats?: DashboardStats;
    sdg_distribution?: SdgDistributionItem[];
    recentRegistrations?: Registration[];
}

export default function AdminDashboard({ auth, stats, sdg_distribution, recentRegistrations }: Props & { auth: any }) {
    const userRole = auth.user?.roles?.[0] || 'Administrator';
    
    const roleMap: Record<string, string> = {
        'superadmin': 'Pusat Komando',
        'faculty_admin': 'Otoritas Fakultas',
        'dpl': 'Personel DPL',
        'student': 'Peserta Mahasiswa',
        'admin_prodi': 'Koordinator Program'
    };
    const translatedRole = roleMap[userRole.toLowerCase()] || userRole.replace('_', ' ').toUpperCase();
    
    return (
        <AppLayout title="Pusat Kendali Operasional">
            <div className="space-y-8 pb-20">
                
                {/* Sleek Minimalist Operational Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse />
                            <span className="text-[9px] font-black text-emerald-600 uppercase  italic">
                                OPERATIONAL_HUB_EMERALD_V3
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900  uppercase italic leading-none">
                            Selamat Datang, <br className="md:hidden" />
                            <span className="text-primary">{translatedRole}</span>
                        </h1>
                        <p className="text-slate-400 font-bold text-[11px] italic  flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                            Akses taktis ke seluruh instrumen operasional KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4
                            <div className="text-right">
                                <span className="block text-[8px] font-black text-slate-400 uppercase  italic leading-none mb-1">Status Periode</span>
                                <span className="text-xs font-black text-slate-900 uppercase italic 
                                    {stats?.active_period || 'HUB_WAITING'}
                                </span>
                            </div>
                            <div className="h-8 w-8 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-primary">
                                <Activity className="w-4 h-4 stroke-[2.5px]" />
                            </div>
                        </div>
                        
                        <div className="flex gap-1.5">
                            <Link 
                                href="/admin/periods" 
                                className="h-10 w-10 bg-white text-slate-400 border border-slate-200 rounded-lg flex items-center justify-center transition-all hover:text-primary hover:border-primary/30 hover:shadow-lg active:scale-95 transition-all"
                                title="Kelola Periode"
                            >
                                <CalendarDays className="w-4 h-4" />
                            </Link>
                            <Link 
                                href="/admin/registrations" 
                                className="h-10 w-10 bg-primary text-white rounded-lg flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95"
                                title="Audit Registrasi"
                            >
                                <Users className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* METRICS GRID - HIGH DENSITY COMPACT */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                        label="TOTAL MAHASISWA" 
                        value={stats?.total_students} 
                        icon={Users} 
                        color="primary"
                        description="Terdaftar"
                    />
                    <MetricCard 
                        label="KELOMPOK AKTIF" 
                        value={stats?.total_groups} 
                        icon={Users2} 
                        color="blue"
                        description="Unit"
                    />
                    <MetricCard 
                        label="LAPORAN HARIAN" 
                        value={stats?.total_reports} 
                        icon={FileText} 
                        color="amber"
                        description="Aktivitas"
                    />
                    <MetricCard 
                        label="LAPORAN AKHIR" 
                        value={stats?.total_final_reports} 
                        icon={CheckCircle2} 
                        color="emerald"
                        description="Audit"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* RECENT RECORDS - COMPACT */}
                    <div className="lg:col-span-2 bg-whiterounded-lg border border-slate-100 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-primary">
                                    <ClipboardList className="w-5 h-5 stroke-[2.5px]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900  leading-none uppercase italic">Aktivitas Terkini</h3>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase  italic leading-none">Sinkronisasi Registrasi</p>
                                </div>
                            </div>
                            <Link href="/admin/registrations" className="flex items-center gap-2 text-[9px] font-black text-primary hover:text-primary-dark transition-colors uppercase  italic group/link">
                                Selengkapnya
                                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentRegistrations && recentRegistrations.length > 0 ? (
                                recentRegistrations.map((reg) => (
                                    <div key={reg.id} className="px-8 py-5 hover:bg-slate-50/40 transition-all flex items-center justify-between group/row cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-base font-black text-slate-300 group-hover/row:bg-primary group-hover/row:text-white transition-all italic leading-none">
                                                {reg.mahasiswa?.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-black text-[13px] text-slate-900 leading-none group-hover/row:text-primary transition-colors italic uppercase">{reg.mahasiswa?.user?.name || 'ENTITAS_PESERTA'}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400 italic">NIM: {reg.mahasiswa?.nim || '---'}</span>
                                                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                    <span className="text-[9px] font-bold text-slate-400 italic uppercase truncate max-w-[120px]">{reg.periode?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={clsx(
                                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase  italic",
                                            reg.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            reg.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            'bg-rose-50 text-rose-600 border border-rose-100'
                                        )}>
                                            {reg.status === 'pending' ? 'Menunggu' : (reg.status === 'approved' ? 'Disetujui' : 'Ditolak')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 text-center">
                                    <ClipboardList className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase  italic">Belum ada aktivitas terekam</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SDG ANALYTICS - COMPACT */}
                    <div className="bg-whiterounded-lg border border-slate-100 p-8 space-y-8 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-primary rotate-12 group-hover:rotate-45 transition-transform pointer-events-none">
                             <Globe2 className="w-32 h-32" />
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-base font-black text-slate-900  leading-none uppercase italic">Analitik SDG</h3>
                            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase  italic leading-none">Distribusi Fokus Program</p>
                        </div>

                        <div className="space-y-5 relative z-10">
                            {(() => {
                                const totalSdgCount = sdg_distribution?.reduce((sum, item) => sum + item.count, 0) || 1;
                                return (sdg_distribution || []).slice(0, 4).map((item) => {
                                    const sdg = SDG_DETAILS[item.id] || { name: `SDG ${item.id}`, color: 'bg-slate-100', icon: '📍' };
                                    const percentage = (item.count / totalSdgCount) * 100;
                                    
                                    return (
                                        <div key={item.id} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl drop-shadow-sm">{sdg.icon}</span>
                                                    <span className="text-[10px] font-black text-slate-700 truncate max-w-[120px] uppercase italic 
                                                </div>
                                                <span className="text-xs font-black text-slate-900 tabular-nums italic">{item.count}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div 
                                                    className={clsx("h-full rounded-full transition-all", sdg.color)} 
                                                    style={{ width: `${Math.max(5, percentage)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                {/* Tactical Global Monitor - COMPACT */}
                <div className="p-8 bg-[#043d23] rounded-[2.5rem] border border-primary/20 relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-black text-white uppercase  italic leading-none">INTEGRITY_CONTROL_PROTOCOL</h4>
                                    <p className="text-[8px] text-emerald-400 font-bold  mt-1.5 italic">STATUS: ENCRYPTED_SATELLITE_LINK</p>
                                </div>
                            </div>
                            <p className="text-[12px] text-slate-400 font-bold leading-relaxed max-w-3xl italic opacity-80">
                                Protokol audit sistem aktif. Seluruh aktivitas operasional terekam secara real-time untuk keperluan monitoring KKN UIN SAIZU.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 border-l border-slate-800 pl-8 hidden lg:flex">
                             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[9px] font-black text-slate-100 uppercase  italic">LIVE</span>
                             </div>
                             <div className="flex gap-3">
                                <Fingerprint className="h-6 w-6 text-slate-600 hover:text-primary transition-colors cursor-help" />
                                <Globe2 className="h-6 w-6 text-slate-600 hover:text-primary transition-colors cursor-help" />
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color, description }: any) {
    const iconColors: Record<string, string> = {
        primary: 'bg-primary text-white
        blue: 'bg-blue-600 text-white
        amber: 'bg-amber-600 text-white
        emerald: 'bg-emerald-600 text-white
    };

    return (
        <div className="bg-white rounded-[1.5rem] p-5 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-slate-900 transition-transform group-hover:scale-125">
                 <Icon className="w-16 h-16" />
            </div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className={clsx("p-2.5 rounded-xl transition-all group-hover:rotate-6", iconColors[color])}>
                    <Icon className="w-4 h-4 stroke-[2.5px]" />
                </div>
                <div className="text-left font-black text-[9px] text-slate-400 uppercase  grow italic leading-none">{label}</div>
            </div>
            
            <div className="flex items-baseline gap-2 relative z-10">
                <h4 className="text-3xl font-black text-slate-900  leading-none italic tabular-nums">
                    {value?.toLocaleString() || 0}
                </h4>
                <span className="text-[8px] font-black text-slate-300 uppercase  italic">{description}</span>
            </div>
            
            <div className="mt-6 border-t border-slate-50 pt-4 opacity-50 flex justify-end">
                <MoreHorizontal className="w-4 h-4 text-slate-200 group-hover:text-primary transition-colors cursor-pointer" />
            </div>
        </div>
    );
}
