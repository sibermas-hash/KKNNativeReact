import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect, StatusBadge } from '@/Components/ui';

interface StudentGrade {
 id: number;
 user: {
 name: string;
 nim: string;
 };
 final_report_score: number | null;
 execution_score: number | null;
 article_score: number | null;
 discipline_score: number | null;
 attitude_score: number | null;
 workshop_score: number | null;
 administration_score: number | null;
 total_score: number | null;
 letter_grade: string | null;
 is_finalized: boolean;
}

interface Summary {
 total_students: number;
 fully_graded: number;
 average_score: number;
 students: StudentGrade[];
}

interface GroupOption {
 id: number;
 code?: string;
 name: string;
}

interface Props {
 summary: Summary | null;
 groups: GroupOption[];
 selectedGroupId: number | string | null;
 error?: string;
}

export default function AdminGradingIndex({ summary, groups, selectedGroupId, error }: Props) {
 return (
 <AppLayout title="Evaluasi dan Nilai">
 <Head title="Evaluasi dan Nilai" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-slate-900">Evaluasi dan Nilai</h1>
 <p className="mt-2 text-sm text-slate-500">
 Pantau ringkasan penilaian kelompok dari berbagai komponen penilaian KKN.
 </p>
 </div>

 <div className="w-full max-w-xs">
 <FormSelect
 value={selectedGroupId ?? ''}
 onChange={(event) => {
 const value = event.target.value;
 router.get('/admin/evaluations', value ? { group_id: value } : {}, {
 preserveState: true,
 preserveScroll: true,
 replace: true,
 });
 }}
 className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
 >
 <option value="">Pilih kelompok</option>
 {groups.map((group) => (
 <option key={group.id} value={group.id}>
 {group.code || group.name}
 </option>
 ))}
 </FormSelect>
 </div>
 </div>
 </section>

 {!summary ? (
 <section className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-sm text-amber-800">
 {error || 'Pilih kelompok untuk melihat ringkasan penilaian.'}
 </section>
 ) : (
 <>
 <section className="grid gap-4 md:grid-cols-3">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <p className="text-sm text-slate-500">Total Mahasiswa</p>
 <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.total_students}</p>
 </div>
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <p className="text-sm text-slate-500">Sudah Dinilai</p>
 <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.fully_graded}</p>
 </div>
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <p className="text-sm text-slate-500">Rata-rata Nilai</p>
 <p className="mt-2 text-3xl font-semibold text-slate-900">
 {Number(summary.average_score || 0).toFixed(2)}
 </p>
 </div>
 </section>

 <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
 <div className="border-b border-slate-200 px-6 py-4">
 <h2 className="text-lg font-semibold text-slate-900">Ringkasan Mahasiswa</h2>
 </div>

 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Mahasiswa</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Komponen DPL</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Komponen Mitra</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Komponen Admin</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Nilai Akhir</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {summary.students.length > 0 ? (
 summary.students.map((student) => (
 <tr key={student.id}>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-slate-900">{student.user.name}</p>
 <p className="text-xs text-slate-500">{student.user.nim}</p>
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">
 Laporan: {student.final_report_score ?? '-'}
 <br />
 Pelaksanaan: {student.execution_score ?? '-'}
 <br />
 Artikel: {student.article_score ?? '-'}
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">
 Kedisiplinan: {student.discipline_score ?? '-'}
 <br />
 Sikap: {student.attitude_score ?? '-'}
 </td>
 <td className="px-6 py-4 text-sm text-slate-600">
 Workshop: {student.workshop_score ?? '-'}
 <br />
 Administrasi: {student.administration_score ?? '-'}
 </td>
 <td className="px-6 py-4 text-sm text-slate-700">
 <p className="font-semibold">{student.total_score ?? '-'}</p>
 <p className="text-xs text-slate-500">{student.letter_grade ?? '-'}</p>
 </td>
 <td className="px-6 py-4">
 <StatusBadge status={student.is_finalized ? 'disetujui' : 'submitted'} />
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
 Belum ada data nilai untuk kelompok ini.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </section>
 </>
 )}
 </div>
 </AppLayout>
 );
}
