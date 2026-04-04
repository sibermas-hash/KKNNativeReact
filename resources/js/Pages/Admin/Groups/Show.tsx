import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface GroupLecturer {
 id: number;
 nama?: string | null;
 nip?: string | null;
 pivot?: {
 role?: string | null;
 } | null;
}

interface GroupStudent {
 id: number;
 status: string;
 role?: string | null;
 mahasiswa?: {
 nim?: string | null;
 nama?: string | null;
 } | null;
}

interface WorkProgram {
 id: number;
 title?: string | null;
 status?: string | null;
}

interface GroupData {
 id: number;
 code?: string | null;
 nama_kelompok?: string | null;
 token?: string | null;
 capacity?: number | null;
 status: string;
 periode?: {
 name?: string | null;
 } | null;
 lokasi?: {
 village_name?: string | null;
 full_name?: string | null;
 address?: string | null;
 } | null;
 dosen?: GroupLecturer[];
 peserta?: GroupStudent[];
 program_kerja?: WorkProgram[];
 posko?: {
 latitude?: number | string | null;
 longitude?: number | string | null;
 gmaps_link?: string | null;
 photo_url?: string | null;
 photo_name?: string | null;
 updated_at?: string | null;
 } | null;
}

interface Props extends PageProps {
 group: GroupData;
}

export default function GroupShow({ group }: Props) {
 const lecturers = group.dosen ?? [];
 const registrations = group.peserta ?? [];
 const workPrograms = group.program_kerja ?? [];
 const chiefLecturer = lecturers.find((lecturer) => lecturer.pivot?.role === 'Ketua') ?? lecturers[0] ?? null;

 return (
 <AppLayout title={`Detail Kelompok ${group.code || ''}`}>
 <Head title={`Detail Kelompok ${group.code || group.nama_kelompok || ''}`} />

 <div className="space-y-6">
 <section className="rounded-lg border border-slate-200 bg-white p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <Link
 href="/admin/groups"
 className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Kembali ke daftar kelompok
 </Link>
 <h1 className="mt-4 text-2xl font-semibold text-slate-900">
 {group.nama_kelompok || 'Kelompok KKN'} {group.code ? `(${group.code})` : ''}
 </h1>
 <p className="mt-2 text-sm text-slate-500">
 Token kelompok: {group.token || '-'}.
 </p>
 </div>

 <StatusBadge status={group.status} />
 </div>
 </section>

 <div className="grid gap-6 xl:grid-cols-3">
 <section className="space-y-6 xl:col-span-2">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Informasi Umum</h2>
 <dl className="mt-6 grid gap-4 md:grid-cols-2">
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Periode</dt>
 <dd className="mt-1 text-sm text-slate-800">{group.periode?.name || '-'}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kapasitas</dt>
 <dd className="mt-1 text-sm text-slate-800">
 {registrations.length} / {group.capacity || 0}
 </dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lokasi</dt>
 <dd className="mt-1 text-sm text-slate-800">
 {group.lokasi?.full_name || group.lokasi?.village_name || '-'}
 </dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alamat</dt>
 <dd className="mt-1 text-sm text-slate-800">{group.lokasi?.address || '-'}</dd>
 </div>
 </dl>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Daftar Peserta</h2>
 <div className="mt-6 overflow-x-auto">
 <table className="min-w-full divide-y divide-slate-200">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Mahasiswa
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 NIM
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Peran
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
 Status
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 bg-white">
 {registrations.length > 0 ? (
 registrations.map((registration) => (
 <tr key={registration.id}>
 <td className="px-4 py-3 text-sm font-medium text-slate-900">
 {registration.mahasiswa?.nama || '-'}
 </td>
 <td className="px-4 py-3 text-sm text-slate-600">
 {registration.mahasiswa?.nim || '-'}
 </td>
 <td className="px-4 py-3 text-sm text-slate-600">{registration.role || 'Anggota'}</td>
 <td className="px-4 py-3">
 <StatusBadge status={registration.status} />
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
 Belum ada peserta pada kelompok ini.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Program Kerja</h2>
 <div className="mt-6 space-y-3">
 {workPrograms.length > 0 ? (
 workPrograms.map((program) => (
 <div key={program.id} className="rounded-lg border border-slate-200 px-4 py-3">
 <p className="text-sm font-medium text-slate-900">{program.title || 'Tanpa judul'}</p>
 <p className="mt-1 text-xs text-slate-500">Status: {program.status || '-'}</p>
 </div>
 ))
 ) : (
 <p className="text-sm text-slate-500">Belum ada program kerja pada kelompok ini.</p>
 )}
 </div>
 </div>
 </section>

 <section className="space-y-6">
 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">DPL</h2>
 {chiefLecturer ? (
 <div className="mt-4 space-y-3">
 <div>
 <p className="text-sm font-medium text-slate-900">{chiefLecturer.nama || '-'}</p>
 <p className="mt-1 text-xs text-slate-500">{chiefLecturer.nip || '-'}</p>
 </div>
 <p className="text-xs text-slate-500">
 Peran utama: {chiefLecturer.pivot?.role || 'Anggota'}
 </p>
 {lecturers.length > 1 && (
 <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
 Total DPL terhubung: {lecturers.length}
 </div>
 )}
 </div>
 ) : (
 <p className="mt-4 text-sm text-slate-500">Belum ada DPL yang ditugaskan.</p>
 )}
 </div>

 <div className="rounded-lg border border-slate-200 bg-white p-6">
 <h2 className="text-lg font-semibold text-slate-900">Data Posko</h2>
 {group.posko ? (
 <div className="mt-4 space-y-4">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Koordinat</p>
 <p className="mt-1 text-sm text-slate-800">
 {group.posko.latitude || '-'}, {group.posko.longitude || '-'}
 </p>
 </div>
 {group.posko.gmaps_link && (
 <a
 href={group.posko.gmaps_link}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
 >
 Buka Google Maps
 </a>
 )}
 {group.posko.photo_url && (
 <div className="overflow-hidden rounded-lg border border-slate-200">
 <img
 src={group.posko.photo_url}
 alt={group.posko.photo_name || 'Foto posko'}
 className="h-64 w-full object-cover"
 />
 </div>
 )}
 <p className="text-xs text-slate-500">
 Diperbarui: {group.posko.updated_at || 'Tidak diketahui'}
 </p>
 </div>
 ) : (
 <p className="mt-4 text-sm text-slate-500">Kelompok ini belum melaporkan data posko.</p>
 )}
 </div>
 </section>
 </div>
 </div>
 </AppLayout>
 );
}
