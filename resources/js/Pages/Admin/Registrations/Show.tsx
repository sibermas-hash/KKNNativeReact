import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormTextarea, StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface RegistrationDocument {
 id: number;
 document_type?: string | null;
 file_name?: string | null;
 file_path?: string | null;
 status?: string | null;
}

interface RegistrationData {
 id: number;
 status: string;
 registration_date?: string | null;
 notes?: string | null;
 role?: string | null;
 mahasiswa?: {
 nim?: string | null;
 nama?: string | null;
 gender?: string | null;
 batch_year?: number | null;
 fakultas?: { nama?: string | null } | null;
 prodi?: { nama?: string | null } | null;
 } | null;
 periode?: { name?: string | null } | null;
 kelompok?: { nama_kelompok?: string | null; code?: string | null } | null;
 dokumen?: RegistrationDocument[];
}

interface Props extends PageProps {
 registration: RegistrationData;
}

export default function RegistrationShow({ registration }: Props) {
 const [showRejectForm, setShowRejectForm] = useState(false);
 const approveForm = useForm({});
 const rejectForm = useForm({
 notes: registration.notes ?? '',
 });

 const documents = useMemo(() => registration.dokumen ?? [], [registration.dokumen]);
 const isPending = registration.status === 'menunggu' || registration.status === 'document_submitted';

 return (
 <AppLayout title="Detail Pendaftaran">
 <Head title="Detail Pendaftaran KKN" />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <Link
 href="/admin/pendaftaran"
 className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Kembali ke daftar pendaftaran
 </Link>
 <h1 className="mt-4 text-2xl font-semibold text-slate-900">
 Detail Pendaftaran Mahasiswa
 </h1>
 <p className="mt-2 text-sm text-slate-500">
 Tinjau identitas mahasiswa, dokumen, dan status verifikasi sebelum mengambil keputusan.
 </p>
 </div>

 <StatusBadge status={registration.status} />
 </div>
 </section>

 <div className="grid gap-6 xl:grid-cols-3">
 <section className="space-y-6 xl:col-span-2">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Informasi Mahasiswa</h2>
 <dl className="mt-6 grid gap-4 md:grid-cols-2">
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nama</dt>
 <dd className="mt-1 text-sm text-slate-800">{registration.mahasiswa?.nama || '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">NIM</dt>
 <dd className="mt-1 text-sm text-slate-800">{registration.mahasiswa?.nim || '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fakultas</dt>
 <dd className="mt-1 text-sm text-slate-800">
 {registration.mahasiswa?.fakultas?.nama || '-'}
 </dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Program studi</dt>
 <dd className="mt-1 text-sm text-slate-800">
 {registration.mahasiswa?.prodi?.nama || '-'}
 </dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jenis kelamin</dt>
 <dd className="mt-1 text-sm text-slate-800">{registration.mahasiswa?.gender || '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Angkatan</dt>
 <dd className="mt-1 text-sm text-slate-800">
 {registration.mahasiswa?.batch_year || '-'}
 </dd>
 </div>
 </dl>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Dokumen Pendaftaran</h2>
 <div className="mt-6 space-y-4">
 {documents.length > 0 ? (
 documents.map((document) => (
 <div
 key={document.id}
 className="rounded-lg border border-slate-200 px-4 py-3"
 >
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <p className="text-sm font-medium text-slate-900">
 {document.document_type || 'Dokumen'}
 </p>
 <p className="mt-1 text-xs text-slate-500">{document.file_name || '-'}</p>
 </div>
 <StatusBadge status={document.status || 'menunggu'} />
 </div>
 </div>
 ))
 ) : (
 <p className="text-sm text-slate-500">Belum ada dokumen yang diunggah.</p>
 )}
 </div>
 </div>
 </section>

 <section className="space-y-6">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Informasi Pendaftaran</h2>
 <dl className="mt-6 space-y-4">
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Periode</dt>
 <dd className="mt-1 text-sm text-slate-800">{registration.periode?.name || '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kelompok</dt>
 <dd className="mt-1 text-sm text-slate-800">
 {registration.kelompok?.nama_kelompok || 'Belum ditempatkan'}
 </dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tanggal daftar</dt>
 <dd className="mt-1 text-sm text-slate-800">{registration.registration_date || '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Peran kelompok</dt>
 <dd className="mt-1 text-sm text-slate-800">{registration.role || 'Anggota'}</dd>
 </div>
 </dl>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Keputusan Admin</h2>

 {isPending ? (
 <div className="mt-6 space-y-4">
 {!showRejectForm ? (
 <>
 <button
 type="button"
 onClick={() =>
 approveForm.patch(`/admin/pendaftaran/${registration.id}/approve`, {
 preserveScroll: true,
 })
 }
 disabled={approveForm.processing}
 className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
 >
 {approveForm.processing ? 'Menyetujui...' : 'Setujui pendaftaran'}
 </button>
 <button
 type="button"
 onClick={() => setShowRejectForm(true)}
 className="inline-flex w-full items-center justify-center rounded-lg border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
 >
 Tolak pendaftaran
 </button>
 </>
 ) : (
 <form
 onSubmit={(event) => {
 event.preventDefault();
 rejectForm.patch(`/admin/pendaftaran/${registration.id}/reject`, {
 preserveScroll: true,
 onSuccess: () => setShowRejectForm(false),
 });
 }}
 className="space-y-4"
 >
 <FormTextarea
 label="Catatan penolakan"
 required
 value={rejectForm.data.notes}
 onChange={(event) => rejectForm.setData('notes', event.target.value)}
 error={rejectForm.errors.notes}
 />
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => setShowRejectForm(false)}
 className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Batal
 </button>
 <button
 type="submit"
 disabled={rejectForm.processing}
 className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
 >
 {rejectForm.processing ? 'Menyimpan...' : 'Simpan penolakan'}
 </button>
 </div>
 </form>
 )}
 </div>
 ) : (
 <p className="mt-4 text-sm text-slate-500">
 Pendaftaran ini sudah diproses. Catatan: {registration.notes || 'Tidak ada catatan.'}
 </p>
 )}
 </div>
 </section>
 </div>
 </div>
 </AppLayout>
 );
}
