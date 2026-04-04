import { useState, useEffect } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
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
} from 'lucide-react';
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
        router.get(route('admin.eligibility.index'), {
            period_id: periodId || undefined,
            faculty_id: facultyId || undefined,
            show_eligible: showEligible,
            search,
        }, { preserveState: true });
    };

    const handleExport = () => {
        window.location.href = route('admin.eligibility.export', {
            period_id: periodId || undefined,
            faculty_id: facultyId || undefined,
        });
    };

    return (
        <AppLayout title="Cek Eligibility KKN">
            <Head title="Eligibility Checker" />

            <div className="space-y-6 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cek Eligibility KKN</h1>
                        <p className="text-sm text-slate-500 mt-1">Identifikasi mahasiswa yang memenuhi syarat untuk mengikuti KKN.</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-xs text-slate-500">Total Mahasiswa</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-emerald-200 rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-white">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <div>
                                <p className="text-xs text-slate-500">Eligible</p>
                                <p className="text-2xl font-bold text-emerald-900">{stats.eligible_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-rose-200 rounded-lg p-4 bg-gradient-to-br from-rose-50 to-white">
                        <div className="flex items-center gap-3">
                            <XCircle className="w-5 h-5 text-rose-600" />
                            <div>
                                <p className="text-xs text-slate-500">Not Eligible</p>
                                <p className="text-2xl font-bold text-rose-900">{stats.not_eligible_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-amber-200 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-white">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                            <div>
                                <p className="text-xs text-slate-500">Eligibility Rate</p>
                                <p className="text-2xl font-bold text-amber-900">{stats.eligibility_rate}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Periode</label>
                            <select
                                value={periodId}
                                onChange={(e) => setPeriodId(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Semua Periode</option>
                                {periods.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Fakultas</label>
                            <select
                                value={facultyId}
                                onChange={(e) => setFacultyId(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Semua Fakultas</option>
                                {faculties.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Status</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowEligible(true)}
                                    className={clsx(
                                        "flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors",
                                        showEligible 
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : "bg-white border-slate-200 text-slate-600"
                                    )}
                                >
                                    Eligible
                                </button>
                                <button
                                    onClick={() => setShowEligible(false)}
                                    className={clsx(
                                        "flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors",
                                        !showEligible 
                                            ? "bg-rose-50 border-rose-200 text-rose-700"
                                            : "bg-white border-slate-200 text-slate-600"
                                    )}
                                >
                                    Not Eligible
                                </button>
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mahasiswa</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">SKS</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">IPK</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">BTA-PPI</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Dokumen</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.length > 0 ? students.map((student) => (
                                    <tr key={student.mahasiswa_id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                                    {student.nama.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 mb-1">
                                                        {student.nama}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400">NIM: {student.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={clsx(
                                                "text-sm font-semibold",
                                                student.sks_completed >= 100 ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {student.sks_completed}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-semibold text-slate-700">
                                                {student.gpa ? student.gpa.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <Badge variant={student.is_bta_ppi_passed ? 'success' : 'danger'}>
                                                {student.is_bta_ppi_passed ? 'LULUS' : 'BELUM'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {student.has_health_certificate ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-rose-600" />
                                                )}
                                                {student.has_parent_permission ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-rose-600" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {student.is_eligible ? (
                                                <Badge variant="success">ELIGIBLE</Badge>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                    <span className="text-xs font-semibold text-rose-600">{student.issue_count} issues</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Link
                                                href={route('admin.registrations.index', { search: student.nim })}
                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                                            >
                                                <Eye className="w-3 h-3" />
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <GraduationCap className="h-12 w-12 text-slate-200" />
                                                <p className="text-sm font-semibold text-slate-400">Tidak ada data mahasiswa</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Info */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        Menampilkan <span className="font-semibold">{students.length}</span> dari <span className="font-semibold">{pagination.total}</span> mahasiswa
                    </p>
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
