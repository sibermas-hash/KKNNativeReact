import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';

export default function StudentWorkProgramCreate() {
 const form = useForm({
 title: '',
 description: '',
 objectives: '',
 target_participants: '',
 budget: '',
 });

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post('/student/work-programs');
 };

 return (
 <AppLayout title="Ajukan Program Kerja">
 <Head title="Ajukan Program Kerja" />

 <div className="mx-auto max-w-4xl space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <Link
 href="/student/work-programs"
 className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Kembali ke program kerja
 </Link>
 <h1 className="mt-4 text-2xl font-semibold text-slate-900">Ajukan Program Kerja</h1>
 <p className="mt-2 text-sm text-slate-500">
 Tambahkan rencana program kerja kelompok untuk diverifikasi DPL.
 </p>
 </section>

 <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="space-y-6">
 <FormInput
 label="Judul program kerja"
 required
 value={form.data.title}
 onChange={(event) => form.setData('title', event.target.value)}
 error={form.errors.title}
 />
 <FormTextarea
 label="Deskripsi"
 value={form.data.description}
 onChange={(event) => form.setData('description', event.target.value)}
 error={form.errors.description}
 />
 <FormTextarea
 label="Tujuan dan luaran"
 value={form.data.objectives}
 onChange={(event) => form.setData('objectives', event.target.value)}
 error={form.errors.objectives}
 />
 <div className="grid gap-6 md:grid-cols-2">
 <FormInput
 type="number"
 label="Target peserta"
 value={form.data.target_participants}
 onChange={(event) => form.setData('target_participants', event.target.value)}
 error={form.errors.target_participants}
 />
 <FormInput
 type="number"
 label="Anggaran"
 required
 value={form.data.budget}
 onChange={(event) => form.setData('budget', event.target.value)}
 error={form.errors.budget}
 />
 </div>
 </div>

 <div className="mt-6 flex justify-end gap-3">
 <Link
 href="/student/work-programs"
 className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Batal
 </Link>
 <button
 type="submit"
 disabled={form.processing}
 className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Menyimpan...' : 'Ajukan program kerja'}
 </button>
 </div>
 </form>
 </div>
 </AppLayout>
 );
}
