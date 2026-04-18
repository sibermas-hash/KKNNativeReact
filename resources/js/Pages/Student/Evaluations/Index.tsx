import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface EvaluationItem {
 id?: number;
 criterion?: string | null;
 score?: number | null;
 weight?: number | null;
}

interface EvaluationData {
 id: number;
 evaluator_type?: string | null;
 total_score?: number | null;
 grade?: string | null;
 notes?: string | null;
 kelompok?: {
 nama_kelompok?: string | null;
 } | null;
 item_evaluasi?: EvaluationItem[];
 item?: EvaluationItem[];
}

interface Props {
 evaluations: EvaluationData[];
}

export default function StudentEvaluationsIndex({ evaluations }: Props) {
 return (
 <AppLayout title="Hasil Evaluasi">
 <Head title="Hasil Evaluasi" />

  <div className="space-y-6">
  <section className="rounded-xl border border-emerald-50 bg-white p-8">
  <h1 className="text-2xl font-bold text-emerald-950 uppercase tracking-tight italic">Hasil Evaluasi</h1>
  <p className="mt-2 text-sm font-bold text-emerald-950 uppercase tracking-wider">
  Pantau nilai dan catatan evaluasi yang sudah masuk untuk aktivitas KKN Anda.
  </p>
  </section>

 {evaluations.length > 0 ? (
 <div className="grid gap-6 lg:grid-cols-2">
 {evaluations.map((evaluation) => {
 const items = evaluation.item_evaluasi ?? evaluation.item ?? [];
 return (
  <section key={evaluation.id} className="rounded-xl border border-emerald-50 bg-white p-6 shadow-sm">
 <div className="flex items-start justify-between gap-4">
 <div>
  <h2 className="text-lg font-bold text-emerald-950 uppercase italic">
 Evaluasi {evaluation.evaluator_type || '-'}
 </h2>
  <p className="mt-1 text-sm font-bold text-emerald-950 uppercase tracking-wider">
 {evaluation.kelompok?.nama_kelompok || 'Kelompok tidak diketahui'}
 </p>
 </div>
 <div className="text-right">
  <p className="text-2xl font-bold text-emerald-950 tabular-nums italic">{evaluation.total_score ?? '-'}</p>
  <p className="mt-1 text-sm font-bold text-emerald-600 uppercase tracking-widest">Grade {evaluation.grade || '-'}</p>
 </div>
 </div>

 <div className="mt-6 space-y-3">
 {items.length > 0 ? (
 items.map((item, index) => (
 <div
 key={item.id ?? index}
  className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg border border-emerald-50 px-4 py-3 bg-emerald-50/20"
 >
  <span className="text-sm font-bold text-emerald-950 uppercase italic">{item.criterion || '-'}</span>
  <span className="text-sm font-bold text-emerald-600 tabular-nums">{item.weight ?? 0}%</span>
  <span className="text-sm font-bold text-emerald-950 tabular-nums">{item.score ?? 0}</span>
 </div>
 ))
 ) : (
 <p className="text-sm text-emerald-950">Belum ada rincian item evaluasi.</p>
 )}
 </div>

 {evaluation.notes && (
  <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
  <h3 className="text-sm font-bold text-emerald-950 uppercase italic">Catatan penilai</h3>
  <p className="mt-2 text-sm font-bold text-emerald-950 leading-relaxed italic">{evaluation.notes}</p>
 </div>
 )}
 </section>
 );
 })}
 </div>
 ) : (
  <section className="rounded-xl border border-emerald-50 bg-white px-6 py-12 text-center text-sm font-bold text-emerald-950 uppercase tracking-widest italic shadow-sm">
 Nilai belum tersedia.
 </section>
 )}
 </div>
 </AppLayout>
 );
}
