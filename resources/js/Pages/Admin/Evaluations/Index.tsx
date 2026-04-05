import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Badge } from '@/Components/ui';
import type { PageProps } from '@/types';
import { 
    Star,
    User,
    Calendar,
    BarChart3,
    ShieldCheck,
    Cpu,
    Fingerprint,
    Users,
    Zap,
    Binary,
    Database,
    Clock,
    Activity,
    Target,
    LayoutDashboard,
    Navigation,
    Flag,
    SearchCheck,
    Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

interface EvaluationItem {
    criterion: string;
    score: number;
    weight: number;
}

interface EvaluationData {
    id: number;
    student_name: string;
    group_name: string;
    evaluator_name: string;
    evaluator_type: string;
    total_score: number | null;
    grade: string | null;
    evaluated_at: string;
    notes: string | null;
    items: EvaluationItem[];
}

interface PaginatedData {
    data: EvaluationData[];
    meta?: {
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
}

interface Props extends PageProps {
    evaluations: PaginatedData;
}

export default function EvaluationsIndex({ evaluations }: Props) {
    return (
        <AppLayout title="Academic Evaluation Monitor">
            <Head title="Monitoring Evaluasi Akademik" />
            
            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">EVALUATION_MONITOR_SUBSYSTEM_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <BarChart3 className="w-10 h-10 text-emerald-600" />
                            MONITORING <span className="text-emerald-600">EVALUASI</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Audit penilaian sistematis, verifikasi parameter ganda, dan pemantauan integritas data akademik lapangan.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Evaluasi Record</span>
                                <div className="flex items-center gap-3">
                                    <Database className="w-5 h-5 text-emerald-500" />
                                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{evaluations.meta?.total ?? evaluations.data?.length ?? 0} ENTRIES</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar - Visual Filler for consistency */}
                <div className="flex items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4 font-black text-[10px] text-slate-400 uppercase tracking-[0.4em] italic">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        SECURE_EVALUATION_FEED_ACTIVE
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-100 via-slate-200 to-transparent" />
                </div>

                {/* Tactical Ledger Table */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">PERSONNEL_IDENTITY</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">OPERATIONAL_UNIT</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">EVALUATOR_AUTHORITY</th>
                                    <th className="px-6 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">AUDIT_SCORE</th>
                                    <th className="px-6 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">GRADE</th>
                                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">TIMESTAMP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(evaluations.data ?? []).map((ev, idx) => (
                                    <motion.tr 
                                        key={ev.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-slate-50/50 transition-colors cursor-default"
                                    >
                                        <td className="px-12 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-950 uppercase italic tracking-tighter group-hover:text-emerald-600 transition-colors">{ev.student_name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Fingerprint className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">VERIFIED_IDENTITY</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                                                <span className="text-xs font-black text-slate-700 uppercase italic tracking-tight">{ev.group_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 uppercase italic tracking-tight">{ev.evaluator_name}</span>
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic mt-0.5">{ev.evaluator_type}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <span className="text-2xl font-black text-slate-950 italic tabular-nums group-hover:text-emerald-600 transition-colors">
                                                {ev.total_score != null ? ev.total_score.toFixed(1) : '--.-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <div className="inline-flex h-16 w-16 items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl shadow-xl group-hover:scale-110 transition-transform">
                                                <span className={clsx(
                                                    "text-xl font-black italic",
                                                    ev.grade === 'A' || ev.grade === 'A-' ? 'text-emerald-500' : 'text-white'
                                                )}>
                                                    {ev.grade ?? '--'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 shadow-inner">
                                                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                    <span className="text-[10px] font-black text-slate-500 tabular-nums italic uppercase tracking-tighter">
                                                        {ev.evaluated_at ?? 'LOG_PENDING'}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic mr-2 opacity-0 group-hover:opacity-100 transition-opacity underline decoration-emerald-500/20 underline-offset-2">SECURE_PAYLOAD</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {(evaluations.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 opacity-20">
                                                <div className="p-10 bg-slate-50 rounded-[4rem] border border-slate-100 border-dashed">
                                                    <Star className="h-20 w-20 text-slate-300" />
                                                </div>
                                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic">SYSTEM_INFO: NO_EVALUATION_DATA_RECORDED</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* Tactical Footer Monitor */}
                <div className="p-12 bg-slate-950 rounded-[4rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)]" />
                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-6">
                                <div className="p-5 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-[2.5rem] rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                    <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white italic tracking-[0.3em] uppercase">Academic_Evaluation_Core • V4</h4>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic leading-relaxed max-w-2xl">
                                        Seluruh ekosistem penilaian dikelola melalui algoritma validasi terakreditasi UIN SAIZU. Data audit mencatat <span className="text-emerald-500">"Analytical Scoring Matrix"</span> secara otomatis untuk menjamin integritas kedaulatan data akademik.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-10 shrink-0">
                            {[Cpu, Zap, Database].map((Icon, i) => (
                                <div key={i} className="h-20 w-20 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all cursor-help shadow-2xl group/feat">
                                    <Icon className="h-10 w-10 group-hover/feat:scale-110 transition-transform" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-12 pt-10 border-t border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic">
                         <div className="flex items-center gap-3">
                             <SearchCheck className="w-4 h-4 text-emerald-600" />
                             EVALUATION_INTEGRITY_PROTOCOL_ALPHA
                         </div>
                         <div className="flex items-center gap-3">
                             {new Date().getFullYear()} • ENCRYPTED_STATE
                         </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
