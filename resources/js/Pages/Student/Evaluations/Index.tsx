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
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Hasil Evaluasi</h1>
 <p className="mt-2 text-sm text-slate-500">
 Pantau nilai dan catatan evaluasi yang sudah masuk untuk aktivitas KKN Anda.
 </p>
 </section>

 {evaluations.length > 0 ? (
 <div className="grid gap-6 lg:grid-cols-2">
 {evaluations.map((evaluation) => {
 const items = evaluation.item_evaluasi ?? evaluation.item ?? [];
 return (
 <section key={evaluation.id} className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex items-start justify-between gap-4">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">
 Evaluasi {evaluation.evaluator_type || '-'}
 </h2>
 <p className="mt-1 text-sm text-slate-500">
 {evaluation.kelompok?.nama_kelompok || 'Kelompok tidak diketahui'}
 </p>
 </div>
 <div className="text-right">
 <p className="text-2xl font-semibold text-slate-900">{evaluation.total_score ?? '-'}</p>
 <p className="mt-1 text-sm font-medium text-slate-500">Grade {evaluation.grade || '-'}</p>
 </div>
 </div>

 <div className="mt-6 space-y-3">
 {items.length > 0 ? (
 items.map((item, index) => (
 <div
 key={item.id ?? index}
 className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg border border-slate-200 px-4 py-3"
 >
 <span className="text-sm font-medium text-slate-800">{item.criterion || '-'}</span>
 <span className="text-sm text-slate-500">{item.weight ?? 0}%</span>
 <span className="text-sm font-semibold text-slate-900">{item.score ?? 0}</span>
 </div>
 ))
 ) : (
 <p className="text-sm text-slate-500">Belum ada rincian item evaluasi.</p>
 )}
 </div>

 {evaluation.notes && (
 <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
 <h3 className="text-sm font-semibold text-slate-900">Catatan penilai</h3>
 <p className="mt-2 text-sm text-slate-600">{evaluation.notes}</p>
 </div>
 )}
 </section>
 );
 })}
 </div>
 ) : (
 <section className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
 Nilai belum tersedia.
 </section>
 )}
 </div>
 </AppLayout>
 );
}
