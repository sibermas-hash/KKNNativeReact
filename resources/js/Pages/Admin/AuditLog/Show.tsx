import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import {
    ArrowLeftIcon,
    CommandLineIcon, CpuChipIcon, GlobeAltIcon,
    UserIcon, ClockIcon
} from '@heroicons/react/24/outline'

export default function AuditLogShow({ log }: { log: any }) {
    const jsonDiff = (old: any, next: any) => {
        if (!old && !next) return <p className="text-slate-500 italic">No data recorded</p>

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Previous State</p>
                        <pre className="text-xs font-mono text-slate-400 overflow-x-auto custom-scrollbar leading-relaxed">
                            {JSON.stringify(old, null, 2)}
                        </pre>
                    </div>
                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Updated State</p>
                        <pre className="text-xs font-mono text-slate-200 overflow-x-auto custom-scrollbar leading-relaxed">
                            {JSON.stringify(next, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <AppLayout title={`Log Identity #${log.id}`}>
            <Head title={`Audit Log Details #${log.id}`} />

            <div className="max-w-4xl mx-auto p-6">
                <Link
                    href="/admin/audit-log"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold mb-8 group"
                >
                    <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Timeline
                </Link>

                {/* Hero Card */}
                <div className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden mb-8">
                    <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 p-8 border-b border-white/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-3xl bg-slate-950 flex items-center justify-center text-3xl shadow-2xl border border-white/10">
                                    🛡️
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white tracking-tight">Security Audit Event</h1>
                                    <p className="text-slate-400 font-medium">System identification hash: <span className="text-red-400 font-mono">0x{log.id.toString(16).toUpperCase()}</span></p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="px-4 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-black border border-red-500/20 uppercase tracking-widest">
                                    {log.action}
                                </span>
                                <p className="text-[10px] text-slate-500 mt-2 font-black uppercase">Level: Critical Monitoring</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <UserIcon className="w-3 h-3" /> Initiator
                            </p>
                            <p className="text-white font-black text-lg">{log.user?.name ?? 'System Authority'}</p>
                            <p className="text-slate-400 text-xs font-medium">{log.user?.email ?? 'Internal Service'}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ClockIcon className="w-3 h-3" /> Event Horizon
                            </p>
                            <p className="text-white font-black text-lg">
                                {format(new Date(log.created_at), 'dd MMMM yyyy', { locale: id })}
                            </p>
                            <p className="text-slate-400 text-xs font-medium">
                                {format(new Date(log.created_at), 'HH:mm:ss')} ({formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })})
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <GlobeAltIcon className="w-3 h-3" /> Origin Trace
                            </p>
                            <p className="text-white font-black text-lg">{log.ip_address}</p>
                            <p className="text-slate-400 text-xs font-medium truncate max-w-[200px]" title={log.user_agent}>
                                {log.user_agent?.split(' ')[0]}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Data Section */}
                <div className="space-y-8">
                    {/* Ability / Purpose */}
                    <div className="glass-card rounded-[2rem] border border-white/10 p-8 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <CommandLineIcon className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-black text-white tracking-tight">Technical Capability & Description</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Authenticated Ability</p>
                                <code className="text-violet-400 font-mono text-sm">{log.ability ?? 'global_access'}</code>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-3">Activity Description</p>
                                <p className="text-slate-300 leading-relaxed font-medium">
                                    {log.description || 'No additional description provided by the system provider.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Model Mutation */}
                    <div className="glass-card rounded-[2rem] border border-white/10 p-8 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <CpuChipIcon className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-lg font-black text-white tracking-tight">Data Mutation Inspector</h2>
                        </div>

                        {log.model_type && (
                            <div className="mb-6 flex items-center gap-2 text-xs">
                                <span className="text-slate-500 font-bold uppercase tracking-widest">Model:</span>
                                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-mono">
                                    {log.model_type} #{log.model_id}
                                </span>
                            </div>
                        )}

                        {jsonDiff(log.old_values, log.new_values)}
                    </div>
                </div>
            </div>

            <style>{`
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
        </AppLayout>
    )
}
