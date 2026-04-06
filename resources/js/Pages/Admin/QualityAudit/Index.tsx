import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Cpu, 
    AlertTriangle, 
    CheckCircle, 
    Search, 
    ShieldAlert, 
    Zap,
    Filter,
    BarChart3,
    Activity,
    ScanLine,
    Fingerprint,
    Database,
    ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Badge } from '@/Components/ui';

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
        meta: any;
    };
    stats: {
        high_risk_count: number;
    };
}

export default function QualityAuditIndex({ reports, stats }: Props) {
    return (
        <AppLayout title="Reports Analytics Core">
            <Head title="Activity Intelligence Auditor" />

            <div className="space-y-10 pb-32">
                {/* Premium Corporate Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 border-b border-slate-100 pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(16,168,83,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">Security_Governance_Oracle</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter flex items-center gap-5 italic uppercase">
                            <ShieldCheck className="w-12 h-12 text-emerald-600" />
                            Audit <span className="text-emerald-600">Terintegrasi</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic uppercase tracking-wider">Pemantauan Kualitas & Integritas Aktivitas Mahasiswa Secara Real-time.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="px-10 py-6 bg-slate-950 border border-slate-800 rounded-[2.5rem] flex items-center gap-10 shadow-3xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           
                           <div className="relative z-10 flex flex-col">
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Anomali Terdeteksi</span>
                               <div className="flex items-center gap-4">
                                   <div className="p-2 bg-rose-500/20 rounded-lg">
                                       <ShieldAlert className="w-5 h-5 text-rose-500" />
                                   </div>
                                   <span className="text-3xl font-black text-white italic tracking-tighter leading-none">{stats.high_risk_count}</span>
                               </div>
                           </div>
                           
                           <div className="h-12 w-px bg-slate-800 relative z-10" />
                           
                           <div className="relative z-10 flex flex-col">
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Sistem Verifikasi</span>
                               <div className="flex items-center gap-4">
                                   <div className="p-2 bg-emerald-500/20 rounded-lg">
                                       <CheckCircle className="w-5 h-5 text-emerald-500" />
                                   </div>
                                   <span className="text-xl font-black text-white italic tracking-tighter leading-none uppercase tracking-widest">Optimized</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Audit Grid */}
                <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all relative group/table">
                    <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-slate-900 text-emerald-500 rounded-2xl shadow-2xl">
                                <ScanLine className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.4em] italic text-slate-950">Intelligent_Quality_Scanner</h2>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-none">Pemindaian Log Aktivitas & Verifikasi Duplikasi Konteks</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Monitoring Active</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/20 border-b border-slate-100">
                                    <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Identitas & Target</th>
                                    <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Data Telemetri</th>
                                    <th className="px-12 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Vektor Risiko</th>
                                    <th className="px-12 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Skor Audit</th>
                                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest italic pr-16">Otoritas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reports.data.map((report, idx) => (
                                    <motion.tr 
                                        key={report.id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className="group/row hover:bg-slate-50/50 transition-all cursor-default"
                                    >
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className={clsx(
                                                    "h-16 w-16 rounded-[1.8rem] border flex items-center justify-center font-black text-xl italic group-hover/row:scale-110 transition-all shadow-xl",
                                                    report.risk_level === 'HIGH' ? "bg-slate-950 text-rose-500 border-rose-500/30" : "bg-slate-950 text-slate-400 border-slate-800"
                                                )}>
                                                    {report.user_name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-black text-slate-950 uppercase italic tracking-tighter leading-tight group-hover/row:text-rose-700 transition-colors">{report.user_name}</span>
                                                    <span className="text-[10px] font-black text-slate-400 italic mt-1 uppercase tracking-widest">UNIT: {report.group_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8">
                                            <div className="max-w-xs space-y-2">
                                                <p className="text-xs font-black italic text-slate-700 line-clamp-1 uppercase tracking-tighter">{report.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 italic uppercase tabular-nums">REC: {report.submitted_at}</p>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-center">
                                            <div className="flex flex-wrap justify-center gap-1.5 max-w-[200px] mx-auto">
                                                {report.risk_flags.length > 0 ? report.risk_flags.map((flag, fidx) => (
                                                    <span key={fidx} className="px-2 py-1 bg-rose-50 text-rose-600 text-[8px] font-black border border-rose-100 rounded-md uppercase italic tracking-widest">
                                                        {flag}
                                                    </span>
                                                )) : (
                                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black border border-emerald-100 rounded-md uppercase italic tracking-widest">
                                                        INTEGRITY_PASSED
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={clsx(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black italic shadow-inner border transition-all",
                                                    report.risk_score >= 70 ? "bg-rose-950 text-rose-500 border-rose-800 animate-pulse" : 
                                                    report.risk_score >= 30 ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                )}>
                                                    {report.risk_score}
                                                </div>
                                                <span className="text-[8px] font-black text-slate-400 italic uppercase">Risk_Vector</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-right pr-16">
                                            <div className="flex justify-end gap-3 scale-110">
                                                <button
                                                    className="h-12 w-12 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-600/30 rounded-[1.4rem] transition-all shadow-xl flex items-center justify-center active:scale-90 group/btn"
                                                    title="Bypass Security"
                                                >
                                                    <AlertTriangle className="w-5 h-5 transition-transform group-hover/btn:scale-125" />
                                                </button>
                                                <button
                                                    className="h-12 w-12 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-600/30 rounded-[1.4rem] transition-all shadow-xl flex items-center justify-center active:scale-90 group/btn"
                                                    title="Verify Content"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Analytical Overlays */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="p-12 bg-slate-950 rounded-[4rem] border border-slate-800 relative overflow-hidden group shadow-3xl">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.15),transparent_60%)]" />
                        <div className="relative z-10 flex items-center gap-10">
                            <div className="p-6 bg-emerald-600 shadow-[0_0_50px_rgba(16,168,83,0.3)] rounded-[2.5rem] rotate-3 transition-transform group-hover:rotate-0">
                                <Activity className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white italic tracking-[0.3em] uppercase">Status_Engine: Aktif</h4>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic leading-relaxed">
                                    Sistem melakukan pemindaian integritas pada setiap entri data laporan harian. <br/>
                                    <span className="text-emerald-500 underline underline-offset-8 decoration-emerald-500/20">Protocol: Peninjauan_Kualitas_Otomatis</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 bg-white rounded-[4rem] border border-slate-200 flex flex-wrap items-center justify-around gap-12 group hover:border-emerald-500 transition-all duration-700 shadow-sm hover:shadow-2xl">
                         <div className="flex flex-col items-center">
                             <BarChart3 className="h-10 w-10 text-slate-200 group-hover:text-emerald-600 transition-colors" />
                             <span className="text-[9px] font-black text-slate-300 uppercase mt-4 tracking-widest italic group-hover:text-emerald-600">Analitik Digital</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <Database className="w-10 h-10 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                             <span className="text-[9px] font-black text-slate-300 uppercase mt-4 tracking-widest italic group-hover:text-emerald-500">Big Data KKN</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <ShieldCheck className="w-10 h-10 text-slate-200 group-hover:text-amber-500 transition-colors" />
                             <span className="text-[9px] font-black text-slate-300 uppercase mt-4 tracking-widest italic group-hover:text-amber-500">Keamanan Data</span>
                         </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                     <div className="inline-flex items-center justify-center gap-5 text-slate-400 font-black text-[11px] uppercase tracking-[0.6em] italic opacity-30 hover:opacity-100 transition-opacity duration-700 cursor-default">
                         <Zap className="w-4 h-4 text-rose-600" />
                         CORE_AUDIT_ENGINE • ANALYTICAL_OVERRIDE_ENABLED • {new Date().getFullYear()}
                     </div>
                </div>
            </div>
        </AppLayout>
    );
}
