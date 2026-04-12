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
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface AuditLog {
    id: number;
    description: string;
    subject_type: string | null;
    causer?: { name: string; };
    properties: Record<string, unknown>;
    created_at: string;
}

interface Props {
    logs: {
        data: AuditLog[];
        meta: PaginationMeta;
    };
    filters: { search?: string };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function AuditLogIndex({ logs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.audit-log.index'), { search }, { preserveState: true });
    };

    return (
        <AppLayout title="System Intelligence Tracker">
            <Head title="Audit Log | SIKKKN" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Node / Chronological Integrity Audit</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            System <span>Intelligence.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Pemantauan aktivitas sistem menyeluruh. <br />
                            <span className="text-slate-900 not-italic">Audit kronologis terhadap setiap mutasi data, interaksi operator, dan anomali eksekusi.</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                         <div className="h-24 px-10 bg-slate-900 rounded-[2.5rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                   <History size={80} strokeWidth={1} />
                              </div>
                              <div className="flex flex-col justify-center">
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-2">Total Transmissions</span>
                                   <div className="flex items-baseline gap-3">
                                        <span className="text-5xl font-black text-white tracking-tighter leading-none">{logs.meta.total.toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logs</span>
                                   </div>
                              </div>
                         </div>
                    </div>
                </motion.div>

                {/* --- TELEMETRY BENTO MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard label="Audit Pipeline" value="SECURE" icon={ShieldCheck} color="emerald" desc="End-to-end data tracing active" />
                    <MetricCard label="Transmission Speed" value="NOMINAL" icon={Zap} color="emerald" desc="IOPS performance within limits" />
                    <MetricCard label="Kernel Status" value="OPTIMIZED" icon={Cpu} color="emerald" desc="Middleware hooks authenticated" />
                </motion.div>

                {/* --- COMMAND FILTER BAR --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3rem] p-3 shadow-sm flex flex-col md:flex-row items-center gap-4">
                    <form onSubmit={handleSearch} className="flex-1 w-full relative group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="CARI AKTIVITAS / AKTOR / SUBJECT IDENTIFIER..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-16 pl-20 pr-8 bg-transparent text-sm font-black text-slate-900 border-none focus:ring-0 outline-none placeholder:text-slate-200 uppercase tracking-tight"
                        />
                    </form>
                </motion.div>

                {/* --- TACTICAL AUDIT LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-12 py-8 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                   <Binary size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Audit stream</h3>
                                   <p className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">Intelligence Chronology Ledger</p>
                              </div>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Node</th>
                                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Activity Sequence</th>
                                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Security Causer</th>
                                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-center">Subject Link</th>
                                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-right">Execution Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.data.length > 0 ? logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-emerald-50/20 transition-all group font-sans">
                                        <td className="px-12 py-8">
                                            <span className="text-[10px] font-black text-slate-200 font-mono tracking-tighter italic group-hover:text-emerald-500 transition-colors">
                                                #{log.id}
                                            </span>
                                        </td>
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-8">
                                                <div className="h-16 w-16 bg-white border border-slate-100 text-slate-300 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-emerald-500 group-hover:border-slate-900 transition-all shadow-sm">
                                                    <Activity size={22} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-sm font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase italic max-w-md truncate">{log.description}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono italic">TRACE ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black text-xs border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all italic shadow-sm">
                                                    <User size={16} />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[11px] font-black text-slate-800 uppercase italic leading-none">{log.causer?.name || 'SYSTEM_DAEMON'}</span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none pt-1">Authorized Actor</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-center">
                                            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-slate-900 group-hover:text-emerald-500 transition-all shadow-sm">
                                                <Fingerprint size={12} className="text-emerald-500" />
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">{log.subject_type?.split('\\').pop() || 'STATIC_EVENT'}</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Clock size={14} className="text-emerald-500" />
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter tabular-nums leading-none">{log.created_at}</span>
                                                </div>
                                                <Link 
                                                    href={route('admin.audit-log.show', log.id)}
                                                    className="h-9 px-4 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 rounded-xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-all shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                                >
                                                    Inspect Packet
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <Ghost size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Security Silence</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO ACTIVITY LOGS DETECTED IN CURRENT AUDIT BUFFER.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-12 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-5">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inventory Sequence Hal. {logs.meta?.current_page || 1} / {logs.meta?.last_page || 1} Transmitted</span>
                        </div>
                        {logs.meta && <Pagination meta={logs.meta} />}
                    </div>
                </motion.section>

                {/* --- FOOTER COMPLIANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-5 group-hover/f:rotate-12 transition-transform duration-1000">
                         <ShieldCheck size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <Layers className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Security Layer</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Immutable Audit Record</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Seluruh aktivitas sistem tercatat secara immutable. Audit log ini menjamin transparansi operasional dan akuntabilitas personil dalam mengelola metadata pendaftaran KKN.
                             </p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                             <div className="h-2 w-20 bg-emerald-600 rounded-full animate-pulse" />
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Audit Active</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string, icon: any, color: 'emerald' | 'amber', desc: string }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icon size={140} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
                <Icon size={30} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic leading-none">{label}</p>
                <p className="text-4xl font-black tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic leading-none">{value}</p>
                <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{desc}</p>
            </div>
        </div>
    );
}
