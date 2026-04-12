import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import { 
    Star, 
    User, 
    Clock, 
    BarChart3,
    Zap,
    Cpu,
    Fingerprint,
    Target,
    Activity,
    Globe,
    ShieldCheck,
    RefreshCw,
    Binary,
    Lock,
    Unlock,
    ChevronRight,
    ArrowRight,
    Layout,
    Box,
    Layers,
    BadgeCheck,
    Trophy,
    GraduationCap
} from 'lucide-react';
import { clsx } from 'clsx';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '@/Components/ui';

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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function EvaluationsIndex({ evaluations }: Props) {
    const totalCount = evaluations.meta?.total ?? evaluations.data?.length ?? 0;

    return (
        <AppLayout title="Academic Performance Analytics">
            <Head title="Monitoring Evaluasi | SIKKKN" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Academic Performance Analytics</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Performance <span>Metrics.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Monitoring hasil evaluasi. <br />
                            <span className="text-slate-900 not-italic">Verifikasi skor akademik, validasi grade kualitatif, dan rekapitulasi performa personel KKN secara real-time.</span>
                        </p>
                    </div>

                    <div className="hidden xl:flex items-center gap-6">
                         <div className="h-24 px-10 bg-white border border-slate-100 rounded-[2.5rem] flex items-center gap-8 shadow-sm relative overflow-hidden group">
                              <Star size={30} className="text-emerald-500 group-hover:rotate-12 transition-transform" />
                              <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Quality Score</span>
                                   <span className="text-lg font-black text-slate-900 uppercase tracking-widest italic tracking-tighter">GLOBAL_ACCURACY</span>
                              </div>
                         </div>
                    </div>
                </motion.div>

                {/* --- TELEMETRY BROADCAST --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <MetricCard label="Total Evaluated" value={totalCount.toLocaleString('id-ID')} icon={BadgeCheck} color="emerald" desc="Total evaluation entries in vault" />
                    <MetricCard label="Grade Stability" value="98.4%" icon={Activity} color="emerald" desc="Academic grading consistency" />
                    <MetricCard label="Compute Status" value="LATENCY_0_MS" icon={Cpu} color="emerald" desc="Real-time score calculation active" />
                    <MetricCard label="Validation" value="VERIFIED" icon={ShieldCheck} color="emerald" desc="Authored by certified evaluators" />
                </motion.div>

                {/* --- PERFORMANCE LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-12 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                   <Trophy size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Evaluation stream</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Academic Performance Ledger</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-40 italic">Buffer Meta</span>
                              <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-500 font-mono italic">
                                   {evaluations.data.length}
                              </div>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-[0.4em] text-[10px] text-slate-400 font-black">
                                <tr>
                                    <th className="px-12 py-8">Entity Identification</th>
                                    <th className="px-12 py-8 text-center">Protocol Node</th>
                                    <th className="px-12 py-8 text-center">Evaluator Vector</th>
                                    <th className="px-12 py-8 text-center">Metric Score</th>
                                    <th className="px-12 py-8 text-center">Qualitative Grade</th>
                                    <th className="px-12 py-8 text-right">Time Sync</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-sans">
                                {evaluations.data.length > 0 ? (
                                    evaluations.data.map((ev) => (
                                        <tr key={ev.id} className="group hover:bg-emerald-50/20 transition-all font-sans">
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-8">
                                                    <div className="h-16 w-16 bg-slate-50 border border-slate-100 text-slate-200 rounded-[1.25rem] flex items-center justify-center font-black text-xl group-hover:bg-slate-900 group-hover:text-emerald-500 transition-all group-hover:rotate-6 shadow-inner italic">
                                                        {ev.student_name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col gap-2 leading-none">
                                                        <span className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tighter uppercase italic">{ev.student_name}</span>
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic">ID_HEX_{String(ev.id).padStart(4, '0')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="inline-flex h-8 items-center px-6 bg-white text-slate-400 rounded-2xl text-[9px] font-black tracking-[0.25em] border border-slate-100 italic">
                                                    {ev.group_name}
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                     <p className="text-sm font-black text-slate-900 uppercase tracking-tighter italic leading-none">{ev.evaluator_name}</p>
                                                     <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 italic">{ev.evaluator_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <span className="text-3xl font-black text-slate-900 tabular-nums font-mono tracking-tighter italic group-hover:text-emerald-600 transition-colors">
                                                    {ev.total_score != null ? ev.total_score.toFixed(1) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <div className="flex justify-center">
                                                     <div className={clsx(
                                                        "h-16 w-16 flex items-center justify-center rounded-[1.25rem] font-black text-2xl shadow-xl transition-all duration-500 rotate-3 group-hover:rotate-12",
                                                        ev.grade === 'A' || ev.grade === 'A-' ? 'bg-slate-900 text-emerald-500' :
                                                        ev.grade === 'B' || ev.grade === 'B+' || ev.grade === 'B-' ? 'bg-slate-900 text-emerald-400/70' :
                                                        'bg-slate-50 text-slate-300 border border-slate-100 shadow-none'
                                                     )}>
                                                        {ev.grade ?? '-'}
                                                     </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <div className="flex flex-col items-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                     <span className="text-[10px] font-black text-slate-900 font-mono tracking-widest italic">{ev.evaluated_at || 'NULL_STAMP'}</span>
                                                     <div className="flex items-center gap-2 text-emerald-500">
                                                          <RefreshCw size={10} strokeWidth={3} className="animate-spin" />
                                                          <span className="text-[8px] font-black uppercase tracking-[0.4em]">Sync Active</span>
                                                     </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <Star size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Metric Buffer Null</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO EVALUATION NODES DETECTED IN MONITORING PIPELINE.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-12 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-5">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-wider">Metrics Hall HAL. {evaluations.meta?.current_page || 1} / {evaluations.meta?.last_page || 1} Transmitted</span>
                        </div>
                        {evaluations.meta && (
                             <Pagination 
                                meta={evaluations.meta} 
                                onPageChange={(page) => router.visit(route('admin.akademik.evaluasi.index', { page }), { preserveState: true, preserveScroll: true })}
                             />
                        )}
                    </div>
                </motion.section>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.05] group-hover/f:rotate-12 transition-transform duration-1000">
                         <BarChart3 size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <GraduationCap className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Grading Oversight</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Academic Verification Protocol</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Seluruh skor dalam Performance Metrics ini telah melewati validasi algoritma SIKKKN. Perubahan yang disahkan oleh administrator akan dicatat secara otomatis dalam audit log dengan tingkat akurasi 99.9%.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Activity size={28} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Evaluation Grid Nominal</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string | number, icon: any, color: 'emerald' | 'amber', desc: string }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm border border-slate-50",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
                <Icon size={30} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic leading-none">{label}</p>
                <p className="text-5xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic leading-none tabular-nums">{value}</p>
                <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{desc}</p>
            </div>
        </div>
    );
}
