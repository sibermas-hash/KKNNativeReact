import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, ClipboardList, MapPin, ShieldCheck, Users } from 'lucide-react';
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
        fakultas?: {
            nama?: string | null;
        } | null;
        prodi?: {
            nama?: string | null;
        } | null;
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
        district_name?: string | null;
        regency_name?: string | null;
        full_name?: string | null;
        address?: string | null;
    } | null;
    dosen?: GroupLecturer[];
    peserta?: GroupStudent[];
    program_kerja?: WorkProgram[];
    posko?: {
        id?: number;
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
    members?: GroupStudent[];
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

export default function GroupShow({ group, members = [] }: Props) {
    const memberRows = members.length > 0 ? members : (group.peserta ?? []);
    const lecturerRows = group.dosen ?? [];
    const workPrograms = group.program_kerja ?? [];
    const mainLecturer = lecturerRows.find((lecturer) => lecturer.pivot?.role === 'Ketua') ?? lecturerRows[0] ?? null;
    const approvedCount = memberRows.filter((member) => member.status === 'approved').length;
    const pendingCount = memberRows.filter((member) => member.status === 'pending').length;
    const availableSlots = Math.max((group.capacity ?? 0) - approvedCount, 0);

    return (
        <AppLayout title={`Kelompok ${group.code || group.nama_kelompok || ''}`}>
            <Head title={`Kelompok ${group.code || group.nama_kelompok || ''}`} />

            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                            <Link
                                href={route('admin.kelompok.index')}
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali ke daftar kelompok
                            </Link>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Detail Operasional</p>
                            <h1 className="text-3xl font-bold text-slate-900">
                                {group.nama_kelompok || '-'} <span className="text-slate-400">({group.code || '-'})</span>
                            </h1>
                            <p className="max-w-3xl text-sm text-slate-600">
                                Halaman ini merangkum kondisi kelompok, DPL pembina, anggota, lokasi penempatan, posko, dan program kerja
                                yang sedang berjalan pada kelompok KKN ini.
                            </p>
                        </div>

                        <div className="flex flex-col items-start gap-3 lg:items-end">
                            <StatusBadge status={group.status} />
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-900">Token kelompok</p>
                                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-slate-700">{group.token || 'Belum dibuat'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <SummaryCard label="Periode" value={group.periode?.name || '-'} />
                    <SummaryCard label="DPL Utama" value={mainLecturer?.nama || 'Belum ditetapkan'} />
                    <SummaryCard label="Peserta Disetujui" value={approvedCount} />
                    <SummaryCard label="Menunggu Review" value={pendingCount} />
                    <SummaryCard label="Sisa Kursi" value={availableSlots} />
                    <SummaryCard label="Program Kerja" value={workPrograms.length} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-emerald-600" />
                                <h2 className="text-base font-semibold text-slate-900">Anggota Kelompok</h2>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                                Ketua kelompok dapat ditetapkan dari daftar ini. Untuk pemindahan antar kelompok, gunakan modul pendaftaran.
                            </p>

                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[960px] border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Mahasiswa</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Fakultas</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Prodi</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Peran</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {memberRows.map((member) => (
                                            <tr key={member.id} className="border-b border-slate-100 align-top hover:bg-slate-50/60">
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-semibold text-slate-900">{member.mahasiswa?.nama || '-'}</p>
                                                    <p className="text-xs text-slate-500">{member.mahasiswa?.nim || '-'}</p>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-slate-600">
                                                    {member.mahasiswa?.fakultas?.nama || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-slate-600">
                                                    {member.mahasiswa?.prodi?.nama || '-'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                        {member.role || 'Anggota'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={member.status} />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={route('admin.pendaftaran.show', member.id)}
                                                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                        >
                                                            Buka Pendaftaran
                                                        </Link>
                                                        {member.role !== 'Ketua' && member.status === 'approved' ? (
                                                            <Link
                                                                href={route('admin.pendaftaran.jadikan-ketua', member.id)}
                                                                method="post"
                                                                as="button"
                                                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                                            >
                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                                Jadikan Ketua
                                                            </Link>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {memberRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                                    Belum ada anggota pada kelompok ini.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-emerald-600" />
                                <h2 className="text-base font-semibold text-slate-900">Program Kerja</h2>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">Daftar program kerja yang sudah dibuat untuk kelompok ini.</p>

                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[520px] border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Judul</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workPrograms.map((program) => (
                                            <tr key={program.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                                <td className="px-4 py-4 text-sm font-medium text-slate-900">{program.title || '-'}</td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={program.status || 'draft'} />
                                                </td>
                                            </tr>
                                        ))}
                                        {workPrograms.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="px-4 py-10 text-center text-sm text-slate-500">
                                                    Belum ada program kerja untuk kelompok ini.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                <h2 className="text-base font-semibold text-slate-900">Pembina Kelompok</h2>
                            </div>
                            <div className="mt-4 space-y-3">
                                {lecturerRows.length > 0 ? (
                                    lecturerRows.map((lecturer) => (
                                        <div key={lecturer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm font-semibold text-slate-900">{lecturer.nama || '-'}</p>
                                            <p className="mt-1 text-xs text-slate-500">NIP: {lecturer.nip || '-'}</p>
                                            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                Peran: {lecturer.pivot?.role || 'Anggota'}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">Belum ada DPL yang ditetapkan pada kelompok ini.</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-emerald-600" />
                                <h2 className="text-base font-semibold text-slate-900">Lokasi dan Posko</h2>
                            </div>
                            <div className="mt-4 space-y-4 text-sm text-slate-600">
                                <div>
                                    <p className="font-semibold text-slate-900">Wilayah penempatan</p>
                                    <p className="mt-1">{group.lokasi?.full_name || group.lokasi?.village_name || '-'}</p>
                                    {group.lokasi?.address ? <p className="mt-1 text-xs text-slate-500">{group.lokasi.address}</p> : null}
                                </div>

                                {group.posko ? (
                                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        {group.posko.photo_url ? (
                                            <img
                                                src={group.posko.photo_url}
                                                alt="Foto posko"
                                                className="h-48 w-full rounded-lg border border-slate-200 object-cover"
                                            />
                                        ) : null}
                                        <div className="space-y-1 text-xs text-slate-500">
                                            <p>Latitude: {group.posko.latitude || '-'}</p>
                                            <p>Longitude: {group.posko.longitude || '-'}</p>
                                            {group.posko.updated_at ? <p>Diperbarui: {group.posko.updated_at}</p> : null}
                                        </div>
                                        {group.posko.gmaps_link ? (
                                            <a
                                                href={group.posko.gmaps_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                            >
                                                Buka Lokasi Posko
                                            </a>
                                        ) : null}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">Data posko belum diunggah oleh kelompok.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
