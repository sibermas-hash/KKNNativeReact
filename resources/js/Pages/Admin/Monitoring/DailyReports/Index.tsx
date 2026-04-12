import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Badge, Pagination, Button } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
    Filter,
    Calendar,
    Activity,
    Search,
    ChevronRight,
    Clock,
    ClipboardList,
    FileSearch,
    MapPin,
    ArrowRight,
    Layers,
    History,
    FileText,
    ShieldCheck,
    Zap,
    Users,
    AlertTriangle,
    Eye,
    Target,
    Database,
    Fingerprint,
    Cpu,
    ArrowLeft
} from 'lucide-react';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface ReportData {
    id: number;
    date: string;
    title: string;
    status: string;
    student: { name: string; nim: string };
    group: { name: string };
}

interface Props extends PageProps {
    reports: { 
        data: ReportData[];
        meta: PaginationMeta;
    };
    filters: { status?: string; search?: string };
}

function statusLabel(status: string): string {
    const s = status.toLowerCase();
    if (s === 'disetujui' || s === 'approved') return 'VERIFIED';
    if (s === 'revisi' || s === 'revision') return 'REVISION REQ';
    if (s === 'draf' || s === 'draft') return 'DRAFT';
    return 'SUBMITTED';
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

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
        <AppLayout title="Operational Surveillance Hub">
            <Head title="Monitoring Aktivitas | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Field Intelligence</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Tactical <span>Surveillance.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Pengawasan real-time logbook harian. <br />
                            <span className="text-slate-900 not-italic">Audit terpusat terhadap aktivitas operasional seluruh faksi di wilayah penempatan KKN.</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="h-24 w-72 bg-slate-900 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                                <History size={80} strokeWidth={1} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none relative z-10">Capture Density</span>
                            <div className="flex items-baseline gap-3 relative z-10">
                                <span className="text-4xl font-black text-white tracking-tighter">{(reports.meta?.total || 0).toLocaleString()}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Logs</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* --- TELEMETRY BENTO MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard label="Active Data Stream" value="REAL-TIME" icon={Zap} color="emerald" desc="Inbound traffic via encryption" />
                    <MetricCard label="System Integrity" value="VERIFIED" icon={ShieldCheck} color="emerald" desc="Metadata hash authenticated" />
                    <MetricCard label="Operation Risk" value="MINIMAL" icon={AlertTriangle} color="amber" desc="Stability parameters nominal" />
                </motion.div>

                {/* --- COMMAND FILTER HUB --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] p-4 shadow-sm flex flex-col lg:flex-row items-center gap-4">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="OPERATOR NAME / NIM / LOG IDENTIFIER..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-16 pl-20 pr-8 bg-transparent text-sm font-black text-slate-900 border-none focus:ring-0 outline-none placeholder:text-slate-200 uppercase tracking-tight"
                        />
                    </div>
                    <div className="h-10 w-px bg-slate-100 hidden lg:block" />
                    <div className="relative w-full lg:w-96 group">
                        <Filter className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full h-16 pl-20 pr-12 bg-transparent border-none focus:ring-0 outline-none text-[10px] font-black text-slate-700 appearance-none uppercase tracking-[0.3em] group-hover:text-emerald-600 transition-colors"
                        >
                            <option value="">ALL PROTOCOLS</option>
                            <option value="submitted">SUBMITTED</option>
                            <option value="disetujui">VERIFIED</option>
                            <option value="revisi">REVISION</option>
                            <option value="draf">DRAFT</option>
                        </select>
                        <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                    </div>
                </motion.div>

                {/* --- TACTICAL SURVEILLANCE LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-10 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                   <Layers3 size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Audit stream</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Diagnostic Log Inventory</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-40 italic">Buffer Load</span>
                              <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-500">
                                   {reports.data.length}
                              </div>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Node</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Activity Identification</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Field Personnel</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">Unit Zone</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-right">Verification Protocol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reports.data.length > 0 ? (
                                    reports.data.map((report, idx) => (
                                        <tr key={report.id} className="group hover:bg-emerald-50/20 transition-all font-sans">
                                            <td className="px-10 py-8">
                                                <span className="text-[10px] font-black text-slate-200 font-mono tracking-tighter italic group-hover:text-emerald-500 transition-colors">
                                                    #{idx + 1 + (reports.meta.current_page - 1) * reports.meta.per_page}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-emerald-500 group-hover:border-slate-900 transition-all shadow-sm">
                                                        <Calendar size={22} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase italic">{report.title}</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-2 rounded-full bg-emerald-500 group-hover:animate-ping" />
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic">{report.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black text-[13px] border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all italic">
                                                        {report.student?.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic group-hover:text-emerald-600 transition-colors leading-none">{report.student?.name}</span>
                                                        <span className="text-[10px] font-black text-slate-300 font-mono uppercase tracking-widest leading-none pt-1">NIM: {report.student?.nim}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-slate-900 group-hover:text-emerald-500 transition-all shadow-sm">
                                                    <MapPin size={12} className="text-rose-500" />
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[150px] group-hover:text-emerald-500 transition-colors">{report.group?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                    <span className={clsx(
                                                        "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border transition-all italic shadow-sm",
                                                        (report.status.toLowerCase() === 'disetujui' || report.status.toLowerCase() === 'approved') 
                                                            ? "bg-slate-950 text-emerald-500 border-white/10" 
                                                            : (report.status.toLowerCase() === 'revisi' || report.status.toLowerCase() === 'revision') 
                                                                ? "bg-amber-50 text-amber-700 border-amber-100" 
                                                                : (report.status.toLowerCase() === 'draf' || report.status.toLowerCase() === 'draft') 
                                                                    ? "bg-white text-slate-300 border-slate-100" 
                                                                    : "bg-emerald-600 text-white border-emerald-600"
                                                    )}>
                                                        {statusLabel(report.status)}
                                                    </span>
                                                    <Link 
                                                        href={`/admin/laporan/harian/${report.id}`}
                                                        className="h-12 px-6 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                                    >
                                                        Inspect
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <History size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Diagnostic Stream Idle</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO DATA PACKETS DETECTED IN CURRENT SURVEILLANCE LOOP.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-10 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">PAGE {reports.meta?.current_page || 1} / {reports.meta?.last_page || 1} OF TRANSMISSION</span>
                        </div>
                        {reports.meta && <Pagination meta={reports.meta} />}
                    </div>
                </motion.section>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3.5rem] p-16 text-white relative overflow-hidden group/f shadow-2xl">
                    <div className="absolute top-0 right-0 p-16 opacity-5 group-hover/f:rotate-12 transition-transform duration-1000">
                         <ShieldCheck size={300} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-5">
                                  <Users className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Personnel Integrity</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Authorized Audit Policy</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Seluruh logbook harian adalah representasi otoritatif terhadap aktivitas lapangan. Audit ini memantau sinkronisasi antara klaim mahasiswa dan verifikasi pembimbing lapangan.
                             </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6">
                             <SafetyShield label="GPS" />
                             <SafetyShield label="HASH" />
                             <SafetyShield label="VERIFIED" />
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

function SafetyShield({ label }: { label: string }) {
    return (
        <div className="h-20 w-32 border border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 bg-white/5 backdrop-blur-xl group hover:border-emerald-500 transition-all">
             <ShieldCheck size={20} className="text-emerald-500 group-hover:scale-110 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
        </div>
    );
}
