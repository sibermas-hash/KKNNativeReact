import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';

interface Props {
 group: {
 id: number;
 nama_kelompok?: string | null;
 name?: string | null;
 } | null;
}

export default function StudentDailyReportCreate({ group }: Props) {
 const form = useForm({
 date: '',
 title: '',
 activity: '',
 reflection: '',
 output: '',
 location_name: '',
 latitude: '',
 longitude: '',
 files: [] as File[],
 });

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.post('/student/daily-reports', {
 forceFormData: true,
 });
 };

 const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
 form.setData('files', Array.from(event.target.files ?? []));
 };

 return (
 <AppLayout title="Buat Laporan Harian">
 <Head title="Buat Laporan Harian" />

 <div className="mx-auto max-w-4xl space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
 <div>
 <Link
 href="/student/daily-reports"
 className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Kembali ke laporan
 </Link>
 <h1 className="mt-4 text-2xl font-semibold text-slate-900">Buat Laporan Harian</h1>
 <p className="mt-2 text-sm text-slate-500">
 {group ? `Kelompok aktif: ${group.name || group.nama_kelompok}` : 'Isi aktivitas harian kelompok Anda.'}
 </p>
 </div>
 </div>
 </section>

 <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="grid gap-6 md:grid-cols-2">
 <FormInput
 type="date"
 label="Tanggal kegiatan"
 required
 value={form.data.date}
 onChange={(event) => form.setData('date', event.target.value)}
 error={form.errors.date}
 />
 <FormInput
 label="Lokasi kegiatan"
 required
 value={form.data.location_name}
 onChange={(event) => form.setData('location_name', event.target.value)}
 error={form.errors.location_name}
 />
 <div className="md:col-span-2">
 <FormInput
 label="Judul kegiatan"
 required
 value={form.data.title}
 onChange={(event) => form.setData('title', event.target.value)}
 error={form.errors.title}
 />
 </div>
 <div className="md:col-span-2">
 <FormTextarea
 label="Uraian kegiatan"
 required
 value={form.data.activity}
 onChange={(event) => form.setData('activity', event.target.value)}
 error={form.errors.activity}
 />
 </div>
 <div className="md:col-span-2">
 <FormTextarea
 label="Refleksi"
 value={form.data.reflection}
 onChange={(event) => form.setData('reflection', event.target.value)}
 error={form.errors.reflection}
 />
 </div>
 <div className="md:col-span-2">
 <FormTextarea
 label="Luaran"
 value={form.data.output}
 onChange={(event) => form.setData('output', event.target.value)}
 error={form.errors.output}
 />
 </div>
 <FormInput
 type="number"
 step="any"
 label="Latitude"
 value={form.data.latitude}
 onChange={(event) => form.setData('latitude', event.target.value)}
 error={form.errors.latitude}
 />
 <FormInput
 type="number"
 step="any"
 label="Longitude"
 value={form.data.longitude}
 onChange={(event) => form.setData('longitude', event.target.value)}
 error={form.errors.longitude}
 />
 <div className="md:col-span-2 space-y-2">
 <label className="block text-sm font-medium text-slate-700">Lampiran</label>
 <input
 type="berkas"
 multiple
 onChange={handleFilesChange}
 className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
 />
 {form.errors.files && <p className="text-xs text-red-600">{form.errors.files}</p>}
 </div>
 </div>

 <div className="mt-6 flex justify-end gap-3">
 <Link
 href="/student/daily-reports"
 className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Batal
 </Link>
 <button
 type="submit"
 disabled={form.processing}
 className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {form.processing ? 'Menyimpan...' : 'Kirim laporan'}
 </button>
 </div>
 </form>
 </div>
 </AppLayout>
 );
}
