import { useEffect, useState } from 'react';
import axios from 'axios';
import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormSelect } from '@/Components/ui';

interface Group {
 id: number;
 code: string;
 name: string;
 lecturer?: {
 user?: {
 name: string;
 };
 };
}

interface StudentOption {
 id: number;
 name: string;
 email: string;
 username: string;
 nim?: string;
}

interface Props {
 groups: Group[];
}

export default function AdminGradesIndex({ groups }: Props) {
 const { data, setData, post, processing, reset, errors } = useForm({
 kelompok_id: '',
 student_id: '',
 execution_score: '',
 article_score: '',
 discipline_score: '',
 attitude_score: '',
 });

 const [students, setStudents] = useState<StudentOption[]>([]);
 const [loadingStudents, setLoadingStudents] = useState(false);

 useEffect(() => {
 const fetchStudents = async () => {
 if (!data.kelompok_id) {
 setStudents([]);
 setData('student_id', '');
 return;
 }

 setLoadingStudents(true);

 try {
 const response = await axios.get(route('admin.groups.students', data.kelompok_id));
 setStudents(response.data);
 } catch {
 setStudents([]);
 } finally {
 setLoadingStudents(false);
 }
 };

 void fetchStudents();
 }, [data.kelompok_id, setData]);

 return (
 <AppLayout title="Input Nilai Manual">
 <Head title="Input Nilai Manual" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Input Nilai Manual</h1>
 <p className="mt-2 text-sm text-slate-500">
 Gunakan halaman ini hanya untuk koreksi manual yang memang membutuhkan intervensi admin.
 </p>
 </section>

 <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
 <form
 onSubmit={(event) => {
 event.preventDefault();
 post(route('admin.grades.store'), {
 onSuccess: () => {
 reset('execution_score', 'article_score', 'discipline_score', 'attitude_score');
 },
 });
 }}
 className="rounded-lg border border-slate-200 bg-white p-8"
 >
 <div className="grid gap-6 md:grid-cols-2">
 <div>
 <label className="mb-2 block text-sm font-medium text-slate-700">Kelompok</label>
 <FormSelect
 value={data.kelompok_id}
 onChange={(event) => setData('kelompok_id', event.target.value)}
 error={errors.kelompok_id}
 className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
 >
 <option value="">Pilih kelompok</option>
 {groups.map((group) => (
 <option key={group.id} value={group.id}>
 {group.code || group.name}
 {group.lecturer?.user?.name ? ` - DPL: ${group.lecturer.user.name}` : ''}
 </option>
 ))}
 </FormSelect>
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium text-slate-700">Mahasiswa</label>
 <FormSelect
 value={data.student_id}
 onChange={(event) => setData('student_id', event.target.value)}
 error={errors.student_id}
 disabled={!data.kelompok_id || loadingStudents}
 className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
 >
 <option value="">{loadingStudents ? 'Memuat mahasiswa...' : 'Pilih mahasiswa'}</option>
 {students.map((student) => (
 <option key={student.id} value={student.id}>
 {student.nim ? `${student.nim} - ` : ''}
 {student.name}
 </option>
 ))}
 </FormSelect>
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium text-slate-700">Nilai Pelaksanaan</label>
 <FormInput
 type="number"
 min="0"
 max="100"
 value={data.execution_score}
 onChange={(event) => setData('execution_score', event.target.value)}
 error={errors.execution_score}
 className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium text-slate-700">Nilai Artikel</label>
 <FormInput
 type="number"
 min="0"
 max="100"
 value={data.article_score}
 onChange={(event) => setData('article_score', event.target.value)}
 error={errors.article_score}
 className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium text-slate-700">Nilai Kedisiplinan</label>
 <FormInput
 type="number"
 min="0"
 max="100"
 value={data.discipline_score}
 onChange={(event) => setData('discipline_score', event.target.value)}
 error={errors.discipline_score}
 className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
 />
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium text-slate-700">Nilai Sikap</label>
 <FormInput
 type="number"
 min="0"
 max="100"
 value={data.attitude_score}
 onChange={(event) => setData('attitude_score', event.target.value)}
 error={errors.attitude_score}
 className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
 />
 </div>
 </div>

 <div className="mt-6 flex justify-end">
 <button
 type="submit"
 disabled={processing}
 className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
 >
 Simpan Nilai Manual
 </button>
 </div>
 </form>

 <aside className="rounded-lg border border-amber-200 bg-amber-50 p-8">
 <h2 className="text-lg font-semibold text-amber-900">Catatan</h2>
 <ul className="mt-4 space-y-3 text-sm leading-6 text-amber-800">
 <li>Gunakan fitur ini hanya jika koreksi tidak bisa dilakukan dari jalur penilaian normal.</li>
 <li>Nilai akan dihitung ulang otomatis setelah disimpan.</li>
 <li>Pastikan kelompok dan mahasiswa yang dipilih sudah benar sebelum menyimpan.</li>
 </ul>
 </aside>
 </section>
 </div>
 </AppLayout>
 );
}
