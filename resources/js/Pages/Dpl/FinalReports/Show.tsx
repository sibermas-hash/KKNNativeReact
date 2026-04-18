import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';

interface ReportDetail {
 id: number;
 title: string;
 abstract?: string | null;
 file_name?: string | null;
 status: string;
 can_review: boolean;
 submitted_at?: string | null;
 review_notes?: string | null;
 download_url: string;
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

interface Props {
 report: ReportDetail;
}

function formatLocation(report: ReportDetail): string {
 const location = report.kelompok?.lokasi;

 return [location?.village_name, location?.district_name, location?.regency_name]
 .filter(Boolean)
 .join(', ');
}

export default function DplFinalReportsShow({ report }: Props) {
 const approveForm = useForm({});
 const revisionForm = useForm({
 notes: report.review_notes ?? '',
 });
 const canReview = report.can_review;

 return (
 <AppLayout title="Detail Laporan Akhir">
 <Head title="Detail Laporan Akhir" />

 <div className="mx-auto max-w-5xl space-y-8">
 <section className="rounded-lg border border-emerald-50/60 bg-white p-8">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <Link href="/dpl/final-reports" className="text-sm font-medium text-primary hover:underline">
 Kembali ke daftar laporan akhir
 </Link>
 <h1 className="mt-3 text-2xl font-semibold text-emerald-950">{report.title}</h1>
 <p className="mt-2 text-sm text-emerald-950">
 {report.mahasiswa?.nama ?? '-'} ({report.mahasiswa?.nim ?? '-'})
 </p>
 <p className="text-sm text-emerald-950">
 {report.kelompok?.nama_kelompok ?? '-'} · {formatLocation(report) || 'Lokasi belum tersedia'}
 </p>
 </div>
 <StatusBadge status={report.status} />
 </div>
 </section>

 <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
 <section className="space-y-6 rounded-lg border border-emerald-50/60 bg-white p-6">
 <div>
 <h2 className="text-lg font-semibold text-emerald-950">Dokumen Laporan</h2>
 <p className="mt-1 text-sm text-emerald-950">
 Dikirim pada {report.submitted_at ?? 'waktu belum tercatat'}.
 </p>
 </div>

 <div className="rounded-lg border border-emerald-50/60 bg-emerald-50/30 p-4">
 <p className="text-sm font-medium text-emerald-950">{report.file_name ?? 'Dokumen laporan akhir'}</p>
 <a
 href={report.download_url}
 className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
 >
 Unduh Dokumen
 </a>
 </div>

 <div>
 <h3 className="text-base font-semibold text-emerald-950">Abstrak</h3>
 <p className="mt-2 whitespace-pre-line text-sm leading-6 text-emerald-800">
 {report.abstract || 'Mahasiswa belum mengisi abstrak laporan akhir.'}
 </p>
 </div>
 </section>

 <aside className="space-y-6 rounded-lg border border-emerald-50/60 bg-white p-6">
 <div>
 <h2 className="text-lg font-semibold text-emerald-950">Tinjauan DPL</h2>
 <p className="mt-1 text-sm text-emerald-950">
 {canReview
 ? 'Setujui laporan akhir atau kembalikan dengan catatan revisi.'
 : 'Laporan ini sudah selesai ditinjau dan tidak dapat diproses ulang.'}
 </p>
 </div>

 <button
 type="button"
 onClick={() => approveForm.patch(`/dpl/final-reports/${report.id}/setujui`)}
 disabled={!canReview || approveForm.processing}
 className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
 >
 Setujui Laporan
 </button>

 <form
 onSubmit={(event) => {
 event.preventDefault();
 revisionForm.patch(`/dpl/final-reports/${report.id}/revision`);
 }}
 className="space-y-3"
 >
 <label htmlFor="notes" className="block text-sm font-medium text-emerald-800">
 Catatan revisi
 </label>
 <textarea
 id="notes"
 rows={5}
 value={revisionForm.data.notes}
 onChange={(event) => revisionForm.setData('notes', event.target.value)}
 className="w-full rounded-lg border border-emerald-50/60 px-3 py-2 text-sm text-emerald-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
 placeholder="Tulis arahan revisi untuk mahasiswa."
 />
 {revisionForm.errors.notes ? (
 <p className="text-xs text-red-600">{revisionForm.errors.notes}</p>
 ) : null}
 <button
 type="submit"
 disabled={!canReview || revisionForm.processing}
 className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
 >
 Kirim Revisi
 </button>
 </form>

 {report.review_notes ? (
 <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
 <h3 className="text-sm font-semibold text-amber-800">Catatan Review Terakhir</h3>
 <p className="mt-2 whitespace-pre-line text-sm text-amber-700">{report.review_notes}</p>
 </div>
 ) : null}
 </aside>
 </div>
 </div>
 </AppLayout>
 );
}
