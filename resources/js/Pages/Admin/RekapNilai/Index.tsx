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
 Lock,
 Activity,
 ChevronRight,
 GraduationCap,
 Cpu,
 Scale,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { clsx } from 'clsx';
import { StatusBadge } from '@/Components/ui';

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

 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 ACADEMIC_SCORE_AGGREGATOR_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <BarChart3 className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Rekap <span className="text-primary">Nilai</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 {canExport && (
 <button
 onClick={handleExport}
 disabled={!currentPeriodId}
 className="px-6 py-3 bg-white border border-slate-200 text-slate-900 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-3 disabled:opacity-30"
 >
 <Download className="w-3.5 h-3.5 text-primary" />
 EXPORT_LEDGER
 </button>
 )}
 {canFinalizeMass && (
 <button
 onClick={handleFinalizeMass}
 disabled={!currentPeriodId || (finalizeProgress?.status === 'processing')}
 className="px-6 py-3 bg-slate-900 text-white text-[10px] font-semibold rounded-lg transition-all flex items-center gap-3 disabled:opacity-30"
 >
 <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
 {finalizeProgress?.status === 'processing' ? 'PROCESSING...' : 'INITIALIZE_FINAL_LOCK'}
 </button>
 )}
 </div>
 </div>

 {stats && (
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <RekapStatCard label="AVG_SCORE_LEVEL" value={stats.avg_score.toFixed(1)} icon={Activity} color="text-primary" />
 <RekapStatCard label="LOCKED_RECORDS" value={stats.finalized} icon={ShieldCheck} color="text-emerald-500" />
 <RekapStatCard label="PENDING_AUDIT" value={stats.pending} icon={AlertCircle} color="text-rose-500" />
 <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 flex flex-col justify-between group overflow-hidden relative">
 <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-300 pointer-events-none ">
 <Lock className="h-16 w-16" />
 </div>
 <div className="flex items-center justify-between relative z-10">
 <p className="text-[9px] font-semibold text-emerald-500 leading-none">Security_Protocol</p>
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 </div>
 <div className="mt-4 relative z-10">
 <p className="text-[11px] font-semibold text-white leading-none">
 {lockedFaculty ? 'MODE_READ_ONLY_ACCESS' : 'SYSTEM_INTEGRITY_SAFE'}
 </p>
 <p className="text-[8px] font-semibold text-slate-500 mt-1.5 opacity-50">
 {lockedFaculty ? `Limited: ${lockedFaculty.name}` : 'Record Terverifikasi SSL'}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Operations Toolbar */}
 <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
 <div className="flex-1 w-full xl:max-w-2xl relative group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 type="search"
 placeholder="SEARCH_ACADEMIC_RECORD (NAME / NIM)..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>

 <div className="flex flex-wrap gap-4 w-full xl:w-auto">
 <select
 value={currentPeriodId}
 onChange={(e) => applyServerFilters(e.target.value, currentFacultyId)}
 className="flex-1 xl:w-56 bg-white border border-slate-100 rounded-lg px-4 py-3 text-[10px] font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 appearance-none cursor-pointer"
 >
 <option value="">SELECT_PERIOD</option>
 {periods.map((period) => (
 <option key={period.id} value={period.id}>{period.name}</option>
 ))}
 </select>

 {!lockedFaculty && faculties.length > 0 && (
 <select
 value={currentFacultyId}
 onChange={(e) => applyServerFilters(currentPeriodId, e.target.value)}
 className="flex-1 xl:w-56 bg-white border border-slate-100 rounded-lg px-4 py-3 text-[10px] font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 appearance-none cursor-pointer"
 >
 <option value="">ALL_FACULTIES</option>
 {faculties.map((faculty) => (
 <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
 ))}
 </select>
 )}

 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="flex-1 xl:w-56 bg-white border border-slate-100 rounded-lg px-4 py-3 text-[10px] font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 appearance-none cursor-pointer"
 >
 <option value="">AUDIT_STATUS</option>
 <option value="true">LOCKED</option>
 <option value="false">AUDITING_PROCESS</option>
 </select>
 </div>
 </div>

 {/* Data Table */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">PERSONNEL_IDENTITY</th>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">SCORE_COMPONENTS</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">AGGREGATE</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">GRADE_CONV</th>
 <th className="px-8 py-6 text-right text-[9px] font-semibold text-slate-400">INSPECTION</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {filteredScores.map((student) => (
 <tr key={student.id} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 text-primary text-[11px] font-semibold flex items-center justify-center ">
 {student.nama.charAt(0)}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] group-hover/row:text-primary transition-colors">
 {student.nama}
 </span>
 <div className="flex items-center gap-2 mt-0.5">
 <Fingerprint className="h-3 w-3 text-slate-300" />
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 font-mono">
 NIM: {student.nim}
 </span>
 </div>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <MiniScore label="DPL" active={student.status_submit.dpl} value={student.n_dpl} />
 <MiniScore label="MITRA" active={student.status_submit.mitra} value={student.n_mitra} />
 <MiniScore label="ADMIN" active={student.status_submit.admin} value={student.n_admin} />
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <span className="text-xl font-semibold text-slate-900">{student.total ?? '--'}</span>
 </td>
 <td className="px-8 py-6 text-center">
 <span className={clsx(
 'inline-flex px-4 py-1.5 rounded-lg text-[10px] font-semibold ',
 getGradeStyles(student.grade)
 )}>
 {student.grade ?? 'AUDITING'}
 </span>
 </td>
 <td className="px-8 py-6 text-right">
 <div className="flex items-center justify-end gap-3">
 {student.is_finalized && (
 <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-lg border border-emerald-100 " title="LOCKED_RECORD">
 <ShieldCheck className="w-4 h-4" />
 </div>
 )}
 <button
 onClick={() => setSelectedStudent(student)}
 className="h-9 w-9 bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/30 rounded-lg transition-all flex items-center justify-center"
 >
 <Eye className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 {filteredScores.length === 0 && (
 <tr>
 <td colSpan={5} className="px-8 py-32 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <Archive className="h-12 w-12 text-slate-900" />
 <span className="text-[10px] font-semibold text-slate-900">ZERO_RECORDS_DETECTED</span>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Operational Governance Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <ShieldCheck className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">ACADEMIC_GOVERNANCE_PROTOCOL_V3.2</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: SYSTEM_INTEGRITY_SAFE</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 {lockedFaculty
 ? 'Akun administrator fakultas diberikan akses monitor terbatas untuk memastikan transparansi capaian akademik mahasiswa pada sektor penugasan terkait.'
 : 'Finalisasi massal adalah tindakan permanen yang akan membekukan seluruh data komponen nilai dan menerbitkan sertifikat digital secara otomatis.'}
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">REALTIME_LEDGER_SYNC</span>
 </div>
 <div className="flex gap-4 opacity-50">
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Cpu className="h-5 w-5" />
 </div>
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Scale className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Scale Inspection Modal */}
 {selectedStudent && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm fade-in duration-300">
 <div className="bg-white rounded-lg w-full max-w-2xl border border-slate-100 overflow-hidden zoom-in-95 duration-300">
 <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 relative">
 <div className="flex items-center gap-4 relative z-10">
 <div className="p-3 bg-slate-900 rounded-lg text-primary">
 <Eye className="h-5 w-5" />
 </div>
 <div className="flex flex-col">
 <h3 className="text-sm font-semibold text-slate-900">SCORE_INSPECTION_AUDIT</h3>
 <span className="text-[9px] font-semibold text-slate-400 opacity-50">ACADEMIC_PERFORMANCE_VECTOR</span>
 </div>
 </div>
 <button 
 onClick={() => setSelectedStudent(null)} 
 className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-300 hover:text-rose-500 rounded-lg hover:rotate-90 transition-all z-10"
 >
 <X className="h-5 w-5" />
 </button>
 <BarChart3 className="absolute right-[-20px] bottom-[-20px] h-32 w-32 text-slate-100/50 -rotate-12 pointer-events-none" />
 </div>

 <div className="p-10 space-y-8">
 <div className="p-6 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-6">
 <div className="h-14 w-14 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-xl font-semibold text-primary">
 {selectedStudent.nama.charAt(0)}
 </div>
 <div className="flex flex-col min-w-0">
 <p className="text-sm font-semibold text-slate-900 truncate leading-none mb-1">{selectedStudent.nama}</p>
 <div className="flex items-center gap-2">
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 font-mono">NIM: {selectedStudent.nim}</span>
 <span className="text-[10px] font-semibold text-primary/40">{selectedStudent.prodi || 'PROGRAM_UNSET'}</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-4">
 <DetailMetric label="SKOR_DPL" value={selectedStudent.n_dpl} active={selectedStudent.status_submit.dpl} />
 <DetailMetric label="SKOR_MITRA" value={selectedStudent.n_mitra} active={selectedStudent.status_submit.mitra} />
 <DetailMetric label="SKOR_ADMIN" value={selectedStudent.n_admin} active={selectedStudent.status_submit.admin} />
 </div>

 <div className="bg-slate-900 rounded-lg p-8 flex items-center justify-between relative overflow-hidden group">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,168,83,0.1),transparent_50%)]" />
 <div className="relative z-10">
 <p className="text-[9px] font-semibold text-slate-500 mb-2 flex items-center gap-2">
 <Bolt className="h-3.5 w-3.5 text-primary" /> ACCUMULATED_WEIGHT
 </p>
 <p className="text-5xl font-semibold text-white">{selectedStudent.total ?? '--'}</p>
 </div>
 <div className="relative z-10 text-right">
 <p className="text-[9px] font-semibold text-slate-500 mb-2">FINAL_GRADE</p>
 <span className={clsx('text-5xl font-semibold', getGradeStyles(selectedStudent.grade).includes('text-emerald') ? 'text-primary' : 'text-slate-400')}>
 {selectedStudent.grade ?? '--'}
 </span>
 </div>
 </div>

 <div className="flex items-center justify-between pt-6 border-t border-slate-50">
 <div className="flex items-center gap-4 text-slate-300">
 <ShieldCheck className="h-5 w-5" />
 <span className="text-[9px] font-semibold">REGISTRY_CHECK_V3.2</span>
 </div>
 <div className="flex gap-4">
 <button
 type="button"
 onClick={() => setSelectedStudent(null)}
 className="px-8 py-3 text-[10px] font-semibold text-slate-400 hover:text-slate-900 transition-all font-sans"
 >
 CLOSE_INSPECTION
 </button>
 {!selectedStudent.is_finalized && canFinalizeMass && selectedStudent.score_id && (
 <button
 onClick={() => {
 if (confirm('KONFIRMASI: Finalisasi nilai mahasiswa ini?')) {
 router.post(route('admin.rekap-nilai.finalize', selectedStudent.score_id!));
 setSelectedStudent(null);
 }
 }}
 disabled={!selectedStudent.total}
 className="px-12 py-3 bg-primary text-white rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50"
 >
 FINALIZE_&_LOCK
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </AppLayout>
 );
}

function RekapStatCard({ label, value, icon: Icon, color }: any) {
 return (
 <div className="bg-white p-6 rounded-lg border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
 <div className="relative z-10">
 <p className="text-[9px] font-semibold text-slate-400 mb-1 group-hover:text-primary transition-colors">{label}</p>
 <p className={clsx('text-3xl font-semibold leading-none transition-transform', color)}>{value}</p>
 </div>
 <div className={clsx('p-4 rounded-lg border border-slate-50 transition-all group-hover:rotate-12 bg-slate-50/50', color)}>
 <Icon className="w-6 h-6" />
 </div>
 </div>
 );
}

function MiniScore({ label, active, value }: { label: string; active: boolean; value: any }) {
 return (
 <div className="flex flex-col gap-1.5 min-w-[54px]">
 <span className="text-[8px] font-semibold text-slate-400 text-center leading-none">{label}</span>
 <div className={clsx(
 'py-2 rounded-lg border text-center font-semibold text-[11px] h-9 flex items-center justify-center transition-all',
 active ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-50/30 text-slate-200 border-slate-100'
 )}>
 {value ?? '0'}
 </div>
 </div>
 );
}

function DetailMetric({ label, value, active }: any) {
 return (
 <div className="space-y-4 group text-center flex-1">
 <p className="text-[9px] font-semibold text-slate-400 group-hover:text-primary transition-colors">{label}</p>
 <div className={clsx(
 'py-8 rounded-lg text-center border transition-all duration-500',
 active ? 'bg-white text-slate-900 border-slate-100 scale-105' : 'bg-slate-50 text-slate-200 border-slate-100 opacity-50'
 )}>
 <span className="text-3xl font-semibold leading-none">{value ?? '--'}</span>
 </div>
 <div className="flex justify-center transition-all group-hover:translate-y-1">
 <div className={clsx("h-1.5 w-1.5 rounded-full transition-all duration-500", active ? "bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" : "bg-slate-200")} />
 </div>
 </div>
 );
}

const getGradeStyles = (grade: string | null) => {
 if (!grade) return 'bg-slate-50 text-slate-300 border-slate-100';
 const firstLetter = grade.charAt(0).toUpperCase();
 switch (firstLetter) {
 case 'A': return 'bg-primary/10 text-primary border-primary/20';
 case 'B': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
 case 'C': return 'bg-amber-50 text-amber-600 border-amber-100';
 default: return 'bg-rose-50 text-rose-600 border-rose-100';
 }
};
