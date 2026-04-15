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
 Archive,
 ChevronRight
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
 <AppLayout title="Repositori Laporan Mahasiswa">
 <Head title="Repositori Laporan" />

 <div className="max-w-7xl mx-auto space-y-8 pb-24 text-black font-sans">
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-4">
 <div className="flex items-center gap-3 text-emerald-600">
 <Archive size={18} />
 <span className="text-xs font-bold tracking-[0.25em] opacity-80">Repositori & Arsip Produk Akademik</span>
 </div>
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-1">
 <h1 className="text-2xl font-semibold text-black tracking-tight">
 Repositori <span className="text-emerald-500">Laporan.</span>
 </h1>
 <p className="text-sm font-semibold text-emerald-950 font-semibold text-xs mt-2 leading-relaxed max-w-2xl">
 Pusat Verifikasi Produk Akademik dan Validasi Kelulusan Mahasiswa KKN
 </p>
 </div>
 <div className="flex items-center gap-4">
 <div className="h-14 px-8 bg-white border border-emerald-100/60 rounded-2xl flex items-center gap-4 shadow-sm">
 <FileCheck size={20} className="text-emerald-500" />
 <div className="flex flex-col">
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-none mb-1">Status Inventori</span>
 <span className="text-sm font-bold text-black tabular-nums leading-none tracking-tight">{reports.meta.total.toLocaleString()} BERKAS TERARSIP</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* --- INSTITUTIONAL STATS --- */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <MetricCard label="Akurasi Data" value="VALIDATED" icon={ShieldCheck} color="emerald" desc="Verifikasi integritas dokumen 100%" />
 <MetricCard label="Aturan Audit" value="STANDAR" icon={CheckCircle2} color="emerald" desc="Sesuai regulasi akademik LPPM" />
 <MetricCard label="Status Pengarsipan" value="OPTIMAL" icon={History} color="emerald" desc="Sistem penyimpanan cloud aktif" />
 </div>

 {/* --- FILTER & TABEL --- */}
 <section className="bg-white border border-emerald-100/60 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
 <div className="p-8 border-b border-emerald-100/60 flex flex-col md:flex-row items-center justify-between gap-6 bg-emerald-50/30/20">
 <div className="flex items-center gap-5">
 <div className="h-12 w-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100/60 shadow-sm">
 <Filter size={24} />
 </div>
 <div className="space-y-1">
 <h3 className="text-base font-bold text-black tracking-tight">Penyaringan Dokumen</h3>
 <p className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold">Filter berdasarkan status validasi</p>
 </div>
 </div>
 <div className="relative w-full md:w-80 group">
 <select 
 value={filters.status ?? ''}
 onChange={(e) => handleFilterChange(e.target.value)}
 className="w-full h-14 pl-6 pr-12 bg-white border border-emerald-100/60 rounded-2xl text-sm font-bold text-emerald-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 appearance-none font-semibold text-xs"
 >
 {statusOptions.map(opt => (
 <option key={opt.value} value={opt.value}>
 {opt.value === '' ? 'SEMUA STATUS' : opt.label}
 </option>
 ))}
 </select>
 <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-white text-sm font-bold tracking-wider text-xs font-semibold text-emerald-950 border-b border-slate-50">
 <tr>
 <th className="px-6 py-6 w-16 text-center">#</th>
 <th className="px-6 py-6">Identitas Dokumen</th>
 <th className="px-6 py-6">Mahasiswa / Personel</th>
 <th className="px-6 py-6 text-center">Unit / Kelompok</th>
 <th className="px-6 py-6 text-right">Status Verifikasi</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {rows.length > 0 ? rows.map((report, idx) => (
 <tr key={report.id} className="hover:bg-emerald-50/30/50 transition-all group">
 <td className="px-6 py-8 text-center text-sm font-bold text-slate-300 tabular-nums">
 {idx + 1 + (reports.meta.current_page - 1) * reports.meta.per_page}
 </td>
 <td className="px-6 py-8">
 <div className="flex items-center gap-6">
 <div className="h-14 w-14 bg-white border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
 <FileText size={24} />
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[15px] font-bold text-black leading-tight group-hover:text-emerald-700 transition-colors tracking-tight">{report.title}</span>
 <span className="text-sm font-bold text-slate-300 tracking-wider text-xs font-semibold font-mono">Arsip ID: #{report.id}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-8">
 <div className="flex flex-col gap-1">
 <span className="text-sm font-bold text-emerald-700 leading-none">{report.mahasiswa?.nama || '—'}</span>
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs font-mono">NIM: {report.mahasiswa?.nim || '—'}</span>
 </div>
 </td>
 <td className="px-6 py-8 text-center">
 <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
 <Layers size={14} className="text-emerald-500" />
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs group-hover:text-white transition-colors leading-none">{report.kelompok?.nama_kelompok || '—'}</span>
 </div>
 </td>
 <td className="px-6 py-8 text-right">
 <div className="flex items-center justify-end gap-5">
 <StatusBadge status={report.status} className="!rounded-lg !font-bold !py-1.5 !px-4 !text-sm ! !tracking-normal !border !shadow-none" />
 <Link 
 href={route('admin.laporan.akhir.show', report.id)}
 className="h-10 px-5 bg-white border border-emerald-100/60 text-emerald-950 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-sm rounded-xl text-sm font-bold font-semibold text-xs flex items-center gap-2 transition-all active:scale-95 group/btn"
 >
 Lihat Detail
 <ChevronRight size={14} className="opacity-40 group-hover/btn:translate-x-0.5 transition-transform" />
 </Link>
 </div>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={5} className="px-6 py-40 text-center">
 <div className="flex flex-col items-center gap-6 text-slate-200">
 <Archive size={60} strokeWidth={1} />
 <p className="text-xs font-bold tracking-wider text-xs font-semibold leading-none">Repositori laporan masih kosong</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="px-6 py-6 border-t border-slate-50 bg-emerald-50/30/20 flex items-center justify-between">
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-none">
 Inventori Hal. {reports.meta?.current_page} — {reports.meta?.total} laporan terarsip
 </span>
 {reports.meta && <Pagination meta={reports.meta} />}
 </div>
 </section>

 {/* --- FOOTER GUIDE --- */}
 <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
 <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-16 -mt-16"><ShieldCheck size={350} /></div>
 <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
 <div className="flex items-center gap-6">
 <div className="h-12 w-24 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md">
 <FileCheck size={48} className="text-white" />
 </div>
 <div className="space-y-3">
 <h4 className="text-2xl font-bold tracking-tight">Manajemen Validasi Laporan</h4>
 <p className="text-sm font-medium text-emerald-50 max-w-2xl leading-relaxed">
 Laporan akhir adalah bukti otentik pengabdian mahasiswa. Validasi yang ketat menjamin kualitas luaran KKN dan integritas institusional UIN SAIZU dalam kontribusi nyata di masyarakat.
 </p>
 </div>
 </div>
 <div className="flex flex-col items-center gap-2 opacity-30 text-emerald-100">
 <Cpu size={32} />
 <span className="text-sm font-bold tracking-wider text-xs font-semibold">Node Arsip Aktif</span>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string, icon: LucideIcon, color: 'emerald' | 'amber', desc: string }) {
 return (
 <div className="bg-white border border-emerald-100/60 rounded-2xl p-8 space-y-6 hover:shadow-lg transition-all group overflow-hidden relative shadow-sm">
 <div className="flex items-center justify-between relative z-10">
 <div className={clsx(
 "h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-sm",
 color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
 )}>
 <Icon size={24} />
 </div>
 </div>
 <div className="space-y-1 relative z-10">
 <p className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold leading-none mb-2">{label}</p>
 <div className="flex items-baseline gap-1">
 <p className="text-2xl font-semibold text-black tracking-tight tabular-nums leading-none ">
 {value}
 </p>
 </div>
 <p className="mt-4 text-sm font-bold text-slate-300 tracking-wider text-xs font-semibold">{desc}</p>
 </div>
 </div>
 );
}
