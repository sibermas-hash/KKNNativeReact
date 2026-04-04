import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { 
 FileText, 
 Calendar, 
 Edit3,
 AlertTriangle,
 ChevronRight,
 Sparkles,
 
 Search,
 History,
 Activity,
 PlusCircle,
} from 'lucide-react';
import type { PageProps } from '@/types';

interface ReportData {
 id: number;
 date: string;
 title: string;
 status: string;
 review_notes?: string;
}

interface Props extends PageProps {
 reports: { data: ReportData[] };
}

export default function StudentDailyReportsIndex({ reports }: Props) {
 const reportList = reports?.data ?? [];

 return (
 <AppLayout title="Laporan Harian">
 <Head title="Riwayat Laporan Harian" />
 
 <div className="space-y-8 pb-24">
 {/* Clean Professional Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-200">
 <div>
 <div className="flex items-center gap-2 mb-4">
 <History className="h-4 w-4 text-primary" />
 <span className="text-xs text-sm text-slate-400 ">Dokumentasi Pelaksanaan KKN</span>
 </div>
 <h1 className="text-4xl font-extrabold text-slate-900 ">
 Arsip <span className="text-primary">Laporan</span> Harian
 </h1>
 <p className="text-slate-500 text-sm mt-4 font-medium leading-normal max-w-xl">
 Kelola rekaman aktivitas harian Anda. Pastikan setiap laporan dikirim tepat waktu untuk proses validasi oleh DPL.
 </p>
 </div>

 <Link href="/student/daily-reports/create">
 <button className="h-16 px-6 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center gap-4 grouphover:bg-black">
 <PlusCircle className="h-5.5 w-5.5 text-primary " />
 Buat Laporan Baru
 </button>
 </Link>
 </div>

 {/* Registry Summary Metrics */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="bg-white border border-slate-200rounded-lg p-8 flex items-center gap-6 group hover:border-primary/10">
 <div className="h-14 w-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
 <FileText className="h-7 w-7" />
 </div>
 <div>
 <p className="text-xs font-semibold text-slate-400 mb-2">Total Dokumentasi</p>
 <p className="text-2xl font-semibold text-slate-900">{reportList.length} <span className="text-xs text-sm text-slate-300 ml-1">Laporan</span></p>
 </div>
 </div>
 
 {reportList.some(r => r.status === 'revision') ? (
 <div className="bg-rose-50 border border-rose-100rounded-lg p-8 flex items-center gap-6">
 <div className="h-14 w-14 rounded-lg bg-white border border-rose-100 flex items-center justify-center text-rose-500 font-semibold">
 <AlertTriangle className="h-7 w-7" />
 </div>
 <div>
 <p className="text-xs font-semibold text-rose-500 mb-2 Sistem</p>
 <p className="text-lg font-semibold text-rose-600 ">Perlu Revisi Segera</p>
 </div>
 </div>
 ) : (
 <div className="bg-emerald-50 border border-emerald-100rounded-lg p-8 flex items-center gap-6 group">
 <div className="h-14 w-14 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 font-semibold">
 <Activity className="h-7 w-7" />
 </div>
 <div>
 <p className="text-xs font-semibold text-emerald-500 mb-2 Sinkronisasi</p>
 <p className="text-lg font-semibold text-emerald-600 ">Data Terkini (OK)</p>
 </div>
 </div>
 )}

 <div className="bg-white border border-slate-200rounded-lg p-8 flex items-center gap-6 group overflow-hidden relative">
 <div className="absolute top-0 right-0 p-4 text-primary group-">
 <Zap className="h-20 w-20" />
 </div>
 <div className="h-14 w-14 rounded-lg bg-primary/10 border border-primary flex items-center justify-center text-primary font-semibold relative z-10
 <Zap className="h-7 w-7" />
 </div>
 <div className="relative z-10">
 <p className="text-xs font-semibold text-slate-400 mb-2">Koneksi Data</p>
 <p className="text-xs font-semibold text-slate-900 decoration-primary/30">Tersambung ke Server</p>
 </div>
 </div>
 </div>

 <div className="space-y-8">
 {reportList.length === 0 ? (
 <div className="bg-white rounded-lg border border-slate-100 p-32 text-center group overflow-hidden relative">
 <div className="absolute top-0 left-0 w-full h-full text-slate-900 pointer-events-none group-transition-transform[2000ms]">
 <Search className="h-[400px] w-full -translate-x-1/2/2" />
 </div>
 <div className="relative z-10">
 <div className="inline-flex p-10 bg-slate-50 rounded-lg border border-slate-200 mb-8">
 <FileText className="h-16 w-16 text-slate-200" />
 </div>
 <h3 className="text-2xl font-semibold text-slate-900 mb-3">Belum Ada Laporan</h3>
 <p className="text-slate-400 text-sm text-xs max-w-sm mx-auto leading-normal">Sistem belum mendeteksi catatan aktivitas untuk periode aktif ini.</p>
 </div>
 </div>
 ) : (
 reportList.map((r) => (
 <div 
 key={r.id} 
 className="group bg-white rounded-lg border border-slate-100 p-10 hover:border-primary relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6"
 >
 <div className="absolute top-0 right-0 p-12 text-slate-900 pointer-events-none group-transition-transform">
 <Sparkles className="h-40 w-40" />
 </div>
 
 <div className="flex flex-col md:flex-row md:items-center flex-1 gap-6 relative z-10">
 <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-lg min-w-[120px]">
 <Calendar className="h-6 w-6 text-slate-300 mb-2.5" />
 <p className="text-sm font-semibold text-slate-900 mb-1.5">{r.date.split(' ')[0]}</p>
 <p className="text-xs text-sm text-slate-400">{r.date.split(' ')[1]}</p>
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-3">
 <div className="h-1.5 w-1.5 rounded-lg bg-primary/40" />
 <p className="text-xs font-semibold text-slate-400 decoration-slate-100">ID Entri: #{r.id.toString().padStart(4, '0')}</p>
 </div>
 <h3 className="text-xl font-semibold text-slate-800 group-hover:text-primary transition-colors truncate leading-normal">{r.title}</h3>
 
 {r.review_notes && (
 <div className="mt-6 flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-lg slide-in-from-top-3">
 <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
 <div className="min-w-0">
 <p className="text-xs font-semibold text-rose-600 mb-1.5">Umpan Balik Auditor:</p>
 <p className="text-sm text-rose-800 leading-normal">"{r.review_notes}"</p>
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-6 relative z-10 shrink-0 border-t border-slate-200 md:border-t-0 pt-8 md:pt-0">
 <StatusBadge status={r.status} className="px-6 py-2 rounded-lg text-xs font-semibold border-none" />
 
 {r.status === 'revision' ? (
 <Link 
 href={`/student/daily-reports/${r.id}/edit`} 
 className="h-12 px-6 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700active:flex items-center gap-2"
 >
 <Edit3 className="h-4 w-4" />
 Perbaiki Laporan
 </Link>
 ) : (
 <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-white group-hover:border-primarycursor-default">
 <ChevronRight className="h-6 w-6" />
 </div>
 )}
 </div>
 </div>
 ))
 )}
 </div>

 <div className="text-center pt-8">
 <p className="text-xs font-semibold text-slate-300 ">
 Pusat Kendali Dokumen • UIN SAIZU © 2024
 </p>
 </div>
 </div>
 </AppLayout>
 );
}
