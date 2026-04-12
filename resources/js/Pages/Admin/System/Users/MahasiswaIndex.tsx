import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Database,
    FileSpreadsheet,
    KeyRound,
    Lock,
    RefreshCw,
    Search,
    Unlock,
    UserCheck,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';

interface FacultyOption {
    id: number;
    name: string;
}

interface ProgramOption {
    id: number;
    faculty_id: number;
    name: string;
}

interface RegistryReference {
    id: number;
    nama: string;
}

interface StudentAccount {
    id: number;
    username: string;
    name: string;
    email: string;
    is_active: boolean;
}

interface StudentRecord {
    id: number;
    nim: string;
    nik: string | null;
    nama: string;
    mother_name: string | null;
    batch_year: number | null;
    gender: 'L' | 'P' | null;
    sks_completed: number | null;
    gpa: number | null;
    is_bta_ppi_passed: boolean;
    master_id: number | null;
    master_synced_at: string | null;
    address: string | null;
    fakultas: RegistryReference | null;
    prodi: RegistryReference | null;
    account: StudentAccount | null;
    has_account: boolean;
}

interface Filters {
    search?: string;
    faculty_id?: string | number;
    program_id?: string | number;
    batch_year?: string | number;
    gender?: string;
    bta_ppi?: string;
    account_status?: string;
    sync_status?: string;
}

interface Props {
    students: {
        data: StudentRecord[];
        meta: PaginationMeta;
    };
    filters: Filters;
    faculties: FacultyOption[];
    programs: ProgramOption[];
    batchYears: number[];
    stats: {
        total: number;
        with_account: number;
        active_accounts: number;
        bta_passed: number;
        synced: number;
    };
    syncInfo: {
        mode: string;
        source: string;
        last_synced_at: string | null;
    };
}

const emptyFilters: Required<Filters> = {
    search: '',
    faculty_id: '',
    program_id: '',
    batch_year: '',
    gender: '',
    bta_ppi: '',
    account_status: '',
    sync_status: '',
};

function normalizeFilters(filters: Filters): Required<Filters> {
    return {
        search: filters.search ?? '',
        faculty_id: filters.faculty_id ?? '',
        program_id: filters.program_id ?? '',
        batch_year: filters.batch_year ?? '',
        gender: filters.gender ?? '',
        bta_ppi: filters.bta_ppi ?? '',
        account_status: filters.account_status ?? '',
        sync_status: filters.sync_status ?? '',
    };
}

function buildQuery(filters: Required<Filters>): Record<string, string | number> {
    return Object.entries(filters).reduce<Record<string, string | number>>((carry, [key, value]) => {
        if (value !== '' && value !== null) {
            carry[key] = value;
        }

        return carry;
    }, {});
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatGender(value: StudentRecord['gender']): string {
    if (value === 'L') return 'Laki-laki';
    if (value === 'P') return 'Perempuan';
    return '-';
}

function SummaryCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number;
    icon: LucideIcon;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <Icon className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{value.toLocaleString('id-ID')}</p>
        </div>
    );
}

function AccountBadge({ student }: { student: StudentRecord }) {
    if (!student.account) {
        return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Belum ada akun</span>;
    }

    return (
        <span
            className={clsx(
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                student.account.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
            )}
        >
            {student.account.is_active ? 'Akun aktif' : 'Akun dikunci'}
        </span>
    );
}

