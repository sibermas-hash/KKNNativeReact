import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface PreviewItem {
 id: number | null;
 nim: string;
 name: string;
 final_report_score: number;
 execution_score: number;
 article_score: number;
 status: 'READY' | 'NOT_IN_GROUP' | 'NOT_FOUND';
}

interface Props {
 preview: PreviewItem[];
 group: {
 id: number;
 name: string;
 period_name: string;
 };
 dplWeights: {
 final_report: number;
 execution: number;
 article: number;
 };
}

function statusLabel(status: PreviewItem['status']): string {
 if (status === 'READY') {
 return 'Siap diimpor';
 }

 if (status === 'NOT_IN_GROUP') {
 return 'Bukan anggota kelompok';
 }

 return 'NIM tidak ditemukan';
}

export default function ImportPreview({ preview, group, dplWeights }: Props) {
 const readyCount = preview.filter((item) => item.status === 'READY').length;
 const payloadRows = preview.map((item) => ({
 id: item.id,
 nim: item.nim,
 name: item.name,
 final_report_score: item.final_report_score,
 execution_score: item.execution_score,
 article_score: item.article_score,
 status: item.status,
 }));

 return (
 <AppLayout title="Pratinjau Impor Evaluasi">
 <Head title="Pratinjau Impor Evaluasi" />

 <div className="space-y-8">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Pratinjau Impor Evaluasi</h1>
 <p className="mt-2 text-sm text-slate-500">
 Kelompok: {group.name} · {group.period_name}
 </p>
 <p className="mt-1 text-sm text-slate-500">
 {readyCount} dari {preview.length} baris siap diimpor.
 </p>
 <p className="mt-1 text-sm text-slate-500">
 Bobot aktif: Laporan Akhir {dplWeights.final_report}%, Pelaksanaan {dplWeights.execution}%, Artikel {dplWeights.article}%.
 </p>
 </section>

 <section className="flex gap-4">
 <button
 type="button"
 onClick={() => window.history.back()}
 className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
 >
 Kembali
 </button>
 <button
 type="button"
 disabled={readyCount === 0}
 onClick={() => {
 router.post('/dpl/evaluations/import', {
 group_id: group.id,
 data: payloadRows,
 });
 }}
 className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
 >
 Lanjutkan Impor
 </button>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Mahasiswa</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Laporan Akhir</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Pelaksanaan</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Artikel</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {preview.map((item, index) => (
 <tr key={`${item.nim}-${index}`}>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-slate-900">{item.name}</p>
 <p className="text-xs text-slate-500">{item.nim}</p>
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">{item.final_report_score}</td>
 <td className="px-6 py-4 text-sm text-slate-600">{item.execution_score}</td>
 <td className="px-6 py-4 text-sm text-slate-600">{item.article_score}</td>
 <td className="px-6 py-4">
 <span
 className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
 item.status === 'READY'
 ? 'bg-emerald-50 text-emerald-700'
 : 'bg-rose-50 text-rose-700'
 }`}
 >
 {statusLabel(item.status)}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </section>
 </div>
 </AppLayout>
 );
}
