import { useState, useEffect } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Download,
    Search,
    Filter,
    RefreshCw,
    Users,
    TrendingUp,
    GraduationCap,
    BookOpen,
    Eye,
    Zap,
    Layers,
    ShieldCheck,
    Activity,
    Binary,
    Fingerprint,
    Cpu,
    Database,
    Clock,
    Target,
    LayoutDashboard,
    Navigation,
    Flag,
    History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Pagination, Badge } from '@/Components/ui';

interface EligibilityCheck {
    passed: boolean;
    key: string;
    message: string;
}

interface Student {
    mahasiswa_id: number;
    nim: string;
    nama: string;
    sks_completed: number;
    gpa: number | null;
    is_bta_ppi_passed: boolean;
    has_health_certificate: boolean;
    has_parent_permission: boolean;
    checks: EligibilityCheck[];
    is_eligible: boolean;
    issues: EligibilityCheck[];
    issue_count: number;
    mahasiswa?: {
        fakultas?: { nama: string };
        prodi?: { nama: string };
    };
}

interface Props {
    students: Student[];
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    stats: {
        total: number;
        eligible_count: number;
        not_eligible_count: number;
        eligibility_rate: number;
    };
    filters: {
        period_id?: number;
        faculty_id?: number;
        show_eligible: boolean;
    };
    periods: Array<{ id: number; name: string }>;
    faculties: Array<{ id: number; name: string }>;
}

