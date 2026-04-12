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
                <div className="bg-white border border-slate-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                            <h1 className="text-xl font-bold text-emerald-900 uppercase tracking-tighter">
                                AUDIT KUALITAS <span className="text-emerald-600">LAPORAN</span>
                            </h1>
                        </div>
                        <p className="text-[10px] font-bold text-emerald-600/40 uppercase tracking-widest leading-none">
                            PANTAU KEJUJURAN DAN KUALITAS LAPORAN MAHASISWA SECARA REAL-TIME
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="px-6 py-4 bg-white border border-slate-100 rounded-full flex items-center gap-6 shadow-sm">
                            <div className="flex flex-col border-r border-slate-100 pr-6">
                                <span className="text-[9px] font-bold text-emerald-600/40 uppercase tracking-widest leading-none mb-1">MENCURIGAKAN</span>
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                                    <span className="text-xl font-bold text-emerald-900 tabular-nums">{stats.high_risk_count}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-emerald-600/40 uppercase tracking-widest leading-none mb-1">AUDITOR</span>
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">AKTIF</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Grid */}
                <div className="bg-white border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-600 text-white rounded shadow-sm shadow-emerald-600/20">
                                <ScanLine className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-emerald-900">PEMINDAI OTOMATIS</h2>
                                <p className="text-[9px] font-bold text-emerald-600/40 mt-1 uppercase tracking-widest">CEK KEASLIAN DAN KESESUAIAN KONTEKS LAPORAN</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-slate-200">
                             <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                             <span className="text-[9px] font-bold uppercase tracking-widest">PANTAUAN LANGSUNG</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-bold text-emerald-600/40 uppercase tracking-widest">MAHASISWA & KELOMPOK</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-emerald-600/40 uppercase tracking-widest">RINCIAN LAPORAN</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-bold text-emerald-600/40 uppercase tracking-widest">INDIKASI MASALAH</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-bold text-emerald-600/40 uppercase tracking-widest">SKOR RISIKO</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold text-emerald-600/40 uppercase tracking-widest pr-10">AKSI</th>
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
                                            className="hover:bg-slate-50/50 transition-all border-b border-slate-100/10 group"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={clsx(
                                                        "h-10 w-10 flex items-center justify-center font-bold text-sm border rounded shadow-sm",
                                                        report.risk_level === 'HIGH' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-slate-200"
                                                    )}>
                                                        {report.user_name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-tight">{report.user_name}</span>
                                                        <span className="text-[9px] font-bold text-emerald-600/40 mt-0.5 uppercase tracking-widest">{report.group_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="max-w-xs space-y-1">
                                                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight line-clamp-1">{report.title}</p>
                                                    <p className="text-[9px] font-bold text-emerald-600/30 uppercase tabular-nums">TGL: {report.submitted_at}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {report.risk_flags.length > 0 ? report.risk_flags.map((flag, fidx) => {
                                                        const flagLabels: Record<string, string> = {
                                                            'CRITICAL_LOW_DETAIL': 'Konten Terlalu Singkat',
                                                            'MINIMAL_DETAIL': 'Kurang Detail',
                                                            'PLACEHOLDER_CONTENT': 'Teks Placeholder/Template',
                                                            'REPETITIVE_STRINGS': 'Karakter Berulang',
                                                            'EXACT_MATCH': 'Sama Persis dengan Lainnya',
                                                            'NEAR_DUPLICATE': 'Terindikasi Duplikat',
                                                        };
                                                        return (
                                                            <span key={fidx} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-bold border border-rose-100 rounded uppercase tracking-widest">
                                                                {flagLabels[flag] || flag}
                                                            </span>
                                                        );
                                                    }) : (
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold border border-slate-200 rounded uppercase tracking-widest">
                                                            Normal
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={clsx(
                                                        "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border transition-all shadow-sm",
                                                        report.risk_score >= 70 ? "bg-rose-600 text-white border-transparent animate-pulse" : 
                                                        report.risk_score >= 30 ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        "bg-emerald-50 text-emerald-600 border-slate-200"
                                                    )}>
                                                        {report.risk_score}
                                                    </div>
                                                    <span className="text-[7px] font-bold text-emerald-600/30 uppercase">Skor</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right pr-10">
                                                <div className="flex justify-end gap-2">
                                                    <button className="h-8 w-8 bg-white border border-slate-200 text-emerald-400 hover:text-emerald-700 hover:border-emerald-300 rounded flex items-center justify-center transition-all shadow-sm active:scale-95" title="Verifikasi">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-24 text-center text-slate-300">
                                            <Database size={48} className="mx-auto mb-4 opacity-10" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Tidak Ada Laporan</p>
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
                            <h4 className="text-sm font-bold uppercase tracking-widest">SISTEM AUDIT: AKTIF</h4>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                                PEMINDAIAN KEJUJURAN OTOMATIS BERJALAN PADA SETIAP ENTRI DATA LAPORAN.
                            </p>
                        </div>
                    </div>

                    <div className="p-10 bg-white border border-slate-100 rounded shadow-sm flex items-center justify-around gap-8 group hover:border-slate-900 transition-all">
                         <div className="flex flex-col items-center gap-2">
                             <BarChart3 className="h-8 w-8 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                             <span className="text-[9px] font-bold text-emerald-600/30 uppercase tracking-widest group-hover:text-emerald-600">GRAFIK</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                             <Database className="w-8 h-8 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                             <span className="text-[9px] font-bold text-emerald-600/30 uppercase tracking-widest group-hover:text-emerald-600">DATA</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                             <ShieldCheck className="w-8 h-8 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                             <span className="text-[9px] font-bold text-emerald-600/30 uppercase tracking-widest group-hover:text-emerald-600">KEAMANAN</span>
                         </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                     <div className="inline-flex items-center justify-center gap-4 text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                         <Zap className="w-3 h-3 text-emerald-500" />
                         Sistem Audit Aktif • {new Date().getFullYear()}
                     </div>
                </div>
            </div>
        </AppLayout>
    );
}
