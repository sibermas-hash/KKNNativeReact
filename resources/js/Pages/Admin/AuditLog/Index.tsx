import { useState } from 'react'
import { router, Link, Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { route } from 'ziggy-js'
import {
    ShieldExclamationIcon, EyeIcon, MagnifyingGlassIcon,
    BoltIcon, ClockIcon, UserCircleIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

// ── Risk config ────────────────────────────────────────────────────────────────
const riskConfig: any = {
    GATE_BYPASS: { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/25', icon: '🔓', risk: 'HIGH' },
    DELETE: { color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/25', icon: '🗑️', risk: 'HIGH' },
    FINALISASI: { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/25', icon: '✅', risk: 'MEDIUM' },
    UPDATE: { color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/25', icon: '✏️', risk: 'LOW' },
    CREATE: { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25', icon: '➕', risk: 'LOW' },
    LOGIN: { color: 'text-sky-400', bg: 'bg-sky-400/15 border-sky-400/25', icon: '🔑', risk: 'INFO' },
}

const getActionCfg = (action: string) =>
    riskConfig[action] ??
    { color: 'text-slate-400', bg: 'bg-slate-700/30 border-slate-600/30', icon: '•', risk: 'INFO' }

// ── Timeline Item ──────────────────────────────────────────────────────────────
function LogItem({ log }: { log: any }) {
    const cfg = getActionCfg(log.action)

    return (
        <div className="flex gap-4 py-4 px-6 hover:bg-white/5 border-b border-white/5 transition-colors group">
            <div className="flex flex-col items-center flex-shrink-0 mt-1">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg border shadow-lg ${cfg.bg}`}>
                    <span>{cfg.icon}</span>
                </div>
                <div className="w-px flex-1 mt-2 bg-gradient-to-b from-white/10 to-transparent" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-bold tracking-tight">{log.user?.name ?? 'System'}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest border uppercase ${cfg.bg} ${cfg.color}`}>
                        {log.action}
                    </span>
                    {log.ability && (
                        <code className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-violet-300 font-mono border border-white/5">
                            {log.ability}
                        </code>
                    )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                        <UserCircleIcon className="w-3.5 h-3.5 opacity-50" />
                        {log.ip_address}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5 opacity-50" />
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
                    </span>
                </div>
                {log.description && (
                    <p className="mt-2 text-xs text-slate-400 line-clamp-1 leading-relaxed">{log.description}</p>
                )}
            </div>

            <div className="flex items-start gap-3 flex-shrink-0">
                <span className={`text-[10px] px-2 py-1 rounded-md font-black tracking-tighter ${cfg.risk === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    cfg.risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-700/50 text-slate-500'
                    }`}>{cfg.risk}</span>
                <Link href={route('admin.audit-log.show', log.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-slate-400
            hover:text-white hover:bg-white/10 transition-all active:scale-95">
                    <EyeIcon className="w-5 h-5" />
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
    const [selected, setSelected] = useState<any>(null)

    const applyFilters = (extra = {}) => router.get(
        route('admin.audit-log.index'),
        { ...filters, search, ...extra },
        { preserveState: true, replace: true }
    )

    return (
        <AppLayout title="Audit Log System">
            <Head title="Audit Log System" />
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/20 shadow-lg shadow-red-500/5">
                        <ShieldExclamationIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Audit Log System</h1>
                        <p className="text-slate-500 text-sm font-medium">Monitoring real-time aktivitas kritis dan hak akses sistem</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: 'Aktivitas Hari Ini', value: stats.total_today, color: 'text-blue-400', icon: BoltIcon, bg: 'from-blue-500/10 to-transparent' },
                        { label: 'Gate Bypass', value: stats.gate_bypass, color: 'text-red-400', icon: ShieldExclamationIcon, bg: 'from-red-500/10 to-transparent' },
                        { label: 'Aktor Aktif', value: stats.actors_today, color: 'text-violet-400', icon: UserCircleIcon, bg: 'from-violet-500/10 to-transparent' },
                    ].map(({ label, value, color, icon: Icon, bg }) => (
                        <div key={label} className={`relative overflow-hidden rounded-3xl p-6 border border-white/10 bg-gradient-to-br ${bg} backdrop-blur-xl`}>
                            <div className="relative z-10">
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{label}</p>
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-6 h-6 ${color} opacity-80`} />
                                    <span className={`text-3xl font-black ${color}`}>{value}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-4 mb-6 flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[240px]">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text" placeholder="Cari aktor, IP, atau kemampuan..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                            className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm text-white outline-none
                bg-white/5 border border-white/10 placeholder-slate-600 focus:border-red-500/30 transition-all font-medium"
                        />
                    </div>
                    <select onChange={e => applyFilters({ action: e.target.value })}
                        defaultValue={filters.action ?? ''}
                        className="px-4 py-2.5 rounded-2xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-red-500/30 font-semibold appearance-none">
                        <option value="" className="bg-slate-900">Semua Aksi</option>
                        {actions.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <input type="date" value={filters.date_from ?? ''}
                            onChange={e => applyFilters({ date_from: e.target.value })}
                            className="px-4 py-2.5 rounded-2xl text-xs text-white bg-white/5 border border-white/10 outline-none focus:border-red-500/30 font-bold" />
                        <span className="text-slate-600 font-black">—</span>
                        <input type="date" value={filters.date_to ?? ''}
                            onChange={e => applyFilters({ date_to: e.target.value })}
                            className="px-4 py-2.5 rounded-2xl text-xs text-white bg-white/5 border border-white/10 outline-none focus:border-red-500/30 font-bold" />
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {logs.total} Total Entri · Halaman {logs.current_page} dari {logs.last_page}
                        </p>
                    </div>

                    <div className="divide-y divide-white/5">
                        {logs.data.map((log: any) => (
                            <LogItem key={log.id} log={log} />
                        ))}
                        {logs.data.length === 0 && (
                            <div className="py-20 text-center">
                                <ShieldExclamationIcon className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold text-lg">Tidak ada log aktivitas ditemukan</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-white/5 flex gap-2 overflow-x-auto bg-white/2">
                        {logs.links.map((link: any, i: number) => (
                            <button key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap
                  ${link.active
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                        : !link.url
                                            ? 'text-slate-700 cursor-default opacity-50'
                                            : 'text-slate-500 hover:bg-white/5 hover:text-white border border-white/5'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
                    onClick={() => setSelected(null)}>
                    <div className="w-full max-w-2xl rounded-[2.5rem] border border-white/15 p-8 shadow-2xl bg-slate-900"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${getActionCfg(selected.action).bg}`}>
                                    {getActionCfg(selected.action).icon}
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl tracking-tight">Log Details #{selected.id}</h3>
                                    <p className="text-slate-500 text-sm font-medium">{selected.action} Activity</p>
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all font-black text-xl">
                                &times;
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {[
                                ['Aktor', selected.user?.name ?? 'System'],
                                ['Role', selected.user?.role ?? '-'],
                                ['IP Address', selected.ip_address],
                                ['Ability', selected.ability ?? 'None'],
                                ['Timestamp', new Date(selected.created_at).toLocaleString('id-ID')],
                                ['User Agent', selected.user_agent?.split(' ')[0] ?? '-'],
                            ].map(([l, v]) => (
                                <div key={l as string} className="p-4 rounded-3xl bg-white/2 border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">{l as string}</p>
                                    <p className="text-slate-200 font-bold truncate text-sm">{v}</p>
                                </div>
                            ))}
                        </div>

                        {selected.description && (
                            <div className="mb-8">
                                <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Description</p>
                                <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10 text-slate-300 text-sm leading-relaxed">
                                    {selected.description}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setSelected(null)}
                                className="flex-1 py-4 rounded-2xl text-sm font-black text-slate-400 border border-white/10 hover:bg-white/5 transition-all">
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
