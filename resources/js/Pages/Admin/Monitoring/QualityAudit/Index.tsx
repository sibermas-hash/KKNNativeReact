import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
 CheckCircle, 
 ShieldAlert, 
 Zap,
 BarChart3,
 Activity,
 ScanLine,
 Database,
 ShieldCheck,
 Search,
 Filter,
 Trophy,
 SearchCode,
 FileSearch,
 RefreshCw,
 Cpu,
 ArrowRight,
 ShieldQuestion,
 AlertTriangle,
 Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface AuditedReport {
 id: number;
 user_name: string;
 group_name: string;
 title: string;
 submitted_at: string;
 risk_score: number;
 risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
 risk_flags: string[];
 description_preview: string;
}

interface Props {
 reports: { data: AuditedReport[]; meta: PaginationMeta };
 stats: { high_risk_count: number };
}

export default function QualityAuditIndex({ reports, stats }: Props) {
 return (
 <AppLayout title="Audit Kualitas & Integritas Aktivitas">
 <Head title="Audit Aktivitas"/>

 <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-gray-900">
 
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-6 pt-12">
 <div className="flex items-center gap-3 text-[#1a7a4a]">
 <ShieldAlert size={20} />
 <span className="text-xs font-semibold opacity-80">Monitoring & Penjaminan Mutu</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
 <div className="space-y-2">
 <h1 className="text-4xl font-semibold text-gray-900 er leading-none">
 Audit <span className="text-[#1a7a4a]">Integritas.</span>
 </h1>
 <p className="text-sm font-semibold text-gray-700 leading-relaxed max-w-2xl mt-4">
 Pemindaian otomatis kualitas pelaporan dan kejujuran data aktivitas lapangan. Identifikasi anomali transmisi laporan untuk memastikan validitas output pengabdian.
 </p>
 </div>
 <div className="shrink-0">
 <div className="h-20 px-10 bg-[#16a34a] border border-[#1a7a4a] rounded-xl flex items-center gap-8 text-white shadow-sm shadow-none">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-gray-700 leading-none mb-2">Laporan Berisiko</span>
 <span className="text-2xl font-semibold text-white tabular-nums leading-none">{stats.high_risk_count} ENTITAS</span>
 </div>
 <div className="w-px h-10 bg-white/20"/>
 <ShieldQuestion size={28} className="text-white drop-shadow-sm"/>
 </div>
 </div>
 </div>
 </div>

 {/* --- STATS OVERVIEW --- */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <MetricCard label="Audit Pipeline"value="STABIL"icon={ShieldCheck} desc="Sistem Pemindaian"/>
 <MetricCard label="Update Sinyal"value="REAL-TIME"icon={RefreshCw} desc="Analisis Lanjuatn"/>
 <MetricCard label="Integritas Node"value="SECURE"icon={Database} desc="Keamanan Metadata"/>
 <MetricCard label="Level Risiko"value="OPTIMAL"icon={Activity} desc="Parameter Global"/>
 </div>

 {/* --- DATA TABLE CARD --- */}
 <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="px-10 py-10 bg-gray-50 border-b-2 border-gray-200 flex items-center justify-between">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-[#1a7a4a] shadow-sm">
 <ScanLine size={32} className="animate-pulse"strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-xl font-semibold text-gray-900 leading-none mb-1.5">Scanner Integritas</h3>
 <p className="text-xs font-bold text-gray-700 leading-none">Identifikasi Anomali Pelaporan Secara Otomatis</p>
 </div>
 </div>

 <div className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
 <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse shadow-sm shadow-none"/>
 <span className="text-xs font-semibold text-gray-900">SENTINEL_ACTIVE</span>
 </div>
 </div>

 <div className="overflow-x-auto min-h-[500px]">
 <table className="min-w-full text-left border-collapse whitespace-nowrap">
 <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
 <tr>
 <th className="px-10 py-6 text-xs font-semibold">Identitas Peserta & Unit</th>
 <th className="px-8 py-6 text-xs font-semibold">Rincian Transmisi Laporan</th>
 <th className="px-8 py-6 text-center text-xs font-semibold">Indikasi Temuan</th>
 <th className="px-8 py-6 text-center text-xs font-semibold">Risk Score</th>
 <th className="px-10 py-6 text-right text-xs font-semibold">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#f3f4f6]">
 {reports.data.length === 0 ? (
 <EmptyState />
 ) : (
 reports.data.map((r) => (
 <tr key={r.id} className={clsx(
"group hover:bg-gray-50 transition-all font-sans",
 r.risk_level === 'HIGH' ? 'bg-rose-50/20' : ''
 )}>
 <td className="px-10 py-8">
 <div className="flex items-center gap-5">
 <div className={clsx(
"h-12 w-12 rounded-xl flex items-center justify-center font-semibold text-sm border shadow-sm transition-all group-hover:bg-[#16a34a] group-hover:text-white group-hover:border-emerald-600",
 r.risk_level === 'HIGH' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-[#e8f5ee] border-gray-200 text-gray-700'
 )}>
 {r.user_name.charAt(0)}
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors max-w-[200px] truncate mb-2">{r.user_name}</span>
 <span className="text-xs font-semibold text-gray-700 opacity-60 leading-none">{r.group_name}</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-8">
 <div className="flex flex-col gap-2">
 <span className="text-xs font-semibold text-gray-700 leading-tight max-w-[300px] truncate">{r.title}</span>
 <div className="flex items-center gap-2">
 <Clock size={12} className="text-gray-600"strokeWidth={3} />
 <span className="text-xs font-semibold text-gray-600 font-mono">{r.submitted_at}</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-8 text-center">
 <div className="flex flex-wrap justify-center gap-2">
 {r.risk_flags.length > 0 ? r.risk_flags.map((flag, idx) => (
 <span key={idx} className="h-6 px-3 bg-rose-50 border border-rose-100 text-rose-500 text-xs font-semibold rounded-lg flex items-center shadow-sm">
 {flag.replace(/_/g, ' ')}
 </span>
 )) : (
 <span className="h-6 px-3 bg-[#16a34a] border border-[#1a7a4a] text-white text-xs font-semibold rounded-lg flex items-center shadow-sm shadow-none">PASSED</span>
 )}
 </div>
 </td>
 <td className="px-8 py-8 text-center text-center">
 <div className={clsx(
 'h-12 w-12 inline-flex items-center justify-center rounded-xl text-sm font-semibold border transition-all shadow-sm', 
 r.risk_score >= 70 ? 'bg-rose-600 text-white border-rose-500 shadow-rose-200' : 
 r.risk_score >= 30 ? 'bg-amber-50 border-amber-100 text-amber-500 shadow-amber-50' : 
 'bg-white border-gray-200 text-[#1a7a4a] shadow-emerald-50'
 )}>
 {r.risk_score}
 </div>
 </td>
 <td className="px-10 py-8 text-right whitespace-nowrap">
 <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
 <button className="h-10 px-5 bg-white border border-gray-200 text-gray-900 hover:bg-white hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm">
 AUDIT_DETAIL <ArrowRight size={14} className="ml-2"strokeWidth={3} />
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* PAGINATION */}
 <div className="px-10 py-8 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between">
 <span className="text-xs font-semibold text-gray-700">
 Data Halaman <strong className="text-gray-900 text-xs tabular-nums">{reports.meta.current_page}</strong> Per <strong className="text-gray-900 text-xs tabular-nums">{(reports.meta.total || 0).toLocaleString('id-ID')}</strong> Entitas Terdeteksi
 </span>
 <Pagination meta={reports.meta} />
 </div>
 </section>

 {/* --- GOVERNANCE FOOTER --- */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="bg-white rounded-xl p-10 text-white relative overflow-hidden shadow-sm border border-emerald-800 group/audit">
 <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 -mr-12 -mt-12 group-hover/audit:rotate-45 transition-transform duration-1000"><Activity size={200} /></div>
 <div className="flex items-center gap-8 relative z-10">
 <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
 <ShieldCheck size={32} className="text-gray-700"strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h4 className="text-lg font-semibold leading-none">Integritas Sentinel</h4>
 <p className="text-xs font-bold text-gray-600 leading-relaxed">Pemindaian kejujuran otomatis berjalan secara real-time pada setiap transmisi data pelaporan mahasiswa.</p>
 </div>
 </div>
 </div>
 
 <div className="bg-[#16a34a] rounded-xl p-10 text-white flex items-center justify-between relative overflow-hidden group/meta shadow-sm border border-[#1a7a4a]">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent)]"/>
 <div className="space-y-4 relative z-10">
 <h4 className="text-xs font-semibold text-gray-900 text-gray-500">System Surveillance Metadata</h4>
 <div className="flex flex-col">
 <span className="text-3xl font-semibold er italic text-white">KERNELS_NOMINAL</span>
 <span className="text-xs font-semibold text-gray-600 opacity-70">Security Registry Secured</span>
 </div>
 </div>
 <div className="flex items-center gap-4 relative z-10">
 <div className="h-12 w-12 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center shadow-inner group-hover/meta:scale-110 transition-transform"><Database size={24} strokeWidth={2.5} /></div>
 <div className="h-12 w-12 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center shadow-inner group-hover/meta:rotate-12 transition-transform"><BarChart3 size={24} strokeWidth={2.5} /></div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, desc }: { label: string; value: string; icon: any; desc: string }) {
 return (
 <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5 shadow-sm hover:border-gray-200 transition-all group overflow-hidden relative">
 <div className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border bg-gray-50 text-[#1a7a4a] border-gray-200">
 <Icon size={24} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col relative z-20">
 <span className="text-xs font-semibold text-gray-700 leading-none mb-3">{label}</span>
 <span className="text-2xl font-semibold text-gray-900 er leading-none group-hover:text-gray-700 transition-colors mb-1.5">{value}</span>
 <p className="text-xs font-semibold text-gray-600 opacity-60 leading-none">{desc}</p>
 </div>
 </div>
 );
}

function EmptyState() {
 return (
 <tr>
 <td colSpan={10} className="px-10 py-32 text-center">
 <div className="flex flex-col items-center justify-center gap-4">
 <div className="h-24 w-24 bg-gray-50 rounded-xl flex items-center justify-center text-gray-700 mb-2">
 <SearchCode size={48} strokeWidth={1} />
 </div>
 <span className="text-sm font-semibold text-gray-900">Audit Aktivitas Nihil</span>
 <p className="text-xs font-semibold text-gray-700 leading-none opacity-60">Tidak ditemukan indikasi risiko pelaporan untuk saat ini.</p>
 </div>
 </td>
 </tr>
 );
}
