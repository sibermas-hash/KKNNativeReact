import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    FlagIcon,
    UserGroupIcon,
    MapPinIcon,
    CalendarDaysIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

interface WorkProgramData {
    id: number;
    title: string;
    status: string;
    submitted_at: string | null;
    group: { name: string; location?: { name: string } };
}

interface Props extends PageProps {
    workPrograms: { data: WorkProgramData[] };
    filters: { status?: string };
}

export default function AdminWorkProgramsIndex({ workPrograms, filters }: Props) {
    const onFilterChange = (value: string) => {
        const next = value ? `/admin/reports/work-programs?status=${value}` : '/admin/reports/work-programs';
        window.location.href = next;
    };

    return (
        <AppLayout title="Strategic Objectives Hub">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-accent-gold/5 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-[10px] font-black uppercase tracking-[0.3em]">STRATEGIC MISSIONS</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter">
                            Objective <span className="text-accent-gold italic drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">Registry</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-3 font-medium max-w-lg">Management of sustainable development goals and scholastic field initiatives.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <FunnelIcon className="h-4 w-4 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                            </div>
                            <FormSelect
                                options={[
                                    { value: '', label: 'ALL INITIATIVES' },
                                    { value: 'submitted', label: 'SUBMITTED' },
                                    { value: 'approved', label: 'VERIFIED' },
                                    { value: 'revision', label: 'REVISION' },
                                    { value: 'draft', label: 'DRAFT' },
                                ]}
                                value={filters.status ?? ''}
                                onChange={(e) => onFilterChange(e.target.value)}
                                className="pl-11 pr-8 py-4 bg-white/[0.03] border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 focus:border-accent-gold/50 focus:ring-accent-gold/5 transition-all w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Registry Table */}
                <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                        <SparklesIcon className="h-64 w-64 text-white" />
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Mission Title</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Brigade Hub</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Target Sector</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Submission</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Deployment Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {(workPrograms.data ?? []).map((p) => (
                                    <tr key={p.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-accent-gold/10 text-accent-gold rounded-xl group-hover:scale-110 transition-transform">
                                                    <FlagIcon className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-black text-white group-hover:text-accent-gold transition-colors uppercase tracking-tight leading-tight pt-1">
                                                    {p.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <UserGroupIcon className="h-3.5 w-3.5 text-white/20" />
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest whitespace-nowrap">
                                                    {p.group?.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <MapPinIcon className="h-3.5 w-3.5 text-primary-light/40" />
                                                <span className="text-[10px] font-black text-primary-light uppercase tracking-widest">
                                                    {p.group?.location?.name ?? 'SECTOR UNKNOWN'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <CalendarDaysIcon className="h-3.5 w-3.5 text-white/20" />
                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono">
                                                    {p.submitted_at ?? 'PENDING'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={p.status} className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg" />
                                        </td>
                                    </tr>
                                ))}
                                {(workPrograms.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center">
                                                <MagnifyingGlassIcon className="h-12 w-12 text-white/5 mb-4" />
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No mission records detected in the registry.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Registry Footer */}
                <div className="flex items-center justify-between px-8">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                        DATA SOURCE: UIN-SAIZU-STRATEGIC-MIS
                    </p>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                        MISSIONS: {workPrograms.data?.length ?? 0} ACTIVE INITIATIVES
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
