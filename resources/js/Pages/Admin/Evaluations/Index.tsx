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
    Search,
    ChevronRight,
    ArrowRight
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
        <AppLayout title="Monitoring Evaluasi Akademik">
            <Head title="Audit Evaluasi | POS-KKN" />
            
            <div className="min-h-screen bg-white italic font-black">
                {/* HEADER TACTICAL: OTORITAS EVALUASI AKADEMIK */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Academic Performance Audit Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            MONITORING <span className="text-emerald-500">EVALUASI AKADEMIK</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <BarChart3 size={12} className="text-emerald-500" />
                             Audit penilaian sistematis, verifikasi parameter ganda, dan pemantauan integritas data akademik.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="h-16 px-10 bg-emerald-950 text-white flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/10 -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                           <div className="flex flex-col relative z-20">
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1">TOTAL EVALUATIONS</span>
                               <div className="flex items-center gap-3">
                                   <Database size={16} className="text-emerald-400" />
                                   <span className="text-xl font-black italic tracking-tighter tabular-nums text-nowrap">{evaluations.meta?.total ?? evaluations.data?.length ?? 0} REKAMAN</span>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-12 space-y-12">
                    {/* OPERATIONS TOOLBAR TACTICAL */}
                    <div className="flex items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4 italic">
                            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.4em] italic leading-none">Status Pemantauan Evaluasi Aktif</span>
                        </div>
                        <div className="h-px flex-1 bg-emerald-50" />
                        <div className="flex items-center gap-4">
                             <span className="text-[8px] font-black text-emerald-100 uppercase tracking-widest italic">REALTIME SYNC</span>
                        </div>
                    </div>

                    {/* TACTICAL LEDGER TABLE */}
                    <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                        <div className="px-10 py-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400 font-black">
                                    <Target size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Academic Performance Ledger</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Registry Penilaian & Kualifikasi Grade Unit</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase italic tracking-widest border border-emerald-100 shadow-inner">
                                VERIFIKASI PARAMETER GANDA
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-emerald-50/10 border-b border-emerald-100">
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">PERSONEL TARGET</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">PENEMPATAN UNIT</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">OTORITAS PENILAI</th>
                                        <th className="px-6 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">SKOR TOTAL</th>
                                        <th className="px-6 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">GRADE</th>
                                        <th className="px-10 py-5 text-right text-[9px] font-black text-emerald-900 uppercase tracking-widest italic pr-12">WAKTU AUDIT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
                                    {(evaluations.data ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-10 py-56 text-center">
                                                <div className="inline-flex flex-col items-center gap-6 opacity-20 capitalize">
                                                    <Star size={64} strokeWidth={1} className="text-emerald-950" />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.5em] italic text-emerald-900">
                                                        REGISTRY EVALUASI KOSONG
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        (evaluations.data ?? []).map((ev) => (
                                            <tr key={ev.id} className="hover:bg-emerald-50/20 transition-colors group/row">
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[14px] font-black text-emerald-950 uppercase tracking-tighter leading-none italic group-hover/row:text-emerald-600 transition-colors truncate">
                                                            {ev.student_name}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <Fingerprint size={10} className="text-emerald-300" />
                                                            <span className="text-[8px] font-black text-emerald-300 uppercase tracking-[0.2em] italic">IDENTITY_VERIFIED: #{ev.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                     <div className="flex flex-col gap-1.5">
                                                        <span className="text-[11px] font-black text-emerald-950 uppercase tracking-tight italic leading-none">
                                                            {ev.group_name}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                                                            <span className="text-[8px] font-black text-emerald-100 uppercase tracking-widest italic">UNIT_ACTIVE</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-10 w-10 bg-emerald-50 text-emerald-950 border border-emerald-100 flex items-center justify-center font-black text-[10px] italic shadow-sm group-hover/row:bg-emerald-950 group-hover/row:text-white transition-all">
                                                            <User size={16} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-emerald-950 uppercase tracking-tight italic leading-tight group-hover/row:text-emerald-600 transition-colors">
                                                                {ev.evaluator_name}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-emerald-200 uppercase tracking-widest mt-1 italic">{ev.evaluator_type.toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-3xl font-black text-emerald-950 italic tabular-nums group-hover/row:text-emerald-600 transition-colors leading-none tracking-tighter">
                                                            {ev.total_score != null ? ev.total_score.toFixed(1) : '--.-'}
                                                        </span>
                                                        <span className="text-[7px] font-black text-emerald-100 uppercase mt-2 tracking-widest italic">CALC_SCORE</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-center">
                                                    <div className="inline-flex h-16 w-16 items-center justify-center bg-emerald-950 border border-emerald-900 shadow-xl group-hover/row:scale-110 transition-transform group-hover/row:bg-emerald-600">
                                                        <span className={clsx(
                                                            "text-2xl font-black italic",
                                                            ev.grade === 'A' || ev.grade === 'A-' ? 'text-emerald-400' : 'text-white'
                                                        )}>
                                                            {ev.grade ?? '--'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right pr-12">
                                                    <div className="flex flex-col items-end gap-3">
                                                        <div className="flex items-center gap-3 bg-white border border-emerald-50 px-5 py-2 italic shadow-sm">
                                                            <Clock size={12} className="text-emerald-200" />
                                                            <span className="text-[10px] font-black text-emerald-950 tabular-nums uppercase tracking-tighter leading-none">
                                                                {ev.evaluated_at?.toUpperCase() || 'NOT_RECORDED'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest italic opacity-0 group-hover/row:opacity-100 transition-opacity border-b border-emerald-500/20 pb-0.5">DATA_COMMITTED_LOKI</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-10 py-8 border-t border-emerald-50 bg-emerald-50/10 italic">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 italic font-black">
                                     <div className="p-2 bg-emerald-950 text-emerald-500 shadow-lg">
                                        <Binary size={14} strokeWidth={2.5} />
                                     </div>
                                     <span className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Otoritas Penilaian Aktif: {evaluations.meta?.total ?? evaluations.data?.length ?? 0} Rekaman Terverifikasi</span>
                                </div>
                                <div className="flex items-center gap-8">
                                     <span className="text-[8px] font-black text-emerald-100 uppercase tracking-[0.4em] italic">SYNERGY MONITOR</span>
                                     <div className="h-10 w-px bg-emerald-50" />
                                     <div className="flex items-center gap-3">
                                         <Badge variant="default" className="border-emerald-50 text-[8px] italic font-black uppercase text-emerald-200 bg-transparent">Ver: 4.0.2</Badge>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECURITY FOOTER TACTICAL */}
                    <div className="bg-emerald-950 p-12 flex flex-col xl:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2" />
                        
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="p-5 bg-emerald-600 shadow-[0_0_50px_rgba(16,185,129,0.2)] rotate-3">
                                <ShieldCheck size={40} className="text-white animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white italic tracking-[0.3em] uppercase leading-none mb-3 text-nowrap">PUSAT EVALUASI AKADEMIK</h4>
                                <p className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-[0.3em] italic leading-relaxed max-w-4xl">
                                    SELURUH PENILAIAN DIREKAP DAN DILACAK SECARA TERSTRUKTUR UNTUK MENJAGA INTEGRITAS DATA AKADEMIK KKN UIN SAIZU. RIWAYAT EVALUASI INI MERUPAKAN BASIS DATA PENENTUAN KELULUSAN AKHIR UNIT MAHASISWA.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 relative z-10">
                            {[Cpu, Zap, Database].map((Icon, i) => (
                                <div key={i} className="h-16 w-16 bg-white/5 border border-white/5 flex items-center justify-center text-emerald-500 hover:text-white hover:bg-emerald-600 transition-all cursor-help shadow-2xl group/feat">
                                    <Icon size={24} className="group-hover/feat:scale-110 transition-transform" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center py-6 gap-6 relative group italic">
                         <div className="flex items-center gap-4 opacity-20">
                            <Binary size={18} className="text-emerald-200" />
                            <div className="h-px w-24 bg-emerald-50" />
                            <div className="p-2 bg-emerald-950 text-emerald-400 font-black text-[7px] tracking-[0.5em] uppercase italic px-4">SECURE_REKAP</div>
                            <div className="h-px w-24 bg-emerald-50" />
                            <Activity size={18} className="text-emerald-200" />
                         </div>
                         <p className="text-[8px] font-black text-emerald-950 uppercase tracking-[0.8em] italic opacity-40 hover:opacity-100 transition-opacity duration-1000 cursor-default">
                             INTEGRITAS EVALUASI AKADEMIK TERVERIFIKASI • POS-KKN {new Date().getFullYear()}
                         </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
