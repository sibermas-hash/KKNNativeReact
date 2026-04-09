import { type FormEvent, useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    Download,
    FileSpreadsheet,
    GraduationCap,
    Lock,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';

interface StudentGrade {
    id: number;
    score_id: number | null;
    nim: string;
    name: string;
    group_name: string;
    kelompok_id: number;
    final_grade_letter: string | null;
    final_grade_value: number | null;
    is_locked: boolean;
    fakultas?: string | null;
    prodi?: string | null;
    can_finalize?: boolean;
}

interface Props {
    scores: StudentGrade[];
    stats: {
        total_students: number;
        graded_count: number;
        locked_count: number;
        average_value: number;
    } | null;
    filters: {
        search?: string | null;
        period_id?: number | string | null;
        faculty_id?: number | string | null;
        kelompok_id?: number | string | null;
        huruf?: string | null;
    };
    periods: Array<{ id: number; name: string }>;
    faculties: Array<{ id: number; name: string }>;
    lockedFaculty?: { id: number; name: string } | null;
    canExport: boolean;
    canFinalizeMass: boolean;
}

function SummaryCard({
    label,
    value,
    tone = 'slate',
}: {
    label: string;
    value: string | number;
    tone?: 'slate' | 'emerald' | 'amber';
}) {
    const toneClass = {
        slate: 'bg-slate-50 text-slate-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
    }[tone];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <span className={clsx('rounded-full px-2 py-1 text-[10px] font-semibold', toneClass)}>{value}</span>
            </div>
        </div>
    );
}

function GradeBadge({ grade }: { grade: string | null }) {
    if (!grade) {
        return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Belum ada</span>;
    }

    const tone =
        grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
        grade === 'B' ? 'bg-sky-100 text-sky-700' :
        grade === 'C' ? 'bg-amber-100 text-amber-700' :
        'bg-rose-100 text-rose-700';

    return <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold', tone)}>{grade}</span>;
}

