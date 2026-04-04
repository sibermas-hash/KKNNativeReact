import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';

interface Attachment {
 id: number;
 file_name: string;
 download_url: string;
}

interface ReportDetail {
 id: number;
 date: string;
 title: string;
 activity: string;
 output?: string | null;
 latitude?: number | null;
 longitude?: number | null;
 status: string;
 can_review: boolean;
 review_notes?: string | null;
 student: {
 name: string;
 nim: string;
 };
 group: {
 name: string;
 location?: {
 village_name?: string | null;
 address?: string | null;
 };
 };
 file_kegiatan: Attachment[];
}

interface Props {
 report: ReportDetail;
}

export default function DplDailyReportShow({ report }: Props) {
 const approveForm = useForm({});
 const revisionForm = useForm({
 revision_notes: report.review_notes ?? '',
 });

 const canReview = report.can_review;

 return (
 <AppLayout title="Detail Laporan Harian">
 <Head title="Detail Laporan Harian" />

 <div className="mx-auto max-w-5xl space-y-8">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <Link href="/dpl/daily-reports" className="text-sm font-medium text-primary hover:underline">
 Kembali ke daftar laporan
 </Link>
 <h1 className="mt-3 text-2xl font-semibold text-slate-900">{report.title}</h1>
 <p className="mt-2 text-sm text-slate-500">
 {report.date} · {report.student.name} ({report.student.nim})
 </p>
 <p className="text-sm text-slate-500">{report.group.name}</p>
 </div>
 <StatusBadge status={report.status} />
 </div>
 </section>

 <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Aktivitas</h2>
 <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{report.activity}</p>

 {report.output ? (
 <>
 <h3 className="mt-6 text-base font-semibold text-slate-900">Output</h3>
 <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{report.output}</p>
 </>
 ) : null}
 </section>

 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Lampiran</h2>
 <div className="mt-4 space-y-3">
 {report.file_kegiatan.length > 0 ? (
 report.file_kegiatan.map((file) => (
 <a
 key={file.id}
 href={file.download_url}
 className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:border-primary hover:text-primary"
 >
 <span>{file.file_name}</span>
 <span className="font-medium">Unduh</span>
 </a>
 ))
 ) : (
 <p className="text-sm text-slate-500">Tidak ada lampiran pada laporan ini.</p>
 )}
 </div>
 </section>
 </div>

 <aside className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Lokasi</h2>
 <div className="mt-4 space-y-2 text-sm text-slate-600">
 <p>{report.group.location?.village_name ?? 'Lokasi desa belum tersedia'}</p>
 {report.group.location?.address ? <p>{report.group.location.address}</p> : null}
 {report.latitude !== null && report.latitude !== undefined && report.longitude !== null && report.longitude !== undefined ? (
 <>
 <p>Latitude: {report.latitude}</p>
 <p>Longitude: {report.longitude}</p>
 <a
 href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
 target="_blank"
 rel="noreferrer"
 className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
 >
 Buka di Google Maps
 </a>
 </>
 ) : (
 <p>Koordinat belum dikirimkan pada laporan ini.</p>
 )}
 </div>
 </section>

 <section className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Tindakan DPL</h2>
 <div className="mt-4 space-y-4">
 {canReview ? (
 <p className="text-sm text-slate-500">
 Laporan ini masih bisa disetujui atau dikembalikan untuk revisi.
 </p>
 ) : (
 <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
 Laporan ini sudah selesai ditinjau dan tidak dapat diproses ulang.
 </p>
 )}
 <button
 type="button"
 disabled={!canReview || approveForm.processing}
 onClick={() => approveForm.patch(`/dpl/daily-reports/${report.id}/approve`)}
 className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
 >
 Setujui Laporan
 </button>

 <form
 onSubmit={(event) => {
 event.preventDefault();
 revisionForm.patch(`/dpl/daily-reports/${report.id}/revision`);
 }}
 className="space-y-3"
 >
 <label htmlFor="revision_notes" className="block text-sm font-medium text-slate-700">
 Catatan revisi
 </label>
 <textarea
 id="revision_notes"
 value={revisionForm.data.revision_notes}
 onChange={(event) => revisionForm.setData('revision_notes', event.target.value)}
 rows={5}
 className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
 placeholder="Tulis arahan revisi untuk mahasiswa."
 />
 {revisionForm.errors.revision_notes ? (
 <p className="text-xs text-red-600">{revisionForm.errors.revision_notes}</p>
 ) : null}
 <button
 type="submit"
 disabled={!canReview || revisionForm.processing}
 className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
 >
 Kirim Revisi
 </button>
 </form>
 </div>
 </section>

 {report.review_notes ? (
 <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
 <h2 className="text-base font-semibold text-amber-800">Catatan Review Terakhir</h2>
 <p className="mt-2 whitespace-pre-line text-sm text-amber-700">{report.review_notes}</p>
 </section>
 ) : null}
 </aside>
 </div>
 </div>
 </AppLayout>
 );
}
