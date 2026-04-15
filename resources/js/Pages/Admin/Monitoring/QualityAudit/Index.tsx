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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Pagination, Button } from '@/Components/ui';
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
 <AppLayout title="Audit Aktivitas Mahasiswa">
 <Head title="Audit Aktivitas" />

 <div className="max-w-7xl mx-auto space-y-8 pb-24 text-black font-sans">
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-4">
 <div className="flex items-center gap-3 text-emerald-600">
 <ShieldAlert size={18} />
 <span className="text-xs font-bold tracking-[0.25em] opacity-80">Monitoring & Penjaminan Mutu</span>
 </div>
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-1">
 <h1 className="text-2xl font-semibold text-black tracking-tight">
 Audit <span className="text-emerald-500">Aktivitas.</span>
 </h1>
 <p className="text-sm font-semibold text-emerald-950 font-semibold text-xs mt-2 leading-relaxed max-w-2xl">
 Aturan Validasi Integritas Pelaporan dan Audit Kualitas Output Mahasiswa KKN Terpadu
 </p>
 </div>
 <div className="flex items-center gap-4">
 <div className="h-14 px-6 bg-white border border-emerald-100/60 rounded-2xl flex items-center gap-4 shadow-sm">
 <div className="flex items-center gap-2">
 <ShieldAlert size={16} className="text-rose-500" />
 <div className="flex flex-col">
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-none mb-1">Mencurigakan</span>
 <span className="text-sm font-bold text-rose-600 tabular-nums leading-none tracking-tight">{stats.high_risk_count} LAPORAN</span>
 </div>
 </div>
 <div className="w-px h-8 bg-emerald-50/60" />
 <div className="flex items-center gap-2">
 <CheckCircle size={16} className="text-emerald-500" />
 <div className="flex flex-col">
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-none mb-1">Status Auditor</span>
 <span className="text-sm font-bold text-emerald-600 leading-none tracking-tight">AKTIF</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* --- AUDIT LEDGER --- */}
 <section className="bg-white border border-emerald-100/60 rounded-xl overflow-hidden shadow-sm">
 <div className="p-3 bg-emerald-50/30/20 border-b border-slate-50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 bg-emerald-600 text-white rounded flex items-center justify-center shadow-lg shadow-emerald-100"><ScanLine size={16} className="animate-pulse" /></div>
 <span className="text-sm font-bold text-black tracking-tight">PEMINDAI INTEGRITAS OTOMATIS</span>
 </div>
 <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
 <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
 <span className="text-sm font-bold font-semibold text-xs">LIVE_MONITORING</span>
 </div>
 </div>

 <div className="overflow-x-auto min-h-[400px]">
 <table className="w-full text-left">
 <thead className="bg-emerald-50/30 border-b border-slate-50 text-sm font-bold font-semibold text-xs text-emerald-950">
 <tr>
 <th className="px-6 py-4">Faksi & Unit</th>
 <th className="px-6 py-4">Rincian Laporan</th>
 <th className="px-6 py-4 text-center">Indikasi Masalah</th>
 <th className="px-6 py-4 text-center">Risk Score</th>
 <th className="px-6 py-4 text-right">Aksi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {reports.data.map((r) => (
 <tr key={r.id} className="group hover:bg-emerald-50/30/50 transition-all">
 <td className="px-6 py-4">
 <div className="flex items-center gap-4">
 <div className={clsx('h-9 w-9 flex items-center justify-center font-bold text-sm border rounded-lg transition-all group-hover:bg-emerald-600 group-hover:text-white', r.risk_level === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50/30 text-slate-300 border-emerald-100/60')}>{r.user_name.charAt(0)}</div>
 <div className="flex flex-col">
 <span className="text-sm font-bold text-black leading-tight truncate max-w-[150px]">{r.user_name}</span>
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs">{r.group_name}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-emerald-700 leading-tight line-clamp-1">{r.title}</span>
 <span className="text-sm font-bold text-slate-300 font-semibold text-xs mt-1">TIMESTAMP: {r.submitted_at}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="flex flex-wrap justify-center gap-1.5">
 {r.risk_flags.length > 0 ? r.risk_flags.map((flag, idx) => (
 <span key={idx} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-sm font-bold border border-rose-100 rounded font-bold text-center">
 {flag.replace(/_/g, ' ')}
 </span>
 )) : (
 <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-100 rounded font-semibold text-xs">NORMAL</span>
 )}
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <div className={clsx('inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold border transition-all shadow-sm', r.risk_score >= 70 ? 'bg-rose-600 text-white border-transparent' : r.risk_score >= 30 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100')}>{r.risk_score}</div>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="h-8 w-8 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 border border-transparent hover:border-emerald-100 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" title="Auto-Verify"><CheckCircle size={14} /></button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>

 {/* --- MONITORING OVERLAY --- */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-emerald-600 p-8 rounded-xl text-white relative overflow-hidden flex items-center gap-6 shadow-xl shadow-emerald-100">
 <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={100} /></div>
 <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><ShieldCheck size={24} /></div>
 <div className="space-y-1 relative z-10">
 <h4 className="text-sm font-bold font-semibold text-xs leading-none">Integrity Guard: ACTIVE</h4>
 <p className="text-sm font-bold text-emerald-100/60 font-semibold text-xs leading-relaxed">PEMINDAIAN KEJUJURAN OTOMATIS BERJALAN PADA SETIAP ENTRI DATA LAPORAN SECARA REAL-TIME.</p>
 </div>
 </div>
 <div className="bg-emerald-600 p-8 rounded-xl text-white flex items-center justify-between relative overflow-hidden group shadow-xl shadow-emerald-100">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
 <div className="space-y-1 relative z-10">
 <h4 className="text-sm font-bold text-emerald-500 font-semibold text-xs leading-none mb-1">Surveillance Metadata</h4>
 <p className="text-xl font-bold tracking-tight tabular-nums">KERNELS_NOMINAL</p>
 </div>
 <div className="flex items-center gap-3 relative z-10">
 <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center"><BarChart3 size={20} className="text-emerald-500" /></div>
 <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center"><Database size={20} className="text-emerald-950 group-hover:text-emerald-500 transition-colors" /></div>
 </div>
 </div>
 </div>

 <div className="flex justify-center py-6">
 <div className="flex items-center gap-3 text-slate-300 font-bold text-sm tracking-wider text-xs font-semibold opacity-50">
 <Zap size={12} className="text-emerald-500 animate-pulse" />
 Audit Active System • Sentinel Registry Integrity
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
