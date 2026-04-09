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
    ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

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
    reports: {
        data: AuditedReport[];
        meta: PaginationMeta;
    };
    stats: {
        high_risk_count: number;
    };
}

export default function QualityAuditIndex({ reports, stats }: Props) {
    return (
        <AppLayout title="Audit Aktivitas">
            <Head title="Audit Intelijen | POS-KKN" />

            <div className="space-y-10 font-sans antialiased text-emerald-900">
                {/* Clean System Header */}
                <div className="bg-white border border-emerald-50 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                            <h1 className="text-xl font-black text-emerald-900 uppercase tracking-tighter">
                                AUDIT ANALITIK <span className="text-emerald-600">TERINTEGRASI</span>
                            </h1>
                        </div>
                        <p className="text-[10px] font-black text-emerald-600/40 uppercase tracking-widest leading-none">
                            PEMANTAUAN KUALITAS & INTEGRITAS AKTIVITAS MAHASISWA SECARA REAL-TIME
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="px-6 py-4 bg-white border border-emerald-50 rounded-full flex items-center gap-6 shadow-sm">
                            <div className="flex flex-col border-r border-emerald-50 pr-6">
                                <span className="text-[9px] font-black text-emerald-600/40 uppercase tracking-widest leading-none mb-1">ANOMALI</span>
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                                    <span className="text-xl font-black text-emerald-900 tabular-nums">{stats.high_risk_count}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-emerald-600/40 uppercase tracking-widest leading-none mb-1">STATUS</span>
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">OPTIMIZED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Grid */}
                <div className="bg-white border border-emerald-50 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-600 text-white rounded shadow-sm shadow-emerald-600/20">
                                <ScanLine className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900">INTELLIGENT SCANNER</h2>
                                <p className="text-[9px] font-bold text-emerald-600/40 mt-1 uppercase tracking-widest">VERIFIKASI LOG & DUPLIKASI KONTEKS</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                             <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                             <span className="text-[9px] font-black uppercase tracking-[0.2em]">LIVE MONITORING</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-emerald-50/10 border-b border-emerald-50">
                                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600/40 uppercase tracking-widest">SUBJEK & UNIT</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600/40 uppercase tracking-widest">DATA TELEMETRI</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-emerald-600/40 uppercase tracking-widest">VEKTOR RISIKO</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-emerald-600/40 uppercase tracking-widest">SKOR AUDIT</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-emerald-600/40 uppercase tracking-widest pr-10">INSTRUMEN</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50/30">
                                {reports.data.length > 0 ? (
                                    reports.data.map((report, idx) => (
                                        <motion.tr 
                                            key={report.id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.01 }}
                                            className="hover:bg-emerald-50/20 transition-all border-b border-emerald-50/10"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={clsx(
                                                        "h-10 w-10 flex items-center justify-center font-black text-sm border rounded shadow-sm",
                                                        report.risk_level === 'HIGH' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    )}>
                                                        {report.user_name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-emerald-900 uppercase tracking-tight">{report.user_name}</span>
                                                        <span className="text-[9px] font-black text-emerald-600/40 mt-0.5 uppercase tracking-widest">{report.group_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="max-w-xs space-y-1">
                                                    <p className="text-[11px] font-black text-emerald-800 uppercase tracking-tight line-clamp-1">{report.title}</p>
                                                    <p className="text-[9px] font-bold text-emerald-600/30 uppercase tabular-nums">REC: {report.submitted_at}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {report.risk_flags.length > 0 ? report.risk_flags.map((flag, fidx) => (
                                                        <span key={fidx} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black border border-rose-100 rounded uppercase tracking-widest">
                                                            {flag}
                                                        </span>
                                                    )) : (
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black border border-emerald-100 rounded uppercase tracking-widest">
                                                            Aman
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={clsx(
                                                        "h-10 w-10 rounded-full flex items-center justify-center text-xs font-black border transition-all shadow-sm",
                                                        report.risk_score >= 70 ? "bg-rose-600 text-white border-transparent animate-pulse" : 
                                                        report.risk_score >= 30 ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    )}>
                                                        {report.risk_score}
                                                    </div>
                                                    <span className="text-[7px] font-black text-emerald-600/30 uppercase">Skor risiko</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right pr-10">
                                                <div className="flex justify-end gap-2">
                                                    <button className="h-8 w-8 bg-white border border-emerald-100 text-emerald-400 hover:text-emerald-700 hover:border-emerald-300 rounded flex items-center justify-center transition-all shadow-sm active:scale-95" title="Verifikasi">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-24 text-center text-emerald-100">
                                            <Database size={48} className="mx-auto mb-4 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Tidak Ada Data</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Analytical Overlays (White/Green Style) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-10 bg-emerald-600 text-white rounded shadow-lg shadow-emerald-600/10 flex items-center gap-8 group">
                        <div className="p-5 bg-white/20 rounded shadow-inner rotate-3 transition-transform group-hover:rotate-0">
                            <Activity className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-[0.2em]">SISTEM ANALITIK: AKTIF</h4>
                            <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest leading-relaxed">
                                PEMINDAIAN INTEGRITAS OTOMATIS BERJALAN PADA SETIAP ENTRI DATA LAPORAN.
                            </p>
                        </div>
                    </div>

                    <div className="p-10 bg-white border border-emerald-50 rounded shadow-sm flex items-center justify-around gap-8 group hover:border-emerald-500 transition-all">
                         <div className="flex flex-col items-center gap-2">
                             <BarChart3 className="h-8 w-8 text-emerald-100 group-hover:text-emerald-600 transition-colors" />
                             <span className="text-[9px] font-black text-emerald-600/30 uppercase tracking-widest group-hover:text-emerald-600">ANALITIK</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                             <Database className="w-8 h-8 text-emerald-100 group-hover:text-emerald-600 transition-colors" />
                             <span className="text-[9px] font-black text-emerald-600/30 uppercase tracking-widest group-hover:text-emerald-600">DATABASE</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                             <ShieldCheck className="w-8 h-8 text-emerald-100 group-hover:text-emerald-600 transition-colors" />
                             <span className="text-[9px] font-black text-emerald-600/30 uppercase tracking-widest group-hover:text-emerald-600">SECURITY</span>
                         </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                     <div className="inline-flex items-center justify-center gap-4 text-emerald-100 font-black text-[10px] uppercase tracking-[0.6em]">
                         <Zap className="w-3 h-3 text-emerald-500" />
                         Mesin audit aktif • {new Date().getFullYear()}
                     </div>
                </div>
            </div>
        </AppLayout>
    );
}
