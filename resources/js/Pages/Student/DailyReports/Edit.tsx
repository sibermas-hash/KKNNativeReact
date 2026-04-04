import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FormInput, FormTextarea } from '@/Components/ui';

interface ReportFile {
 id: number;
 file_name?: string | null;
}

interface ReportData {
 id: number;
 date: string;
 title: string;
 activity: string;
 reflection?: string | null;
 output?: string | null;
 location_name?: string | null;
 latitude?: number | string | null;
 longitude?: number | string | null;
 file_kegiatan?: ReportFile[];
 fileKegiatan?: ReportFile[];
}

interface Props {
 report: ReportData;
}

export default function StudentDailyReportEdit({ report }: Props) {
 const files = report.file_kegiatan ?? report.fileKegiatan ?? [];

 const form = useForm({
 date: report.date ?? '',
 title: report.title ?? '',
 activity: report.activity ?? '',
 reflection: report.reflection ?? '',
 output: report.output ?? '',
 location_name: report.location_name ?? '',
 latitude: report.latitude ? String(report.latitude) : '',
 longitude: report.longitude ? String(report.longitude) : '',
 });

 const handleSubmit = (event: React.FormEvent) => {
 event.preventDefault();
 form.put(`/student/daily-reports/${report.id}`);
 };

 return (
 <AppLayout title="Ubah Laporan Harian">
 <Head title="Ubah Laporan Harian" />

 <div className="mx-auto max-w-4xl space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <Link
 href="/student/daily-reports"
 className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Kembali ke laporan
 </Link>
 <h1 className="mt-4 text-2xl font-semibold text-slate-900">Ubah Laporan Harian</h1>
 <p className="mt-2 text-sm text-slate-500">
 Perbarui data laporan dan kirim ulang untuk ditinjau DPL.
 </p>
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
 </div>

 {files.length > 0 && (
 <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
 <h2 className="text-sm font-semibold text-slate-900">Lampiran yang sudah tersimpan</h2>
 <ul className="mt-3 space-y-2 text-sm text-slate-600">
 {files.map((file) => (
 <li key={file.id}>{file.file_name || `Lampiran #${file.id}`}</li>
 ))}
 </ul>
 </div>
 )}

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
 {form.processing ? 'Menyimpan...' : 'Simpan perubahan'}
 </button>
 </div>
 </form>
 </div>
 </AppLayout>
 );
}
