import { Link, useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormSelect } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowTopRightOnSquareIcon,
    IdentificationIcon,
    ShieldCheckIcon,
    AcademicCapIcon,
    BoltIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

interface RegData {
    id: number;
    status: string;
    registration_date: string;
    student: { nim: string; name: string; faculty?: { name: string }; program?: { name: string } };
    period: { name: string };
    group: { name: string } | null;
}

interface PaginatedData {
    data: RegData[];
    meta?: {
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    links?: { prev: string | null; next: string | null };
}

interface Props extends PageProps {
    registrations: PaginatedData;
    filters: { status?: string };
}

export default function RegistrationsIndex({ registrations, filters }: Props) {
    const statusFilter = useForm({ status: filters.status ?? '' });
    const statuses = [
        { value: '', label: 'ALL PROTOCOLS' },
        { value: 'pending', label: 'PENDING' },
        { value: 'document_submitted', label: 'SUBMITTED' },
        { value: 'approved', label: 'APPROVED' },
        { value: 'rejected', label: 'REJECTED' },
    ];

    function handleFilter(status: string) {
        statusFilter.setData('status', status);
        statusFilter.get('/admin/registrations', { preserveState: true });
    }

    return (
        <AppLayout title="Enrollment Registry Nexus">
            <Head title="Scholar Enrollment Registry" />
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">

                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">INTEGRITY LEDGER</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Enrollment <span className="text-accent-gold text-glow-gold">Registry</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Audit and authorize scholastic candidates for the upcoming academic cycle.</p>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <FunnelIcon className="h-4 w-4 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                            </div>
                            <FormSelect
                                options={statuses}
                                value={filters.status ?? ''}
                                onChange={(e) => handleFilter(e.target.value)}
                                className="pl-13 pr-8 py-5 bg-black/40 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/80 focus:border-accent-gold/50 focus:ring-accent-gold/5 transition-all w-72 shadow-2xl uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* Enrollment Ledger (Table) */}
                <div className="glass rounded-[3.5rem] border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white">
                        <IdentificationIcon className="h-64 w-64 rotate-12" />
                    </div>

                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-10 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Scholar Identity</th>
                                    <th className="px-8 py-10 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Academic Track</th>
                                    <th className="px-8 py-10 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Cycle Period</th>
                                    <th className="px-8 py-10 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Registry Status</th>
                                    <th className="px-10 py-10 text-right text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Operation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {(registrations.data ?? []).map((reg) => (
                                    <tr key={reg.id} className="group hover:bg-white/[0.05] transition-all duration-300">
                                        <td className="px-10 py-10">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-dark/20 border border-white/10 flex items-center justify-center text-primary-light font-black text-xl group-hover:scale-110 transition-transform shadow-2xl italic">
                                                    {reg.student.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-white hover:text-accent-gold transition-colors uppercase tracking-widest italic group-hover:translate-x-2 transition-transform duration-500">
                                                        {reg.student.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-widest mt-2 flex items-center gap-2">
                                                        <UserCircleIcon className="h-3.5 w-3.5" /> ID // {reg.student.nim}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none flex items-center gap-2 group-hover:text-white/60 transition-colors">
                                                    <AcademicCapIcon className="h-3.5 w-3.5" />
                                                    {reg.student.program?.name ?? 'UNSPECIFIED'}
                                                </span>
                                                <span className="text-[9px] font-black text-accent-gold/30 uppercase tracking-[0.2em] mt-2 italic">
                                                    {reg.student.faculty?.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            <span className="inline-flex text-[10px] font-black text-primary-light uppercase tracking-widest bg-primary/10 px-5 py-2 rounded-xl border border-primary/20 shadow-glow-sm italic">
                                                {reg.period.name}
                                            </span>
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            <div className="inline-flex">
                                                <StatusBadge status={reg.status} className="px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/10 italic group-hover:scale-110 transition-all font-outfit" />
                                            </div>
                                        </td>
                                        <td className="px-10 py-10 text-right">
                                            <Link
                                                href={`/admin/registrations/${reg.id}`}
                                                className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-accent-gold text-accent-gold hover:text-black border border-accent-gold/20 hover:border-accent-gold rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-2xl italic overflow-hidden relative"
                                            >
                                                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                                INSPECT CANDIDATE
                                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {(registrations.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-20">
                                                <ShieldCheckIcon className="h-20 w-20 text-white" />
                                                <p className="text-[11px] font-black text-white uppercase tracking-[0.5em] italic">Enrollment streams are clear. No active records.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Registry Intelligence Footer */}
                <div className="flex flex-col md:flex-row items-center justify-between px-10 py-8 glass rounded-[3rem] border-white/5 gap-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary-light border border-primary/20">
                            <BoltIcon className="h-6 w-6" />
                        </div>
                        <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] italic leading-none">
                            ENROLLMENT AUTHORITY CONSOLE: <span className="text-white/40">UIN-SAIZU-CORE-SYSTEM</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">TOTAL RECORDS</p>
                            <p className="text-2xl font-black text-white italic leading-none">{registrations.data?.length ?? 0}</p>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">DATA SOURCE</p>
                            <p className="text-[11px] font-black text-accent-gold italic leading-none tracking-widest flex items-center gap-2">
                                <IdentificationIcon className="h-4 w-4" />
                                SCHOLAR_MAINFRAME_V4
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

