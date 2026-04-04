import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { 
 Award, 
 Info, 
 Sparkles, 
 ClipboardCheck,
 GraduationCap,
 Trophy,
} from 'lucide-react';
import { clsx } from 'clsx';

interface EvalItem {
 criterion: string;
 score: number;
 weight: number;
}

interface EvalData {
 id: number;
 evaluator_type: string;
 total_score?: number;
 grade?: string;
 notes?: string;
 group: { name: string };
 items: EvalItem[];
}

interface Props extends PageProps {
 evaluations: EvalData[];
}

export default function StudentEvaluationsIndex({ evaluations }: Props) {
 return (
 <AppLayout title="Hasil Evaluasi">
 <Head title="Pusat Nilai & Sertifikasi" />
 
 <div className="space-y-8 pb-24">
 {/* Clean Professional Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-200">
 <div>
 <div className="flex items-center gap-2 mb-4">
 <Award className="h-4 w-4 text-primary" />
 <span className="text-xs text-sm text-slate-400 decoration-slate-100">Transkrip Penilaian Lapangan</span>
 </div>
 <h1 className="text-4xl font-extrabold text-slate-900 ">
 Hasil <span className="text-primary">Evaluasi</span> & Nilai
 </h1>
 <p className="text-slate-500 text-sm mt-4 font-medium opacity-50 leading-normal max-w-xl">
 Lihat rincian penilaian kinerja Anda selama masa bakti KKN. Nilai akhir ditentukan berdasarkan akumulasi poin dari DPL dan Mitra.
 </p>
 </div>

 <div className="flex items-center gap-5 bg-white p-6rounded-lg border border-slate-200 min-w-[240px]">
 <div className="p-4 bg-primary/10 rounded-lg text-primary border border-primary">
 <Trophy className="h-6 w-6" />
 </div>
 <div>
 <span className="text-xs text-sm text-slate-400 block mb-1">Status Akademik</span>
 <span className="text-xs font-semibold text-slate-900 ">Evaluasi Final Aktif</span>
 </div>
 </div>
 </div>

 {evaluations.length === 0 ? (
 <div className="bg-white rounded-lg border border-slate-100 p-32 text-center group overflow-hidden relative">
 <div className="absolute top-0 left-0 w-full h-full text-slate-900 pointer-events-none group-transition-transform[2000ms]">
 <GraduationCap className="h-[400px] w-full -translate-x-1/2/2" />
 </div>
 <div className="relative z-10">
 <div className="inline-flex p-10 bg-slate-50 rounded-lg border border-slate-200 mb-8
 <Award className="h-16 w-16 text-slate-200" />
 </div>
 <h3 className="text-2xl font-semibold text-slate-900 mb-3">Nilai Belum Dirilis</h3>
 <p className="text-slate-400 text-sm text-xs max-w-sm mx-auto leading-normal opacity-50">
 Dosen Pembimbing Lapangan (DPL) sedang melakukan sinkronisasi nilai akhir Anda ke dalam basis data universitas.
 </p>
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {evaluations.map((ev) => (
 <div key={ev.id} className="group bg-white rounded-lg border border-slate-100 overflow-hidden hover:border-primary relative">
 <div className="absolute top-0 right-0 p-10 text-slate-900 pointer-events-none group-transition-transform">
 <Sparkles className="h-40 w-40" />
 </div>
 
 <div className="p-10 pb-4 relative z-10">
 <div className="flex items-center justify-between mb-10 font-semibold">
 <div className="flex items-center gap-4">
 <div className="h-14 w-14 rounded-lg bg-slate-900 text-primary flex items-center justify-center
 <ClipboardCheck className="h-7 w-7" />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-slate-900 ">Penilaian {ev.evaluator_type === 'dpl' ? 'DPL' : ev.evaluator_type}</h3>
 <span className="text-xs text-sm text-slate-400 mt-1.5 block opacity-50">{ev.group.name}</span>
 </div>
 </div>
 <div className="text-right">
 <p className="text-4xl font-semibold text-slate-900 ">{ev.total_score ?? '00'}</p>
 <div className={clsx(
 "mt-3 inline-flex px-4 py-1.5 rounded-lg text-xs font-semibold 
 ev.grade === 'A' || ev.grade === 'B' 
 ? "bg-emerald-500 text-white 
 : ev.grade === 'C' 
 ? "bg-amber-500 text-white 
 : "bg-slate-900 text-white
 )}>
 NILAI: {ev.grade ?? '...'}
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <div className="grid grid-cols-3 text-xs font-semibold text-slate-300 px-4 opacity-50">
 <span className="col-span-1">Metrik Penilaian</span>
 <span className="text-center">Bobot</span>
 <span className="text-right">Skor</span>
 </div>
 <div className="space-y-2">
 {ev.items.map((item, i) => (
 <div key={i} className="grid grid-cols-3 items-center p-5 bg-slate-50 border border-slate-200 rounded-lg group/item hover:bg-white hover:border-primary">
 <span className="text-sm font-semibold text-slate-900 group-hover/item:text-primary transition-colors">{item.criterion}</span>
 <span className="text-center text-xs text-sm text-slate-400 ">{item.weight}%</span>
 <span className="text-right text-base font-semibold text-slate-900">{item.score}</span>
 </div>
 ))}
 </div>
 </div>

 {ev.notes && (
 <div className="mt-8 p-6 bg-slate-900rounded-lg relative overflow-hidden group/notes">
 <div className="absolute inset-0 bg-whitepointer-events-none" />
 <div className="relative z-10 flex gap-4">
 <Info className="h-5 w-5 text-primary shrink-0 opacity-50" />
 <div>
 <p className="text-xs font-semibold text-slate-500 mb-2">Catatan Penilai:</p>
 <p className="text-xs text-sm text-slate-400 leading-normal opacity-75">"{ev.notes}"</p>
 </div>
 </div>
 </div>
 )}
 </div>
 <div className="h-1.5 w-full bg-slate-50 mt-10" />
 </div>
 ))}
 </div>
 )}
 
 <div className="text-center pt-8 opacity-20">
 <p className="text-xs font-semibold text-slate-300 ">
 Pusat Evaluasi Akademik • UIN SAIZU © 2024
 </p>
 </div>
 </div>
 </AppLayout>
 );
}
