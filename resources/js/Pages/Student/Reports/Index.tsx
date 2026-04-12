import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import { route } from 'ziggy-js';

interface ProgressItem {
 type: string;
 name: string;
 status: string;
 report: {
 id: number;
 title: string;
 file_name: string;
 status: string;
 submitted_at: string | null;
 } | null;
}

interface ReportTypeOption {
 type: string;
 name: string;
 allowed_types: string[];
 max_size_mb: number;
}

interface Props {
 progress: ProgressItem[];
 reportTypes: ReportTypeOption[];
}

export default function StudentReportsIndex({ progress, reportTypes }: Props) {
 const form = useForm({
 type: reportTypes[0]?.type ?? '',
 title: '',
 file: null as File | null,
 });

 const selectedType = reportTypes.find((item) => item.type === form.data.type) ?? null;

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post(route('student.reports.upload'), {
 forceFormData: true,
 onSuccess: () => form.reset('title', 'file'),
 });
 };

 return (
 <AppLayout title="Dokumen Kelompok">
 <Head title="Dokumen Kelompok" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Dokumen Kelompok</h1>
 <p className="mt-2 text-sm text-slate-500">
 Unggah dokumen pendukung kelompok dan pantau status dokumen yang sudah terkirim.
 </p>
 </section>

 <div className="grid gap-6 lg:grid-cols-3">
 <section className="space-y-4 lg:col-span-2">
 {progress.length > 0 ? (
 progress.map((item) => (
 <article key={item.type} className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
 <p className="mt-1 text-sm text-slate-500">
 {item.report?.title || 'Belum ada dokumen pada kategori ini.'}
 </p>
 {item.report?.file_name && (
 <p className="mt-1 text-xs text-slate-500">{item.report.file_name}</p>
 )}
 </div>
 <div className="flex items-center gap-3">
 <StatusBadge status={item.report?.status || item.status} />
 {item.report && (
 <a
 href={`/reports/${item.report.id}/download`}
 className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Unduh
 </a>
 )}
 </div>
 </div>
 </article>
 ))
 ) : (
 <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
 Belum ada dokumen yang dipantau.
 </div>
 )}
 </section>

 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Unggah Dokumen</h2>
 <form onSubmit={handleSubmit} className="mt-6 space-y-4">
 <div className="space-y-2">
 <label className="block text-sm font-medium text-slate-700">Jenis dokumen</label>
 <select
 value={form.data.type}
 onChange={(event) => form.setData('type', event.target.value)}
 className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
 >
 {reportTypes.map((type) => (
 <option key={type.type} value={type.type}>
 {type.name}
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-medium text-slate-700">Judul dokumen</label>
 <input
 type="text"
 value={form.data.title}
 onChange={(event) => form.setData('title', event.target.value)}
 className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
 />
 {form.errors.title && <p className="text-xs text-red-600">{form.errors.title}</p>}
 </div>

 <div className="space-y-2">
   <label className="block text-sm font-medium text-slate-700">Berkas</label>
   <input
     type="file"
     onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)}
     accept={
       selectedType
         ? selectedType.allowed_types.map((extension) => `.${extension}`).join(',')
         : undefined
     }
     className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
   />
   {form.errors.file && <p className="text-xs text-red-600">{form.errors.file}</p>}
 </div>
 {selectedType && (
 <p className="text-xs text-slate-500">
 Format: {selectedType.allowed_types.join(', ')}. Maksimal {selectedType.max_size_mb} MB.
 </p>
 )}
 {form.errors.file && <p className="text-xs text-red-600">{form.errors.file}</p>}

 <button
 type="submit"
 disabled={form.processing || reportTypes.length === 0}
 className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Mengirim...' : 'Unggah dokumen'}
 </button>
 </form>
 </section>
 </div>
 </div>
 </AppLayout>
 );
}
