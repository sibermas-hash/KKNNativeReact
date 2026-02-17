import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    AcademicCapIcon,
    StarIcon,
    UserIcon,
    CalendarIcon,
    MagnifyingGlassIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

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
        <AppLayout title="Merit Analytics Hub">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">SCHOLASTIC ASSESSMENT</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                            Merit <span className="text-accent-gold text-glow-gold">Analytics</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-3 font-medium uppercase tracking-[0.15em]">Systematic evaluation of academic performance and field impact.</p>
                    </div>

                    <div className="flex items-center gap-6 px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">TOTAL ASSESSMENTS</span>
                            <span className="text-xl font-black text-white tabular-nums">{evaluations.meta?.total ?? evaluations.data?.length ?? 0}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <ChartBarIcon className="h-6 w-6 text-accent-gold" />
                    </div>
                </div>

                {/* Main Table Section */}
                <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                        <StarIcon className="h-64 w-64 text-white" />
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Candidate</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Brigade HUB</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Evaluator</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Protocol</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">Score</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">Grade</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {(evaluations.data ?? []).map((ev) => (
                                    <tr key={ev.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white group-hover:text-accent-gold transition-colors uppercase tracking-tight">
                                                    {ev.student_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-primary-light uppercase tracking-widest whitespace-nowrap">
                                                {ev.group_name}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-3.5 w-3.5 text-white/20" />
                                                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">
                                                    {ev.evaluator_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={ev.evaluator_type} className="px-3 py-1 text-[8px]" />
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-lg font-black text-white tabular-nums italic">
                                                {ev.total_score != null ? ev.total_score.toFixed(1) : '---'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden group/grade transition-all hover:scale-110">
                                                <div className={`absolute inset-0 opacity-10 ${ev.grade === 'A' || ev.grade === 'A-' ? 'bg-emerald-500' : 'bg-primary'}`} />
                                                <span className={`relative z-10 text-base font-black italic tracking-tighter ${ev.grade === 'A' || ev.grade === 'A-' ? 'text-emerald-400' : 'text-accent-gold'}`}>
                                                    {ev.grade ?? '--'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-3.5 w-3.5 text-white/20" />
                                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono">
                                                    {ev.evaluated_at ?? 'PENDING'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(evaluations.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center">
                                                <MagnifyingGlassIcon className="h-12 w-12 text-white/5 mb-4" />
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No merit data records detected.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer UI */}
                <div className="flex items-center justify-between px-8">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                        DATA SECURED: UIN-SAIZU-MERIT-REGISTRY
                    </p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                        ALGORITHM: ACADEMIC-STANDARD-v3
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
