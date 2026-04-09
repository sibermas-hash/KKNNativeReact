import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCheck,
    Clock3,
    Download,
    FileSpreadsheet,
    FilterX,
    IdCard,
    Search,
    Users,
    XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface Registration {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string | null;
    rejection_reason?: string | null;
    revision_count?: number;
    resubmitted_at?: string | null;
    student: {
        nim: string;
        name: string;
        faculty?: { name: string };
        program?: { name: string };
    };
    period: { name: string; id: number | null };
    group?: { name: string };
    registration_date: string;
}

interface FacultyStat {
    faculty_name: string;
    count: number;
}

interface Props {
    registrations: {
        data: Registration[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
        status?: string;
    };
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        by_faculty: FacultyStat[];
    };
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function StatusBadge({ status }: { status: Registration['status'] }) {
    const label = {
        pending: 'Menunggu review',
        approved: 'Disetujui',
        rejected: 'Ditolak',
    }[status];

    return (
        <span
            className={clsx(
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                status === 'pending' && 'bg-amber-100 text-amber-700',
                status === 'approved' && 'bg-emerald-100 text-emerald-700',
                status === 'rejected' && 'bg-rose-100 text-rose-700',
            )}
        >
            {label}
        </span>
    );
}

function SummaryCard({
    label,
    value,
    tone = 'slate',
}: {
    label: string;
    value: number;
    tone?: 'slate' | 'amber' | 'emerald' | 'rose';
}) {
    const toneClass = {
        slate: 'bg-slate-50 text-slate-700',
        amber: 'bg-amber-50 text-amber-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        rose: 'bg-rose-50 text-rose-700',
    }[tone];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <span className={clsx('rounded-full px-2 py-1 text-[10px] font-semibold', toneClass)}>
                    {value.toLocaleString('id-ID')}
                </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{value.toLocaleString('id-ID')}</p>
        </div>
    );
}

