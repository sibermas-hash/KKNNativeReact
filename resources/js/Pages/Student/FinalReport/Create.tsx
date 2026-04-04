import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea, StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface Props extends PageProps {
 group: {
 id?: number;
 nama_kelompok?: string | null;
 name?: string | null;
 } | null;
 existingReport: {
 id: number;
 title: string;
 status: string;
 file_name?: string | null;
 } | null;
 isLeader: boolean;
}

export default function StudentFinalReportCreate({ group, existingReport, isLeader }: Props) {
 const form = useForm({
 title: existingReport?.title ?? '',
 abstract: '',
 file: null as File | null,
 });

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post('/student/final-report', {
 forceFormData: true,
 });
 };

 if (!group) {
 return (
 <AppLayout title="Laporan Akhir">
 <Head title="Laporan Akhir" />
 <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
 Anda belum memiliki kelompok aktif.
 </div>
 </AppLayout>
 );
 }

 return (
 <AppLayout title="Laporan Akhir">
 <Head title="Laporan Akhir" />

 <div className="mx-auto max-w-4xl space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <Link
 href="/student/dashboard"
 className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Kembali ke dasbor
 </Link>
 <h1 className="mt-4 text-2xl font-semibold text-slate-900">Unggah Laporan Akhir</h1>
 <p className="mt-2 text-sm text-slate-500">
 Kelompok aktif: {group.name || group.nama_kelompok}. Hanya ketua kelompok yang dapat mengunggah laporan akhir.
 </p>
 </section>

 {existingReport && (
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">{existingReport.title}</h2>
 <p className="mt-1 text-sm text-slate-500">{existingReport.file_name || 'Dokumen sudah tersimpan.'}</p>
 </div>
 <StatusBadge status={existingReport.status} />
 </div>
 </section>
 )}

 {isLeader ? (
 <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="space-y-6">
 <FormInput
 label="Judul laporan"
 required
 value={form.data.title}
 onChange={(event) => form.setData('judul', event.target.value)}
 error={form.errors.title}
 />
 <FormTextarea
 label="Abstrak"
 value={form.data.abstract}
 onChange={(event) => form.setData('abstract', event.target.value)}
 error={form.errors.abstract}
 />
 <div className="space-y-2">
 <label className="block text-sm font-medium text-slate-700">File laporan</label>
 <input
 type="berkas"
 accept=".pdf,.doc,.docx"
 onChange={(event) => form.setData('berkas', event.target.files?.[0] ?? null)}
 className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
 required
 />
 {form.errors.file && <p className="text-xs text-red-600">{form.errors.file}</p>}
 </div>
 </div>

 <div className="mt-6 flex justify-end gap-3">
 <Link
 href="/student/dashboard"
 className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Batal
 </Link>
 <button
 type="submit"
 disabled={form.processing}
 className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Mengirim...' : 'Kirim laporan akhir'}
 </button>
 </div>
 </form>
 ) : (
 <section className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
 Anda hanya dapat melihat status laporan akhir. Pengunggahan hanya bisa dilakukan oleh ketua kelompok.
 </section>
 )}
 </div>
 </AppLayout>
 );
}