export default function RekapNilaiIndex({
    scores,
    stats,
    filters,
    periods,
    faculties,
    lockedFaculty,
    canExport,
    canFinalizeMass,
}: Props) {
    const [search, setSearch] = useState(filters.search ? String(filters.search) : '');
    const [periodId, setPeriodId] = useState(filters.period_id ? String(filters.period_id) : '');
    const [facultyId, setFacultyId] = useState(filters.faculty_id ? String(filters.faculty_id) : '');
    const [huruf, setHuruf] = useState(filters.huruf ? String(filters.huruf) : '');

    useEffect(() => {
        setSearch(filters.search ? String(filters.search) : '');
        setPeriodId(filters.period_id ? String(filters.period_id) : '');
        setFacultyId(filters.faculty_id ? String(filters.faculty_id) : '');
        setHuruf(filters.huruf ? String(filters.huruf) : '');
    }, [filters.faculty_id, filters.huruf, filters.period_id, filters.search]);

    const applyFilters = (event?: FormEvent) => {
        event?.preventDefault();
        router.get(
            '/admin/rekap-nilai',
            {
                search: search || undefined,
                period_id: periodId || undefined,
                faculty_id: lockedFaculty ? lockedFaculty.id : facultyId || undefined,
                huruf: huruf || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setHuruf('');
        const nextPeriodId = periods[0] ? String(periods[0].id) : '';
        setPeriodId(nextPeriodId);
        if (!lockedFaculty) {
            setFacultyId('');
        }

        router.get(
            '/admin/rekap-nilai',
            {
                period_id: nextPeriodId || undefined,
                faculty_id: lockedFaculty ? lockedFaculty.id : undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleFinalize = (scoreId: number) => {
        if (confirm('Finalisasi nilai mahasiswa ini?')) {
            router.patch(`/admin/rekap-nilai/${scoreId}/finalisasi`, {}, { preserveScroll: true });
        }
    };

    const handleBulkFinalize = () => {
        if (!periodId) {
            return;
        }

        if (confirm('Finalisasi massal untuk nilai yang sudah lengkap pada periode ini?')) {
            router.post('/admin/rekap-nilai/finalisasi-massal', { period_id: periodId }, { preserveScroll: true });
        }
    };

    const exportWithPath = (path: 'ekspor' | 'ekspor-ledger') => {
        if (!periodId) {
            return;
        }

        const params = new URLSearchParams();
        params.set('period_id', periodId);
        if (lockedFaculty) {
            params.set('faculty_id', String(lockedFaculty.id));
        } else if (facultyId) {
            params.set('faculty_id', facultyId);
        }
        if (search) {
            params.set('search', search);
        }
        if (huruf) {
            params.set('huruf', huruf);
        }

        window.location.href = `/admin/rekap-nilai/${path}?${params.toString()}`;
    };

    return (
        <AppLayout title="Rekap Nilai">
            <Head title="Rekap Nilai | POS-KKN" />

            <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-emerald-600">Nilai akhir dan finalisasi</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rekap Nilai Mahasiswa</h1>
                        <p className="max-w-3xl text-sm text-slate-600">
                            Gunakan halaman ini untuk meninjau nilai akhir KKN, memfilter per periode atau fakultas, lalu memfinalisasi nilai yang sudah lengkap.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {canExport ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => exportWithPath('ekspor')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                                >
                                    <Download className="h-4 w-4" />
                                    Ekspor Excel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => exportWithPath('ekspor-ledger')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                                >
                                    <Download className="h-4 w-4" />
                                    Ekspor ledger
                                </button>
                            </>
                        ) : null}
                        {canFinalizeMass ? (
                            <button
                                type="button"
                                onClick={handleBulkFinalize}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                Finalisasi massal
                            </button>
                        ) : null}
                    </div>
                </header>

                {canExport ? (
                    <section className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">Ekspor Excel</p>
                            <p className="mt-1">
                                Dipakai untuk rekap kerja harian dan olah data lanjutan. Semua filter pada halaman ini ikut
                                terbawa ke file ekspor.
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">Ekspor ledger</p>
                            <p className="mt-1">
                                Dipakai untuk audit nilai dan pelaporan resmi. Jika periode belum dipilih, sistem akan memakai
                                periode aktif atau periode terbaru yang tersedia.
                            </p>
                        </div>
                    </section>
                ) : null}

                {stats ? (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard label="Total mahasiswa" value={stats.total_students.toLocaleString('id-ID')} />
                        <SummaryCard label="Sudah dinilai" value={stats.graded_count.toLocaleString('id-ID')} tone="amber" />
                        <SummaryCard label="Sudah final" value={stats.locked_count.toLocaleString('id-ID')} tone="emerald" />
                        <SummaryCard label="Rata-rata nilai" value={stats.average_value.toFixed(2)} />
                    </section>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Filter rekap nilai</h2>
                        <p className="text-xs text-slate-500">Filter yang tampil di sini langsung terhubung ke backend dan juga dipakai untuk ekspor.</p>
                    </div>
                    <form onSubmit={applyFilters} className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-5">
                        <label className="relative xl:col-span-2">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari NIM, nama, fakultas, prodi, atau kelompok"
                                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                            />
                        </label>
                        <select
                            value={periodId}
                            onChange={(event) => setPeriodId(event.target.value)}
                            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Pilih periode</option>
                            {periods.map((period) => (
                                <option key={period.id} value={period.id}>
                                    {period.name}
                                </option>
                            ))}
                        </select>
                        {lockedFaculty ? (
                            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                                Fakultas: {lockedFaculty.name}
                            </div>
                        ) : (
                            <select
                                value={facultyId}
                                onChange={(event) => setFacultyId(event.target.value)}
                                className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                            >
                                <option value="">Semua fakultas</option>
                                {faculties.map((faculty) => (
                                    <option key={faculty.id} value={faculty.id}>
                                        {faculty.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <select
                            value={huruf}
                            onChange={(event) => setHuruf(event.target.value)}
                            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Semua huruf nilai</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                        </select>
                        <div className="flex flex-wrap gap-3 xl:col-span-5">
                            <button
                                type="submit"
                                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                <Search className="h-4 w-4" />
                                Terapkan filter
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Daftar nilai akhir</h2>
                            <p className="text-xs text-slate-500">Nilai baru bisa difinalisasi bila skor akhir sudah tersedia dan record nilai sudah terbentuk.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mahasiswa</th>
                                    <th>Akademik</th>
                                    <th>Kelompok</th>
                                    <th>Nilai akhir</th>
                                    <th>Status</th>
                                    <th className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-16 text-center">
                                            <div className="mx-auto max-w-md space-y-2">
                                                <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
                                                <p className="text-sm font-semibold text-slate-700">Belum ada data rekap nilai</p>
                                                <p className="text-xs text-slate-500">Pilih periode aktif atau ubah filter agar data yang dibutuhkan muncul.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    scores.map((grade) => (
                                        <tr key={grade.score_id ?? `${grade.kelompok_id}-${grade.id}`}>
                                            <td>
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-slate-900">{grade.name}</p>
                                                    <p className="text-xs text-slate-500">NIM {grade.nim}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-slate-800">{grade.fakultas || '-'}</p>
                                                    <p className="text-xs text-slate-500">{grade.prodi || '-'}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <p className="text-sm text-slate-800">{grade.group_name}</p>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {grade.final_grade_value !== null ? grade.final_grade_value.toFixed(2) : '-'}
                                                    </p>
                                                    <GradeBadge grade={grade.final_grade_letter} />
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={clsx(
                                                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                                        grade.is_locked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                                                    )}
                                                >
                                                    {grade.is_locked ? 'Sudah final' : 'Draft'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    {grade.can_finalize && !grade.is_locked && grade.score_id ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFinalize(grade.score_id as number)}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                                        >
                                                            <Lock className="h-4 w-4" />
                                                            Finalisasi
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                                            {grade.is_locked ? 'Terkunci' : 'Belum siap'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                        <p className="text-xs text-slate-500">
                            Rekap nilai menampilkan data mahasiswa yang sudah berada dalam kelompok pada periode terpilih.
                        </p>
                        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                            <Users className="h-3.5 w-3.5" />
                            {scores.length.toLocaleString('id-ID')} baris
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-slate-400" />
                            Nilai yang sudah final tidak boleh diubah kembali tanpa otorisasi admin yang berwenang.
                        </div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-slate-400" />
                            Gunakan ekspor ledger untuk kebutuhan pelaporan dan audit.
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
