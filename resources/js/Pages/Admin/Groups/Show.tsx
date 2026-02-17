import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    IdentificationIcon,
    MapPinIcon,
    UserGroupIcon,
    AcademicCapIcon,
    QrCodeIcon,
    ShieldCheckIcon,
    CalendarDaysIcon,
    ChevronLeftIcon,
    ClockIcon,
    Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

interface Props extends PageProps {
    group: {
        id: number;
        code: string;
        name: string;
        token: string;
        capacity: number;
        status: string;
        period: { name: string };
        location: { village_name: string; address?: string };
        lecturer: { name: string; nip: string } | null;
        registrations: { id: number; status: string; student: { nim: string; name: string } }[];
        work_programs: { id: number; title: string; status: string }[];
    };
}

export default function GroupShow({ group }: Props) {
    return (
        <AppLayout title={`BRIGADE ${group.code} // ${group.name}`}>
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <Link href="/admin/groups" className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-accent-gold transition-colors mb-6 group">
                            <ChevronLeftIcon className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            RETURN TO BRIGADE REGISTRY
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">FIELD OPERATIONAL UNIT</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Brigade <span className="text-accent-gold text-glow-gold">{group.code}</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em] flex items-center gap-3">
                            <Square3Stack3DIcon className="w-5 h-5 text-primary-light" />
                            {group.name}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="px-8 py-5 glass rounded-[2rem] flex items-center gap-6">
                            <QrCodeIcon className="h-6 w-6 text-accent-gold" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">SECURE TOKEN</span>
                                <span className="text-xl font-black text-white mt-1 tabular-nums tracking-widest uppercase">{group.token}</span>
                            </div>
                        </div>
                        <StatusBadge status={group.status} className="px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl" />
                    </div>
                </div>

                {/* Core Intel Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        {/* Deployment Intel */}
                        <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-white pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                <MapPinIcon className="h-64 w-64" />
                            </div>

                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-10 flex items-center gap-4">
                                <MapPinIcon className="w-7 h-7 text-accent-gold" />
                                Deployment HUB
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                <IntelItem icon={MapPinIcon} label="TACTICAL VILLAGE" value={group.location.village_name} />
                                <IntelItem icon={IdentificationIcon} label="OPERATIONAL ADDRESS" value={group.location.address || 'UNDEFINED LOCATION'} />
                                <IntelItem icon={CalendarDaysIcon} label="ASSIGNED CYCLE" value={group.period.name} />
                                <IntelItem icon={UserGroupIcon} label="SCHOLAR OCCUPANCY" value={`${group.registrations.length} / ${group.capacity} UNITS`} status={group.registrations.length >= group.capacity ? 'FULL' : 'AVAILABLE'} />
                            </div>
                        </div>

                        {/* Scholar Manifest */}
                        <div className="bg-white/[0.02] rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl">
                            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary-light">
                                        <UserGroupIcon className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Scholar Manifest</h3>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Authorized participants in this tactical unit.</p>
                                    </div>
                                </div>
                                <span className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                    {group.registrations.length} SCHOLARS
                                </span>
                            </div>

                            <div className="overflow-x-auto relative z-10">
                                <table className="min-w-full divide-y divide-white/5">
                                    <thead className="bg-white/[0.02]">
                                        <tr>
                                            <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Candidate</th>
                                            <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Identifier</th>
                                            <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Link Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {group.registrations.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-10 py-24 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <UserGroupIcon className="h-12 w-12 text-white/5 mb-4" />
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Manifest empty. No scholars assigned.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            group.registrations.map((reg) => (
                                                <tr key={reg.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                                    <td className="px-10 py-8">
                                                        <span className="text-base font-black text-white tracking-widest uppercase italic group-hover:text-accent-gold transition-colors">{reg.student.name}</span>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <span className="text-xs font-black text-white/40 tabular-nums tracking-[0.2em] font-mono uppercase">{reg.student.nim}</span>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <StatusBadge status={reg.status} className="text-[8px] font-black uppercase tracking-widest" />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Officer Panel */}
                    <div className="space-y-10">
                        <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-transparent">
                            <div className="absolute -top-10 -right-10 p-10 opacity-10 text-primary-light">
                                <AcademicCapIcon className="w-40 h-40" />
                            </div>

                            <h3 className="text-xl font-black text-white tracking-widest uppercase italic mb-10 border-b border-white/10 pb-6 flex items-center gap-3">
                                <ClockIcon className="w-5 h-5 text-accent-gold" />
                                Command Oversight
                            </h3>

                            {group.lecturer ? (
                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark border border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                                            {group.lecturer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-white tracking-tight uppercase italic leading-none">{group.lecturer.name}</p>
                                            <p className="text-[10px] font-black text-accent-gold tracking-[0.3em] uppercase mt-2">FIELD SUPERVISOR (DPL)</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">OFFICER IDENTIFIER (NIP)</p>
                                        <p className="text-sm font-black text-white tabular-nums tracking-widest uppercase italic">{group.lecturer.nip}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                    <ShieldCheckIcon className="w-10 h-10 text-white/10 mb-4" />
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic text-center px-6">COMMAND OFFICER NOT YET COMMISSIONED</p>
                                </div>
                            )}

                            <div className="mt-12 pt-10 border-t border-white/10">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] leading-relaxed italic">
                                    * ALL FIELD OPERATIONS ARE SUBJECT TO FULL OVERSIGHT BY THE DESIGNATED OFFICER.
                                </p>
                            </div>
                        </div>

                        {/* Strategic Objectives */}
                        <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl">
                            <h3 className="text-xl font-black text-white tracking-widest uppercase italic mb-8 border-b border-white/10 pb-6 flex items-center gap-3">
                                <Square3Stack3DIcon className="w-5 h-5 text-accent-gold" />
                                Mission Count
                            </h3>
                            <div className="flex items-end justify-between">
                                <span className="text-5xl font-black text-white tabular-nums tracking-tighter text-glow-primary">
                                    {group.work_programs.length}
                                </span>
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">ACTIVE MISSIONS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function IntelItem({ icon: Icon, label, value, status }: { icon: any; label: string; value: string; status?: string }) {
    return (
        <div className="group/item">
            <div className="flex items-center gap-3 mb-4">
                <Icon className="w-4 h-4 text-accent-gold group-hover/item:rotate-12 transition-transform" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{label}</span>
            </div>
            <p className="text-lg font-black text-white tracking-tight uppercase italic group-hover/item:text-primary-light transition-colors leading-tight">
                {value}
            </p>
            {status && (
                <span className={`inline-block mt-3 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${status === 'FULL' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                    {status}
                </span>
            )}
        </div>
    );
}
