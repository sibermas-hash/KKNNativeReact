import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    CheckBadgeIcon,
    DocumentArrowDownIcon,
    ExclamationCircleIcon,
    EyeIcon,
    XMarkIcon,
    CheckCircleIcon,
    FunnelIcon,
    ChartPieIcon
} from '@heroicons/react/24/outline';
import { route } from 'ziggy-js';

interface ScoreRow {
    id: number;
    student_id: number;
    nim: string;
    nama: string;
    prodi: string;
    fakultas: string;
    n_dpl: number | string | null;
    n_mitra: number | string | null;
    n_admin: number | string | null;
    total: number | string | null;
    grade: string | null;
    is_finalized: boolean;
    status_submit: {
        dpl: boolean;
        mitra: boolean;
        admin: boolean;
    };
}

interface Stats {
    total: number;
    finalized: number;
    pending: number;
    avg_score: number;
}

interface Props {
    scores: ScoreRow[];
    stats: Stats | null;
    periodeId: number | null;
    filters: any;
    finalizeProgress?: {
        status: string;
        current: number;
        total: number;
        percentage: number;
    };
}

const getGradeColor = (grade: string | null) => {
    if (!grade) return 'bg-slate-100 text-slate-400 border-slate-200';
    const firstLetter = grade.charAt(0).toUpperCase();
    switch (firstLetter) {
        case 'A': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'B': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'C': return 'bg-amber-50 text-amber-600 border-amber-100';
        default: return 'bg-rose-50 text-rose-600 border-rose-100';
    }
};

