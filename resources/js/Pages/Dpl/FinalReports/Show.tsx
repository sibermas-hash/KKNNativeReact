import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';
import {
 ChevronLeft,
 FileText,
 MapPin,
 User,
 Users,
 Download,
 CheckCircle2,
 MessageSquare,
} from 'lucide-react';

interface ReportDetail {
 id: number;
 title: string;
 abstract?: string | null;
 file_path?: string | null;
 file_name?: string | null;
 status: string;
 submitted_at?: string | null;
 review_notes?: string | null;
 mahasiswa?: {
 nama?: string | null;
 nim?: string | null;
 } | null;
 kelompok?: {
 nama_kelompok?: string | null;
 lokasi?: {
 village_name?: string | null;
 district_name?: string | null;
 regency_name?: string | null;
 } | null;
 } | null;
}

interface Props extends PageProps {
 report: ReportDetail;
}

function formatLocation(report: ReportDetail): string {
 const location = report.kelompok?.lokasi;
 if (!location) {
 return 'Lokasi belum tersedia';
 }

 return [
 location.village_name,
 location.district_name ? `Kecamatan ${location.district_name}` : null,
 location.regency_name ? `Kabupaten ${location.regency_name}` : null,
 ]
 .filter(Boolean)
 .join(', ');
}

export default function DplFinalReportsShow({ report }: Props) {
 const revisionForm = useForm({
 notes: report.review_notes ?? '',
 });

 const approveForm = useForm({});

 return (
 <AppLayout title="Detail Laporan Akhir">
 <Head title="Detail Laporan Akhir" />

 <div className="mx-auto max-w-5xl space-y-8 pb-16">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div className="flex items-center gap-4">
 <Link
 href="/dpl/final-reports"
 className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-primary hover:text-primary"
 >
 <ChevronLeft className="h-5 w-5" />
 </Link>
 <div>
 <p className="text-[11px] font-semibold text-slate-400">
 DPL Final Report Desk
 </p>
 <h1 className="text-3xl font-semibold text-slate-900">
 Detail Laporan Akhir
 </h1>
 </div>
 </div>

 <StatusBadge status={report.status} />
 </div>

 <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
 <section className="space-y-8rounded-lg border border-slate-200 bg-white p-8
 <div className="space-y-3 border-b border-slate-200 pb-6">
 <div className="flex items-center gap-3 text-slate-500">
 <FileText className="h-5 w-5" />
 <span className="text-xs font-semibold 
 Dokumen Laporan
 </span>
 </div>
 <h2 className="text-2xl font-semibold text-slate-900">
 {report.title}
 </h2>
 <p className="text-sm font-medium text-slate-500">
 Dikirim pada {report.submitted_at ?? 'waktu belum tercatat'}.
 </p>
 </div>

 <div className="space-y-6">
 <div className="grid gap-4 md:grid-cols-2">
 <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
 <div className="mb-2 flex items-center gap-2 text-slate-500">
 <User className="h-4 w-4" />
 <span className="text-xs font-semibold 
 </div>
 <p className="text-sm text-sm text-slate-900">{report.mahasiswa?.nama ?? '-'}</p>
 <p className="text-xs font-medium text-slate-500">{report.mahasiswa?.nim ?? '-'}</p>
 </div>

 <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
 <div className="mb-2 flex items-center gap-2 text-slate-500">
 <Users className="h-4 w-4" />
 <span className="text-xs font-semibold 
 </div>
 <p className="text-sm text-sm text-slate-900">
 {report.kelompok?.nama_kelompok ?? '-'}
 </p>
 </div>
 </div>

 <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
 <div className="mb-2 flex items-center gap-2 text-slate-500">
 <MapPin className="h-4 w-4" />
 <span className="text-xs font-semibold KKN</span>
 </div>
 <p className="text-sm font-medium leading-normal text-slate-700">
 {formatLocation(report)}
 </p>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-5">
 <p className="mb-3 text-xs font-semibold text-slate-500">
 Ringkasan / Abstrak
 </p>
 <p className="text-sm leading-normal text-slate-700">
 {report.abstract || 'Mahasiswa belum mengisi abstrak laporan akhir.'}
 </p>
 </div>

 {report.file_path && (
 <a
 href={`/storage/${report.file_path}`}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center gap-3 rounded-lg border border-primary bg-primary/5 px-5 py-3 text-sm text-sm text-primary transition-colors hover:bg-primary hover:text-white"
 >
 <Download className="h-4 w-4" />
 Unduh {report.file_name ?? 'dokumen laporan'}
 </a>
 )}
 </div>
 </section>

 <aside className="space-y-6rounded-lg border border-slate-200 bg-white p-8
 <div className="space-y-3">
 <h3 className="text-sm font-semibold text-slate-900">
 Tinjauan DPL
 </h3>
 <p className="text-sm font-medium leading-normal text-slate-500">
 Gunakan panel ini untuk menyetujui laporan akhir atau mengirimkannya kembali
 dengan catatan revisi.
 </p>
 </div>

 <button
 type="button"
 onClick={() => approveForm.patch(`/dpl/final-reports/${report.id}/approve`)}
 disabled={approveForm.processing}
 className="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
 >
 <CheckCircle2 className="h-4 w-4" />
 Setujui Laporan
 </button>

 <form
 onSubmit={(event) => {
 event.preventDefault();
 revisionForm.patch(`/dpl/final-reports/${report.id}/revision`);
 }}
 className="space-y-4"
 >
 <div className="flex items-center gap-2 text-slate-600">
 <MessageSquare className="h-4 w-4" />
 <span className="text-xs font-semibold 
 Catatan Revisi
 </span>
 </div>

 <FormTextarea
 label=""
 value={revisionForm.data.notes}
 onChange={(event) => revisionForm.setData('notes', event.target.value)}
 rows={5}
 error={revisionForm.errors.notes}
 placeholder="Tulis arahan revisi yang jelas untuk mahasiswa."
 />

 <button
 type="submit"
 disabled={revisionForm.processing}
 className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
 >
 <MessageSquare className="h-4 w-4" />
 Kirim Revisi
 </button>
 </form>
 </aside>
 </div>
 </div>
 </AppLayout>
 );
}
