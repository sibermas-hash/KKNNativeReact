import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Search,
    Download,
    BadgeCheck,
    AlertCircle,
    Eye,
    X,
    CheckCircle,
    BarChart3,
    Archive,
    Bolt,
    History,
    ShieldCheck,
    Lock
} from 'lucide-react';
import { route } from 'ziggy-js';
import { clsx } from 'clsx';

interface ScoreRow {
    id: number | string;
    score_id: number | null;
    student_id: number;
    kelompok_id: number;
    nim: string;
    nama: string;
    prodi: string | null;
    fakultas: string | null;
    n_dpl: number | string | null;
    n_mitra: number | string | null;
    n_admin: number | string | null;
    total: number | string | null;
    grade: string | null;
    is_finalized: boolean;
    evidence_file: string | null;
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

interface PeriodOption {
    id: number;
    name: string;
}

interface FacultyOption {
    id: number;
    name: string;
}

interface LockedFaculty {
    id: number;
    name: string;
}

interface Props {
    scores: ScoreRow[];
    stats: Stats | null;
    periodeId: number | null;
    filters: {
        period_id?: number | null;
        faculty_id?: number | null;
    };
    periods: PeriodOption[];
    faculties: FacultyOption[];
    lockedFaculty?: LockedFaculty | null;
    canExport: boolean;
    canBulkCertificates: boolean;
    canFinalizeMass: boolean;
    finalizeProgress?: {
        status: string;
        current: number;
        total: number;
        percentage: number;
    };
}

const getGradeColor = (grade: string | null) => {
    if (!grade) return 'bg-slate-50 text-slate-400 border-slate-100';
    const firstLetter = grade.charAt(0).toUpperCase();
    switch (firstLetter) {
        case 'A': return 'bg-emerald-50 text-emerald-600 border-emerald-100
        case 'B': return 'bg-primary/5 text-primary border-primary/10
        case 'C': return 'bg-amber-50 text-amber-600 border-amber-100
        default: return 'bg-rose-50 text-rose-600 border-rose-100
    }
};

export default function RekapNilaiIndex({
    scores = [],
    stats,
    periodeId,
    filters,
    periods,
    faculties,
    lockedFaculty,
    canExport,
    canFinalizeMass,
    finalizeProgress,
}: Props) {
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<ScoreRow | null>(null);
    const [statusFilter, setStatusFilter] = useState('');

    const currentPeriodId = periodeId ? String(periodeId) : '';
    const currentFacultyId = filters?.faculty_id ? String(filters.faculty_id) : '';

    const filteredScores = useMemo(() => {
        return scores.filter((student) =>
            (student.nama.toLowerCase().includes(search.toLowerCase()) || student.nim.includes(search)) &&
            (statusFilter === '' || String(student.is_finalized) === statusFilter)
        );
    }, [scores, search, statusFilter]);

    const applyServerFilters = (nextPeriodId: string, nextFacultyId: string) => {
        router.get(route('admin.rekap-nilai.index'), {
            period_id: nextPeriodId || undefined,
            faculty_id: lockedFaculty?.id ?? (nextFacultyId || undefined),
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleExport = () => {
        if (!currentPeriodId || !canExport) return;
        window.open(route('admin.rekap-nilai.export', {
            period_id: currentPeriodId,
            faculty_id: lockedFaculty?.id ?? (currentFacultyId || undefined),
        }), '_blank');
    };

    const handleFinalizeMass = () => {
        if (!canFinalizeMass || !currentPeriodId) return;
        if (!confirm('KONFIRMASI: Apakah Anda yakin ingin memfinalisasi semua nilai yang telah lengkap? Nilai yang sudah dikunci tidak dapat diubah tanpa izin superuser.')) return;
        router.post(route('admin.rekap-nilai.finalize-mass'), {
            period_id: currentPeriodId,
            faculty_id: lockedFaculty?.id ?? (currentFacultyId || undefined),
        });
    };

    return (
        <AppLayout title="Rekapitulasi Nilai">
            <Head title="Rekap Nilai Mahasiswa" />

            <div className="space-y-10 pb-16">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                <History className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                ACADEMIC_SCORE_AGGREGATOR_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Rekapitulasi <span className="text-emerald-300 text-glow-emerald italic">Nilai KKN</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Agregasi capaian prestasi mahasiswa, validasi indeks penilaian, dan orkestrasi sertifikasi digital secara terpusat dalam ekosistem KKN UIN SAIZU.
                        </p>
                        {lockedFaculty && (
                            <div className="mt-4 inline-flex items-center gap-3 px-5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white
                                <Lock className="h-4 w-4 text-emerald-300" />
                                <span className="text-[10px] font-black uppercase  italic  Terbatas: {lockedFaculty.name}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 shrink-0 relative z-10">
                        {canExport && (
                            <button
                                onClick={handleExport}
                                disabled={!currentPeriodId}
                                className="inline-flex items-center gap-3 px-8 py-4.5 bg-white text-primary rounded-[1.25rem] text-[10px] font-black uppercase  transition-all hover:-translate-y-1 active:scale-95 italic"
                            >
                                <Download className="w-4.5 h-4.5" />
                                Ekspor Nilai
                            </button>
                        )}
                        {canFinalizeMass && (
                            <button
                                onClick={handleFinalizeMass}
                                disabled={!currentPeriodId || (finalizeProgress?.status === 'processing')}
                                className="inline-flex items-center gap-3 px-8 py-4.5 bg-emerald-400/10 hover:bg-emerald-400/20 text-white border border-white/20 rounded-[1.25rem] text-[10px] font-black uppercase  transition-all italic"
                            >
                                <BadgeCheck className="w-4.5 h-4.5 text-emerald-300" />
                                {finalizeProgress?.status === 'processing' ? 'Processing...' : 'Finalisasi Massal'}
                            </button>
                        )}
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <RekapStatCard label="RATA-RATA NILAI" value={stats.avg_score.toFixed(1)} icon={BarChart3} color="text-primary" bg="bg-primary/5" border="border-primary/10" />
                        <RekapStatCard label="DATA TERKUNCI" value={stats.finalized} icon={CheckCircle} color="text-emerald-500" bg="bg-emerald-50/50" border="border-emerald-100" />
                        <RekapStatCard label="BELUM FINAL" value={stats.pending} icon={AlertCircle} color="text-rose-500" bg="bg-rose-50/50" border="border-rose-100" />

                        <div className="p-6 bg-gradient-to-br from-primary-dark to-[#043d23]rounded-lg border border-primary/20 flex flex-col justify-between group overflow-hidden relative">
                             <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-300 pointer-events-none group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-16 w-16" />
                            </div>
                            <div className="flex items-center justify-between relative z-10">
                                <p className="text-[9px] font-black text-emerald-300 uppercase  italic">Protokol Keamanan</p>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                            <div className="mt-4 relative z-10">
                                <p className="text-[10px] font-black text-white uppercase  italic leading-none">
                                    {lockedFaculty ? 'MODE_READ_ONLY_ACCESS' : 'SYSTEM_INTEGRITY_SAFE'}
                                </p>
                                <p className="text-[9px] font-bold text-emerald-100/40 uppercase mt-2 italic leading-none 
                                    {lockedFaculty ? 'Ruang Lingkup Fakultas' : 'Record Terverifikasi SSL'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
                    <div className="flex-1 w-full xl:max-w-xl relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                        <input
                            placeholder="Cari berdasarkan NIM atau Nama..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-14 pr-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-900 italic  outline-none focus:border-primary/50 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                        <select
                            value={currentPeriodId}
                            onChange={(e) => applyServerFilters(e.target.value, currentFacultyId)}
                            className="flex-1 xl:w-64 h-13 px-6 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase  text-slate-600 outline-none focus:border-primary/50 transition-all cursor-pointer italic"
                        >
                            <option value="">Pilih Periode</option>
                            {periods.map((period) => (
                                <option key={period.id} value={period.id}>{period.name}</option>
                            ))}
                        </select>

                        {!lockedFaculty && faculties.length > 0 && (
                            <select
                                value={currentFacultyId}
                                onChange={(e) => applyServerFilters(currentPeriodId, e.target.value)}
                                className="flex-1 xl:w-64 h-13 px-6 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase  text-slate-600 outline-none focus:border-primary/50 transition-all cursor-pointer italic"
                            >
                                <option value="">Semua Fakultas</option>
                                {faculties.map((faculty) => (
                                    <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                                ))}
                            </select>
                        )}

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 xl:w-64 h-13 px-6 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase  text-slate-600 outline-none focus:border-primary/50 transition-all cursor-pointer italic"
                        >
                            <option value="">Semua Status Final</option>
                            <option value="true">Sudah Final</option>
                            <option value="false">Belum Final</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden relative">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-5 text-left text-[10px] font-bold uppercase  text-slate-400 italic">Data Mahasiswa</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold uppercase  text-slate-400 italic">Komponen Nilai</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-bold uppercase  text-slate-400 italic">Total</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-bold uppercase  text-slate-400 italic">Grade</th>
                                    <th className="px-10 py-5 text-right text-[10px] font-bold uppercase  text-slate-400 italic">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredScores.map((student) => (
                                    <tr key={student.id} className="group hover:bg-slate-50/30 transition-all">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-primary group-hover:text-white transition-all italic">
                                                    {student.nama.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="font-bold text-slate-900 group-hover:text-primary transition-colors text-sm uppercase italic  truncate leading-none">{student.nama}</p>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase  mt-1.5 leading-none italic">NIM: {student.nim}</span>
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase  mt-1 leading-none italic">
                                                        {student.prodi || '-'}{student.fakultas ? ` • ${student.fakultas}` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <MiniScore label="DPL" active={student.status_submit.dpl} value={student.n_dpl} />
                                                <MiniScore label="MITRA" active={student.status_submit.mitra} value={student.n_mitra} />
                                                <MiniScore label="ADMIN" active={student.status_submit.admin} value={student.n_admin} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-2xl font-black text-slate-900 tabular-nums italic  ?? '--'}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                <span className={clsx('px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase  italic border transition-all', getGradeColor(student.grade))}>
                                                    {student.grade ?? 'MENUNGGU'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                {student.is_finalized && (
                                                    <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl border border-emerald-100" title="Terkunci">
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary active:scale-95 transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredScores.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <Archive className="w-12 h-12 text-slate-200" />
                                                <p className="text-[10px] font-bold uppercase  text-slate-400 italic">Data tidak ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-10 bg-slate-900 rounded-[3rem] border border-slate-800 relative overflow-hidden group">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                     
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                    <ShieldCheck className="h-5.5 w-5.5 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">POLIK_PENILAIAN_INTEGRASI</h4>
                            </div>
                            <p className="text-[12px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-70">
                                {lockedFaculty
                                    ? 'Akun administrator fakultas diberikan akses otorisasi terbatas untuk memonitior capaian akademik mahasiswa pada fakultas terkait untuk seluruh angkatan operasional.'
                                    : 'Finalisasi massal merupakan tindakan permanen yang akan membekukan seluruh data komponen nilai dan menerbitkan sertifikat digital secara otomatis. Seluruh log perubahan akan terekam dalam ledger audit sistem.'}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0 border-l border-slate-800 pl-10 hidden md:flex">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-100 uppercase  italic">SECURITY_LEDGER_OK</span>
                             </div>
                             <div className="flex gap-4">
                                <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-600 hover:text-primary transition-colors cursor-help
                                    <Lock className="h-5 w-5" />
                                </div>
                                <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-600
                                    <Archive className="h-5 w-5" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedStudent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl border border-slate-100 overflow-hidden zoom-in-95 relative">
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-lg bg-slate-900 text-primary flex items-center justify-center text-xl font-bold italic
                                    {selectedStudent.nama.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-xl font-extrabold text-slate-900  italic uppercase leading-none">{selectedStudent.nama}</h4>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase  italic">{selectedStudent.nim}</span>
                                        <div className="h-1 w-1 rounded-full bg-slate-100" />
                                        <span className="text-[10px] font-bold text-primary uppercase  italic">{selectedStudent.prodi || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-3 gap-6">
                                <DetailMetric label="SKOR DPL" value={selectedStudent.n_dpl} active={selectedStudent.status_submit.dpl} />
                                <DetailMetric label="SKOR MITRA" value={selectedStudent.n_mitra} active={selectedStudent.status_submit.mitra} />
                                <DetailMetric label="SKOR ADMIN" value={selectedStudent.n_admin} active={selectedStudent.status_submit.admin} />
                            </div>

                            <div className="bg-slate-900rounded-lg p-8 flex items-center justify-between relative overflow-hidden group
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                                <div className="relative z-10">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase  mb-3 italic flex items-center gap-2">
                                        <Bolt className="h-3.5 w-3.5 text-primary" />
                                        Akumulasi Skor
                                    </p>
                                    <p className="text-5xl font-black text-white tabular-nums italic  ?? '--'}</p>
                                </div>
                                <div className="relative z-10 text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase  mb-3 italic">Konversi Grade</p>
                                    <span className={clsx('text-5xl font-black italic  transition-all', (getGradeColor(selectedStudent.grade).split(' ')[1] || 'text-slate-500'))}>
                                        {selectedStudent.grade ?? '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-8 bg-slate-50/30 border-t border-slate-50 flex gap-4">
                            {selectedStudent.is_finalized ? (
                                <div className="flex-1 py-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase  rounded-xl text-center flex items-center justify-center gap-3 italic border border-emerald-100">
                                    <ShieldCheck className="w-5 h-5" />
                                    Data Sudah Terkunci
                                </div>
                            ) : canFinalizeMass && selectedStudent.score_id ? (
                                <button
                                    onClick={() => {
                                        if (confirm('KONFIRMASI: Finalisasi nilai mahasiswa ini?')) {
                                            router.post(route('admin.rekap-nilai.finalize', selectedStudent.score_id!));
                                            setSelectedStudent(null);
                                        }
                                    }}
                                    disabled={!selectedStudent.total}
                                    className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-bold uppercase  rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 italic"
                                >
                                    Finalisasi & Kunci Nilai
                                </button>
                            ) : (
                                <div className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase  rounded-xl text-center flex items-center justify-center gap-3 italic border border-slate-200">
                                    <Lock className="w-5 h-5" />
                                    Mode Baca Saja
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function RekapStatCard({ label, value, icon: Icon, color, bg, border }: any) {
    return (
        <div className={clsx('bg-white p-6rounded-lg border group transition-all hover:-translate-y-1 relative overflow-hidden', border)}>
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase  mb-2 group-hover:text-primary transition-colors italic">{label}</p>
                    <p className={clsx('text-3xl font-black tabular-nums italic  group-hover:scale-110 transition-transform', color)}>{value}</p>
                </div>
                <div className={clsx('p-3.5 rounded-lg border transition-all group-hover:rotate-12', bg, color, 'border-transparent')}>
                    <Icon className="w-7 h-7" />
                </div>
            </div>
        </div>
    );
}

function MiniScore({ label, active, value }: { label: string; active: boolean; value: any }) {
    return (
        <div className="flex flex-col gap-1 min-w-[50px]">
            <span className="text-[8px] font-bold text-slate-400 uppercase  text-center italic">{label}</span>
            <div className={clsx(
                'py-1.5 rounded-lg border text-center font-mono text-[9px] font-bold transition-all italic',
                active ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-50 text-slate-300 border-slate-100 opacity-40'
            )}>
                {value ?? '0'}
            </div>
        </div>
    );
}

function DetailMetric({ label, value, active }: any) {
    return (
        <div className="space-y-3 group text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase  italic group-hover:text-primary transition-colors">{label}</p>
            <div className={clsx(
                'py-8 rounded-lg text-center border transition-all',
                active ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-50 text-slate-200 border-slate-100'
            )}>
                <span className="text-3xl font-black italic tabular-nums  leading-none">{value ?? '--'}</span>
            </div>
            <div className="flex justify-center transition-all group-hover:scale-110">
                {active ? (
                    <Bolt className="w-5 h-5 text-primary opacity-60" />
                ) : (
                    <Archive className="w-5 h-5 text-slate-100" />
                )}
            </div>
        </div>
    );
}
