import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CheckCircle2, XCircle, AlertTriangle, Download, Search,
    Filter, Users, Target, Eye, Shield, FileCheck,
    Activity, Zap, Briefcase, Cpu, Layers3, ChevronRight,
    SearchCheck, Database, Fingerprint, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface EligibilityCheck { passed: boolean; key: string; message: string; }
interface Student {
    mahasiswa_id: number; nim: string; nama: string; sks_completed: number;
    gpa: number | null; is_bta_ppi_passed: boolean;
    has_health_certificate: boolean; has_parent_permission: boolean;
    checks: EligibilityCheck[]; is_eligible: boolean;
    issues: EligibilityCheck[]; issue_count: number;
    mahasiswa?: { fakultas?: { nama: string }; prodi?: { nama: string }; };
}
interface Props {
    students: Student[];
    pagination: { current_page: number; per_page: number; total: number; last_page: number; };
    stats: { total: number; eligible_count: number; not_eligible_count: number; eligibility_rate: number; };
    filters: { period_id?: number; faculty_id?: number; show_eligible: boolean; };
    periods: Array<{ id: number; name: string }>;
    faculties: Array<{ id: number; name: string }>;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function EligibilityIndex({ students, pagination, stats, filters, periods, faculties }: Props) {
    const [search, setSearch] = useState('');
    const [periodId, setPeriodId] = useState(filters.period_id?.toString() || '');
    const [facultyId, setFacultyId] = useState(filters.faculty_id?.toString() || '');
    const [showEligible, setShowEligible] = useState(filters.show_eligible);

    const handleFilter = () => {
        router.get('/admin/cek-kelayakan', {
            period_id: periodId || undefined, faculty_id: facultyId || undefined,
            show_eligible: showEligible, search,
        }, { preserveState: true });
    };

    const handleExport = () => {
        window.location.href = `/admin/cek-kelayakan/ekspor?period_id=${periodId}&faculty_id=${facultyId}`;
    };

    return (
        <AppLayout title="Academic Validation HUB">
            <Head title="Cek Kelayakan Mahasiswa | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Academic Integrity</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Integrity <span>Scanner.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Validasi kelayakan akademik. <br />
                            <span className="text-slate-900 not-italic">Evaluasi real-time terhadap parameter SKS, IPK, BTA-PPI, dan kepatuhan administratif pendaftar.</span>
                        </p>
                    </div>

                    <button
                        onClick={handleExport}
                        className="h-20 px-10 rounded-[2.5rem] bg-emerald-600 text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-500/10 active:scale-95 group/btn"
                    >
                        <Download size={22} strokeWidth={3} className="group-hover/btn:translate-y-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Execute Data Export</span>
                    </button>
                </motion.div>

                {/* --- STRATEGIC METRICS MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <MetricCard label="Identification Load" value={stats.total} icon={Users} color="slate" />
                    <MetricCard label="Verified Eligible" value={stats.eligible_count} icon={CheckCircle2} color="emerald" />
                    <MetricCard label="Protocol Failed" value={stats.not_eligible_count} icon={XCircle} color="rose" />
                    <MetricCard label="Success Ratio" value={`${stats.eligibility_rate}%`} icon={Target} color="amber" />
                </motion.div>

                {/* --- COMMAND FILTER HUB --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-2xl shadow-slate-200/50">
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Temporal Focus</label>
                            <div className="relative group/sel">
                                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/sel:text-emerald-500 transition-colors" />
                                <select 
                                    value={periodId} 
                                    onChange={(e) => setPeriodId(e.target.value)} 
                                    className="w-full h-16 pl-16 pr-8 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-900 focus:border-emerald-500 focus:ring-0 outline-none transition-all appearance-none uppercase tracking-tight"
                                >
                                    <option value="">SELECT PERIOD...</option>
                                    {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Faculty Cluster</label>
                            <div className="relative group/sel">
                                <Database className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/sel:text-emerald-500 transition-colors" />
                                <select 
                                    value={facultyId} 
                                    onChange={(e) => setFacultyId(e.target.value)} 
                                    className="w-full h-16 pl-16 pr-8 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-black text-slate-900 focus:border-emerald-500 focus:ring-0 outline-none transition-all appearance-none uppercase tracking-tight"
                                >
                                    <option value="">ALL FACULTIES...</option>
                                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Integrity Status Filter</label>
                            <div className="grid grid-cols-2 gap-3 h-16 bg-slate-50 p-2 rounded-[1.5rem] border-2 border-slate-50">
                                <button 
                                    onClick={() => setShowEligible(true)} 
                                    className={clsx(
                                        "flex items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic", 
                                        showEligible ? "bg-emerald-600 text-white shadow-xl" : "bg-transparent text-slate-400 hover:text-slate-900"
                                    )}
                                >
                                    Eligible Nodes
                                </button>
                                <button 
                                    onClick={() => setShowEligible(false)} 
                                    className={clsx(
                                        "flex items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic", 
                                        !showEligible ? "bg-rose-600 text-white shadow-xl" : "bg-transparent text-slate-400 hover:text-slate-900"
                                    )}
                                >
                                    Failed Check
                                </button>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button 
                                onClick={handleFilter} 
                                className="w-full h-16 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl shadow-slate-200"
                            >
                                <Filter size={18} />
                                Refresh Scanner
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* --- TACTICAL VALIDATION LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-10 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                   <Layers3 size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Validation Stream</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Diagnostic Registry</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white opacity-40 italic">Buffer Load</span>
                              <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-500 shadow-xl">
                                   {students.length}
                              </div>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Node / Identify</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">SKS Ledger</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">GPA Index</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">BTA-PPI</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">Compliance Map</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">Final Result</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {students.length > 0 ? students.map((s) => (
                                    <tr key={s.mahasiswa_id} className="group hover:bg-emerald-50/20 transition-all">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center font-black text-xl italic border border-slate-100 group-hover:bg-slate-900 group-hover:text-emerald-500 transition-all shadow-sm">
                                                    {s.nama.charAt(0)}
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase italic">{s.nama}</span>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic">IDENTIFIER: {s.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={clsx(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic border", 
                                                s.sks_completed >= 100 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"
                                            )}>
                                                {s.sks_completed} SKS
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className="text-base font-black text-slate-900 italic font-mono">{s.gpa ? s.gpa.toFixed(2) : '0.00'}</span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className={clsx(
                                                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic",
                                                s.is_bta_ppi_passed ? "bg-emerald-950 text-emerald-500 shadow-xl shadow-emerald-500/10" : "bg-slate-100 text-slate-300"
                                            )}>
                                                {s.is_bta_ppi_passed ? <Zap size={10} className="fill-current" /> : <Lock size={10} />}
                                                {s.is_bta_ppi_passed ? 'AUTHORIZED' : 'LOCKED'}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <DocIcon active={s.has_health_certificate} title="Health Certificate Verified" />
                                                <DocIcon active={s.has_parent_permission} title="Parental Permission Authenticated" />
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            {s.is_eligible ? (
                                                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] italic">
                                                    <ShieldCheck size={16} strokeWidth={3} />
                                                    PASSED
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-rose-600 text-white shadow-xl shadow-rose-500/20 text-[10px] font-black uppercase tracking-[0.2em] italic">
                                                    <ShieldAlert size={16} strokeWidth={3} />
                                                    FAILED ({s.issue_count})
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <Link 
                                                href={`/admin/mahasiswa/${s.mahasiswa_id}`} 
                                                className="h-12 px-6 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                            >
                                                Inspect 
                                                <ChevronRight size={14} className="ml-2" />
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 text-slate-200 opacity-50">
                                                <FileCheck size={80} strokeWidth={1} />
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] italic leading-none">Scanning Idle</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest italic">AWAITING TEMPORAL CONTEXT AND FACULTY CLUSTER FILTERS.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-10 py-10 border-t border-slate-50 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Identifying {students.length} of {pagination.total.toLocaleString()} entities</span>
                        </div>
                        <Pagination meta={{ current_page: pagination.current_page, last_page: pagination.last_page, per_page: pagination.per_page, total: pagination.total, from: (pagination.current_page - 1) * pagination.per_page + 1, to: Math.min(pagination.current_page * pagination.per_page, pagination.total), links: [], path: '/admin/cek-kelayakan' }} />
                    </div>
                </motion.section>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: 'emerald' | 'rose' | 'amber' | 'slate' }) {
    return (
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <Icon size={100} strokeWidth={1} />
            </div>
            <div className="flex flex-col gap-6 relative z-10">
                <div className={clsx(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm group-hover:bg-slate-900 group-hover:text-white",
                    color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                    color === 'rose' ? "bg-rose-50 text-rose-600" :
                    color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"
                )}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 opacity-60 italic leading-none">{label}</p>
                   <p className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">{value.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

function DocIcon({ active, title }: { active: boolean; title: string }) {
    return (
        <div title={title} className={clsx(
            "h-10 w-10 rounded-xl border flex items-center justify-center transition-all shadow-sm", 
            active ? 'bg-emerald-950 text-emerald-500 border-emerald-950/20' : 'bg-slate-50 text-slate-200 border-slate-100'
        )}>
            <ShieldCheck size={18} strokeWidth={2} />
        </div>
    );
}
