import { useState } from 'react'
import { router, Link, Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { route } from 'ziggy-js'
import {
    ShieldExclamationIcon, EyeIcon, MagnifyingGlassIcon,
    BoltIcon, ClockIcon, UserCircleIcon,
    FunnelIcon, ArrowPathIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

// ── Risk config ────────────────────────────────────────────────────────────────
const riskConfig: any = {
    GATE_BYPASS: { color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100', icon: '🔓', risk: 'HIGH' },
    DELETE: { color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100', icon: '🗑️', risk: 'HIGH' },
    FINALISASI: { color: 'text-primary-700', bg: 'bg-primary-50 border-primary-100', icon: '✅', risk: 'MEDIUM' },
    UPDATE: { color: 'text-sky-700', bg: 'bg-sky-50 border-sky-100', icon: '✏️', risk: 'LOW' },
    CREATE: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', icon: '➕', risk: 'LOW' },
    LOGIN: { color: 'text-primary-600', bg: 'bg-primary-50 border-primary-100', icon: '🔑', risk: 'INFO' },
}

const getActionCfg = (action: string) =>
    riskConfig[action] ??
    { color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100', icon: '•', risk: 'INFO' }

// ── Timeline Item ──────────────────────────────────────────────────────────────
function LogItem({ log }: { log: any }) {
    const cfg = getActionCfg(log.action)

    return (
        <div className="flex gap-6 py-8 px-10 hover:bg-slate-50/50 border-b border-slate-50 transition-all group relative">
            <div className="flex flex-col items-center flex-shrink-0 mt-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shadow-sm transition-transform group-hover:scale-110 ${cfg.bg}`}>
                    <span>{cfg.icon}</span>
                </div>
                <div className="w-px flex-1 mt-4 bg-gradient-to-b from-slate-100 to-transparent" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span className="text-slate-900 font-black tracking-tighter text-lg">{log.user?.name ?? 'Intelijen Sistem'}</span>
                    <span className={`px-4 py-1 rounded-xl text-[10px] font-black tracking-widest border uppercase shadow-sm ${cfg.bg} ${cfg.color}`}>
                        {log.action}
                    </span>
                    {log.ability && (
                        <code className="px-3 py-1.5 rounded-lg text-[10px] bg-slate-100 text-slate-600 font-black border border-slate-200 uppercase tracking-tighter italic">
                            {log.ability}
                        </code>
                    )}
                </div>
                <div className="flex items-center gap-6 text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg group-hover:text-slate-600 transition-colors border border-slate-100">
                        <UserCircleIcon className="w-4 h-4 opacity-40 text-primary" />
                        {log.ip_address}
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg group-hover:text-slate-600 transition-colors border border-slate-100">
                        <ClockIcon className="w-4 h-4 opacity-40 text-primary" />
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
                    </span>
                </div>
                {log.description && (
                    <div className="text-sm text-slate-500 font-medium leading-relaxed bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-sm">
                        {log.description}
                    </div>
                )}
            </div>

            <div className="flex items-start gap-4 flex-shrink-0 pt-1">
                <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black tracking-[0.2em] border shadow-sm ${cfg.risk === 'HIGH' ? 'bg-rose-600 text-white border-rose-700' :
                    cfg.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-primary-50 text-primary border-primary-100'
                    }`}>{cfg.risk}</span>
                <Link href={route('admin.audit-log.show', log.id)}
                    className="opacity-0 group-hover:opacity-100 p-3 rounded-2xl text-slate-400
            hover:text-primary hover:bg-slate-50 transition-all active:scale-95 shadow-sm border border-slate-200">
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
        <AppLayout title="Pengawasan Keamanan">
            <Head title="Sistem Audit Log" />
            <div className="space-y-12 animate-in fade-in duration-700 pb-16">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-200/60">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">Kepatuhan Terverifikasi</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Persistensi Real-time</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                            Buku Besar <span className="text-primary italic">Aktivitas</span>
                        </h1>
                    </div>
                </div>

                {/* Stats Grid - Refined Teal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Kejadian Sistem', value: stats.total, icon: BoltIcon, color: 'text-primary', bg: 'bg-primary/5' },
                        { label: 'Risiko Kritis', value: stats.high_risk, icon: ShieldExclamationIcon, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Operator Aktif', value: stats.unique_users, icon: UserCircleIcon, color: 'text-slate-900', bg: 'bg-slate-50' },
                        { label: 'Tercatat Hari Ini', value: stats.today_logs, icon: ArrowPathIcon, color: 'text-primary', bg: 'bg-primary/5' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between group transition-all hover:bg-slate-50 hover:-translate-y-1">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{s.label}</p>
                                <p className={`text-3xl font-black tabular-nums transition-colors ${s.color}`}>{s.value.toLocaleString()}</p>
                            </div>
                            <div className={`p-4 rounded-xl ${s.bg} ${s.color} transition-transform group-hover:scale-110 shadow-sm border border-transparent group-hover:border-current/10`}>
                                <s.icon className="w-8 h-8" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Performance Feed View */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden text-slate-900">
                    <div className="p-8 border-b border-slate-100 flex flex-wrap gap-6 items-center justify-between bg-slate-50/30">
                        <div className="flex-1 min-w-[300px] relative group">
                            <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari riwayat, pengguna, atau identifier IP..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full pl-15 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-4">
                            <select
                                value={filters.action ?? ''}
                                onChange={(e) => applyFilters({ action: e.target.value })}
                                className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 outline-none focus:border-primary/30 shadow-sm cursor-pointer"
                            >
                                <option value="">Skema Aksi</option>
                                <option value="LOGIN">LOGIN</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="GATE_BYPASS">GATE_BYPASS</option>
                                <option value="FINALISASI">FINALISASI</option>
                            </select>
                            <button
                                onClick={() => applyFilters()}
                                className="px-10 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-3"
                            >
                                <FunnelIcon className="w-5 h-5" /> Terapkan Filter
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {logs.data.length > 0 ? (
                            logs.data.map((log: any) => (
                                <LogItem key={log.id} log={log} />
                            ))
                        ) : (
                            <div className="py-24 text-center opacity-40">
                                <ShieldExclamationIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Tidak ada kejadian keamanan ditemukan dalam buku besar</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination - Premium Minimalist */}
                    <div className="px-10 py-10 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Menampilkan <span className="text-slate-900 border-b-2 border-primary/20">{logs.from ?? 0}</span> sampai <span className="text-slate-900 border-b-2 border-primary/20">{logs.to ?? 0}</span> dari <span className="text-slate-900">{logs.total}</span> entri
                        </p>
                        <div className="flex gap-2.5">
                            {logs.links.map((link: any, idx: number) => (
                                <Link
                                    key={idx}
                                    href={link.url ?? '#'}
                                    className={`h-11 min-w-[44px] px-3 flex items-center justify-center rounded-xl text-[10px] font-black uppercase transition-all ${link.active ? 'bg-primary text-white shadow-lg shadow-primary/20' :
                                        link.url ? 'bg-white text-slate-500 border border-slate-200 hover:border-primary/30 hover:text-primary shadow-sm hover:scale-105' :
                                            'bg-white text-slate-200 cursor-not-allowed border border-slate-100'
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
