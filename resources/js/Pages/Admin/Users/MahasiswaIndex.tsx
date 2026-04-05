import { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Database,
    GraduationCap,
    Lock,
    RefreshCw,
    Search,
    Unlock,
    UserCheck,
    Users,
    XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

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

function formatDateTime(value: string | null): string {
    if (!value) {
        return 'Belum pernah sinkron';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatGender(value: StudentRecord['gender']): string {
    if (value === 'L') {
        return 'Laki-laki';
    }

    if (value === 'P') {
        return 'Perempuan';
    }

    return '-';
}

function formatGpa(value: number | null): string {
    if (value === null) {
        return '-';
    }

    return value.toFixed(2);
}

function buildQuery(filters: Required<Filters>): Record<string, string | number> {
    return Object.entries(filters).reduce<Record<string, string | number>>((carry, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            carry[key] = value;
        }

        return carry;
    }, {});
}

export default function MahasiswaIndex({
    students,
    filters,
    faculties,
    programs,
    batchYears,
    stats,
    syncInfo,
}: Props) {
    const [formFilters, setFormFilters] = useState<Required<Filters>>(normalizeFilters(filters));

    useEffect(() => {
        setFormFilters(normalizeFilters(filters));
    }, [filters]);

    const visiblePrograms = formFilters.faculty_id
        ? programs.filter((program) => String(program.faculty_id) === String(formFilters.faculty_id))
        : programs;

    const submitFilters = (event?: React.FormEvent) => {
        event?.preventDefault();

        router.get('/admin/mahasiswa', buildQuery(formFilters), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setFormFilters(emptyFilters);

        router.get('/admin/mahasiswa', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const toggleStatus = (student: StudentRecord) => {
        if (!student.account) {
            return;
        }

        const actionLabel = student.account.is_active ? 'menonaktifkan' : 'mengaktifkan';

        if (confirm(`Apakah Anda yakin ingin ${actionLabel} akun ${student.nama}?`)) {
            router.patch(`/admin/pengguna/${student.account.id}/toggle-status`);
        }
    };

    return (
        <AppLayout title="REGISTRY MAHASISWA MASTER">
            <Head title="Registry Mahasiswa Master | KKN UIN SAIZU" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                            <Users size={24} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-900">Registry Mahasiswa Master</h2>
                            <p className="text-sm text-slate-500">
                                Pantau data hasil sinkron master kampus, status akun login, dan kesiapan mahasiswa untuk proses KKN.
                            </p>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sumber Data</div>
                            <div className="mt-1 text-sm font-semibold text-slate-700">{syncInfo.source}</div>
                            <div className="mt-1 text-xs text-slate-500">Sinkron terakhir: {syncInfo.last_synced_at ?? 'Belum ada riwayat'}</div>
                        </div>

                        <Link
                            href="/admin/mahasiswa/sinkron"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-emerald-600"
                        >
                            <RefreshCw size={16} />
                            Sinkron Master Kampus
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Master</span>
                            <Database size={18} className="text-slate-400" />
                        </div>
                        <div className="mt-3 text-2xl font-bold text-slate-900">{stats.total}</div>
                        <p className="mt-1 text-xs text-slate-500">Seluruh mahasiswa hasil sinkron yang tersimpan lokal.</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Akun Terhubung</span>
                            <UserCheck size={18} className="text-emerald-500" />
                        </div>
                        <div className="mt-3 text-2xl font-bold text-slate-900">{stats.with_account}</div>
                        <p className="mt-1 text-xs text-slate-500">Record master yang sudah punya akun portal terhubung.</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Akun Aktif</span>
                            <Unlock size={18} className="text-blue-500" />
                        </div>
                        <div className="mt-3 text-2xl font-bold text-slate-900">{stats.active_accounts}</div>
                        <p className="mt-1 text-xs text-slate-500">Akun mahasiswa yang tidak sedang dikunci.</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lulus BTA/PPI</span>
                            <CheckCircle2 size={18} className="text-emerald-500" />
                        </div>
                        <div className="mt-3 text-2xl font-bold text-slate-900">{stats.bta_passed}</div>
                        <p className="mt-1 text-xs text-slate-500">Mahasiswa yang sudah memenuhi prasyarat akademik dasar.</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sudah Sinkron</span>
                            <RefreshCw size={18} className="text-amber-500" />
                        </div>
                        <div className="mt-3 text-2xl font-bold text-slate-900">{stats.synced}</div>
                        <p className="mt-1 text-xs text-slate-500">Record yang memiliki jejak sinkron dari master kampus.</p>
                    </div>
                </div>

                <form onSubmit={submitFilters} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Filter Registry Mahasiswa</h3>
                                <p className="text-xs text-slate-500">Gunakan filter untuk menyaring data master berdasarkan identitas, akademik, sinkronisasi, dan akun login.</p>
                            </div>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                Reset Filter
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Cari Master</span>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="search"
                                        value={formFilters.search}
                                        onChange={(event) => setFormFilters((current) => ({ ...current, search: event.target.value }))}
                                        placeholder="NIM, NIK, nama, email, alamat"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                                    />
                                </div>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Fakultas</span>
                                <select
                                    value={String(formFilters.faculty_id)}
                                    onChange={(event) =>
                                        setFormFilters((current) => ({
                                            ...current,
                                            faculty_id: event.target.value,
                                            program_id:
                                                current.program_id &&
                                                !programs.some(
                                                    (program) =>
                                                        String(program.id) === String(current.program_id) &&
                                                        String(program.faculty_id) === event.target.value,
                                                )
                                                    ? ''
                                                    : current.program_id,
                                        }))
                                    }
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                                >
                                    <option value="">Semua fakultas</option>
                                    {faculties.map((faculty) => (
                                        <option key={faculty.id} value={faculty.id}>
                                            {faculty.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Program Studi</span>
                                <select
                                    value={String(formFilters.program_id)}
                                    onChange={(event) => setFormFilters((current) => ({ ...current, program_id: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                                >
                                    <option value="">Semua prodi</option>
                                    {visiblePrograms.map((program) => (
                                        <option key={program.id} value={program.id}>
                                            {program.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Angkatan</span>
                                <select
                                    value={String(formFilters.batch_year)}
                                    onChange={(event) => setFormFilters((current) => ({ ...current, batch_year: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                                >
                                    <option value="">Semua angkatan</option>
                                    {batchYears.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</span>
                                <select
                                    value={formFilters.gender}
                                    onChange={(event) => setFormFilters((current) => ({ ...current, gender: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                                >
                                    <option value="">Semua gender</option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status BTA/PPI</span>
                                <select
                                    value={formFilters.bta_ppi}
                                    onChange={(event) => setFormFilters((current) => ({ ...current, bta_ppi: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                                >
                                    <option value="">Semua status</option>
                                    <option value="passed">Lulus</option>
                                    <option value="failed">Belum lulus</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status Akun</span>
                                <select
                                    value={formFilters.account_status}
                                    onChange={(event) => setFormFilters((current) => ({ ...current, account_status: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                                >
                                    <option value="">Semua akun</option>
                                    <option value="active">Akun aktif</option>
                                    <option value="locked">Akun terkunci</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status Sinkron</span>
                                <select
                                    value={formFilters.sync_status}
                                    onChange={(event) => setFormFilters((current) => ({ ...current, sync_status: event.target.value }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                                >
                                    <option value="">Semua status</option>
                                    <option value="synced">Sudah sinkron</option>
                                    <option value="unsynced">Belum sinkron</option>
                                </select>
                            </label>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="submit"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
                            >
                                <Search size={16} />
                                Terapkan Filter
                            </button>
                        </div>
                    </div>
                </form>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1180px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Identitas Master</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Data Pribadi</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Akademik</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Metrik</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Sinkron Master</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">BTA/PPI</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Akun Login</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.data.length > 0 ? (
                                    students.data.map((student) => (
                                        <tr key={student.id} className="align-top transition hover:bg-slate-50/50">
                                            <td className="px-6 py-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-600">
                                                        {student.nama.charAt(0)}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-bold text-slate-900">{student.nama}</div>
                                                        <div className="text-xs font-medium text-slate-500">NIM {student.nim}</div>
                                                        <div className="text-xs text-slate-500">NIK {student.nik ?? '-'}</div>
                                                        {student.account ? (
                                                            <div className="text-xs text-slate-500">
                                                                Username <span className="font-semibold text-slate-700">{student.account.username}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                                                Relasi akun tidak ditemukan
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="space-y-1.5 text-xs text-slate-600">
                                                    <div>
                                                        Nama ibu: <span className="font-semibold text-slate-800">{student.mother_name ?? '-'}</span>
                                                    </div>
                                                    <div className="max-w-xs leading-5 text-slate-500">
                                                        Alamat: <span className="font-semibold text-slate-700">{student.address ?? '-'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="space-y-1.5 text-xs">
                                                    <div className="font-semibold text-slate-800">{student.prodi?.nama ?? '-'}</div>
                                                    <div className="text-slate-500">{student.fakultas?.nama ?? '-'}</div>
                                                    <div className="text-slate-500">
                                                        Angkatan {student.batch_year ?? '-'} · {formatGender(student.gender)}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="space-y-1.5 text-xs text-slate-600">
                                                    <div>SKS: <span className="font-semibold text-slate-800">{student.sks_completed ?? '-'}</span></div>
                                                    <div>IPK: <span className="font-semibold text-slate-800">{formatGpa(student.gpa)}</span></div>
                                                    <div>ID Master: <span className="font-semibold text-slate-800">{student.master_id ?? '-'}</span></div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="space-y-2">
                                                    <span
                                                        className={clsx(
                                                            'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold',
                                                            student.master_synced_at
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : 'border-slate-200 bg-slate-50 text-slate-600',
                                                        )}
                                                    >
                                                        {student.master_synced_at ? 'Sudah sinkron' : 'Belum sinkron'}
                                                    </span>
                                                    <div className="text-xs text-slate-500">{formatDateTime(student.master_synced_at)}</div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                {student.is_bta_ppi_passed ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                                                        <CheckCircle2 size={12} />
                                                        Lulus
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-bold text-rose-700">
                                                        <XCircle size={12} />
                                                        Belum lulus
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-5">
                                                {student.account ? (
                                                    <div className="space-y-2 text-xs">
                                                        <div className="font-semibold text-slate-800">{student.account.email}</div>
                                                        <span
                                                            className={clsx(
                                                                'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold',
                                                                student.account.is_active
                                                                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                                    : 'border-amber-200 bg-amber-50 text-amber-700',
                                                            )}
                                                        >
                                                            {student.account.is_active ? 'Akun aktif' : 'Akun terkunci'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-500">Record master ini belum menemukan relasi akun portal yang valid.</div>
                                                )}
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStatus(student)}
                                                        disabled={!student.account}
                                                        className={clsx(
                                                            'inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition active:scale-95',
                                                            student.account
                                                                ? student.account.is_active
                                                                    ? 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600'
                                                                    : 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700'
                                                                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300',
                                                        )}
                                                        title={
                                                            !student.account
                                                                ? 'Akun belum tersedia'
                                                                : student.account.is_active
                                                                  ? 'Kunci akun'
                                                                  : 'Buka kunci akun'
                                                        }
                                                    >
                                                        {student.account?.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                                                    </button>

                                                    <Link
                                                        href={`/admin/pendaftaran?search=${student.nim}`}
                                                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
                                                    >
                                                        Detail
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                                <GraduationCap className="h-12 w-12 opacity-20" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold italic text-slate-500">Belum ada data mahasiswa yang cocok dengan filter saat ini.</p>
                                                    <p className="text-xs text-slate-400">Coba ubah filter atau lakukan sinkron data master kampus.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                        <Pagination meta={students.meta} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
