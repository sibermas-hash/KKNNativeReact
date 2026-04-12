import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import { 
    FileCheck, 
    Filter, 
    FileText, 
    Clock, 
    Eye, 
    Layers, 
    User, 
    History, 
    Search, 
    CheckCircle2, 
    Database, 
    ShieldCheck, 
    Zap, 
    Cpu, 
    ArrowRight,
    SearchCheck,
    Archive
} from 'lucide-react';
import { route } from 'ziggy-js';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface FinalReportData {
    id: number;
    title: string;
    status: string;
    submitted_at: string | null;
    mahasiswa?: { nama?: string | null; nim?: string | null; } | null;
    kelompok?: { nama_kelompok?: string | null; } | null;
}

interface Props extends PageProps {
    reports: {
        data: FinalReportData[];
        meta: PaginationMeta;
    };
    filters: { status?: string; };
}

const statusOptions = [
    { value: '', label: 'ALL STATUS' },
    { value: 'submitted', label: 'SUBMITTED' },
    { value: 'reviewed', label: 'UNDER REVIEW' },
    { value: 'disetujui', label: 'APPROVED' },
    { value: 'revisi', label: 'REVISION' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function AdminFinalReportsIndex({ reports, filters }: Props) {
    const rows = reports.data ?? [];

    const handleFilterChange = (value: string) => {
        router.get('/admin/laporan/akhir', { status: value || undefined }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout title="Final Report Repository">
            <Head title="Laporan Akhir | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Security Vault / Final Report Archive</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Final <span>Anthology.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Pusat verifikasi laporan akhir. <br />
                            <span className="text-slate-900 not-italic">Otentikasi produk akademik final dan sertifikasi kelulusan program KKN fungsional.</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                         <div className="h-24 px-8 bg-slate-900 rounded-[2.5rem] flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                   <SearchCheck size={60} strokeWidth={1} />
                              </div>
                              <div className="flex flex-col justify-center">
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Archived Data</span>
                                   <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-white tracking-tighter">{(reports.meta?.total || 0).toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reports</span>
                                   </div>
                              </div>
                         </div>
                    </div>
                </motion.div>

                {/* --- TELEMETRY BENTO MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard label="Vault Reliability" value="SECURE" icon={ShieldCheck} color="emerald" desc="Data integrity verified 256-bit" />
                    <MetricCard label="Audit Pipeline" value="ACTIVE" icon={Zap} color="emerald" desc="Transmissions optimal" />
                    <MetricCard label="Archive Status" value="OPTIMIZED" icon={Database} color="emerald" desc="Database indexing nominal" />
                </motion.div>

                {/* --- COMMAND FILTER BAR --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3rem] p-3 shadow-sm flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full relative group">
                        <Filter className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                        <select 
                            value={filters.status ?? ''}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="w-full h-16 pl-20 pr-12 bg-transparent border-none focus:ring-0 outline-none text-[10px] font-black text-slate-700 appearance-none uppercase tracking-[0.3em] group-hover:text-emerald-600 transition-colors"
                        >
                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                    </div>
                </motion.div>

                {/* --- TACTICAL ARCHIVE GRID --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950 text-white">
                                <tr>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Matrix</th>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em]">Document Identification</th>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em]">Field Personnel</th>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-center">Operational Unit</th>
                                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-right">Vault Protocol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rows.length > 0 ? rows.map((report, idx) => (
                                    <tr key={report.id} className="hover:bg-emerald-50/20 transition-all group font-sans">
                                        <td className="px-12 py-10">
                                            <span className="text-[10px] font-black text-slate-200 font-mono italic group-hover:text-emerald-500 transition-colors">
                                                #{idx + 1 + (reports.meta.current_page - 1) * reports.meta.per_page}
                                            </span>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-8">
                                                <div className="h-16 w-16 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-emerald-500 group-hover:border-slate-900 transition-all shadow-sm">
                                                    <FileText size={22} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase italic">{report.title}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono italic">CRC ID: #{report.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-5">
                                                <div className="h-11 w-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black text-xs border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all italic">
                                                    {report.mahasiswa?.nama?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic leading-none">{report.mahasiswa?.nama || 'UNKNOWN'}</span>
                                                    <span className="text-[10px] font-black text-slate-300 font-mono uppercase tracking-widest leading-none pt-1">NIM: {report.mahasiswa?.nim || 'UNKNOWN'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10 text-center">
                                            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-slate-900 group-hover:text-emerald-500 transition-all shadow-sm">
                                                <Layers size={12} className="text-emerald-500" />
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">{report.kelompok?.nama_kelompok || 'INVALID'}</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <div className="flex items-center justify-end gap-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                                <StatusBadge status={report.status} className="!rounded-xl !font-black !py-2.5 !px-5 !text-[9px] !uppercase !tracking-widest" />
                                                <Link 
                                                    href={route('admin.laporan.akhir.show', report.id)}
                                                    className="h-12 px-6 bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                                >
                                                    Inspect
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <Archive size={100} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Archive Vault Empty</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">NO FINAL REPORTS DETECTED IN STORAGE PIPELINE.</p>
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
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inventory Hal. {reports.meta?.current_page || 1} / {reports.meta?.last_page || 1} Transmitted</span>
                        </div>
                        {reports.meta && <Pagination meta={reports.meta} />}
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
                                  <FileCheck className="text-emerald-500" size={32} />
                                  <div className="space-y-1">
                                       <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">Academic Integrity</span>
                                       <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Final Certification Vault</h3>
                                  </div>
                             </div>
                             <p className="text-lg font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-2xl opacity-80 italic">
                                Laporan akhir adalah instrumen bukti utama kelulusan pengabdian. Seluruh dokumen wajib melewati proses verifikasi akademik terstandarisasi sebelum didigitalkan ke dalam repositori institusi.
                             </p>
                        </div>
                        <div className="px-12 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center justify-center gap-2">
                             <Cpu size={28} className="text-emerald-500" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Processing Node Active</span>
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