export default function RegistrationsIndex({ registrations, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? '');
    }, [filters.search, filters.status]);

    useEffect(() => {
        setSelectedIds([]);
    }, [registrations.meta.current_page, registrations.meta.total]);

    const pendingIds = useMemo(
        () => registrations.data.filter((registration) => registration.status === 'pending').map((registration) => registration.id),
        [registrations.data],
    );

    const applyFilters = (event?: FormEvent) => {
        event?.preventDefault();
        router.get(
            '/admin/pendaftaran',
            {
                search: search || undefined,
                status: status || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        router.get('/admin/pendaftaran', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleStatusUpdate = (id: number, newStatus: 'approved' | 'rejected') => {
        if (newStatus === 'approved') {
            if (confirm('Setujui pendaftaran ini?')) {
                router.patch(`/admin/pendaftaran/${id}/setujui`, {}, { preserveScroll: true });
            }

            return;
        }

        const notes = prompt('Alasan penolakan wajib diisi:');
        if (notes) {
            router.patch(`/admin/pendaftaran/${id}/tolak`, { notes }, { preserveScroll: true });
        }
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) {
            return;
        }

        if (confirm(`Setujui ${selectedIds.length} pendaftaran terpilih?`)) {
            router.post(
                '/admin/pendaftaran/setuju-massal',
                { ids: selectedIds },
                {
                    preserveScroll: true,
                    onSuccess: () => setSelectedIds([]),
                },
            );
        }
    };

    const handleBulkReject = () => {
        if (selectedIds.length === 0) {
            return;
        }

        const notes = prompt(`Alasan penolakan untuk ${selectedIds.length} pendaftaran:`);
        if (notes) {
            router.post(
                '/admin/pendaftaran/tolak-massal',
                { ids: selectedIds, notes },
                {
                    preserveScroll: true,
                    onSuccess: () => setSelectedIds([]),
                },
            );
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        window.location.href = `/admin/pendaftaran/ekspor${params.toString() ? `?${params.toString()}` : ''}`;
    };

    const handleBpjsExport = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        window.location.href = `/admin/pendaftaran/ekspor-bpjs${params.toString() ? `?${params.toString()}` : ''}`;
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
    };

    const toggleSelectAll = () => {
        setSelectedIds((current) => (current.length === pendingIds.length ? [] : pendingIds));
    };

    return (
        <AppLayout title="Pendaftaran Mahasiswa">
            <Head title="Pendaftaran Mahasiswa | POS-KKN" />

            <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-emerald-600">Modul operasional admin</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pendaftaran Mahasiswa</h1>
                        <p className="max-w-3xl text-sm text-slate-600">
                            Review pendaftaran, verifikasi berkas, approval massal, dan ekspor data peserta dilakukan dari satu meja kerja ini.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleBpjsExport}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                        >
                            <IdCard className="h-4 w-4" />
                            Ekspor BPJS
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            <Download className="h-4 w-4" />
                            Ekspor pendaftaran
                        </button>
                    </div>
                </header>

                <section className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Ekspor pendaftaran</p>
                        <p className="mt-1">
                            Dipakai untuk daftar peserta hasil review admin. File ini mengikuti filter pencarian dan status
                            yang sedang aktif di halaman.
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Ekspor BPJS</p>
                        <p className="mt-1">
                            Dipakai untuk kebutuhan administrasi BPJS. Fokus utama file ini adalah biodata peserta yang
                            sudah siap diproses secara operasional.
                        </p>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard label="Total pendaftaran" value={stats.total} />
                    <SummaryCard label="Menunggu review" value={stats.pending} tone="amber" />
                    <SummaryCard label="Disetujui" value={stats.approved} tone="emerald" />
                    <SummaryCard label="Ditolak" value={stats.rejected} tone="rose" />
                </section>

                {stats.by_faculty.length > 0 ? (
                    <section className="rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">Sebaran per fakultas</h2>
                                <p className="text-xs text-slate-500">Ringkasan pendaftar yang sedang masuk ke meja review.</p>
                            </div>
                        </div>
                        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                            {stats.by_faculty.map((item) => (
                                <div key={item.faculty_name} className="bg-white px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.faculty_name}</p>
                                    <p className="mt-1 text-xl font-bold text-slate-900">{item.count.toLocaleString('id-ID')}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}

                {selectedIds.length > 0 ? (
                    <section className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">{selectedIds.length} pendaftaran dipilih</p>
                            <p className="text-xs text-emerald-700">Gunakan aksi massal untuk mempercepat review berkas yang statusnya masih menunggu.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleBulkApprove}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                <CheckCheck className="h-4 w-4" />
                                Setujui massal
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkReject}
                                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                                <XCircle className="h-4 w-4" />
                                Tolak massal
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                            >
                                <FilterX className="h-4 w-4" />
                                Bersihkan pilihan
                            </button>
                        </div>
                    </section>
                ) : null}

                <section className="rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Filter pendaftaran</h2>
                        <p className="text-xs text-slate-500">Cari peserta, saring status review, lalu lanjutkan ke detail bila perlu.</p>
                    </div>
                    <form onSubmit={applyFilters} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
                        <label className="relative block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari NIM, nama, fakultas, atau prodi"
                                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                            />
                        </label>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                        >
                            <option value="">Semua status</option>
                            <option value="pending">Menunggu review</option>
                            <option value="approved">Disetujui</option>
                            <option value="rejected">Ditolak</option>
                        </select>
                        <button
                            type="submit"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            <Search className="h-4 w-4" />
                            Terapkan
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                        >
                            <FilterX className="h-4 w-4" />
                            Reset
                        </button>
                    </form>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Daftar pendaftaran</h2>
                            <p className="text-xs text-slate-500">Status, periode, dan penempatan kelompok ditinjau dari tabel ini.</p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            <Users className="h-3.5 w-3.5" />
                            {registrations.meta.total.toLocaleString('id-ID')} data
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table>
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={pendingIds.length > 0 && selectedIds.length === pendingIds.length}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                    </th>
                                    <th>Mahasiswa</th>
                                    <th>Akademik</th>
                                    <th>Periode</th>
                                    <th>Kelompok</th>
                                    <th>Tanggal daftar</th>
                                    <th>Status</th>
                                    <th className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-16 text-center">
                                            <div className="mx-auto max-w-md space-y-2">
                                                <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
                                                <p className="text-sm font-semibold text-slate-700">Belum ada data pendaftaran</p>
                                                <p className="text-xs text-slate-500">Ubah filter atau tunggu mahasiswa mengajukan pendaftaran baru.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    registrations.data.map((registration) => (
                                        <tr key={registration.id}>
                                            <td className="text-center">
                                                {registration.status === 'pending' ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(registration.id)}
                                                        onChange={() => toggleSelect(registration.id)}
                                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                ) : null}
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-slate-900">{registration.student?.name}</p>
                                                    <p className="text-xs text-slate-500">NIM {registration.student?.nim}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-slate-800">{registration.student?.faculty?.name || '-'}</p>
                                                    <p className="text-xs text-slate-500">{registration.student?.program?.name || '-'}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <p className="text-sm text-slate-800">{registration.period?.name || '-'}</p>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-slate-800">{registration.group?.name || 'Belum ditempatkan'}</p>
                                                    {registration.revision_count ? (
                                                        <p className="text-xs text-slate-500">
                                                            Revisi {registration.revision_count}
                                                            {registration.resubmitted_at ? ` • ${formatDateTime(registration.resubmitted_at)}` : ''}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                    <Clock3 className="h-4 w-4 text-slate-400" />
                                                    {formatDateTime(registration.registration_date)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <StatusBadge status={registration.status} />
                                                    {registration.status === 'rejected' && registration.rejection_reason ? (
                                                        <p className="max-w-xs text-xs text-rose-700">{registration.rejection_reason}</p>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/admin/pendaftaran/${registration.id}`}
                                                        className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                                                    >
                                                        Detail
                                                    </Link>
                                                    {registration.status === 'pending' ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusUpdate(registration.id, 'approved')}
                                                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                                            >
                                                                <CheckCheck className="h-4 w-4" />
                                                                Setujui
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusUpdate(registration.id, 'rejected')}
                                                                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                                Tolak
                                                            </button>
                                                        </>
                                                    ) : null}
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
                            Menampilkan {registrations.meta.from ?? 0} - {registrations.meta.to ?? 0} dari {registrations.meta.total.toLocaleString('id-ID')} pendaftaran.
                        </p>
                        <Pagination meta={registrations.meta} />
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
