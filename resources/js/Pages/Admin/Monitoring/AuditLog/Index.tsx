import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
 History,
 Search,
 User,
 Activity,
 Clock,
 Eye,
 ChevronRight,
 ShieldCheck,
 Zap,
 Cpu,
 Database,
 Binary,
 Layers,
 AlertTriangle,
 Navigation,
 Fingerprint,
 Ghost,
 Trophy,
 SearchCode,
 FileSearch,
 RefreshCw,
 Terminal,
 ShieldAlert,
 ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { LucideIcon } from '@/types';

interface AuditLog {
 id: number;
 description: string;
 subject_type: string | null;
 user?: { name: string; email: string };
 severity: 'low' | 'medium' | 'high';
 action: string;
 ip_address?: string;
 created_at: string;
}

interface Props {
 logs: { data: AuditLog[]; meta: PaginationMeta };
 filters: { search?: string };
 stats: { total: number; high_risk: number; unique_users: number; today_logs: number };
}

export default function AuditLogIndex({ logs, filters, stats }: Props) {
 const [search, setSearch] = useState(filters.search || '');

 const handleSearch = (e: React.FormEvent) => {
 e.preventDefault();
 router.get(route('admin.audit-log.index'), { search }, { preserveState: true });
 };

 return (
 <AppLayout title="Audit Log Intelijen Sistem">
 <Head title="Audit Log"/>

 <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8 text-emerald-950">
 
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-6 pt-12">
 <div className="flex items-center gap-3 text-[#1a7a4a]">
 <History size={20} />
 <span className="text-xs font-semibold opacity-80">Chronological Integrity Audit</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
 <div className="space-y-2">
 <h1 className="text-4xl font-semibold text-emerald-950 er leading-none">
 Intelijen <span className="text-[#1a7a4a]">Sistem.</span>
 </h1>
 <p className="text-sm font-semibold text-emerald-800 leading-relaxed max-w-2xl mt-4">
 Audit jejak aktivitas sistem secara immutable. Pantau seluruh anomali dan intervensi data melalui aliran kronologis yang terenkripsi untuk akuntabilitas operasional.
 </p>
 </div>
 <div className="shrink-0">
 <div className="h-20 px-10 bg-white border border-emerald-800 rounded-xl flex items-center gap-8 text-white shadow-sm shadow-emerald-900/40">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-emerald-800 leading-none mb-2">Populasi Record</span>
 <span className="text-2xl font-semibold text-white tabular-nums leading-none">{stats.total.toLocaleString('id-ID')} LOGS</span>
 </div>
 <div className="w-px h-10 bg-white/10"/>
 <Terminal size={28} className="text-emerald-800 drop-shadow-sm"/>
 </div>
 </div>
 </div>
 </div>

 {/* --- STATS OVERVIEW --- */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <MetricCard label="Pengguna Aktif"value={stats.unique_users} icon={User} desc="Authorized Actors"/>
 <MetricCard label="Aktivitas Harian"value={stats.today_logs} icon={Activity} desc="Daily Sequence"/>
 <MetricCard label="Risiko Tinggi"value={stats.high_risk} icon={ShieldAlert} type={stats.high_risk > 0 ? 'danger' : 'success'} desc="Security Anomaly"/>
 <MetricCard label="Kernel Pipeline"value="STABIL"icon={Cpu} desc="System Performance"/>
 </div>

 {/* --- DATA TABLE CARD --- */}
 <section className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="px-10 py-10 bg-gray-50 border-b-2 border-emerald-50 space-y-8">
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 bg-white rounded-xl border border-emerald-50 flex items-center justify-center text-[#1a7a4a] shadow-sm">
 <Binary size={24} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-lg font-semibold text-emerald-950 leading-none mb-1">Audit Stream</h3>
 <p className="text-xs font-bold text-emerald-800">Aliran Aktivitas Kronologis Real-Time</p>
 </div>
 </div>

 <form onSubmit={handleSearch} className="relative group">
 <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-800 group-focus-within:text-[#1a7a4a] transition-colors"strokeWidth={3} />
 <input 
 type="text"
 value={search} 
 onChange={(e) => setSearch(e.target.value)} 
 placeholder="CARI IDENTIFIER, AKSI, ATAU AKTOR..."
 className="w-full h-14 pl-14 pr-6 bg-white border border-emerald-50 rounded-xl text-xs font-semibold text-emerald-950 focus:border-[#1a7a4a] outline-none transition-all placeholder:text-black shadow-sm"
 />
 </form>
 </div>

 <div className="overflow-x-auto min-h-[500px]">
 <table className="min-w-full text-left border-collapse whitespace-nowrap">
 <thead className="bg-gray-50 text-emerald-950 border-b border-emerald-50">
 <tr>
 <th className="px-10 py-6 text-xs font-semibold">Node ID</th>
 <th className="px-8 py-6 text-xs font-semibold">Deskripsi Aktivitas</th>
 <th className="px-8 py-6 text-xs font-semibold text-center">Otoritas Aktor</th>
 <th className="px-8 py-6 text-xs font-semibold text-center">Subjek Event</th>
 <th className="px-10 py-6 text-right text-xs font-semibold">Runtime</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#f3f4f6]">
 {logs.data.length === 0 ? (
 <EmptyState />
 ) : (
 logs.data.map((log) => (
 <tr key={log.id} className={clsx(
"group hover:bg-gray-50 transition-all font-sans",
 log.severity === 'high' ? 'bg-rose-50/20' : log.severity === 'medium' ? 'bg-amber-50/10' : ''
 )}>
 <td className="px-10 py-8">
 <span className="text-xs font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors font-mono">#{log.id.toString().padStart(6, '0')}</span>
 </td>
 <td className="px-8 py-8">
 <div className="flex items-center gap-5">
 <div className={clsx(
"h-12 w-12 rounded-xl flex items-center justify-center transition-all shadow-sm border shrink-0 group-hover:rotate-6",
 log.severity === 'high' ? 'bg-rose-50 border-rose-100 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' : 
 log.severity === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-500 group-hover:bg-amber-500 group-hover:text-white' : 
 'bg-gray-50 border-emerald-50 text-[#1a7a4a] group-hover:bg-[#16a34a] group-hover:text-white'
 )}>
 {log.severity === 'high' ? <ShieldAlert size={22} strokeWidth={2.5} /> : <Activity size={22} strokeWidth={2.5} />}
 </div>
 <div className="flex flex-col gap-2">
 <span className="text-sm font-semibold text-emerald-950 group-hover:text-emerald-800 transition-colors leading-tight max-w-[400px] truncate">{log.description}</span>
 <span className={clsx(
"text-xs font-semibold",
 log.severity === 'high' ? 'text-rose-500' : log.severity === 'medium' ? 'text-amber-500' : 'text-emerald-800'
 )}>{log.action}</span>
 </div>
 </div>
 </td>
 <td className="px-8 py-8 text-center text-center">
 <div className="flex flex-col items-center">
 <span className="text-xs font-semibold text-[#1f2937] leading-none mb-2">{log.user?.name || 'SYSTEM_DAEMON'}</span>
 <span className="px-3 py-1 bg-white border border-emerald-50 rounded-lg text-xs font-semibold text-emerald-800">AUTHORIZED_ACTOR</span>
 </div>
 </td>
 <td className="px-8 py-8 text-center">
 <span className="h-8 px-4 inline-flex items-center bg-white border border-emerald-50 rounded-xl text-xs font-semibold text-[#1a7a4a] shadow-sm">
 {log.subject_type?.split('\\').pop() || 'STATIC_EVENT'}
 </span>
 </td>
 <td className="px-10 py-8 text-right whitespace-nowrap">
 <div className="flex flex-col items-end gap-3">
 <span className="text-xs font-semibold text-[#1a7a4a] font-mono">{log.created_at}</span>
 <Link href={route('admin.audit-log.show', log.id)} className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-2 group-hover:translate-x-0 translate-x-4 transition-all opacity-0 group-hover:opacity-100">
 INSPECT_PACKET <ArrowRight size={12} strokeWidth={3} />
 </Link>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* PAGINATION */}
 <div className="px-10 py-8 border-t-2 border-emerald-50 bg-gray-50 flex items-center justify-between">
 <span className="text-xs font-semibold text-emerald-800">
 Transmission Stage <strong className="text-emerald-950 text-xs tabular-nums">{logs.meta.current_page}</strong> OF <strong className="text-emerald-950 text-xs tabular-nums">{logs.meta.last_page}</strong> Active Frames
 </span>
 <Pagination meta={logs.meta} />
 </div>
 </section>

 {/* --- GOVERNANCE FOOTER --- */}
 <div className="bg-white rounded-xl p-12 text-white relative overflow-hidden shadow-sm border border-emerald-800 group/governance">
 <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-32 -mt-32 transition-transform group-hover/governance:rotate-45 duration-1000">
 <Cpu size={500} strokeWidth={0.5} />
 </div>
 <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
 <div className="space-y-6 flex-1">
 <div className="flex items-center gap-6">
 <div className="h-20 w-20 bg-gray-100/50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-800 shadow-inner group-hover/governance:scale-110 transition-transform">
 <ShieldCheck size={40} className="text-emerald-800"strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-2xl font-semibold leading-none mb-1">Integritas Log Kronologis</h3>
 <span className="text-xs font-semibold text-emerald-800 opacity-80">Protokol Keamanan Data Transparan</span>
 </div>
 </div>
 <p className="text-sm font-bold text-emerald-800 leading-relaxed max-w-4xl">
 Seluruh aktivitas dalam infrastruktur SIBERDAYA dicatat secara immutable melalui arsitektur audit log ini. Sistem ini menjamin transparansi operasional, akuntabilitas personil, dan integritas metadata KKN dari awal pendaftaran hingga yudisium akhir. Intervensi tanpa otorisasi akan memicu sinyal risiko tinggi secara otomatis.
 </p>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, desc, type }: { label: string; value: any; icon: any; desc: string; type?: 'success' | 'danger' }) {
 return (
 <div className="bg-white border border-emerald-50 rounded-xl p-6 flex items-center gap-5 shadow-sm hover:border-emerald-50 transition-all group overflow-hidden relative">
 <div className={clsx(
"h-14 w-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm border",
 type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-gray-50 border-emerald-50 text-[#1a7a4a]'
 )}>
 <Icon size={24} strokeWidth={2.5} />
 </div>
 <div className="flex flex-col relative z-20">
 <span className="text-xs font-semibold text-emerald-800 leading-none mb-3">{label}</span>
 <span className="text-2xl font-semibold text-emerald-950 er leading-none group-hover:text-emerald-800 transition-colors mb-1.5">{value}</span>
 <p className="text-xs font-semibold text-emerald-800 opacity-60 leading-none">{desc}</p>
 </div>
 </div>
 );
}

function EmptyState() {
 return (
 <tr>
 <td colSpan={10} className="px-10 py-32 text-center">
 <div className="flex flex-col items-center justify-center gap-4">
 <div className="h-24 w-24 bg-gray-50 rounded-xl flex items-center justify-center text-emerald-800 mb-2">
 <SearchCode size={48} strokeWidth={1} />
 </div>
 <span className="text-sm font-semibold text-emerald-950">Audit Silence</span>
 <p className="text-xs font-semibold text-emerald-800 leading-none opacity-60">Tidak ditemukan aliran transmisi log untuk parameter pencarian saat ini.</p>
 </div>
 </td>
 </tr>
 );
}
