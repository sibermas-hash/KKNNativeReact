import { useState } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import {
 Calendar,
 User,
 Users,
 MapPin, 
 FileText, 
 Image as ImageIcon,
 ChevronLeft,
 CheckCircle2,
 AlertCircle,
 Navigation,
 
 Activity,
 MessageSquare,
 ExternalLink,
 RefreshCw,
} from 'lucide-react';
import type { PageProps } from '@/types';

interface Props extends PageProps {
 report: {
 id: number;
 date: string;
 title: string;
 activity: string;
 output?: string;
 latitude?: number | null;
 longitude?: number | null;
 status: string;
 review_notes?: string;
 student: { name: string; nim: string };
 group: { name: string; location?: { village_name: string } };
 file_kegiatan: { id: number; file_name: string; file_path: string }[];
 };
}

export default function DplDailyReportShow({ report }: Props) {
 const [showRevision, setShowRevision] = useState(false);
 const approveForm = useForm({});
 const revisionForm = useForm({ revision_notes: '' });

 const canReview = report.status === 'submitted' || report.status === 'revision';
 const hasCoordinates = report.latitude && report.longitude;

 const gmapsUrl = hasCoordinates 
 ? `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`
 : null;

 return (
 <AppLayout title="Review Laporan Harian">
 <Head title="Verifikasi Absensi Mahasiswa" />
 
 <div className="max-w-5xl mx-auto space-y-6 pb-20">
 {/* Tactical Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
 <div className="flex items-center gap-6">
 <Link 
 href="/dpl/daily-reports"
 className="h-14 w-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 hover:text-primary hover:border-primary"
 >
 <ChevronLeft className="h-6 w-6" />
 </Link>
 <div>
 <div className="flex items-center gap-2 mb-2">
 <Zap className="h-3.5 w-3.5 text-primary" />
 <span className="text-[10px] font-semibold text-slate-400 ">Siklus Verifikasi Lapangan</span>
 </div>
 <h1 className="text-3xl font-extrabold text-slate-900 ">
 Review <span className="text-primary">Laporan</span> Harian
 </h1>
 </div>
 </div>
 <StatusBadge status={report.status} className="px-6 py-3 rounded-lg text-xs font-semibold border-none" />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 {/* Main Content Card */}
 <section className="bg-white rounded-lg border border-slate-100 p-10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-12 text-slate-900 pointer-events-none group-transition-transform[2000ms]">
 <FileText className="h-64 w-64" />
 </div>

 <div className="relative z-10 space-y-6">
 <div className="space-y-4 border-b border-slate-200 pb-8">
 <p className="text-[10px] font-semibold text-slate-400 ">Identitas Kegiatan</p>
 <h2 className="text-3xl font-semibold text-slate-900 leading-normal underline decoration-primary/10 underline-offset-8">
 {report.title}
 </h2>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <MetaInfo icon={Calendar} label="Siklus Tanggal" value={report.date} />
 <MetaInfo icon={User} label="Identitas Mahasiswa" value={`${report.student.name} (${report.student.nim})`} />
 <MetaInfo icon={Users} label="Unit Kelompok" value={report.group.name} />
 <MetaInfo icon={MapPin} label="Sektor Penugasan" value={report.group.location?.village_name ?? 'Belum ditetapkan'} />
 </div>

 <div className="space-y-8 pt-10 border-t border-slate-200">
 <div className="space-y-4">
 <h3 className="text-[10px] font-semibold text-primary flex items-center gap-2">
 <Activity className="w-4 h-4" /> Uraian Operasional
 </h3>
 <p className="text-sm font-medium text-slate-600 leading-normal bg-slate-50 p-8 rounded-lg
 {report.activity}
 </p>
 </div>

 {report.output && (
 <div className="space-y-4">
 <h3 className="text-[10px] font-semibold text-emerald-600 flex items-center gap-2">
 <Zap className="w-4 h-4" /> Hasil / Output
 </h3>
 <p className="text-sm font-semibold text-slate-900 leading-normal 
 {report.output}
 </p>
 </div>
 )}
 </div>
 </div>
 </section>

 {/* Attachments Section */}
 {report.file_kegiatan.length > 0 && (
 <section className="bg-white rounded-lg border border-slate-100 p-10">
 <h3 className="text-xs font-semibold text-slate-900 mb-8 flex items-center gap-3">
 <ImageIcon className="w-5 h-5 text-slate-400" /> Bukti Dokumentasi Lapangan
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 {report.file_kegiatan.map((f) => (
 <a
 key={f.id}
 href={`/storage/${f.file_path}`}
 target="_blank"
 rel="noreferrer"
 className="group flex items-center gap-5 p-5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-primary/30
 >
 <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white
 <FileText className="h-6 w-6" />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] font-semibold text-slate-900 truncate">{f.file_name}</p>
 <p className="text-[9px] text-sm text-slate-400 mt-1">Buka Dokumen <ExternalLink className="inline-block w-2.5 h-2.5 ml-1" /></p>
 </div>
 </a>
 ))}
 </div>
 </section>
 )}
 </div>

 <aside className="space-y-8">
 {/* Geotagging Verification Card */}
 <section className="bg-slate-900 rounded-lg p-10 border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 opacity-10 text-primary group-transition-transform pointer-events-none">
 <Navigation className="h-32 w-32" />
 </div>
 <h3 className="text-[10px] font-semibold mb-10 flex items-center gap-3 text-slate-400">
 <span className="flex h-2 w-2 rounded-lg bg-primary" />
 Autentikasi Geotag
 </h3>
 
 {hasCoordinates ? (
 <div className="space-y-8 relative z-10">
 <div className="p-6 rounded-lg bg-white/5 border border-slate-200
 <p className="text-[9px] font-semibold text-primary mb-3">Koordinat GPS Terkunci</p>
 <div className="space-y-2">
 <p className="text-xs font-semibold text-white">LAT: {report.latitude}</p>
 <p className="text-xs font-semibold text-white">LNG: {report.longitude}</p>
 </div>
 </div>
 <a
 href={gmapsUrl!}
 target="_blank"
 rel="noreferrer"
 className="w-full flex items-center justify-center gap-4 py-5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-darkactive:"
 >
 <MapPin className="w-4 h-4" /> Verifikasi di Peta
 </a>
 </div>
 ) : (
 <div className="py-10 text-center opacity-50">
 <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-4" />
 <p className="text-[9px] font-semibold text-slate-400 Lokasi Tidak Ditemukan</p>
 </div>
 )}
 </section>

 {/* Review Action Card */}
 {canReview && (
 <section className="bg-white rounded-lg border border-slate-100 p-10">
 <h3 className="text-xs font-semibold text-slate-900 mb-8 border-b border-slate-200 pb-6">Otoritas Verifikasi</h3>
 <div className="space-y-5">
 <button 
 onClick={() => approveForm.patch(`/dpl/daily-reports/${report.id}/approve`)}
 disabled={approveForm.processing}
 className="w-full flex items-center justify-center gap-4 py-5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600active:"
 >
 {approveForm.processing ? <RefreshCw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
 Setujui Laporan
 </button>
 <button 
 onClick={() => setShowRevision(!showRevision)}
 className="w-full flex items-center justify-center gap-4 py-5 bg-white border border-slate-200 text-slate-400 rounded-lg text-xs font-semibold hover:border-amber-200 hover:text-amber-600"
 >
 <MessageSquare className="w-4 h-4" />
 Minta Revisi
 </button>
 </div>

 {showRevision && (
 <div className="mt-8 space-y-6">
 <textarea
 placeholder="Tulis instruksi revisi untuk mahasiswa..."
 value={revisionForm.data.revision_notes}
 onChange={(e) => revisionForm.setData('revision_notes', e.target.value)}
 rows={4}
 className="w-full bg-slate-50 border-slate-200 rounded-lg p-6 text-xs text-sm text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none
 />
 <button 
 onClick={() => revisionForm.patch(`/dpl/daily-reports/${report.id}/revision`)}
 disabled={revisionForm.processing}
 className="w-full py-4 bg-amber-500 text-white rounded-lg text-[9px] font-semibold hover:bg-amber-600"
 >
 Kirim Instruksi Revisi
 </button>
 </div>
 )}
 </section>
 )}

 {report.review_notes && (
 <section className="bg-amber-50 rounded-lg border border-amber-100 p-8">
 <div className="flex items-center gap-3 mb-4">
 <AlertCircle className="w-4 h-4 text-amber-600" />
 <h4 className="text-[10px] font-semibold text-amber-800 Revisi Aktif</h4>
 </div>
 <p className="text-[11px] text-sm text-amber-700 leading-normal 
 </section>
 )}
 </aside>
 </div>
 </div>
 </AppLayout>
 );
}

function MetaInfo({ icon: Icon, label, value }: any) {
 return (
 <div className="flex items-start gap-4 group">
 <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
 <Icon className="h-5 w-5" />
 </div>
 <div className="min-w-0">
 <p className="text-[9px] font-semibold text-slate-400 mb-1">{label}</p>
 <p className="text-xs font-semibold text-slate-900 truncate">{value}</p>
 </div>
 </div>
 );
}
