import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Badge } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    Filter,
    IdCard,
    List,
    ShieldCheck,
    Calendar,
    Activity,
    Search,
    Fingerprint,
    Cpu,
    SearchCheck,
    Database,
    ChevronRight,
    Clock,
    Binary,
    Zap,
    LayoutDashboard,
    Layers,
    UserCheck,
    ClipboardList,
    Flag,
    FileSearch,
    Key,
    Target
} from 'lucide-react';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

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
    filters: { status?: string; search?: string };
}

export default function AdminDailyReportsIndex({ reports, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '') || status !== (filters.status || '')) {
                router.get('/admin/laporan/harian', { search, status }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, status]);

    return (
        <AppLayout title="Audit Logbook Harian Taktis">
            <Head title="Logbook Aktivitas KKN" />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">LOGBOOK_AUDIT_SUBSYSTEM_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <Activity className="w-10 h-10 text-emerald-600" />
                            AUDIT <span className="text-emerald-600">LOGBOOK</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Otorisasi aktivitas harian, verifikasi narasi operasional, dan audit integritas data lapangan.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                            <div className="relative z-10 flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Logged Entries</span>
                                <div className="flex items-center gap-3">
                                    <List className="w-5 h-5 text-emerald-500" />
                                    <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{(reports.data ?? []).length} REPORTS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex-1 w-full lg:max-w-4xl flex flex-col sm:flex-row gap-6">
                        <div className="relative group flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="search"
                                placeholder="SEARCH_BY_PERSONNEL_OR_ACTIVITY..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-18 pl-16 pr-8 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-black italic tracking-tight text-slate-950 placeholder:text-slate-200 focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="relative group w-full sm:max-w-xs px-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] flex items-center gap-4 shadow-sm focus-within:border-emerald-500 transition-all">
                            <Filter className="w-4 h-4 text-emerald-600" />
                            <div className="flex-1 flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 italic">STATUS_FILTER</span>
                                <select 
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-[10px] font-black italic text-slate-950 focus:ring-0 cursor-pointer appearance-none uppercase"
                                >
                                    <option value="">ALL_CHANNELS</option>
                                    <option value="submitted">SUBMITTED</option>
                                    <option value="disetujui">VERIFIED</option>
                                    <option value="revisi">REVISION</option>
                                    <option value="draf">DRAFT</option>
                                </select>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-200 rotate-90" />
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-3 opacity-20 hover:opacity-100 transition-opacity">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">REAL-TIME_FEED_SYNC</span>
                    </div>
                </div>

                {/* Tactical Ledger Table */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">TEMPORAL_MARK</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">ACTIVITY_DESCRIPTOR</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">PERSONNEL_IDENTITY</th>
                                    <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">OPERATIONAL_UNIT</th>
                                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">SYSTEM_STATE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(reports.data ?? []).length > 0 ? (reports.data ?? []).map((r, idx) => (
                                    <motion.tr 
                                        key={r.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-slate-50/50 transition-colors cursor-default"
                                    >
                                        <td className="px-12 py-8 whitespace-nowrap">
                                            <div className="flex items-center gap-5">
                                                <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-300 group-hover:text-emerald-600 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all shadow-sm">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors tabular-nums italic uppercase tracking-tighter">{r.date}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-black text-slate-950 group-hover:text-emerald-600 transition-colors truncate max-w-[300px] uppercase italic tracking-tighter">
                                                    {r.title}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">ENTRY_ID: #{r.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-xl bg-slate-950 text-emerald-500 border border-slate-800 flex items-center justify-center font-black text-lg italic shadow-lg group-hover:scale-110 transition-transform">
                                                    {r.student?.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-950 uppercase italic tracking-tighter group-hover:text-emerald-700 transition-colors">{r.student?.name}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 italic mt-1 self-start">HASH: {r.student?.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                                                <span className="text-xs font-black text-slate-700 uppercase italic tracking-tight">{r.group?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            <StatusBadge status={r.status} className="px-4 py-1.5 rounded-[1rem] text-[9px] font-black uppercase tracking-widest italic border-none shadow-sm" />
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8">
                                                <div className="p-12 bg-slate-50 rounded-[4rem] border border-slate-100 border-dashed">
                                                    <Activity className="h-20 w-20 text-slate-200" />
                                                </div>
                                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">SYSTEM_INFO: NO_LOGBOOK_CHANNELS_DETECTED</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* Tactical Footer Stamp */}
                <div className="p-12 bg-slate-950 rounded-[4rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)]" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-6">
                                <div className="p-5 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-[2.5rem] rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                    <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white italic tracking-[0.3em] uppercase">Audit_Intelligence_Core • V4</h4>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic leading-relaxed max-w-2xl">
                                        Logbook harian merupakan rantai bukti operasional utama. Seluruh entitas aktivitas disinkronisasi melalui KKN UIN SAIZU decentralized registry untuk verifikasi otoritas.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-10">
                            {[Fingerprint, Binary, Database].map((Icon, i) => (
                                <div key={i} className="h-20 w-20 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all cursor-help shadow-2xl group/feat">
                                    <Icon className="h-10 w-10 group-hover/feat:scale-110 transition-transform" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-12 pt-10 border-t border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic">
                         <div className="flex items-center gap-3">
                             <SearchCheck className="w-4 h-4 text-emerald-600" />
                             LOGBOOK_VERIFICATION_UNIT_ALPHA
                         </div>
                         <div className="flex items-center gap-3">
                             {new Date().getFullYear()} • ENCRYPTED_STATE
                         </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
