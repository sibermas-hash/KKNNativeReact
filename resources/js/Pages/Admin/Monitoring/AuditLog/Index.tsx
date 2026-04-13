import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import {
    History,
    Search,
    User,
    Activity,
    Clock,
    Eye,
    ChevronRight,
    ShieldCheck,
    Zap,
    Cpu,
    Database,
    Binary,
    Layers,
    AlertTriangle,
    Navigation,
    Fingerprint,
    Ghost
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { LucideIcon } from '@/types';

interface AuditLog {
    id: number;
    description: string;
    subject_type: string | null;
    user?: { name: string; email: string };
    severity: 'low' | 'medium' | 'high';
    action: string;
    ip_address?: string;
    created_at: string;
}

interface Props {
    logs: { data: AuditLog[]; meta: PaginationMeta };
    filters: { search?: string };
    stats: { total: number; high_risk: number; unique_users: number; today_logs: number };
}

export default function AuditLogIndex({ logs, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.audit-log.index'), { search }, { preserveState: true });
    };

    return (
        <AppLayout title="Audit Log">
            <Head title="System Intelligence Tracker" />

            <div className="space-y-4 font-sans text-slate-900">
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <h1 className="text-base font-black tracking-tight uppercase italic leading-none">System Intelligence Tracker</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Security Node / Chronological Integrity Audit</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="h-10 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <History size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic tabular-nums">{stats.total.toLocaleString()} Records</span>
                            </div>
                            <div className="h-4 w-px bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 italic tabular-nums">{stats.high_risk} Risks</span>
                            </div>
                         </div>
                    </div>
                </div>

                {/* --- METRIC STRIPS --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <LogMetricStrip label="Users Active" value={stats.unique_users} icon={User} />
                    <LogMetricStrip label="Daily Threads" value={stats.today_logs} icon={Activity} />
                    <LogMetricStrip label="Kernel Status" value="OPTIMIZED" icon={Cpu} />
                    <LogMetricStrip label="Pipeline" value="SECURE" icon={ShieldCheck} />
                </div>

                {/* --- AUDIT LEDGER --- */}
                <section className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-slate-50/20 border-b border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-3 font-sans">
                            <Binary size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Intelligence Chronology Stream</span>
                         </div>
                         <form onSubmit={handleSearch} className="relative w-64 group">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                             <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SEARCH IDENTIFIER..." className="w-full h-8 pl-10 pr-3 bg-white border border-slate-100 rounded-lg text-[10px] font-bold focus:border-emerald-500 outline-none transition-all uppercase tracking-tight italic" />
                         </form>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Node</th>
                                    <th className="px-6 py-4">Activity Sequence</th>
                                    <th className="px-6 py-4">Security Causer</th>
                                    <th className="px-6 py-4 text-center">Subject Link</th>
                                    <th className="px-6 py-4 text-right">Execution Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className={clsx("group transition-all", {
                                        "bg-red-50/10": log.severity === 'high',
                                        "bg-amber-50/10": log.severity === 'medium',
                                        "hover:bg-slate-50/50": log.severity === 'low',
                                    })}>
                                        <td className="px-6 py-4">
                                             <span className="text-[10px] font-black text-slate-200 font-mono italic">#{log.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={clsx(
                                                    "h-10 w-10 border rounded-xl flex items-center justify-center transition-all shrink-0",
                                                    {
                                                        "bg-red-50 border-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white": log.severity === 'high',
                                                        "bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white": log.severity === 'medium',
                                                        "bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white": log.severity === 'low',
                                                    }
                                                )}>
                                                    {log.severity === 'high' ? <AlertTriangle size={18} /> : <Activity size={18} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold text-slate-900 uppercase leading-none italic truncate max-w-[250px]">{log.description}</span>
                                                    <span className={clsx("text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60", {
                                                        "text-red-500": log.severity === 'high',
                                                        "text-amber-500": log.severity === 'medium',
                                                        "text-slate-400": log.severity === 'low',
                                                    })}>{log.action}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <div className="flex items-center gap-3">
                                                <div className="h-7 w-7 bg-slate-100 text-slate-400 rounded-md flex items-center justify-center text-[10px] font-black italic">{log.user?.name.charAt(0) || 'S'}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-slate-700 uppercase leading-none italic">{log.user?.name || 'SYSTEM_DAEMON'}</span>
                                                    <span className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-widest leading-none mt-1">AUTHORIZED_ACTOR</span>
                                                </div>
                                             </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             <span className="inline-flex h-6 items-center px-3 bg-white border border-slate-100 text-slate-400 rounded-md text-[9px] font-black uppercase tracking-widest italic">{log.subject_type?.split('\\').pop() || 'STATIC_EVENT'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex flex-col items-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-bold text-slate-900 font-mono tracking-tighter italic tabular-nums">{log.created_at}</span>
                                                <Link href={route('admin.audit-log.show', log.id)} className="text-[8px] font-black text-emerald-600 uppercase tracking-widest underline decoration-emerald-200 hover:text-emerald-800">Inspect_Packet</Link>
                                             </div>
                                        </td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr><td colSpan={5} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Security silence. buffer null.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Transmission. Page {logs.meta?.current_page || 1} OF {logs.meta?.last_page || 1}</span>
                        {logs.meta && <Pagination meta={logs.meta} />}
                    </div>
                </section>

                {/* COMPLIANCE OVERLAY */}
                <div className="bg-emerald-600 rounded-xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><ShieldCheck size={200} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-white"><Layers size={28} /></div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-black uppercase tracking-tight leading-none italic text-white">Immutable Audit Architecture</h4>
                                <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest leading-relaxed max-w-xl">Seluruh aktivitas sistem tercatat secara immutable. Audit log menjamin transparansi operasional dan akuntabilitas personil dalam manajemen metadata KKN.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-500/40 italic"><Zap size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Audit Chain Secured</span></div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function LogMetricStrip({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm"><Icon size={16} /></div>
            <div className="flex flex-col relative z-20">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
                <span className="text-xl font-black text-slate-900 uppercase italic tracking-tighter tabular-nums leading-none group-hover:text-emerald-600 transition-colors">{value}</span>
            </div>
        </div>
    );
}
