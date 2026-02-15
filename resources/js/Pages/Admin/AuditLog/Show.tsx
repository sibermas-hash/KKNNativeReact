import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    ArrowLeftIcon,
    CommandLineIcon, CpuChipIcon, GlobeAltIcon,
    UserIcon, ClockIcon
} from '@heroicons/react/24/outline';
import { route } from 'ziggy-js';
import VisualDiff from '@/Components/VisualDiff';

export default function AuditLogShow({ log }: { log: any }) {
    return (
        <AppLayout title={`Log Identity #${log.id}`}>
            <Head title={`Audit Log Details #${log.id}`} />

            <div className="max-w-4xl mx-auto p-6">
                <Link
                    href={route('admin.audit-log.index')}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold mb-8 group"
                >
                    <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Timeline
                </Link>

                {/* Hero Card */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
                    <div className="bg-slate-50 p-8 border-b border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-3xl shadow-xl">
                                    🛡️
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security Audit Event</h1>
                                    <p className="text-slate-500 font-medium">System identification hash: <span className="text-rose-500 font-mono">0x{log.id.toString(16).toUpperCase()}</span></p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-4 py-1.5 rounded-xl text-xs font-black border uppercase tracking-widest
                                    ${log.severity === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'}
                                `}>
                                    {log.action}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-2 font-black uppercase">Level: System Monitoring</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <UserIcon className="w-3 h-3" /> Initiator
                            </p>
                            <p className="text-slate-900 font-black text-lg">{log.user?.name ?? 'System Authority'}</p>
                            <p className="text-slate-500 text-xs font-medium">{log.user?.email ?? 'Internal Service'}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ClockIcon className="w-3 h-3" /> Event Horizon
                            </p>
                            <p className="text-slate-900 font-black text-lg">
                                {format(new Date(log.created_at), 'dd MMMM yyyy', { locale: id })}
                            </p>
                            <p className="text-slate-500 text-xs font-medium">
                                {format(new Date(log.created_at), 'HH:mm:ss')} ({formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })})
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <GlobeAltIcon className="w-3 h-3" /> Origin Trace
                            </p>
                            <p className="text-slate-900 font-black text-lg">{log.ip_address}</p>
                            <p className="text-slate-500 text-xs font-medium truncate max-w-[200px]" title={log.user_agent}>
                                {log.user_agent?.split(' ')[0]}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <CommandLineIcon className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Technical Capability & Description</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Authenticated Ability</p>
                                <code className="text-indigo-600 font-mono text-sm">{log.ability ?? 'global_access'}</code>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-3">Activity Description</p>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    {log.description || 'No additional description provided by the system provider.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <CpuChipIcon className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Data Mutation Inspector</h2>
                        </div>

                        {log.model_type && (
                            <div className="mb-6 flex items-center gap-2 text-xs">
                                <span className="text-slate-400 font-bold uppercase tracking-widest">Model Target:</span>
                                <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold">
                                    {log.model_type.split('\\').pop()} #{log.model_id}
                                </span>
                            </div>
                        )}

                        <VisualDiff oldValues={log.old_values} newValues={log.new_values} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
