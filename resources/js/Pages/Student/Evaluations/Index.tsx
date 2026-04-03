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
            
            <div className="space-y-12 pb-24">
                {/* Clean Professional Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase  leading-none italic decoration-slate-100">Transkrip Penilaian Lapangan</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900  uppercase italic leading-none">
                            Hasil <span className="text-primary italic">Evaluasi</span> & Nilai
                        </h1>
                        <p className="text-slate-500 text-sm mt-4 font-medium italic opacity-70 leading-relaxed max-w-xl">
                            Lihat rincian penilaian kinerja Anda selama masa bakti KKN. Nilai akhir ditentukan berdasarkan akumulasi poin dari DPL dan Mitra.
                        </p>
                    </div>

                    <div className="flex items-center gap-5 bg-white p-6rounded-lg border border-slate-100 min-w-[240px]">
                        <div className="p-4 bg-primary/10 rounded-lg text-primary border border-primary/20">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase  block mb-1 italic">Status Akademik</span>
                            <span className="text-xs font-black text-slate-900 uppercase italic  leading-none">Evaluasi Final Aktif</span>
                        </div>
                    </div>
                </div>

                {evaluations.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-100 p-32 text-center group overflow-hidden relative italic">
                         <div className="absolute top-0 left-0 w-full h-full opacity-[0.01] text-slate-900 pointer-events-none group-hover:scale-105 transition-transform[2000ms]">
                            <GraduationCap className="h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div className="relative z-10">
                            <div className="inline-flex p-10 bg-slate-50 rounded-full border border-slate-100 mb-8
                                <Award className="h-16 w-16 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900  uppercase italic mb-3 leading-none">Nilai Belum Dirilis</h3>
                            <p className="text-slate-400 font-bold uppercase  text-[10px] max-w-sm mx-auto leading-relaxed opacity-70">
                                Dosen Pembimbing Lapangan (DPL) sedang melakukan sinkronisasi nilai akhir Anda ke dalam basis data universitas.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {evaluations.map((ev) => (
                            <div key={ev.id} className="group bg-white rounded-lg border border-slate-100 overflow-hidden transition-all hover:shadow-2xl hover:border-primary/20 relative">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-slate-900 pointer-events-none group-hover:rotate-12 group-hover:scale-110 transition-transform">
                                    <Sparkles className="h-40 w-40" />
                                </div>
                                
                                <div className="p-10 pb-4 relative z-10">
                                    <div className="flex items-center justify-between mb-10 italic font-black">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-lg bg-slate-900 text-primary flex items-center justify-center
                                                <ClipboardCheck className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase italic  leading-none leading-none">Penilaian {ev.evaluator_type === 'dpl' ? 'DPL' : ev.evaluator_type}</h3>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase  mt-1.5 block opacity-60">{ev.group.name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-slate-900 italic  tabular-nums leading-none">{ev.total_score ?? '00'}</p>
                                            <div className={clsx(
                                                "mt-3 inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase 
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
                                        <div className="grid grid-cols-3 text-[10px] font-black text-slate-300 uppercase  px-4 italic opacity-40">
                                            <span className="col-span-1">Metrik Penilaian</span>
                                            <span className="text-center">Bobot</span>
                                            <span className="text-right">Skor</span>
                                        </div>
                                        <div className="space-y-2">
                                            {ev.items.map((item, i) => (
                                                <div key={i} className="grid grid-cols-3 items-center p-5 bg-slate-50 border border-slate-100 rounded-lg group/item hover:bg-white hover:border-primary/20 transition-all italic">
                                                    <span className="text-[11px] font-black text-slate-900 uppercase  leading-none group-hover/item:text-primary transition-colors">{item.criterion}</span>
                                                    <span className="text-center text-[10px] font-bold text-slate-400 uppercase  tabular-nums">{item.weight}%</span>
                                                    <span className="text-right text-base font-black text-slate-900 italic tabular-nums">{item.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {ev.notes && (
                                        <div className="mt-8 p-6 bg-slate-900rounded-lg relative overflow-hidden group/notes italic">
                                            <div className="absolute inset-0 bg-white from-primary/10 to-transparent pointer-events-none" />
                                            <div className="relative z-10 flex gap-4">
                                                <Info className="h-5 w-5 text-primary shrink-0 opacity-60" />
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-500 uppercase  mb-2 italic">Catatan Penilai:</p>
                                                    <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase italic opacity-80">"{ev.notes}"</p>
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
                    <p className="text-[10px] font-black text-slate-300 uppercase  italic leading-none">
                        Pusat Evaluasi Akademik • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
