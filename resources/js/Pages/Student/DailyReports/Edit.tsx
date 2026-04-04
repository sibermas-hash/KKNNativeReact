import { useForm, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
 ChevronLeft, 
 FileEdit, 
 Calendar, 
 Sparkles, 
 Activity, 
 
 RotateCcw,
 FileText,
 History,
 Info,
 CheckCircle2
} from 'lucide-react';
import type { PageProps } from '@/types';
import { clsx } from 'clsx';

interface Props extends PageProps {
 report: { id: number; date: string; title: string; activity: string; output?: string };
}

export default function StudentDailyReportEdit({ report }: Props) {
 const form = useForm({
 date: report.date,
 title: report.title,
 activity: report.activity,
 output: report.output ?? '',
 });

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 form.put(`/student/daily-reports/${report.id}`);
 }

 return (
 <AppLayout title="Edit Laporan">
 <Head title={`Kalibrasi Laporan #${report.id.toString().padStart(4, '0')}`} />
 
 <div className="max-w-4xl mx-auto space-y-6 pb-24">
 {/* Clean Professional Header */}
 <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-10 gap-8">
 <div className="space-y-5">
 <button 
 onClick={() => window.history.back()}
 className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-primarygroup"
 >
 <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
 Kembali ke Riwayat
 </button>
 <h1 className="text-4xl font-extrabold text-slate-900 ">
 Kalibrasi <span className="text-primary">Laporan</span>
 </h1>
 <p className="text-slate-500 text-sm font-medium opacity-50 flex items-center gap-2">
 <FileEdit className="h-4 w-4 text-primary/40" />
 Lakukan perbaikan pada entri laporan harian Anda sesuai catatan instruktur atau DPL.
 </p>
 </div>
 
 <div className="flex items-center gap-5 bg-white border border-slate-200 p-6rounded-lg min-w-[220px]">
 <div className="h-14 w-14 rounded-lg bg-slate-900 text-primary flex items-center justify-center
 <History className="h-7 w-7" />
 </div>
 <div>
 <span className="text-[9px] text-sm text-slate-400 block mb-1.5">ID Laporan</span>
 <span className="text-sm font-semibold text-slate-900 ">Entry #{report.id.toString().padStart(4, '0')}</span>
 </div>
 </div>
 </header>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2">
 <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-12 space-y-6 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-16 text-slate-900 pointer-events-none group-transition-transform[2000ms]">
 <FileText className="h-96 w-full" />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
 <div className="space-y-4">
 <label className="text-[11px] font-semibold text-slate-400 ml-2 block mb-1">Tanggal Kegiatan</label>
 <div className="relative group/input">
 <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within/input:text-primary transition-colors">
 <Calendar className="w-5 h-5" />
 </div>
 <input 
 type="date"
 value={form.data.date}
 onChange={(e) => form.setData('date', e.target.value)}
 className="w-full bg-slate-50 border-slate-200 rounded-lg pl-16 py-5 text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primaryoutline-none"
 required
 />
 </div>
 {form.errors.date && <p className="text-[10px] font-semibold text-rose-500 ml-2">{form.errors.date}</p>}
 </div>
 <div className="space-y-4">
 <label className="text-[11px] font-semibold text-slate-400 ml-2 block mb-1">Judul Aktivitas</label>
 <div className="relative group/input">
 <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within/input:text-primary transition-colors">
 <Sparkles className="w-5 h-5" />
 </div>
 <input 
 placeholder="JUDUL KEGIATAN..."
 value={form.data.title}
 onChange={(e) => form.setData('title', e.target.value)}
 className="w-full bg-slate-50 border-slate-200 rounded-lg pl-16 py-5 text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primaryoutline-none"
 required
 />
 </div>
 {form.errors.title && <p className="text-[10px] font-semibold text-rose-500 ml-2">{form.errors.title}</p>}
 </div>
 </div>

 <div className="space-y-4 relative z-10">
 <label className="text-[11px] font-semibold text-slate-400 ml-2 block mb-1">Deskripsi Kegiatan Lengkap</label>
 <textarea 
 rows={8}
 placeholder="Jelaskan secara detail proses, rintangan, dan pencapaian hari ini..."
 value={form.data.activity}
 onChange={(e) => form.setData('activity', e.target.value)}
 className="w-full bg-slate-50 border-slate-200 rounded-lg p-8 text-sm text-sm text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primaryleading-normal outline-none"
 required
 />
 {form.errors.activity && <p className="text-[10px] font-semibold text-rose-500 ml-2">{form.errors.activity}</p>}
 </div>

 <div className="space-y-4 relative z-10">
 <label className="text-[11px] font-semibold text-slate-400 ml-2 block mb-1">Luaran / Hasil (Opsional)</label>
 <input 
 placeholder="HASIL NYATA..."
 value={form.data.output}
 onChange={(e) => form.setData('output', e.target.value)}
 className="w-full bg-slate-50 border-slate-200 rounded-lg px-6 py-5 text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primaryoutline-none"
 />
 {form.errors.output && <p className="text-[10px] font-semibold text-rose-500 ml-2">{form.errors.output}</p>}
 </div>

 <div className="flex pt-8 relative z-10 border-t border-slate-200 justify-between items-center">
 <button 
 type="button"
 onClick={() => window.history.back()}
 className="text-[10px] font-semibold text-slate-400 hover:text-slate-950 transition-colors"
 >
 Batalkan Perubahan
 </button>
 <button 
 type="submit"
 disabled={form.processing}
 className="h-20 px-16 bg-slate-900 text-whiterounded-lg text-xs font-semibold hover:bg-blackactive:disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-5 group group/submit"
 >
 <RotateCcw className={clsx("w-6 h-6 text-primary", form.processing ? : "group-hover/submit:rotate-180")} />
 {form.processing ? 'Sedang Memproses...' : 'Kirim Ulang Laporan'}
 </button>
 </div>
 </form>
 </div>

 <aside className="space-y-12">
 <section className="bg-slate-900 rounded-lg p-12 border border-slate-900 text-white relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 text-primary group-transition-transform[2000ms] pointer-events-none">
 <Activity className="h-40 w-40" />
 </div>
 <h4 className="text-[11px] font-semibold mb-8 flex items-center gap-3">
 <Info className="h-4 w-4 text-primary" />
 Prosedur Revisi
 </h4>
 <div className="space-y-8 relative z-10">
 <div className="space-y-2">
 <p className="text-[10px] font-semibold text-primary Data</p>
 <p className="text-[11px] text-sm text-slate-400 leading-normal opacity-75">Pastikan seluruh data yang diperbaiki sudah sesuai dengan draf fisik atau instruksi dari supervisor lapangan.</p>
 </div>
 <div className="space-y-2 pt-6 border-t border-slate-200">
 <p className="text-[10px] font-semibold text-slate-400 ">Verifikasi Ulang</p>
 <p className="text-[11px] text-sm text-slate-400 leading-normal opacity-50">Laporan yang telah diperbaiki akan masuk kembali ke antrian verifikasi DPL untuk divalidasi statusnya.</p>
 </div>
 </div>
 </section>

 <div className="bg-white border border-slate-200 rounded-lg p-10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 text-slate-900 group-hover:rotate-12 transition-transform">
 <Zap className="h-[200px] w-full" />
 </div>
 <h4 className="text-[10px] font-semibold mb-10 flex items-center gap-3 text-slate-400">
 <CheckCircle2 className="h-4 w-4 text-emerald-500" />
 Integritas Laporan
 </h4>
 <p className="text-[12px] text-sm leading-normal relative z-10 text-slate-500 opacity-75 mb-6">
 Konsistensi antara data digital dan realita lapangan adalah metrik utama dalam penilaian akhir KKN Anda.
 </p>
 <div className="flex -space-x-3">
 {[1,2,3].map(i => (
 <div key={i} className="h-8 w-8 rounded-lg border-4 border-white bg-slate-100 transition-transform hover:translate-y-[-4px] hover:z-20 cursor-default" />
 ))}
 </div>
 </div>
 </aside>
 </div>

 <div className="text-center pt-8 opacity-20">
 <p className="text-[10px] font-semibold text-slate-300 ">
 Pusat Aktivitas • UIN SAIZU © 2024
 </p>
 </div>
 </div>
 </AppLayout>
 );
}