export default function EligibilityIndex({ students, pagination, stats, filters, periods, faculties }: Props) {
    const [search, setSearch] = useState('');
    const [periodId, setPeriodId] = useState(filters.period_id?.toString() || '');
    const [facultyId, setFacultyId] = useState(filters.faculty_id?.toString() || '');
    const [showEligible, setShowEligible] = useState(filters.show_eligible);

    const handleFilter = () => {
        router.get('/admin/cek-kelayakan', {
            period_id: periodId || undefined,
            faculty_id: facultyId || undefined,
            show_eligible: showEligible,
            search,
        }, { preserveState: true });
    };

    const handleExport = () => {
        window.location.href = `/admin/cek-kelayakan/ekspor?period_id=${periodId}&faculty_id=${facultyId}`;
    };

    return (
        <AppLayout title="Student Compatibility Matrix">
            <Head title="Eligibility Checker" />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">STUDENT_COMPATIBILITY_MATRIX_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <GraduationCap className="w-10 h-10 text-emerald-600" />
                            CEK <span className="text-emerald-600">KELAYAKAN</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Audit otomatis parameter akademik, kelaikan dokumen prasyarat, dan otorisasi kelulusan administrasi KKN.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={handleExport}
                            className="h-20 px-10 bg-slate-950 text-white rounded-[2rem] flex items-center gap-6 group hover:bg-emerald-600 transition-all shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                            <Download className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col relative z-10 text-left">
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5">Export Matrix</span>
                                <span className="text-sm font-black italic tracking-tighter leading-none">DATA_COLLECTION_PDF</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Metrics Command Center */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'TOTAL_PERSONNEL', value: stats.total, icon: Users, color: 'text-slate-400', bg: 'bg-slate-50' },
                        { label: 'ELIGIBLE_UNITS', value: stats.eligible_count, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'FAILED_VALIDATION', value: stats.not_eligible_count, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
                        { label: 'SUCCESS_RATIO', value: `${stats.eligibility_rate}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' }
                    ].map((stat, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className={clsx("p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-inner", stat.bg)}>
                                    <stat.icon className={clsx("w-6 h-6", stat.color)} />
                                </div>
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-100 group-hover:bg-emerald-500 transition-colors" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">{stat.label}</span>
                            <span className="text-3xl font-black text-slate-950 italic tracking-tighter tabular-nums">{stat.value}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Tactical Search & Filter */}
                <div className="bg-white rounded-[3.5rem] border border-slate-200 p-10 shadow-sm space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                <Target className="w-3 h-3 text-emerald-500" />
                                OPERATIONAL_PERIOD
                            </span>
                            <select
                                value={periodId}
                                onChange={(e) => setPeriodId(e.target.value)}
                                className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none uppercase"
                            >
                                <option value="">ALL_PERIODS</option>
                                {periods.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                <Layers className="w-3 h-3 text-emerald-500" />
                                SECTOR_FACULTY
                            </span>
                            <select
                                value={facultyId}
                                onChange={(e) => setFacultyId(e.target.value)}
                                className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none uppercase"
                            >
                                <option value="">ALL_FACULTIES</option>
                                {faculties.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                <Activity className="w-3 h-3 text-emerald-500" />
                                ELIGIBILITY_STATE
                            </span>
                            <div className="grid grid-cols-2 gap-3 h-16 bg-slate-50 p-1.5 rounded-2xl">
                                <button
                                    onClick={() => setShowEligible(true)}
                                    className={clsx(
                                        "rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest italic transition-all shadow-sm",
                                        showEligible ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    ELIGIBLE
                                </button>
                                <button
                                    onClick={() => setShowEligible(false)}
                                    className={clsx(
                                        "rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest italic transition-all shadow-sm",
                                        !showEligible ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    FAILED
                                </button>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full h-16 bg-slate-950 text-white rounded-2xl font-black italic uppercase tracking-[0.4em] text-xs hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                            >
                                EXECUTE_FILTER
                            </button>
                        </div>
                    </div>
                </div>

                {/* Compatibility Table */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">PERSONNEL_IDENTITY_HASH</th>
                                    <th className="px-6 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">SKS_LOAD</th>
                                    <th className="px-6 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">GPA_INDEX</th>
                                    <th className="px-6 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">BTA-PPI_CORE</th>
                                    <th className="px-6 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">DOC_ASSETS</th>
                                    <th className="px-6 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">MATRIX_STATUS</th>
                                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">COMMAND</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {students.length > 0 ? students.map((student, idx) => (
                                    <motion.tr 
                                        key={student.mahasiswa_id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-slate-50/50 transition-colors cursor-default"
                                    >
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="h-12 w-12 rounded-xl bg-slate-950 text-emerald-500 border border-slate-800 flex items-center justify-center font-black text-lg italic shadow-lg group-hover:scale-110 transition-transform">
                                                    {student.nama.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-black text-slate-950 uppercase italic tracking-tighter group-hover:text-emerald-700 transition-colors truncate max-w-[200px]">{student.nama}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">NIM: {student.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <span className={clsx(
                                                "text-sm font-black italic tabular-nums",
                                                student.sks_completed >= 100 ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {student.sks_completed}
                                            </span>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <span className="text-sm font-black text-slate-600 italic tabular-nums">
                                                {student.gpa ? student.gpa.toFixed(2) : '--.--'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-8 text-center font-bold">
                                            <Badge variant={student.is_bta_ppi_passed ? 'success' : 'danger'} className="px-3 py-1 font-black italic uppercase tracking-widest text-[9px] border-none shadow-sm">
                                                {student.is_bta_ppi_passed ? 'PASSED_BTA' : 'PENDING'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={clsx("p-1.5 rounded-lg shadow-inner", student.has_health_certificate ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                </div>
                                                <div className={clsx("p-1.5 rounded-lg shadow-inner", student.has_parent_permission ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                                                    <Binary className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            {student.is_eligible ? (
                                                <Badge variant="success" className="px-4 py-1.5 bg-emerald-600 text-white font-black italic text-[9px] uppercase tracking-[0.2em] border-none shadow-xl shadow-emerald-500/20">ELIGIBLE</Badge>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 opacity-50">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                    <span className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{student.issue_count} ISSUES</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            <Link
                                                href={`/admin/registrations?search=${student.nim}`}
                                                className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:text-emerald-600 hover:border-emerald-600 transition-all shadow-sm active:scale-90"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 opacity-20">
                                                <Cpu className="h-20 w-20 text-slate-300" />
                                                <p className="text-[11px] font-black uppercase tracking-[0.6em] italic text-slate-500 leading-relaxed">SYSTEM_INFO: NO_PERSONNEL_DATA_BUFFERED</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* Tactical Registry Logic */}
                <div className="p-12 bg-slate-900 rounded-[4rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)]" />
                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-6">
                                <div className="p-5 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-[2.5rem] animate-pulse">
                                    <Binary className="h-10 w-10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-black text-white italic tracking-[0.3em] uppercase leading-none">Core_Validation_Engine_V4</h4>
                                    <div className="flex items-center gap-4 text-[9px] font-black text-emerald-500 uppercase tracking-widest italic pt-1">
                                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> SYSTEM_LATENCY: 12ms</span>
                                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> ENCRYPTION: SHA-256</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-bold italic leading-relaxed max-w-4xl uppercase tracking-tighter">
                                Matrix kelaikan mahasiswa dihitung secara dinamis berdasarkan parameter SKS min. 100, kelulusan BTA-PPI, dan otorisasi dokumen kesehatan. Data disinkronkan secara real-time dengan basis data akademik UIN SAIZU.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-8 text-slate-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity">
                             <Fingerprint className="w-5 h-5 text-emerald-500" />
                             ELIGIBILITY_PROTOCOL • {new Date().getFullYear()}
                        </div>
                    </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8">
                    <div className="flex items-center gap-6">
                        <div className="h-10 px-6 bg-slate-950 text-white rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest italic shadow-xl">
                            <Binary className="w-4 h-4 text-emerald-500" />
                            BUFFER: {students.length} UNITS
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            TOTAL_RECORDS: <span className="text-slate-950">{pagination.total}</span> PERSONNEL
                        </p>
                    </div>
                    {pagination.last_page > 1 && (
                        <Pagination
                            meta={{
                                current_page: pagination.current_page,
                                last_page: pagination.last_page,
                                per_page: pagination.per_page,
                                total: pagination.total,
                                from: (pagination.current_page - 1) * pagination.per_page + 1,
                                to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
                                links: [],
                            }}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
