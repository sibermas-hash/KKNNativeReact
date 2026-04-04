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
 Zap,
 ChevronRight,
 Cpu,
 BarChart3,
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
 'superadmin': 'ADMIN_PUSAT',
 'faculty_admin': 'ADMIN_FAKULTAS',
 'dpl': 'PERSONEL_DPL',
 'student': 'PESERTA_MAHASISWA',
 'admin_prodi': 'KOORDINATOR_PRODI'
 };
 const translatedRole = roleMap[userRole.toLowerCase()] || userRole.replace('_', ' ').toUpperCase();
 
 return (
 <AppLayout title="Pusat Kendali Operasional">
 <div className="space-y-8 pb-24">
 
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 OPERATIONAL_COMMAND_CENTER_V3.2
 </span>
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Welcome, <span className="text-primary">{translatedRole}</span>
 </h1>
 <p className="text-slate-400 text-[10px] font-semibold flex items-center gap-2 opacity-50">
 <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
 ACCESS_LEVEL_AUTHORIZED: TACTICAL_INSTRUMENTS_ACTIVE
 </p>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="text-right">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-1">Status_Periode</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {stats?.active_period || 'STANDBY'}
 </span>
 </div>
 <div className="h-8 w-8 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-primary ">
 <Activity className="w-4 h-4" />
 </div>
 </div>
 
 <div className="flex gap-2">
 <Link href="/admin/periods" className="h-10 w-10 bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/30 rounded-lg transition-all flex items-center justify-center">
 <CalendarDays className="w-4 h-4" />
 </Link>
 <Link href="/admin/registrations" className="h-10 w-10 bg-slate-900 text-white rounded-lg flex items-center justify-center transition-all">
 <Users className="w-4 h-4" />
 </Link>
 </div>
 </div>
 </div>

 {/* METRICS GRID */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <MetricCard label="TOTAL_PERSONNEL" value={stats?.total_students} icon={Users} color="primary" description="RECORDED" />
 <MetricCard label="ACTIVE_UNITS" value={stats?.total_groups} icon={Users2} color="emerald" description="DEPLOYED" />
 <MetricCard label="DAILY_THROUGHPUT" value={stats?.total_reports} icon={FileText} color="amber" description="TELEMETRY" />
 <MetricCard label="FINAL_AUDITS" value={stats?.total_final_reports} icon={CheckCircle2} color="primary" description="VERIFIED" />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* RECENT RECORDS */}
 <div className="lg:col-span-2 bg-white rounded-lg border border-slate-100 overflow-hidden">
 <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-white rounded-lg border border-slate-100 text-primary ">
 <ClipboardList className="w-5 h-5" />
 </div>
 <div className="flex flex-col">
 <h3 className="text-[11px] font-semibold text-slate-900 leading-none mb-1.5">Aktivitas Terkini</h3>
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 leading-none">REGISTRY_SYNC_STREAM</span>
 </div>
 </div>
 <Link href="/admin/registrations" className="flex items-center gap-2 text-[9px] font-semibold text-primary hover:text-primary-dark transition-all group/link">
 VIEW_FULL_LEDGER
 <ArrowRight className="w-3 h-3 " />
 </Link>
 </div>
 <div className="divide-y divide-slate-50">
 {recentRegistrations && recentRegistrations.length > 0 ? (
 recentRegistrations.map((reg) => (
 <div key={reg.id} className="px-8 py-5 hover:bg-slate-50/50 flex items-center justify-between group/row transition-colors">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 text-primary text-[11px] font-semibold flex items-center justify-center ">
 {reg.mahasiswa?.user?.name?.charAt(0) || 'U'}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] group-hover/row:text-primary transition-colors">
 {reg.mahasiswa?.user?.name || 'ENTITAS_PESERTA'}
 </span>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 font-mono">
 NIM: {reg.mahasiswa?.nim || '---'}
 </span>
 <span className="text-[9px] font-semibold text-primary/40">{reg.periode?.name}</span>
 </div>
 </div>
 </div>
 <span className={clsx(
 "inline-flex px-3 py-1 rounded-lg text-[9px] font-semibold ",
 reg.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
 reg.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
 'bg-rose-50 text-rose-600 border border-rose-100'
 )}>
 {reg.status}
 </span>
 </div>
 ))
 ) : (
 <div className="py-24 text-center">
 <ClipboardList className="w-10 h-10 text-slate-100 mx-auto mb-4" />
 <span className="text-[10px] font-semibold text-slate-900 opacity-20">NO_RECORDS_DETECTED</span>
 </div>
 )}
 </div>
 </div>

 {/* SDG ANALYTICS */}
 <div className="bg-white rounded-lg border border-slate-100 p-8 space-y-8 group overflow-hidden relative">
 <div className="absolute top-0 right-0 p-10 text-primary opacity-[0.03] pointer-events-none ">
 <Globe2 className="w-64 h-64" />
 </div>
 
 <div className="relative z-10">
 <h3 className="text-[11px] font-semibold text-slate-900 leading-none mb-1.5">SDG_ANALYTICS_V3</h3>
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 leading-none">PROGRAM_DISTRIBUTION_VECTOR</span>
 </div>

 <div className="space-y-6 relative z-10">
 {(() => {
 const totalSdgCount = sdg_distribution?.reduce((sum, item) => sum + item.count, 0) || 1;
 return (sdg_distribution || []).slice(0, 5).map((item) => {
 const sdg = SDG_DETAILS[item.id] || { name: `SDG ${item.id}`, color: 'bg-slate-100', icon: '📍' };
 const percentage = (item.count / totalSdgCount) * 100;
 
 return (
 <div key={item.id} className="space-y-3 group/item">
 <div className="flex justify-between items-end">
 <div className="flex items-center gap-3">
 <span className="text-xl ">{sdg.icon}</span>
 <span className="text-[9px] font-semibold text-slate-600 truncate max-w-[150px]">{sdg.name}</span>
 </div>
 <span className="text-sm font-semibold text-slate-900">{item.count}</span>
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

 {/* Tactical Global Monitor */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <ShieldCheck className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">INTEGRITY_CONTROL_PROTOCOL_V3.2</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: ENCRYPTED_SATELLITE_LINK_ACTIVE</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 Protokol audit sistem aktif. Seluruh aktivitas operasional terekam secara real-time untuk menjamin transparansi absolut mutasi data KKN UIN SAIZU.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">REALTIME_SURVEILLANCE</span>
 </div>
 <div className="flex gap-4 opacity-50">
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Fingerprint className="h-5 w-5" />
 </div>
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Globe2 className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, color, description }: any) {
 const colors: Record<string, string> = {
 primary: 'text-primary bg-primary/5 border-primary/10',
 emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
 amber: 'text-amber-500 bg-amber-500/5 border-amber-500/10',
 }

 return (
 <div className="bg-white p-8 rounded-lg border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all overflow-hidden relative">
 <div className="absolute top-0 right-0 p-8 text-slate-900 opacity-[0.02] pointer-events-none ">
 <Icon className="h-32 w-32" />
 </div>
 <div className="relative z-10">
 <p className="text-[9px] font-semibold text-slate-400 mb-1 group-hover:text-primary transition-colors">{label}</p>
 <div className="flex items-baseline gap-2">
 <p className="text-3xl font-semibold leading-none text-slate-900 transition-transform group-hover:translate-x-1">{(value || 0).toLocaleString()}</p>
 <span className="text-[8px] font-semibold text-slate-300">{description}</span>
 </div>
 </div>
 <div className={clsx('p-4 rounded-lg border transition-all', colors[color])}>
 <Icon className="w-6 h-6" />
 </div>
 </div>
 )
}
