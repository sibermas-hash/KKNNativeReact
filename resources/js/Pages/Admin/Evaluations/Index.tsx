import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
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
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { Head } from '@inertiajs/react';

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
        <AppLayout title="Arsip Evaluasi Akademik">
            <Head title="Monitoring Evaluasi Akademik" />
            
            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full  -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <BarChart3 className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                ACADEMIC_EVALUATION_ENGINE_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none ">
                            Monitoring <span className="text-emerald-300 text-glow-emerald italic">Evaluasi</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Log audit penilaian sistematis kinerja akademik dan dampak lapangan mahasiswa KKN UIN SAIZU melalui verifikasi parameter ganda.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Total Evaluasi</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">
                                    {evaluations.meta?.total ?? evaluations.data?.length ?? 0} Record
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Table Section (Tactical Table) */}
                <div className="bg-white rounded-lg border border-slate-100 overflow-hidden group lg:mx-2">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-50 italic">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Identitas_Personel</th>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Sektor_Kelompok</th>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Otoritas_Penilai</th>
                                    <th className="px-10 py-7 text-center text-[11px] font-black uppercase  text-slate-400 italic">Skor_Audit</th>
                                    <th className="px-10 py-7 text-center text-[11px] font-black uppercase  text-slate-400 italic">Predikat</th>
                                    <th className="px-10 py-7 text-right text-[11px] font-black uppercase  text-slate-400 italic pr-14">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {(evaluations.data ?? []).map((ev) => (
                                    <tr key={ev.id} className="group/row hover:bg-slate-50/20 transition-all cursor-default">
                                        <td className="px-10 py-9">
                                            <div className="flex flex-col gap-2.5 min-w-0">
                                                <span className="text-[16px] font-black text-slate-900 group-hover/row:text-primary transition-colors uppercase italic  truncate leading-none">
                                                    {ev.student_name}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1 px-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                        <Fingerprint className="h-3 w-3 text-slate-300 group-hover/row:text-primary transition-colors" />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase  italic opacity-60">IDENTITY_VERIFIED_OK</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-9">
                                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-lg bg-primary/5 border border-primary/10 group-hover/row:rotate-1 group-hover/row:scale-105 transition-all">
                                                <Users className="h-4 w-4 text-primary/40" />
                                                <span className="text-[11px] font-black text-primary uppercase  italic leading-none pt-0.5">
                                                    {ev.group_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-9">
                                            <div className="flex flex-col gap-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-3.5 w-3.5 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                                                       <User className="h-2 w-2 text-slate-400" />
                                                    </div>
                                                    <span className="text-[12px] font-black text-slate-600 uppercase  italic truncate max-w-[150px]">
                                                        {ev.evaluator_name}
                                                    </span>
                                                </div>
                                                <StatusBadge status={ev.evaluator_type} className="px-4 py-1.5 text-[9px] font-black  uppercase border-none h-6 italic w-fit bg-slate-900 text-primary" />
                                            </div>
                                        </td>
                                        <td className="px-10 py-9 text-center">
                                            <span className="text-3xl font-black text-slate-900 tabular-nums italic  leading-none group-hover/row:text-primary transition-colors">
                                                {ev.total_score != null ? ev.total_score.toFixed(1) : '--.-'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-9 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16rounded-lg bg-slate-50 border border-slate-100 group-hover/row:border-primary/30 group-hover/row:bg-white transition-all group-hover/row:rotate-6 group-hover/row:scale-110 group-hover/row:shadow-xl group-hover/row:shadow-primary/10">
                                                <span className={clsx(
                                                    "text-xl font-black italic  transition-colors",
                                                    ev.grade === 'A' || ev.grade === 'A-' ? 'text-emerald-500' : 'text-slate-900'
                                                )}>
                                                    {ev.grade ?? '--'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-9 text-right pr-14">
                                            <div className="flex flex-col items-end gap-2 group-hover/row:translate-x-[-4px] transition-transform">
                                                <div className="flex items-center gap-3 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                                                    <span className="text-[9px] font-black uppercase  italic leading-none">
                                                        {ev.evaluated_at ?? 'LOG_PENDING'}
                                                    </span>
                                                </div>
                                                <span className="text-[8px] font-black text-slate-300 uppercase  italic leading-none pr-2">SECURE_PAYLOAD_SAFE</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(evaluations.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-10 opacity-30">
                                                <div className="p-10 bg-slate-50 rounded-full border border-slate-100
                                                     <Star className="h-20 w-20 text-slate-200" />
                                                </div>
                                                <p className="text-[12px] font-black uppercase  text-slate-400 italic">SYSTEM_INFO: NO_EVALUATION_RECORDS_DETECTED</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Emerald Footer Monitor */}
                <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group mx-2">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                     <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <ShieldCheck className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">ACADEMIC_VALIDATION_GOVERNANCE_V3</h4>
                                    <p className="text-[10px] text-emerald-400 font-bold  mt-2 italic whitespace-nowrap">STATUS: AUDIT_ALGORITHM_VERIFIED</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                Petunjuk Validasi: Seluruh hasil penilaian diverifikasi melalui algoritma validasi akademik terpusat UIN SAIZU. 
                                Data evaluasi mencakup <span className="text-primary font-black uppercase italic">"Analytical Scoring"</span> yang secara otomatis menjadi basis 
                                penentuan grade kelulusan. Log audit pusat mencatat setiap interaksi petugas untuk menjamin kedaulatan data akademik.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-slate-100 uppercase  italic">VAL_INTEGRITY_OK</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                    <Cpu className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Zap className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[9px] font-black text-slate-300 uppercase  italic">
                        Evaluation Monitor System • Audit Registry Ver. 3.2.0 • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