export default function MahasiswaIndex({ students, filters, faculties, programs, batchYears, stats, syncInfo }: Props) {
    const [formFilters, setFormFilters] = useState<Required<Filters>>(normalizeFilters(filters));
    const { flash } = usePage<PageProps>().props;

    useEffect(() => {
        setFormFilters(normalizeFilters(filters));
    }, [filters]);

    const visiblePrograms = formFilters.faculty_id
        ? programs.filter((program) => String(program.faculty_id) === String(formFilters.faculty_id))
        : programs;

    const submitFilters = () => {
        router.get('/admin/mahasiswa', buildQuery(formFilters), {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFormFilters(emptyFilters);
        router.get('/admin/mahasiswa', {}, { preserveState: true, replace: true, preserveScroll: true });
    };

    const toggleStatus = (student: StudentRecord) => {
        if (!student.account) {
            return;
        }

        const action = student.account.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${action} akun ${student.nama}?`)) {
            router.patch(`/admin/pengguna/${student.account.id}/toggle-status`, {}, { preserveScroll: true });
        }
    };

    const resetTemporaryPassword = (student: StudentRecord) => {
        if (!student.account) {
            return;
        }

        if (!confirm(`Buat kata sandi sementara untuk ${student.account.username}?`)) {
            return;
        }

        router.post(`/admin/pengguna/${student.account.id}/reset-password-sementara`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Data Mahasiswa">
            <Head title="Data Mahasiswa | POS-KKN" />

            <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-emerald-600">Master data mahasiswa</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Registry Mahasiswa</h1>
                        <p className="max-w-3xl text-sm text-slate-600">
                            Halaman ini dipakai untuk meninjau mahasiswa hasil sinkron master, status akun, dan data dasar yang dibutuhkan untuk kelayakan KKN maupun kebutuhan ekspor operasional.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sinkron terakhir</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(syncInfo.last_synced_at)}</p>
                        </div>
                        <Link
                            href="/admin/mahasiswa/sinkron"
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Sinkron mahasiswa
                        </Link>
                    </div>
                </header>

                {flash?.temporary_password && flash?.temporary_username ? (
                    <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-emerald-800">Kata sandi sementara berhasil dibuat</p>
                                <p className="text-xs text-emerald-700">
                                    Bagikan ke pengguna lalu minta mereka mengganti kata sandi saat login berikutnya.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="rounded-lg border border-emerald-200 bg-white px-4 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Username / NIM</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{flash.temporary_username}</p>
                                </div>
                                <div className="rounded-lg border border-emerald-200 bg-white px-4 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Kata sandi sementara</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{flash.temporary_password}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : null}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <SummaryCard label="Total mahasiswa" value={stats.total} icon={Database} />
                    <SummaryCard label="Sudah punya akun" value={stats.with_account} icon={Users} />
                    <SummaryCard label="Akun aktif" value={stats.active_accounts} icon={UserCheck} />
                    <SummaryCard label="Lulus BTA-PPI" value={stats.bta_passed} icon={CheckCircle2} />
                    <SummaryCard label="Sudah sinkron" value={stats.synced} icon={RefreshCw} />
                </section>

                <section className="rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Filter data mahasiswa</h2>
                        <p className="text-xs text-slate-500">Gunakan filter ini untuk audit identitas, akademik, akun, dan status sinkron.</p>
                    </div>
                    <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
                        <label className="relative xl:col-span-2">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={formFilters.search}
                                onChange={(event) => setFormFilters({ ...formFilters, search: event.target.value })}
                                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                                placeholder="Cari NIM, nama, NIK, nama ibu, alamat, atau username"
                            />
                        </label>

                        <select
                            value={String(formFilters.faculty_id)}
                            onChange={(event) => setFormFilters({ ...formFilters, faculty_id: event.target.value, program_id: '' })}
                            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Semua fakultas</option>
                            {faculties.map((faculty) => (
                                <option key={faculty.id} value={faculty.id}>
                                    {faculty.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={String(formFilters.program_id)}
                            onChange={(event) => setFormFilters({ ...formFilters, program_id: event.target.value })}
                            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Semua prodi</option>
                            {visiblePrograms.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={String(formFilters.batch_year)}
                            onChange={(event) => setFormFilters({ ...formFilters, batch_year: event.target.value })}
                            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Semua angkatan</option>
                            {batchYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>

                        <select
                            value={formFilters.gender}
                            onChange={(event) => setFormFilters({ ...formFilters, gender: event.target.value })}
                            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Semua jenis kelamin</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>

                        <select
                            value={formFilters.bta_ppi}
                            onChange={(event) => setFormFilters({ ...formFilters, bta_ppi: event.target.value })}
                            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Semua status BTA-PPI</option>
                            <option value="passed">Lulus</option>
                            <option value="failed">Belum lulus</option>
                        </select>

                        <select
                            value={formFilters.account_status}
                            onChange={(event) => setFormFilters({ ...formFilters, account_status: event.target.value })}
                            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Semua status akun</option>
                            <option value="active">Akun aktif</option>
                            <option value="locked">Akun dikunci</option>
                            <option value="no_account">Belum ada akun</option>
                        </select>

                        <select
                            value={formFilters.sync_status}
                            onChange={(event) => setFormFilters({ ...formFilters, sync_status: event.target.value })}
                            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Semua status sinkron</option>
                            <option value="synced">Sudah sinkron</option>
                            <option value="unsynced">Belum sinkron</option>
                        </select>

                        <div className="flex flex-wrap gap-3 xl:col-span-4">
                            <Button type="button" onClick={submitFilters} className="inline-flex h-11 items-center gap-2 rounded-lg px-4">
                                <Search className="h-4 w-4" />
                                Terapkan filter
                            </Button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Daftar mahasiswa</h2>
                            <p className="text-xs text-slate-500">Termasuk identitas, akademik, akun, dan jejak sinkron master.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mahasiswa</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identitas</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akademik</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelayakan KKN</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sinkron & akun</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-16 text-center">
                                            <div className="mx-auto max-w-md space-y-2">
                                                <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
                                                <p className="text-sm font-semibold text-slate-700">Belum ada data mahasiswa</p>
                                                <p className="text-xs text-slate-500">Coba ubah filter atau lakukan sinkronisasi master data.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    students.data.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-50 last:border-0">
                                            <td className="px-6 py-5 text-sm">
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-slate-900">{student.nama}</p>
                                                    <p className="text-xs text-slate-500">
                                                        NIM {student.nim}
                                                        {student.account ? ` • @${student.account.username}` : ''}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{student.account?.email || '-'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-slate-800">NIK: {student.nik || '-'}</p>
                                                    <p className="text-xs text-slate-500">Nama ibu: {student.mother_name || '-'}</p>
                                                    <p className="line-clamp-2 text-xs text-slate-500">{student.address || 'Alamat belum diisi'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-slate-800">{student.prodi?.nama || 'Prodi belum dipetakan'}</p>
                                                    <p className="text-xs text-slate-500">{student.fakultas?.nama || 'Fakultas belum dipetakan'}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Angkatan {student.batch_year || '-'} • {formatGender(student.gender)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-slate-800">SKS: {student.sks_completed ?? 0}</p>
                                                    <p className="text-xs text-slate-500">IPK: {student.gpa?.toFixed(2) ?? '0.00'}</p>
                                                    <span
                                                        className={clsx(
                                                            'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                                            student.is_bta_ppi_passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                                                        )}
                                                    >
                                                        {student.is_bta_ppi_passed ? 'BTA-PPI lulus' : 'BTA-PPI belum lulus'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-slate-800">Master ID: {student.master_id || '-'}</p>
                                                    <p className="text-xs text-slate-500">Sinkron: {formatDateTime(student.master_synced_at)}</p>
                                                    <AccountBadge student={student} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => resetTemporaryPassword(student)}
                                                        disabled={!student.account}
                                                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                        title="Buat kata sandi sementara"
                                                    >
                                                        <KeyRound className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStatus(student)}
                                                        disabled={!student.account}
                                                        className={clsx(
                                                            'inline-flex h-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40',
                                                            student.account?.is_active
                                                                ? 'border-slate-300 bg-white text-slate-700 hover:border-rose-300 hover:text-rose-700'
                                                                : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700',
                                                        )}
                                                        title={student.account?.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                                                    >
                                                        {student.account?.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                                    </button>
                                                    <Link
                                                        href={`/admin/mahasiswa/${student.id}`}
                                                        className="inline-flex h-10 items-center rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                                    >
                                                        Detail
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan {students.meta.from ?? 0} - {students.meta.to ?? 0} dari {students.meta.total.toLocaleString('id-ID')} mahasiswa.
                        </p>
                        <Pagination meta={students.meta} />
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
