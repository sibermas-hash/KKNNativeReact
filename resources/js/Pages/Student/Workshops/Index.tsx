import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';

interface Workshop {
 id: number;
 title: string;
 description: string | null;
 methodology: string | null;
 date: string;
 time: string;
 location: string | null;
 registered: number;
 max_participants: number | null;
 is_full: boolean;
 is_registered: boolean;
 attendance_status?: string | null;
}

interface Props {
 workshops: Workshop[];
 workflow?: {
 period_scoped?: boolean;
 };
}

export default function StudentWorkshopsIndex({ workshops, workflow }: Props) {
 const [submittingId, setSubmittingId] = useState<number | null>(null);

 const register = (workshopId: number) => {
 setSubmittingId(workshopId);
 router.post(
 route('student.workshops.register', workshopId),
 {},
 {
 preserveScroll: true,
 onFinish: () => setSubmittingId(null),
 },
 );
 };

 return (
 <AppLayout title="Workshop Mahasiswa">
 <Head title="Workshop Mahasiswa" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <h1 className="text-2xl font-semibold text-slate-900">Workshop Mahasiswa</h1>
 <p className="mt-2 text-sm text-slate-500">
 Pantau jadwal pembekalan yang tersedia dan status kehadiran Anda pada workshop yang relevan dengan operasional KKN.
 </p>
 {workflow?.period_scoped ? (
 <p className="mt-2 text-xs font-medium uppercase tracking-wide text-emerald-600">
 Jadwal workshop diprioritaskan untuk periode KKN yang sedang aktif.
 </p>
 ) : null}
 </section>

 {workshops.length > 0 ? (
 <div className="grid gap-6 lg:grid-cols-2">
 {workshops.map((workshop) => {
 const isProcessing = submittingId === workshop.id;
 return (
 <section key={workshop.id} className="rounded-lg border border-slate-200 bg-white p-6">
 <div className="flex items-start justify-between gap-4">
 <div>
 <h2 className="text-lg font-semibold text-slate-900">{workshop.title}</h2>
 <p className="mt-2 text-sm text-slate-500">{workshop.description || 'Tidak ada deskripsi.'}</p>
 </div>
 <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
 {workshop.is_registered ? 'Terdaftar' : workshop.is_full ? 'Penuh' : 'Tersedia'}
 </span>
 </div>

 <dl className="mt-6 grid gap-4 md:grid-cols-2">
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tanggal</dt>
 <dd className="mt-1 text-sm text-slate-700">{workshop.date}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Waktu</dt>
 <dd className="mt-1 text-sm text-slate-700">{workshop.time}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lokasi</dt>
 <dd className="mt-1 text-sm text-slate-700">{workshop.location || '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kapasitas</dt>
 <dd className="mt-1 text-sm text-slate-700">
 {workshop.registered} / {workshop.max_participants || 'Tanpa batas'}
 </dd>
 </div>
 </dl>

 {workshop.methodology && (
 <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
 <h3 className="text-sm font-semibold text-slate-900">Metode pelaksanaan</h3>
 <p className="mt-2 text-sm text-slate-600">{workshop.methodology}</p>
 </div>
 )}

 <button
 type="button"
 onClick={() => register(workshop.id)}
 disabled={workshop.is_registered || workshop.is_full || isProcessing}
 className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
 >
 {isProcessing
 ? 'Memproses...'
 : workshop.is_registered
 ? `Status: ${formatAttendanceStatus(workshop.attendance_status)}`
 : workshop.is_full
 ? 'Kuota penuh'
 : 'Daftar workshop'}
 </button>
 </section>
 );
 })}
 </div>
 ) : (
 <section className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
 Belum ada workshop yang tersedia.
 </section>
 )}
 </div>
 </AppLayout>
 );
}

function formatAttendanceStatus(status?: string | null) {
 if (!status || status === 'registered') {
 return 'terdaftar';
 }

 if (status === 'attended') {
 return 'hadir';
 }

 if (status === 'absent') {
 return 'tidak hadir';
 }

 return status.replace(/_/g, ' ');
}
