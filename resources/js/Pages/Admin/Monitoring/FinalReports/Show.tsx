import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormTextarea } from '@/Components/ui';
import { 
 Activity,
 ShieldCheck, 
 ChevronLeft, 
 ExternalLink, 
 FileText, 
 Video, 
 Newspaper, 
 Image, 
 User, 
 Users, 
 CheckCircle, 
 XCircle,
 Info,
 ArrowRight,
 Clock,
 Fingerprint,
 Calendar,
 SearchCheck,
 AlertTriangle,
 Save
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Report {
 id: number;
 title: string;
 abstract?: string | null;
 status: string;
 video_link?: string | null;
 news_link?: string | null;
 file_path: string;
 file_name: string;
 article_1_path?: string | null;
 article_2_path?: string | null;
 poster_1_path?: string | null;
 poster_2_path?: string | null;
 poster_3_path?: string | null;
 submitted_at: string;
 review_notes?: string | null;
 reviewed_at?: string | null;
 mahasiswa?: {
 nama: string;
 nim: string;
 };
 kelompok?: {
 nama_kelompok: string;
 dpl?: {
 user?: {
 name: string;
 }
 }
 };
 reviewer?: {
 name: string;
 };
}

interface Props {
 report: Report;
}

export default function AdminFinalReportShow({ report }: Props) {
 const { data, setData, patch, processing } = useForm({
 status: report.status,
 review_notes: report.review_notes ?? '',
 });

 const handleSubmit = (status: 'disetujui' | 'revisi') => {
 setData('status', status);
 patch(route('admin.laporan.akhir.update-status', report.id));
 };

 const isFinalized = report.status === 'disetujui';

 return (
 <AppLayout title={`Audit Laporan: ${report.mahasiswa?.nama}`}>
 <Head title="Detail Audit Laporan | POS-KKN" />

 <div className="min-h-screen bg-white font-bold text-black pb-24">
 {/* HEADER TACTICAL */}
 <div className="bg-white border-b border-emerald-100/60 px-6 py-6 flex flex-col xl:flex-row xl:items-center justify-between gap-8 sticky top-0 z-20 shadow-sm overflow-hidden relative">
 <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
 
 <div className="space-y-2 relative z-10">
 <Link 
 href={route('admin.laporan.akhir.index')}
 className="inline-flex items-center gap-2 text-sm text-white hover:text-emerald-600 transition-colors font-semibold text-xs mb-4"
 >
 <ChevronLeft size={14} /> KEMBALI KE REPOSITORY
 </Link>
 <h1 className="text-3xl font-bold font-bold text-center leading-none">
 AUDIT <span className="text-emerald-500">DOKUMEN AKHIR</span>
 </h1>
 <div className="flex items-center gap-4 mt-2">
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs flex items-center gap-2">
 <Fingerprint size={12} /> ARCHIVE_STAMP: #{report.id}
 </span>
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
 <StatusBadge status={report.status} />
 </div>
 </div>

 {!isFinalized && (
 <div className="flex items-center gap-4 relative z-10">
 <button
 onClick={() => handleSubmit('disetujui')}
 disabled={processing}
 className="h-14 px-8 bg-emerald-600 text-white font-bold text-sm font-semibold text-xs hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-3 disabled:opacity-50"
 >
 <CheckCircle size={16} /> SETUJUI LAPORAN
 </button>
 <button
 onClick={() => handleSubmit('revisi')}
 disabled={processing}
 className="h-14 px-8 bg-rose-600 text-white font-bold text-sm font-semibold text-xs hover:bg-rose-700 transition-all shadow-lg flex items-center gap-3 disabled:opacity-50"
 >
 <XCircle size={16} /> MINTA REVISI
 </button>
 </div>
 )}
 </div>

 <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 {/* LEFT COLUMN: CORE CONTENT */}
 <div className="lg:col-span-8 space-y-12">
 {/* TITLE & ABSTRACT */}
 <section className="bg-emerald-50/30/50 border border-emerald-100/60 p-12 space-y-8">
 <div className="space-y-4">
 <span className="text-sm font-bold text-white font-semibold text-xs ">Judul Publikasi</span>
 <h2 className="text-2xl font-bold tracking-tight leading-tight text-black ">
 {report.title}
 </h2>
 </div>
 {report.abstract && (
 <div className="space-y-4 pt-8 border-t border-emerald-100/60/50">
 <span className="text-sm font-bold text-white font-semibold text-xs ">Abstrak Operasional</span>
 <p className="text-sm font-bold text-bg-emerald-100 leading-relaxed tracking-tight opacity-70">
 {report.abstract}
 </p>
 </div>
 )}
 </section>

 {/* MULTIMEDIA MODUL (KKN 56) */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="bg-white border border-emerald-100/60 p-8 shadow-sm group hover:border-emerald-900 transition-all">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-4">
 <Video className="text-rose-500" />
 <span className="text-sm font-bold font-semibold text-xs ">Dokumentasi Video</span>
 </div>
 <span className="text-sm px-2 py-1 bg-emerald-50 text-emerald-600 rounded">5-7 MIN REQ</span>
 </div>
 {report.video_link ? (
 <a href={report.video_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-emerald-50/50 hover:bg-emerald-50 transition-colors border border-emerald-100/60">
 <span className="text-sm font-bold truncate max-w-[200px]">{report.video_link}</span>
 <ExternalLink size={14} className="text-white" />
 </a>
 ) : (
 <div className="p-4 bg-rose-50 text-rose-400 text-sm font-bold border border-rose-100 flex items-center gap-3">
 <AlertTriangle size={14} /> LINK_VIDEO_MISSING
 </div>
 )}
 </div>

 <div className="bg-white border border-emerald-100/60 p-8 shadow-sm group hover:border-emerald-900 transition-all">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-4">
 <Newspaper className="text-blue-500" />
 <span className="text-sm font-bold font-semibold text-xs ">Publikasi Berita</span>
 </div>
 <span className="text-sm px-2 py-1 bg-emerald-50 text-emerald-600 rounded">350 WORDS REQ</span>
 </div>
 {report.news_link ? (
 <a href={report.news_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-emerald-50/50 hover:bg-emerald-50 transition-colors border border-emerald-100/60">
 <span className="text-sm font-bold truncate max-w-[200px]">{report.news_link}</span>
 <ExternalLink size={14} className="text-white" />
 </a>
 ) : (
 <div className="p-4 bg-rose-50 text-rose-400 text-sm font-bold border border-rose-100 flex items-center gap-3">
 <AlertTriangle size={14} /> LINK_NEWS_MISSING
 </div>
 )}
 </div>
 </div>

 {/* ACADEMIC ASSETS (KKN 56) */}
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <div className="h-px flex-1 bg-emerald-100" />
 <span className="text-sm font-bold text-white font-semibold text-xs">Arsip Berkas Akademik</span>
 <div className="h-px flex-1 bg-emerald-100" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {[
 { label: 'Laporan Utama', path: report.file_path, icon: FileText, required: true },
 { label: 'Artikel Ilmiah 1', path: report.article_1_path, icon: FileText, required: true },
 { label: 'Artikel Ilmiah 2', path: report.article_2_path, icon: FileText, required: true },
 { label: 'Poster Peta 1', path: report.poster_1_path, icon: Image, required: true },
 { label: 'Poster Peta 2', path: report.poster_2_path, icon: Image, required: true },
 { label: 'Poster Peta 3', path: report.poster_3_path, icon: Image, required: true },
 ].map((item, i) => (
 <div key={i} className={clsx(
 "p-6 border flex flex-col gap-4 group/asset transition-all",
 item.path ? "bg-white border-emerald-100/60 hover:border-emerald-900 shadow-sm" : "bg-rose-50/30 border-rose-100 opacity-60"
 )}>
 <div className="flex items-center gap-3">
 <item.icon size={16} className={item.path ? "text-emerald-500" : "text-rose-300"} />
 <span className="text-sm font-bold font-semibold text-xs">{item.label}</span>
 </div>
 {item.path ? (
 <a 
 href={`/storage/${item.path}`} 
 target="_blank" 
 className="mt-2 h-10 w-full bg-emerald-900 text-white flex items-center justify-center gap-2 text-sm font-bold font-semibold text-xs hover:bg-emerald-600 transition-colors" rel="noreferrer"
 >
 LIHAT BERKAS <ArrowRight size={12} />
 </a>
 ) : (
 <div className="mt-2 h-10 w-full border border-rose-200 border-dashed flex items-center justify-center text-rose-400 text-sm font-bold font-semibold text-xs">
 NOT_UPLOADED
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* RIGHT COLUMN: AUDIT LOGS & ACTION */}
 <div className="lg:col-span-4 space-y-12">
 {/* AUDIT ACTIONS */}
 <motion.section 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-emerald-900 p-10 text-white shadow-soft relative overflow-hidden"
 >
 <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
 <div className="relative z-10 space-y-8">
 <div className="flex items-center gap-4 border-b border-white/5 pb-6">
 <SearchCheck className="text-white" size={20} />
 <h3 className="text-sm font-bold font-semibold text-xs ">Audit Decision</h3>
 </div>
 
 <div className="space-y-4">
 <label htmlFor="review-notes" className="text-sm font-bold font-semibold text-xs text-white ">Catatan Pemeriksa (Reviewer Notes)</label>
 <textarea
 id="review-notes"
 value={data.review_notes}
 onChange={(e) => setData('review_notes', e.target.value)}
 className="w-full h-40 bg-white/5 border border-white/10 p-6 text-sm font-bold text-white tracking-tight placeholder:text-white/20 focus:border-emerald-900 focus:ring-0 transition-all"
 placeholder="Tuliskan instruksi revisi atau alasan penolakan berkas..."
 />
 </div>

 <div className="p-6 bg-white/5 border border-white/5 space-y-4">
 <div className="flex items-center gap-3">
 <Info size={14} className="text-amber-400" />
 <span className="text-sm font-bold font-semibold text-xs text-amber-400">Peringatan Audit</span>
 </div>
 <p className="text-sm font-bold text-slate-300/60 leading-relaxed ">
 Pastikan link video aktif dan artikel ilmiah sudah sesuai dengan template prodi masing-masing sebelum melakukan approval final.
 </p>
 </div>
 </div>
 </motion.section>

 {/* TELEMETRY DATA */}
 <div className="bg-white border border-emerald-100/60 p-10 shadow-sm space-y-8">
 <div className="flex items-center gap-4 text-black font-bold text-sm font-semibold text-xs border-b border-emerald-100/60 pb-6">
 <Activity className="text-emerald-500" size={16} />
 AUDIT TELEMETRY
 </div>
 <div className="space-y-6">
 {[
 { label: 'Ketua Unit', value: report.mahasiswa?.nama, icon: User },
 { label: 'ID_NIM', value: report.mahasiswa?.nim, icon: Fingerprint },
 { label: 'Kelompok', value: report.kelompok?.nama_kelompok, icon: Users },
 { label: 'Supervisor', value: report.kelompok?.dpl?.user?.name, icon: ShieldCheck },
 { label: 'Timestamp', value: report.submitted_at, icon: Calendar },
 { label: 'Reviewer', value: report.reviewer?.name || 'WAITING_ASSIGNMENT', icon: SearchCheck },
 ].map((item, i) => (
 <div key={i} className="flex items-center justify-between group">
 <div className="flex items-center gap-3">
 <item.icon size={12} className="text-emerald-200 group-hover:text-emerald-500 transition-colors" />
 <span className="text-sm font-bold text-emerald-200 font-semibold text-xs group-hover:text-black transition-colors">{item.label}</span>
 </div>
 <span className="text-sm font-bold text-black font-bold text-center truncate max-w-[150px]">{item.value || '-'}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