export default function RekapNilaiIndex({ scores = [], stats, periodeId, filters, finalizeProgress }: Props) {
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<ScoreRow | null>(null);
    const [localFilters, setLocalFilters] = useState({
        is_finalized: '',
        fakultas: '',
        ...filters
    });

    const filteredScores = useMemo(() => {
        return scores.filter(s =>
            (s.nama.toLowerCase().includes(search.toLowerCase()) || s.nim.includes(search)) &&
            (localFilters.is_finalized === '' || String(s.is_finalized) === localFilters.is_finalized) &&
            (localFilters.fakultas === '' || s.fakultas === localFilters.fakultas)
        );
    }, [scores, search, localFilters]);

    const handleExport = () => {
        if (!periodeId) return;
        window.open(route('admin.rekap-nilai.export', { period_id: periodeId, ...localFilters }), '_blank');
    };

    const handleFinalizeMass = () => {
        if (!confirm('Finalisasi semua nilai yang sudah lengkap?')) return;
        router.post(route('admin.rekap-nilai.finalize-mass'), { period_id: periodeId, ...localFilters });
    };

    return (
        <AppLayout title="Academic Grading Ledger">
            <Head title="Rekap Nilai KKN" />

            <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700">
                {/* Header & Actions */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-10 border-b border-slate-200/60">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">Grading System</span>
                            {stats && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stats.total} RECORDED ENTRIES</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                            Rekapitulasi <span className="text-primary italic">Nilai Akhir</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleExport}
                            disabled={!periodeId}
                            className="flex items-center gap-2.5 px-6 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 shadow-sm"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4 text-primary" />
                            Export Ledger
                        </button>
                        <button
                            onClick={() => router.get(route('admin.rekap-nilai.bulk-certificates'), { period_id: periodeId, ...localFilters })}
                            disabled={!periodeId || stats?.finalized === 0}
                            className="flex items-center gap-2.5 px-6 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 shadow-sm"
                        >
                            <DocumentArrowDownIcon className="w-4 h-4 text-primary" />
                            Bulk Certificate
                        </button>
                        <button
                            onClick={handleFinalizeMass}
                            disabled={!periodeId || (finalizeProgress?.status === 'processing')}
                            className="flex items-center gap-2.5 px-8 py-3.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 active:scale-95"
                        >
                            <CheckBadgeIcon className="w-4 h-4" />
                            {finalizeProgress?.status === 'processing' ? 'Processing...' : 'Finalize All'}
                        </button>
                    </div>
                </div>

                {/* Filter & Search Dashboard View */}
                <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-6 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative group">
                        <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or NIM..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-13 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={localFilters.is_finalized}
                            onChange={(e) => setLocalFilters({ ...localFilters, is_finalized: e.target.value })}
                            className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none focus:border-primary/30 transition-all cursor-pointer shadow-sm"
                        >
                            <option value="">Status Finalis</option>
                            <option value="true">Finalized</option>
                            <option value="false">Pending</option>
                        </select>

                        <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-black uppercase tracking-widest text-primary">
                            <FunnelIcon className="w-4 h-4" />
                            Filter Active
                        </div>
                    </div>
                </div>

                {/* Performance Highlights */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group transition-all hover:bg-emerald-50">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-emerald-600 transition-colors">Avg Achievement</p>
                                <p className="text-4xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{stats.avg_score.toFixed(1)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-100 text-emerald-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6">
                                <ChartPieIcon className="w-8 h-8" />
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group transition-all hover:bg-primary-50">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">Finalized Record</p>
                                <p className="text-4xl font-black text-slate-900 group-hover:text-primary transition-colors">{stats.finalized}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-primary/10 text-primary shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6">
                                <CheckCircleIcon className="w-8 h-8" />
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group transition-all hover:bg-amber-50">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-amber-600 transition-colors">Incomplete Queue</p>
                                <p className="text-4xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">{stats.pending}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-100 text-amber-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6">
                                <ExclamationCircleIcon className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Table View */}
                <div className="bg-white rounded-[2rem] shadow-md border border-slate-200/60 overflow-hidden text-slate-900">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Identity</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Score Origin</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Aggregation</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Final Grade</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredScores.map(student => (
                                    <tr key={student.id} className="group hover:bg-slate-50/50 transition-all cursor-default relative">
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl font-black text-primary shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                                                    {student.nama.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase tracking-tight text-base group-hover:text-primary transition-colors">{student.nama}</p>
                                                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">{student.nim}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">{student.prodi}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center gap-4">
                                                <ScoreIndicator label="DPL" active={student.status_submit.dpl} value={student.n_dpl} />
                                                <ScoreIndicator label="MTR" active={student.status_submit.mitra} value={student.n_mitra} />
                                                <ScoreIndicator label="ADM" active={student.status_submit.admin} value={student.n_admin} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <span className="text-xl font-black font-mono text-slate-900 tabular-nums">{student.total ?? '--'}</span>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] border shadow-sm ${getGradeColor(student.grade)}`}>
                                                    {student.grade ?? 'PENDING'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {student.is_finalized && (
                                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shadow-sm" title="Finalized">
                                                        <CheckBadgeIcon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary/30 hover:shadow-md transition-all active:scale-95"
                                                >
                                                    <EyeIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredScores.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center opacity-40">
                                                <MagnifyingGlassIcon className="w-16 h-16 text-slate-200 mb-4" />
                                                <p className="text-sm font-black uppercase tracking-widest text-slate-400">No matching student found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Premium Detail Modal - Clean Edition */}
            {selectedStudent && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between relative">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-[1.5rem] bg-primary text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20">
                                    {selectedStudent.nama.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{selectedStudent.nama}</h4>
                                    <p className="text-sm font-bold text-slate-400 flex items-center gap-2 mt-1">
                                        {selectedStudent.nim} <span className="h-1 w-1 rounded-full bg-slate-200" /> {selectedStudent.prodi}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-colors">
                                <XMarkIcon className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="p-10 space-y-10">
                            {/* Score Breakdown Analysis */}
                            <div className="grid grid-cols-3 gap-6">
                                <ModalMetric label="DPL EVALUATION" value={selectedStudent.n_dpl} active={selectedStudent.status_submit.dpl} />
                                <ModalMetric label="PARTNER REVIEW" value={selectedStudent.n_mitra} active={selectedStudent.status_submit.mitra} />
                                <ModalMetric label="ADMIN CONTROL" value={selectedStudent.n_admin} active={selectedStudent.status_submit.admin} />
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AGGREGATED RESULT</p>
                                    <p className="text-5xl font-black text-slate-900 tabular-nums font-mono">{selectedStudent.total ?? '--'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">FINAL CLASSIFICATION</p>
                                    <span className={`text-4xl font-black ${getGradeColor(selectedStudent.grade).replace('bg-', 'text-').split(' ')[1]}`}>
                                        {selectedStudent.grade ?? 'TBA'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                            {!selectedStudent.is_finalized ? (
                                <button
                                    onClick={() => {
                                        if (confirm('Finalisasi nilai mahasiswa ini?')) {
                                            router.post(route('admin.rekap-nilai.finalize', selectedStudent.student_id));
                                            setSelectedStudent(null);
                                        }
                                    }}
                                    disabled={!selectedStudent.total}
                                    className="flex-1 py-4 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 active:scale-95"
                                >
                                    SINKRONISASI & FINALISASI
                                </button>
                            ) : (
                                <div className="flex-1 py-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-black uppercase tracking-widest rounded-2xl text-center flex items-center justify-center gap-3 shadow-inner">
                                    <CheckBadgeIcon className="w-5 h-5" />
                                    DATA SUDAH FINAL
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function ScoreIndicator({ label, active, value }: { label: string, active: boolean, value: any }) {
    return (
        <div className="flex flex-col gap-1.5 min-w-[50px]">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{label}</span>
            <div className={`p-2 rounded-lg border text-center font-mono text-xs font-black shadow-sm transition-all ${active ? 'bg-primary/5 text-primary border-primary/20' : 'bg-slate-50 text-slate-300 border-slate-200'
                }`}>
                {value ?? '0'}
            </div>
        </div>
    );
}

function ModalMetric({ label, value, active }: any) {
    return (
        <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{label}</p>
            <div className={`py-6 rounded-2xl text-center border shadow-inner transition-all ${active ? 'bg-white text-primary border-primary/30 shadow-primary/5' : 'bg-slate-50 text-slate-300 border-slate-100'
                }`}>
                <span className="text-2xl font-black font-mono">{value ?? '--'}</span>
            </div>
            <div className="flex justify-center">
                {active ? (
                    <CheckCircleIcon className="w-5 h-5 text-primary" />
                ) : (
                    <XMarkIcon className="w-5 h-5 text-slate-200" />
                )}
            </div>
        </div>
    );
}
