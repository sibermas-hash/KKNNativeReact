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
        <AppLayout title="Audit Kelayakan Mahasiswa">
            <Head title="Audit Kelayakan - KKN UIN SAIZU" />

            <div className="space-y-12 pb-32">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Kelayakan Mahasiswa</h1>
                        <p className="text-sm text-slate-500 mt-1">Evaluasi parameter akademik dan prasyarat administrasi secara komprehensif.</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-md active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Ekspor Rekap
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Mahasiswa', value: stats.total, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
                        { label: 'Layak (Eligible)', value: stats.eligible_count, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Belum Layak', value: stats.not_eligible_count, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Rasio Kelayakan', value: `${stats.eligibility_rate}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' }
                    ].map((stat, idx) => (
                        <div key={idx} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                            <div className={clsx("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg)}>
                                <stat.icon className={clsx("w-5 h-5", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Periode</label>
                            <select
                                value={periodId}
                                onChange={(e) => setPeriodId(e.target.value)}
                                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            >
                                <option value="">Semua Periode</option>
                                {periods.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Fakultas</label>
                            <select
                                value={facultyId}
                                onChange={(e) => setFacultyId(e.target.value)}
                                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                            >
                                <option value="">Semua Fakultas</option>
                                {faculties.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status Kelayakan</label>
                            <div className="grid grid-cols-2 gap-2 h-11 bg-slate-50 p-1 rounded-xl">
                                <button
                                    onClick={() => setShowEligible(true)}
                                    className={clsx(
                                        "rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-wider transition-all",
                                        showEligible ? "bg-white text-emerald-600 shadow-sm border border-emerald-100" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Layak
                                </button>
                                <button
                                    onClick={() => setShowEligible(false)}
                                    className={clsx(
                                        "rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-wider transition-all",
                                        !showEligible ? "bg-white text-rose-600 shadow-sm border border-rose-100" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Tidak Layak
                                </button>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                            >
                                Terapkan Filter
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identitas Mahasiswa</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total SKS</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">GPA / IPK</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">BTA-PPI</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dokumen</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Audit</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-10">Detail</th>
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
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                                    {student.nama.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 truncate max-w-[180px]">{student.nama}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400">NIM: {student.nim}</span>
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
                                        <td className="px-6 py-5 text-center font-bold">
                                            <Badge variant={student.is_bta_ppi_passed ? 'success' : 'danger'} className="text-[10px] font-bold px-2 py-0.5 border-none shadow-none">
                                                {student.is_bta_ppi_passed ? 'Lulus' : 'Pending'}
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
                                        <td className="px-6 py-5 text-center">
                                            {student.is_eligible ? (
                                                <span className="inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">Layak</span>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                                    <span className="text-[10px] font-bold text-rose-600">{student.issue_count} Masalah</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right pr-6">
                                            <Link
                                                href={`/admin/registrations?search=${student.nim}`}
                                                className="h-8 w-8 bg-white border border-slate-200 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-600 transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
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
                </div>

                {/* Info Center */}
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900">Parameter Kelayakan Otomatis</h4>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-4xl">
                        Ambang batas minimal SKS adalah 100 dengan status lulus BTA-PPI dan kelengkapan dokumen pendukung. Data diverifikasi secara real-time berdasarkan sinkronisasi SI-pusat UIN SAIZU.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Total Data: <span className="text-slate-900">{pagination.total}</span> Mahasiswa
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
