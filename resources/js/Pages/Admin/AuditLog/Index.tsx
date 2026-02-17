import { useState } from 'react'
import { router, Link, Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { route } from 'ziggy-js'
import {
    ShieldExclamationIcon, EyeIcon, MagnifyingGlassIcon,
    BoltIcon, ClockIcon, UserCircleIcon,
    FunnelIcon, ArrowPathIcon, KeyIcon, FingerPrintIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

// ── Risk config ────────────────────────────────────────────────────────────────
const riskConfig: any = {
    GATE_BYPASS: { color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20', icon: <ShieldExclamationIcon className="w-6 h-6" />, risk: 'CRITICAL' },
    DELETE: { color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/10', icon: <BoltIcon className="w-6 h-6" />, risk: 'HIGH' },
    FINALISASI: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <FingerPrintIcon className="w-6 h-6" />, risk: 'AUDITED' },
    UPDATE: { color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', icon: <BoltIcon className="w-6 h-6" />, risk: 'LOW' },
    CREATE: { color: 'text-primary-light', bg: 'bg-primary/10 border-primary/20', icon: <PlusIcon className="w-6 h-6" />, risk: 'LOG' },
    LOGIN: { color: 'text-accent-gold', bg: 'bg-accent-gold/10 border-accent-gold/20', icon: <KeyIcon className="w-6 h-6" />, risk: 'ACCESS' },
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    )
}

const getActionCfg = (action: string) =>
    riskConfig[action] ??
    { color: 'text-white/40', bg: 'bg-white/5 border-white/10', icon: <BoltIcon className="w-6 h-6" />, risk: 'INFO' }

// ── Timeline Item ──────────────────────────────────────────────────────────────
function LogItem({ log }: { log: any }) {
    const cfg = getActionCfg(log.action)

    return (
        <div className="flex gap-8 py-10 px-12 hover:bg-white/[0.04] border-b border-white/5 transition-all group relative">
            <div className="flex flex-col items-center flex-shrink-0 mt-1">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-2xl transition-all duration-700 group-hover:rotate-[360deg] ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                </div>
                <div className="w-px flex-1 mt-6 bg-gradient-to-b from-white/10 to-transparent" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 flex-wrap mb-4">
                    <span className="text-white font-black tracking-tight text-xl uppercase italic group-hover:text-accent-gold transition-colors">{log.user?.name ?? 'SYSTEM KERNEL'}</span>
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-[0.3em] border uppercase shadow-2xl backdrop-blur-md ${cfg.bg} ${cfg.color}`}>
                        {log.action}
                    </span>
                    {log.ability && (
                        <code className="px-3 py-1.5 rounded-lg text-[9px] bg-white/5 text-white/40 font-black border border-white/10 uppercase tracking-tighter italic">
                            {log.ability}
                        </code>
                    )}
                </div>
                <div className="flex items-center gap-8 text-[10px] text-white/20 font-black uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-2.5 px-4 py-2 bg-white/[0.02] rounded-xl group-hover:text-white/40 transition-colors border border-white/5 font-mono italic">
                        <FingerPrintIcon className="w-3.5 h-3.5 opacity-40 text-accent-gold" />
                        {log.ip_address}
                    </span>
                    <span className="flex items-center gap-2.5 px-4 py-2 bg-white/[0.02] rounded-xl group-hover:text-white/40 transition-colors border border-white/5">
                        <ClockIcon className="w-3.5 h-3.5 opacity-40 text-primary-light" />
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
                    </span>
                </div>
                {log.description && (
                    <div className="text-sm text-white/60 font-medium leading-relaxed bg-black/40 p-5 rounded-2xl border border-white/5 shadow-2xl max-w-2xl group-hover:border-white/10 transition-colors">
                        {log.description}
                    </div>
                )}
            </div>

            <div className="flex items-start gap-5 flex-shrink-0 pt-1">
                <span className={`text-[8px] px-4 py-2 rounded-xl font-black tracking-[0.3em] border shadow-2xl backdrop-blur-md transition-all group-hover:scale-110 ${cfg.risk === 'CRITICAL' ? 'bg-rose-500 text-white border-rose-600 animate-pulse' :
                    cfg.risk === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' :
                        'bg-primary-light/20 text-primary-light border-primary-light/20'
                    }`}>{cfg.risk}</span>
                <Link href={route('admin.audit-log.show', log.id)}
                    className="opacity-0 group-hover:opacity-100 p-4 rounded-2xl text-white/20
            hover:text-accent-gold hover:bg-white/5 transition-all active:scale-95 shadow-2xl border border-white/5 hover:border-accent-gold/20">
                    <EyeIcon className="w-6 h-6" />
                </Link>
            </div>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AuditLogIndex({ logs, stats, filters, actions }: {
    logs: any; stats: any; filters: any; actions: string[]
}) {
    const [search, setSearch] = useState(filters.search ?? '')

    const applyFilters = (extra = {}) => router.get(
        route('admin.audit-log.index'),
        { ...filters, search, ...extra },
        { preserveState: true, replace: true }
    )

    return (
        <AppLayout title="Security Performance Ledger">
            <Head title="Security Performance Ledger" />
            <div className="space-y-16 animate-in fade-in duration-1000 pb-16">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-[0.3em]">IMMUTABLE AUDIT TRAIL</div>
                            <div className="w-2 h-2 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Security <span className="text-accent-gold text-glow-gold">Ledger</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Real-time persistence and forensic analysis of scholastic operations.</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: 'Telemetric Events', value: stats.total, icon: BoltIcon, color: 'text-primary-light', bg: 'bg-primary/10' },
                        { label: 'Critical Breaches', value: stats.high_risk, icon: ShieldExclamationIcon, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                        { label: 'Authorized Uplinks', value: stats.unique_users, icon: UserCircleIcon, color: 'text-white', bg: 'bg-white/5' },
                        { label: '24H Persistence', value: stats.today_logs, icon: ArrowPathIcon, color: 'text-accent-gold', bg: 'bg-accent-gold/10' },
                    ].map((s, i) => (
                        <div key={i} className="glass p-10 rounded-[2.5rem] shadow-2xl flex items-center justify-between group transition-all duration-700 hover:-translate-y-3 relative overflow-hidden">
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${s.bg}`} />
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">{s.label}</p>
                                <p className={`text-4xl font-black tabular-nums transition-all group-hover:scale-110 group-hover:text-glow-gold ${s.color}`}>{s.value.toLocaleString()}</p>
                            </div>
                            <div className={`p-5 rounded-2xl ${s.bg} ${s.color} transition-all duration-700 group-hover:rotate-[360deg] shadow-2xl border border-white/5 group-hover:border-current/20 relative z-10`}>
                                <s.icon className="w-8 h-8" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Performance Feed View */}
                <div className="bg-white/[0.02] rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xxl">
                    <div className="p-10 border-b border-white/5 flex flex-wrap gap-8 items-center justify-between bg-white/[0.01]">
                        <div className="flex-1 min-w-[400px] relative group text-white">
                            <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-white/20 group-focus-within:text-accent-gold transition-all" />
                            <input
                                type="text"
                                placeholder="SCAN LEDGER FOR IDENTIFIERS (USER, IP, DESCRIPTION)..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full pl-16 pr-8 py-5 bg-black/40 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-accent-gold/50 shadow-2xl transition-all"
                            />
                        </div>
                        <div className="flex gap-5">
                            <select
                                value={filters.action ?? ''}
                                onChange={(e) => applyFilters({ action: e.target.value })}
                                className="px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-accent-gold bg-black/40 border border-white/10 outline-none focus:border-accent-gold shadow-2xl cursor-pointer transition-all"
                            >
                                <option value="" className="bg-surface-panel">SCHEMA FILTER</option>
                                <option value="LOGIN" className="bg-surface-panel">LOGIN ACCESS</option>
                                <option value="CREATE" className="bg-surface-panel">INITIALIZE</option>
                                <option value="UPDATE" className="bg-surface-panel">MODIFICATION</option>
                                <option value="DELETE" className="bg-surface-panel">TERMINATION</option>
                                <option value="GATE_BYPASS" className="bg-surface-panel">BYPASS EVENT</option>
                                <option value="FINALISASI" className="bg-surface-panel">VALIDATION</option>
                            </select>
                            <button
                                onClick={() => applyFilters()}
                                className="group px-12 py-5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 border border-white/10 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <FunnelIcon className="w-5 h-5 text-accent-gold" /> SCAN LEDGER
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-white/[0.03]">
                        {logs.data.length > 0 ? (
                            logs.data.map((log: any) => (
                                <LogItem key={log.id} log={log} />
                            ))
                        ) : (
                            <div className="py-40 text-center relative overflow-hidden">
                                <ShieldExclamationIcon className="w-24 h-24 text-white/5 mx-auto mb-8" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">No telemetric anomalies detected in current uplink scan.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="px-12 py-12 bg-white/[0.01] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                            RECORDS: <span className="text-white/60">{logs.from ?? 0}</span> TO <span className="text-white/60">{logs.to ?? 0}</span> OF <span className="text-white/40">{logs.total}</span> ENTRIES
                        </p>
                        <div className="flex gap-4">
                            {logs.links.map((link: any, idx: number) => (
                                <Link
                                    key={idx}
                                    href={link.url ?? '#'}
                                    className={`h-12 min-w-[48px] px-4 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${link.active ? 'bg-primary text-white shadow-xl shadow-primary/40 border border-white/10 scale-110' :
                                        link.url ? 'bg-white/5 text-white/40 border border-white/10 hover:border-accent-gold/40 hover:text-accent-gold shadow-2xl hover:scale-105' :
                                            'bg-white/[0.01] text-white/10 cursor-not-allowed border border-white/5'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
