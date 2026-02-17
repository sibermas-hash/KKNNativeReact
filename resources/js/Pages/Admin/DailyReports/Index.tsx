import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    ClockIcon,
    DocumentTextIcon,
    UserGroupIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    BoltIcon,
    CpuChipIcon,
    IdentificationIcon
} from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';

interface ReportData {
    id: number;
    date: string;
    title: string;
    status: string;
    student: { name: string; nim: string };
    group: { name: string };
}

interface Props extends PageProps {
    reports: { data: ReportData[] };
    filters: { status?: string };
}

export default function AdminDailyReportsIndex({ reports, filters }: Props) {
    const onFilterChange = (value: string) => {
        const next = value ? `/admin/reports/daily?status=${value}` : '/admin/reports/daily';
        window.location.href = next;
    };

    return (
        <AppLayout title="Tactical activity Logs">
            <Head title="Activity Telemetry" />
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">OPERATIONAL INTELLIGENCE</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Activity <span className="text-accent-gold text-glow-gold">Telemetry</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.2em]">Monitoring real-time scholastic field operations and tactical daily reporting.</p>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <FunnelIcon className="h-4 w-4 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                            </div>
                            <FormSelect
                                options={[
                                    { value: '', label: 'ALL PROTOCOLS' },
                                    { value: 'submitted', label: 'SUBMITTED' },
                                    { value: 'approved', label: 'VERIFIED' },
                                    { value: 'revision', label: 'REVISION' },
                                    { value: 'draft', label: 'DRAFT' },
                                ]}
                                value={filters.status ?? ''}
                                onChange={(e) => onFilterChange(e.target.value)}
                                className="pl-13 pr-8 py-5 bg-black/40 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 focus:border-accent-gold/50 focus:ring-accent-gold/5 transition-all w-72 shadow-2xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Tactical Ledger (Table) */}
                <div className="glass rounded-[3.5rem] border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white">
                        <BoltIcon className="h-64 w-64 rotate-12" />
                    </div>

                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-10 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Temporal Stamp</th>
                                    <th className="px-8 py-10 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Strategic Objective</th>
                                    <th className="px-8 py-10 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Scholar ID</th>
                                    <th className="px-8 py-10 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Brigade Unit</th>
                                    <th className="px-10 py-10 text-right text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Protocol Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {(reports.data ?? []).map((r) => (
                                    <tr key={r.id} className="group hover:bg-white/[0.05] transition-all duration-300">
                                        <td className="px-10 py-10 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-accent-gold/5 rounded-xl border border-white/5 group-hover:border-accent-gold/20 transition-all">
                                                    <ClockIcon className="h-4 w-4 text-accent-gold/60 group-hover:text-accent-gold transition-colors" />
                                                </div>
                                                <span className="text-[11px] font-black font-mono text-white/60 tracking-widest uppercase italic group-hover:text-white transition-colors">
                                                    {r.date}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex flex-col">
                                                <span className="text-base font-black text-white hover:text-accent-gold transition-colors uppercase tracking-widest italic group-hover:translate-x-2 transition-transform duration-500 line-clamp-1">
                                                    {r.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex items-center gap-6">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-dark/20 border border-white/10 flex items-center justify-center text-[11px] font-black text-primary-light italic shadow-2xl group-hover:scale-110 transition-transform">
                                                    {r.student?.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none group-hover:text-accent-gold transition-colors">
                                                        {r.student?.name}
                                                    </span>
                                                    <span className="text-[9px] font-mono font-black text-white/20 uppercase tracking-widest mt-2 flex items-center gap-2">
                                                        <IdentificationIcon className="h-3 w-3" /> ID // {r.student?.nim}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                                    <UserGroupIcon className="h-4 w-4 text-primary-light/60" />
                                                </div>
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic group-hover:text-white transition-colors">
                                                    {r.group?.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-10 text-right">
                                            <div className="inline-flex">
                                                <StatusBadge status={r.status} className="px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl border border-white/10 italic group-hover:scale-110 transition-transform" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(reports.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="p-6 bg-white/5 rounded-full border border-white/5">
                                                    <MagnifyingGlassIcon className="h-16 w-16 text-white/10" />
                                                </div>
                                                <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] italic">Telemetry channels clear. No active logs detected.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stream Intelligence Footer */}
                <div className="flex flex-col md:flex-row items-center justify-between px-10 py-8 glass rounded-[2.5rem] border-white/5 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary-light border border-primary/20">
                            <CpuChipIcon className="h-5 w-5" />
                        </div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic leading-none">
                            CENTRAL ANALYTICS NEXUS: <span className="text-white/40">UIN-SAIZU-KKN-TELEMTRY-V4</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">ACTIVE STREAMS</p>
                            <p className="text-xl font-black text-white italic leading-none">{reports.data?.length ?? 0}</p>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">ENCRYPTION</p>
                            <p className="text-[10px] font-black text-primary-light italic leading-none tracking-widest">RSA-4096 VALID</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
