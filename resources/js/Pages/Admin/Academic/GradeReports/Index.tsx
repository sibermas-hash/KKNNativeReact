import { type FormEvent, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
 BarChart3,
 Download,
 FileSpreadsheet,
 GraduationCap,
 Lock,
 Search,
 ShieldCheck,
 Users,
 Activity,
 RefreshCw,
 Building2,
 Binary,
 Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui';
import type { LucideIcon } from '@/types';

interface StudentGrade {
 id: number; score_id: number | null; nim: string; name: string;
 group_name: string; kelompok_id: number; final_grade_letter: string | null;
 final_grade_value: number | null; is_locked: boolean; fakultas?: string | null;
 prodi?: string | null; can_finalize?: boolean;
}

interface Props {
 stats: { total_students: number; graded_count: number; locked_count: number; average_value: number; } | null;
 filters: { search?: string | null; period_id?: number | string | null; faculty_id?: number | string | null; kelompok_id?: number | string | null; huruf?: string | null; };
 periods: Array<{ id: number; name: string }>;
 faculties: Array<{ id: number; name: string }>;
 lockedFaculty?: { id: number; name: string } | null;
 canExport: boolean;
 canFinalizeMass: boolean;
 scores: StudentGrade[] | null;
}

export default function RekapNilaiIndex({
 scores, stats, filters, periods, faculties, lockedFaculty, canExport, canFinalizeMass,
}: Props) {
 const [search, setSearch] = useState(filters.search ? String(filters.search) : '');
 const [periodId, setPeriodId] = useState(filters.period_id ? String(filters.period_id) : '');
 const [facultyId, setFacultyId] = useState(filters.faculty_id ? String(filters.faculty_id) : '');
 const [huruf, setHuruf] = useState(filters.huruf ? String(filters.huruf) : '');
 const [certProgress, setCertProgress] = useState<{ status: 'idle' | 'processing' | 'completed' | 'failed'; progress: number; processed: number; total: number; download_url?: string; }>({ status: 'idle', progress: 0, processed: 0, total: 0 });

 useEffect(() => {
 let interval: ReturnType<typeof setInterval>;
 if (certProgress.status === 'processing') {
 interval = setInterval(() => {
 fetch(route('admin.grade-reports.progres-sertifikat', { period_id: periodId }))
 .then(res => res.json())
 .then(data => { if (data) setCertProgress(prev => ({ ...prev, status: data.status, progress: data.progress || 0, processed: data.processed || 0, total: data.total || 0, download_url: data.download_url })); });
 }, 3000);
 }
 return () => clearInterval(interval);
 }, [certProgress.status, periodId]);

 const applyFilters = (event?: FormEvent) => {
 event?.preventDefault();
 router.get(route('admin.grade-reports.index'), { search: search || undefined, period_id: periodId || undefined, faculty_id: lockedFaculty ? lockedFaculty.id : facultyId || undefined, huruf: huruf || undefined }, { preserveState: true, preserveScroll: true, replace: true });
 };

 const handleFinalize = (scoreId: number) => {
 if (confirm('Finalisasi nilai mahasiswa ini secara permanen?')) router.patch(route('admin.grade-reports.finalisasi', scoreId), {}, { preserveScroll: true });
 };

 const handleBulkFinalize = () => {
 if (!periodId) return;
 if (confirm('Finalisasi massal untuk seluruh nilai yang sudah lengkap pada periode ini?')) router.post(route('admin.grade-reports.finalisasi-massal'), { period_id: periodId }, { preserveScroll: true });
 };

 const exportWithPath = (path: 'ekspor' | 'ekspor-ledger') => {
 if (!periodId) return;
 const params = new URLSearchParams();
 params.set('period_id', periodId);
 if (lockedFaculty) params.set('faculty_id', String(lockedFaculty.id));
 else if (facultyId) params.set('faculty_id', facultyId);
 if (search) params.set('search', search);
 if (huruf) params.set('huruf', huruf);
 window.location.href = `${path === 'ekspor' ? route('admin.grade-reports.ekspor') : route('admin.grade-reports.ekspor-ledger')}?${params.toString()}`;
 };

 const handleBulkCertificates = () => {
 if (!periodId) return;
 if (confirm('Mulai proses penerbitan sertifikat massal? Sistem akan memproses seluruh mahasiswa yang nilainya telah difinalisasi di latar belakang.')) {
 setCertProgress({ status: 'processing', progress: 0, processed: 0, total: 0 });
 router.post(route('admin.grade-reports.sertifikat-massal'), { period_id: periodId, faculty_id: facultyId || undefined }, { preserveScroll: true });
 }
 };

 return (
 <AppLayout title="Laporan & Rekapitulasi Nilai">
 <Head title="Rekapitulasi Nilai" />

 <div className="max-w-7xl mx-auto space-y-8 pb-24 text-emerald-950 font-sans">
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-4">
 <div className="flex items-center gap-3 text-emerald-600">
 <GraduationCap size={18} />
 <span className="text-xs font-bold tracking-[0.2em] opacity-80 uppercase">Administrasi & Pencatatan</span>
 </div>
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-1">
 <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
 Rekapitulasi <span className="text-emerald-500">Nilai.</span>
 </h1>
 <p className="font-semibold text-xs text-emerald-700 mt-2 leading-relaxed max-w-2xl">
 Dasbor terpusat untuk finalisasi capaian akademik dan manajemen penerbitan sertifikat mahasiswa KKN.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-4">
 {canExport && (
 <button
 onClick={() => exportWithPath('ekspor')}
 className="h-12 px-6 rounded-xl bg-white border border-emerald-100 text-emerald-800 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 shadow-sm transition-all flex items-center gap-2 font-bold active:scale-95 text-[11px] tracking-widest uppercase"
 >
 <FileSpreadsheet size={16} /> EKSPOR NILAI
 </button>
 )}
 {canFinalizeMass && (
 <button
 onClick={handleBulkFinalize}
 className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md flex items-center gap-2 font-bold active:scale-95 text-[11px] tracking-widest uppercase"
 >
 <ShieldCheck size={16} className="text-white" /> FINALISASI MASSAL
 </button>
 )}
 <button
 onClick={handleBulkCertificates}
 disabled={certProgress.status === 'processing'}
 className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md flex items-center gap-2 font-bold active:scale-95 disabled:opacity-50 text-[11px] tracking-widest uppercase"
 >
 {certProgress.status === 'processing' ? <RefreshCw size={16} className="animate-spin" /> : <GraduationCap size={16} />}
 CETAK SERTIFIKAT
 </button>
 </div>
 </div>
 </div>

 {/* --- PROGRESS / DOWNLOAD OVERLAY --- */}
 <AnimatePresence>
 {certProgress.status === 'processing' && (
 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
 <div className="bg-emerald-600 rounded-xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-emerald-200 border border-emerald-400">
 <div className="absolute top-0 right-0 p-8 opacity-10"><RefreshCw size={120} className="animate-spin" style={{ animationDuration: '3s' }} /></div>
 <div className="space-y-1 relative z-10">
 <h4 className="text-sm font-bold text-white uppercase tracking-wider">Menerbitkan Dokumen Legal</h4>
 <p className="text-[11px] font-semibold text-emerald-100 uppercase tracking-widest opacity-90">Sistem sedang merangkai sertifikat mahasiswa secara otomatis di latar belakang.</p>
 </div>
 <div className="flex items-center gap-6 relative z-10">
 <span className="text-2xl font-bold text-white tabular-nums">{certProgress.progress}%</span>
 <div className="h-2 w-32 bg-emerald-800 rounded-full overflow-hidden border border-emerald-500"><motion.div initial={{ width: 0 }} animate={{ width: `${certProgress.progress}%` }} className="h-full bg-white" /></div>
 </div>
 </div>
 </motion.div>
 )}
 {certProgress.status === 'completed' && certProgress.download_url && (
 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
 <div className="bg-emerald-600 rounded-xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-200">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0"><ShieldCheck size={20} /></div>
 <span className="text-sm font-bold tracking-tight uppercase">Arsip Sertifikat Telah Siap Diunduh.</span>
 </div>
 <a href={certProgress.download_url} target="_blank" rel="noopener noreferrer" className="h-10 px-6 bg-white text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-2 text-[11px] uppercase tracking-widest shadow-md hover:bg-emerald-50 transition-all"><Download size={14} /> UNDUH ARSIP (ZIP)</a>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* --- ANALYTICS --- */}
 {stats && (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <MetricStrip label="Total Mahasiswa" value={stats.total_students} icon={Users} />
 <MetricStrip label="Nilai Terinput" value={stats.graded_count} icon={Activity} />
 <MetricStrip label="Telah Difinalisasi" value={stats.locked_count} icon={Lock} />
 <MetricStrip label="Rata-Rata Nilai" value={Number(stats.average_value ?? 0).toFixed(2)} icon={BarChart3} />
 </div>
 )}

 {/* --- FILTERS & LEDGER --- */}
 <section className="bg-white border-2 border-emerald-50 rounded-2xl overflow-hidden shadow-sm">
 <div className="p-5 bg-emerald-50/50 border-b-2 border-emerald-50 space-y-4">
 <div className="flex flex-col lg:flex-row gap-4">
 <div className="flex-1 relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
 <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} placeholder="CARI NIM ATAU NAMA MAHASISWA..." className="w-full h-12 pl-10 pr-4 bg-white border border-emerald-100 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-emerald-300 font-semibold text-xs tracking-wide text-emerald-950" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <select value={periodId} onChange={(e) => { setPeriodId(e.target.value); router.get(route('admin.grade-reports.index', { period_id: e.target.value })); }} className="h-12 bg-white border border-emerald-100 rounded-lg px-4 text-emerald-950 font-semibold text-xs tracking-wide outline-none transition focus:border-emerald-500 min-w-[140px]">
 <option value="">SEMUA PERIODE</option>
 {periods.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
 </select>
 <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} disabled={!!lockedFaculty} className="h-12 bg-white border border-emerald-100 rounded-lg px-4 text-emerald-950 font-semibold text-xs tracking-wide outline-none transition focus:border-emerald-500 min-w-[140px] disabled:bg-emerald-50 disabled:opacity-70">
 <option value="">SEMUA FAKULTAS</option>
 {faculties.map(f => <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>)}
 </select>
 <select value={huruf} onChange={(e) => setHuruf(e.target.value)} className="h-12 bg-white border border-emerald-100 rounded-lg px-4 text-emerald-950 font-semibold text-xs tracking-wide outline-none transition focus:border-emerald-500 min-w-[120px]">
 <option value="">GRADE</option>
 {['A','B','C','D','E'].map(h => <option key={h} value={h}>NILAI {h}</option>)}
 </select>
 </div>
 </div>
 <div className="flex items-center justify-between gap-3 pt-2">
 <Button onClick={() => applyFilters()} className="h-10 px-8 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-emerald-700 transition active:scale-95">TERAPKAN PENCARIAN</Button>
 <div className="hidden sm:flex items-center gap-2 text-emerald-600/60">
 <Binary size={14} />
 <span className="font-semibold text-[10px] uppercase tracking-widest pl-1">Data sinkronisasi sistem KKN</span>
 </div>
 </div>
 </div>

 <div className="overflow-x-auto min-h-[400px]">
 <table className="w-full text-left">
 <thead className="bg-emerald-50/50 border-b-2 border-emerald-100">
 <tr>
 <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Identitas Mahasiswa</th>
 <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Fakultas & Prodi</th>
 <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Penempatan</th>
 <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 uppercase tracking-widest text-center">Hasil Akhir</th>
 <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 uppercase tracking-widest text-center">Status</th>
 <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 uppercase tracking-widest text-right">Tindakan</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-emerald-50 font-sans bg-white">
 {scores?.map((grade) => (
 <tr key={grade.id} className="group hover:bg-emerald-50/30 transition-all">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-emerald-950 leading-none group-hover:text-emerald-700 transition-colors truncate max-w-[200px] uppercase">{grade.name}</span>
 <span className="text-[11px] font-semibold text-emerald-600 mt-1.5 tabular-nums tracking-wide">{grade.nim}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-xs font-bold text-emerald-900 leading-none truncate max-w-[180px] uppercase">{grade.fakultas || 'BELUM DIATUR'}</span>
 <span className="text-[10px] font-semibold text-emerald-600 mt-1.5 leading-none uppercase">{grade.prodi || 'TIDAK ADA PRODI'}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-left">
 <span className="inline-flex h-7 items-center px-3 bg-emerald-100/50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold truncate max-w-[150px]">{grade.group_name}</span>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="flex flex-col items-center">
 <span className="text-xl font-bold text-emerald-950 tracking-tight tabular-nums leading-none mb-1.5">{grade.final_grade_value !== null ? Number(grade.final_grade_value).toFixed(2) : '-'}</span>
 <div className={clsx('h-6 px-4 flex items-center justify-center rounded-md font-bold text-[10px] uppercase tracking-wider', grade.final_grade_letter === 'A' || grade.final_grade_letter === 'A-' ? 'bg-emerald-600 text-white shadow-sm' : (grade.final_grade_letter && grade.final_grade_letter.includes('B')) ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-50 text-emerald-600')}>{grade.final_grade_letter || 'N/A'}</div>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <div className={clsx('inline-flex h-7 items-center px-4 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all', grade.is_locked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-emerald-600 border-emerald-100/60')}>
 {grade.is_locked ? 'FINAL MUTLAK' : 'DRAFT'}
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all">
 {grade.can_finalize && !grade.is_locked ? (
 <Button onClick={() => handleFinalize(grade.score_id!)} className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] tracking-widest uppercase rounded-lg flex items-center gap-2 transition-all shadow-sm"><Lock size={12} /> KUNCI NILAI</Button>
 ) : <span className="text-[10px] font-bold text-emerald-600/70 tracking-widest uppercase">{grade.is_locked ? 'TERKUNCI' : 'BELUM LENGKAP'}</span>}
 </div>
 </td>
 </tr>
 ))}
 {(!scores || scores.length === 0) && (
 <tr><td colSpan={6} className="py-24 text-center">
 <div className="flex flex-col items-center justify-center gap-2">
 <Search size={24} className="text-emerald-200 mb-2" />
 <span className="text-sm font-bold text-emerald-700 tracking-wide">TIDAK ADA DATA UNTUK DITAMPILKAN</span>
 <span className="text-[11px] font-semibold text-emerald-500">Sesuaikan filter atau pastikan mahasiswa telah dinilai.</span>
 </div>
 </td></tr>
 )}
 </tbody>
 </table>
 </div>
 </section>

 <div className="bg-emerald-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-200 border border-emerald-500">
 <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Building2 size={200} /></div>
 <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 bg-white border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"><ShieldCheck size={32} /></div>
 <div className="space-y-2">
 <h4 className="text-xl font-bold tracking-tight uppercase">Sistem Validasi Nilai Permanen</h4>
 <p className="text-[12px] font-semibold text-emerald-50 uppercase tracking-widest leading-relaxed max-w-xl">Rekapitulasi ini merupakan muara verifikasi akhir keberhasilan KKN. Nilai yang dikunci bersifat mutlak, permanen, dan siap diterbitkan ke dalam sertifikat.</p>
 </div>
 </div>
 <div className="flex items-center gap-2 border border-emerald-400 bg-emerald-700 px-4 py-2 rounded-lg"><Zap size={14} className="text-emerald-100" /><span className="text-[10px] font-bold text-emerald-50 tracking-widest uppercase">Integritas Terjaga</span></div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricStrip({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
 return (
 <div className="bg-white border-2 border-emerald-50 rounded-2xl p-5 flex items-center gap-5 shadow-sm hover:border-emerald-100 transition-all group overflow-hidden relative">
 <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm"><Icon size={20} strokeWidth={2.5} /></div>
 <div className="flex flex-col relative z-20">
 <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase leading-none mb-2">{label}</span>
 <span className="text-2xl font-black text-emerald-950 tracking-tight tabular-nums leading-none group-hover:text-emerald-700 transition-colors">{value}</span>
 </div>
 </div>
 );
}
