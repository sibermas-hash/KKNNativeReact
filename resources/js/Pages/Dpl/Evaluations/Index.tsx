import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';

interface GroupWithStudents {
 id: number;
 name: string;
 period_name: string;
 students: Array<{
 id: number;
 nim: string;
 name: string;
 }>;
}

interface EvaluationRow {
 id: number;
 student: {
 name: string;
 nim: string;
 };
 group: {
 name: string;
 };
 total_score?: number | null;
 grade?: string | null;
}

interface Props {
 groups: GroupWithStudents[];
 evaluations: EvaluationRow[];
 dplWeights: {
 final_report: number;
 execution: number;
 article: number;
 };
}

export default function DplEvaluationsPage({ groups, evaluations, dplWeights }: Props) {
 const manualForm = useForm({
 group_id: '',
 student_id: '',
 evaluator_type: 'dpl',
 notes: '',
 items: [
 { criterion: 'Laporan Akhir', score: '', weight: dplWeights.final_report },
 { criterion: 'Pelaksanaan Program', score: '', weight: dplWeights.execution },
 { criterion: 'Artikel Ilmiah', score: '', weight: dplWeights.article },
 ],
 });

 const importForm = useForm({
 group_id: '',
 file: null as File | null,
 });

 const selectedGroup = groups.find((group) => String(group.id) === manualForm.data.group_id);
 const students = selectedGroup?.students ?? [];

 return (
 <AppLayout title="Evaluasi Mahasiswa">
 <Head title="Evaluasi Mahasiswa" />

 <div className="space-y-8">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Evaluasi Mahasiswa</h1>
 <p className="mt-2 text-sm text-slate-500">
 Input nilai manual atau impor dari Excel untuk komponen penilaian DPL pada kelompok yang Anda dampingi.
 </p>
 </section>

 <section className="grid gap-6 lg:grid-cols-2">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Input Nilai DPL</h2>
 <form
 className="mt-4 space-y-4"
 onSubmit={(event) => {
 event.preventDefault();
 manualForm.post('/dpl/evaluations');
 }}
 >
 <div>
 <label htmlFor="group_id" className="mb-1 block text-sm font-medium text-slate-700">
 Kelompok
 </label>
 <select
 id="group_id"
 value={manualForm.data.group_id}
 onChange={(event) => {
 manualForm.setData('group_id', event.target.value);
 manualForm.setData('student_id', '');
 }}
 className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
 required
 >
 <option value="">Pilih kelompok</option>
 {groups.map((group) => (
 <option key={group.id} value={group.id}>
 {group.name} - {group.period_name}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label htmlFor="student_id" className="mb-1 block text-sm font-medium text-slate-700">
 Mahasiswa
 </label>
 <select
 id="student_id"
 value={manualForm.data.student_id}
 onChange={(event) => manualForm.setData('student_id', event.target.value)}
 className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
 disabled={!manualForm.data.group_id}
 required
 >
 <option value="">Pilih mahasiswa</option>
 {students.map((student) => (
 <option key={student.id} value={student.id}>
 {student.nim} - {student.name}
 </option>
 ))}
 </select>
 </div>

 <div className="grid gap-4 md:grid-cols-3">
 {manualForm.data.items.map((item, index) => (
 <div key={item.criterion} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
 <p className="text-sm font-medium text-slate-800">{item.criterion}</p>
 <p className="mt-1 text-xs text-slate-500">Bobot {item.weight}%</p>
 <input
 type="number"
 min="0"
 max="100"
 value={item.score}
 onChange={(event) => {
 const items = [...manualForm.data.items];
 items[index].score = event.target.value;
 manualForm.setData('items', items);
 }}
 className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
 required
 />
 </div>
 ))}
 </div>

 <div>
 <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">
 Catatan
 </label>
 <textarea
 id="notes"
 rows={3}
 value={manualForm.data.notes}
 onChange={(event) => manualForm.setData('notes', event.target.value)}
 className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
 />
 </div>

 <button
 type="submit"
 disabled={manualForm.processing}
 className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
 >
 Simpan Evaluasi
 </button>
 </form>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Impor Nilai DPL dari Excel</h2>
 <p className="mt-2 text-sm text-slate-500">
 Template harus memuat kolom NIM, Laporan Akhir, Pelaksanaan, dan Artikel.
 </p>
 <form
 className="mt-4 space-y-4"
 onSubmit={(event) => {
 event.preventDefault();
 importForm.post('/dpl/evaluations/validate-import', { forceFormData: true });
 }}
 >
 <div>
 <label htmlFor="import_group_id" className="mb-1 block text-sm font-medium text-slate-700">
 Kelompok
 </label>
 <select
 id="import_group_id"
 value={importForm.data.group_id}
 onChange={(event) => importForm.setData('group_id', event.target.value)}
 className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
 required
 >
 <option value="">Pilih kelompok</option>
 {groups.map((group) => (
 <option key={group.id} value={group.id}>
 {group.name} - {group.period_name}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label htmlFor="import_file" className="mb-1 block text-sm font-medium text-slate-700">
          File Excel
        </label>
        <input
          id="import_file"
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => importForm.setData('file', event.target.files?.[0] ?? null)}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
          required
        />
      </div>
 <button
 type="submit"
 disabled={importForm.processing}
 className="rounded-lg border border-slate-300 bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
 >
 Validasi File
 </button>
 </form>
 </div>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <h2 className="text-lg font-semibold text-slate-900">Riwayat Evaluasi</h2>
 </div>
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Mahasiswa</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Kelompok</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Nilai</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Nilai</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {evaluations.length > 0 ? (
 evaluations.map((evaluation) => (
 <tr key={evaluation.id}>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-slate-900">{evaluation.student.name}</p>
 <p className="text-xs text-slate-500">{evaluation.student.nim}</p>
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">{evaluation.group.name}</td>
 <td className="px-6 py-4 text-sm text-slate-600">{evaluation.total_score ?? '-'}</td>
 <td className="px-6 py-4">
 <StatusBadge status={evaluation.grade?.toLowerCase() === 'd' ? 'ditolak' : 'disetujui'} className="mr-2" />
 <span className="text-sm font-medium text-slate-700">{evaluation.grade ?? '-'}</span>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
 Belum ada evaluasi yang tersimpan.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </section>
 </div>
 </AppLayout>
 );
}
