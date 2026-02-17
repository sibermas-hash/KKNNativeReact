import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    ClipboardDocumentCheckIcon,
    FunnelIcon,
    AcademicCapIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    StopIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';

interface FinalReportData {
    id: number;
    title: string;
    status: string;
    score: string | number | null;
    submitted_at: string | null;
    student: { name: string; nim: string };
    group: { name: string };
}

interface Props extends PageProps {
    reports: { data: FinalReportData[] };
    filters: { status?: string };
}

export default function AdminFinalReportsIndex({ reports, filters }: Props) {
    const onFilterChange = (value: string) => {
        router.get('/admin/reports/final', { status: value }, { preserveState: true });
    };

    return (
        <AppLayout title="Impact Assessment Registry">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">MISSION TERMINATION</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                            Impact <span className="text-accent-gold text-glow-gold">Assessments</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-3 font-medium uppercase tracking-[0.15em]">Final validation of scholastic field operations and outcome metrics.</p>
                    </div>

                    <div className="flex items-center gap-6 px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">SUBMITTED BLUEPRINTS</span>
                            <span className="text-xl font-black text-white tabular-nums">{reports.data?.length ?? 0}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <ClipboardDocumentCheckIcon className="h-6 w-6 text-accent-gold" />
                    </div>
                </div>

                {/* Filter Section */}
                <div className="flex justify-end p-4 glass rounded-[2rem]">
                    <div className="flex items-center gap-4">
                        <FunnelIcon className="h-4 w-4 text-white/20" />
                        <FormSelect
                            options={[
                                { value: '', label: 'ALL ASSESSMENTS' },
                                { value: 'submitted', label: 'PENDING ACTION' },
                                { value: 'reviewed', label: 'UNDER REVIEW' },
                                { value: 'approved', label: 'CERTIFIED' },
                                { value: 'revision', label: 'NEEDS REVISION' },
                            ]}
                            value={filters.status ?? ''}
                            onChange={(e) => onFilterChange(e.target.value)}
                            className="bg-black/40 border-white/5 text-[10px] font-black uppercase tracking-widest text-accent-gold w-48 rounded-xl"
                        />
                    </div>
                </div>

                {/* Main Table Section */}
                <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                        <StopIcon className="h-64 w-64 text-white" />
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Document Title</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Candidate</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Brigade HUB</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Submission</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">Merit</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Phase</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {(reports.data ?? []).map((r) => (
                                    <tr key={r.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col max-w-xs">
                                                <span className="text-sm font-black text-white group-hover:text-accent-gold transition-colors uppercase tracking-tight line-clamp-1 italic">
                                                    {r.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-black text-white group-hover:bg-primary transition-colors">
                                                    {r.student?.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-white/80 uppercase">{r.student?.name}</span>
                                                    <span className="text-[9px] text-white/20 font-mono tracking-widest">{r.student?.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <UserGroupIcon className="h-3.5 w-3.5 text-primary-light" />
                                                <span className="text-[10px] font-black text-primary-light uppercase tracking-widest">
                                                    {r.group?.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-white/30">
                                                <CalendarDaysIcon className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-bold tracking-widest font-mono">
                                                    {r.submitted_at ?? 'PENDING'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 shadow-xl">
                                                <span className="text-sm font-black text-accent-gold tabular-nums italic">
                                                    {r.score ?? '--'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={r.status} className="px-3 py-1 text-[8px] font-black tracking-widest" />
                                        </td>
                                    </tr>
                                ))}
                                {(reports.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center">
                                                <MagnifyingGlassIcon className="h-12 w-12 text-white/5 mb-4" />
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No impact assessments detected in registry.</p>
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
                        VAULT SECURITY: TERMINATION-PHASE-ENCRYPTED
                    </p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                        DATA INTEGRITY: 100% VERIFIED
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
