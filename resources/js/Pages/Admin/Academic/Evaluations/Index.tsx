import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import { 
    Star, 
    User, 
    Clock, 
    BarChart3,
    Zap,
    Cpu,
    Target,
    Activity,
    Globe,
    ShieldCheck,
    RefreshCw,
    Binary,
    ChevronRight,
    Trophy,
    GraduationCap,
    MoreVertical,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination, Button } from '@/Components/ui';

interface EvaluationItem { criterion: string; score: number; weight: number; }
interface EvaluationData {
    id: number; student_name: string; group_name: string; evaluator_name: string;
    evaluator_type: string; total_score: number | null; grade: string | null;
    evaluated_at: string; notes: string | null; items: EvaluationItem[];
}
interface PaginatedData {
    data: EvaluationData[];
    meta?: { current_page: number; last_page: number; total: number; links: { url: string | null; label: string; active: boolean }[]; };
}
interface Props extends PageProps { evaluations: PaginatedData; }

export default function EvaluationsIndex({ evaluations }: Props) {
    return (
    <AppLayout title="Monitoring Evaluasi Akademik">
      <Head title="Monitoring Evaluasi" />

      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
        {/* --- PREMIUM HEADER --- */}
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
                <Star size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Akademik & Penilaian</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Monitoring <span className="text-emerald-500">Evaluasi.</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                        Direktori Analisis Capaian Akademik dan Penilaian Kinerja Mahasiswa KKN Terpadu
                    </p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="h-14 px-8 bg-emerald-600 border border-emerald-500 rounded-2xl flex items-center gap-5 text-white shadow-xl shadow-emerald-100">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest leading-none mb-1">Total Evaluasi</span>
                            <span className="text-sm font-black text-white uppercase tabular-nums leading-none tracking-tight">{evaluations.meta?.total || 0} ENTRI</span>
                        </div>
                        <div className="w-px h-8 bg-white/20" />
                        <Trophy size={18} className="text-white" />
                    </div>
                </div>
            </div>
        </div>

                {/* --- ANALYTICS LEDGER --- */}
                <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-slate-50/20 border-b border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Binary size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest italic">Live Academic Evaluation Stream</span>
                         </div>
                         <div className="hidden sm:flex items-center gap-2">
                             <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                             <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Global_Accuracy_Verified</span>
                         </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Entity Identity</th>
                                    <th className="px-6 py-4">Unit Zone</th>
                                    <th className="px-6 py-4 text-center">Evaluator Vector</th>
                                    <th className="px-6 py-4 text-center">Metric Score</th>
                                    <th className="px-6 py-4 text-center">Qualitative Grade</th>
                                    <th className="px-6 py-4 text-right">Time Sync</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-sans">
                                {evaluations.data.map((ev) => (
                                    <tr key={ev.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                 <div className="h-9 w-9 bg-slate-50 border border-slate-100 text-slate-300 rounded-lg flex items-center justify-center font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all italic">{ev.student_name.charAt(0)}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-slate-900 uppercase leading-tight italic truncate max-w-[150px]">{ev.student_name}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NODE_ID: #{ev.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className="inline-flex h-6 items-center px-3 bg-white border border-slate-100 text-slate-400 rounded-md text-[9px] font-bold uppercase tracking-widest italic">{ev.group_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] font-black text-slate-700 uppercase leading-none italic">{ev.evaluator_name}</span>
                                                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1 opacity-60">[{ev.evaluator_type}]</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <span className="text-xl font-black text-slate-900 tabular-nums font-mono tracking-tighter italic group-hover:text-emerald-600 transition-colors">{ev.total_score != null ? ev.total_score.toFixed(1) : '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                 <div className={clsx('h-10 w-10 flex items-center justify-center rounded-lg font-black text-lg transition-all', ev.grade?.includes('A') ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : ev.grade?.includes('B') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300')}>
                                                     {ev.grade ?? '-'}
                                                 </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-bold text-slate-500 font-mono tracking-widest italic">{ev.evaluated_at || 'NULL_STAMP'}</span>
                                                <div className="flex items-center gap-1.5 text-emerald-500 mt-1">
                                                    <RefreshCw size={10} className="animate-spin" />
                                                    <span className="text-[7px] font-black uppercase tracking-[0.2em]">SYNCED</span>
                                                </div>
                                             </div>
                                        </td>
                                    </tr>
                                ))}
                                {evaluations.data.length === 0 && (
                                    <tr><td colSpan={6} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Metadata buffer null.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Transmission. Page {evaluations.meta?.current_page || 1} OF {evaluations.meta?.last_page || 1}</span>
                        {evaluations.meta && <Pagination meta={evaluations.meta} />}
                    </div>
                </section>

                {/* Governance Summary */}
                 <div className="bg-emerald-600 rounded-xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><BarChart3 size={200} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><GraduationCap size={28} /></div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-black uppercase tracking-tight leading-none">Academic Verification Protocol</h4>
                                <p className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-widest leading-relaxed max-w-xl">Seluruh skor dalam Performance Metrics ini telah melewati validasi algoritma SIKKKN. Perubahan yang disahkan administrator dicatat otomatis dalam audit log.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 opacity-30 italic">
                             <Zap size={16} className="text-white" />
                             <span className="text-[9px] font-black uppercase tracking-widest">Evaluation Grid Nominal</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
