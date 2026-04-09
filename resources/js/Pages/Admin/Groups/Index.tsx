import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    Download,
    FileSpreadsheet,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
    UserCheck,
    Layers3,
    RefreshCw,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface Group {
    id: number;
    code: string;
    name: string;
    capacity: number;
    status: string;
    registrations_count: number;
    approved_participants_count: number;
    pending_participants_count: number;
    available_slots: number;
    ready_for_placement: boolean;
    placement_note: string;
    period?: { id: number; name: string } | null;
    governance?: {
        program_type?: string | null;
        program_type_label?: string | null;
        registration_mode_label?: string | null;
        placement_mode_label?: string | null;
    } | null;
    location?: {
        id: number;
        village_name: string;
        district_name?: string | null;
        regency_name?: string | null;
        full_name: string;
    } | null;
    main_lecturer?: { id: number; name: string } | null;
}

interface Summary {
    total_groups: number;
    active_groups: number;
    draft_groups: number;
    groups_without_main_lecturer: number;
    groups_ready_for_placement: number;
    total_available_slots: number;
}

interface Props {
    groups: {
        data: Group[];
        meta: PaginationMeta;
    };
    periods: Array<{ id: number; name: string }>;
    locations: Array<{ id: number; village_name: string; full_name: string }>;
    lecturers: Array<{ id: number; name: string }>;
    filters: {
        search?: string;
        period_id?: string | number;
        status?: string;
    };
    ui?: {
        can_manage?: boolean;
    };
    workflow?: {
        has_locations?: boolean;
        has_periods?: boolean;
        locations_managed_automatically?: boolean;
    };
    summary: Summary;
}

type GroupFormData = {
    period_id: string;
    location_id: string;
    lead_lecturer_id: string;
    name: string;
    capacity: string;
    status: 'draft' | 'active' | 'closed';
};

const initialFormData: GroupFormData = {
    period_id: '',
    location_id: '',
    lead_lecturer_id: '',
    name: '',
    capacity: '10',
    status: 'draft',
};

function statusLabel(status: string): string {
    if (status === 'active') return 'Aktif';
    if (status === 'closed') return 'Ditutup';

    return 'Draf';
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

function PlacementBadge({ ready }: { ready: boolean }) {
    return (
        <span
            className={
                ready
                    ? 'inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700'
                    : 'inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700'
            }
        >
            {ready ? 'Siap auto-placement' : 'Belum siap'}
        </span>
    );
}

export default function GroupsIndex({
    groups,
    periods,
    locations,
    lecturers,
    filters,
    ui,
    workflow,
    summary,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [periodId, setPeriodId] = useState(filters.period_id ? String(filters.period_id) : '');
    const [status, setStatus] = useState(filters.status ? String(filters.status) : '');
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const form = useForm<GroupFormData>(initialFormData);
    const importForm = useForm<{ file: File | null }>({ file: null });

    const canManage = ui?.can_manage ?? false;
    const hasLocations = workflow?.has_locations ?? locations.length > 0;
    const hasPeriods = workflow?.has_periods ?? periods.length > 0;
    const canImport = canManage && hasPeriods;

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const normalizedSearch = filters.search ?? '';
            const normalizedPeriodId = filters.period_id ? String(filters.period_id) : '';
            const normalizedStatus = filters.status ? String(filters.status) : '';

            if (search !== normalizedSearch || periodId !== normalizedPeriodId || status !== normalizedStatus) {
                router.get(
                    route('admin.kelompok.index'),
                    {
                        search: search || undefined,
                        period_id: periodId || undefined,
                        status: status || undefined,
                    },
                    { preserveState: true, preserveScroll: true, replace: true },
                );
            }
        }, 250);

        return () => window.clearTimeout(timer);
    }, [filters.period_id, filters.search, filters.status, periodId, search, status]);

    const selectedPeriod = useMemo(
        () => periods.find((period) => String(period.id) === form.data.period_id) ?? null,
        [form.data.period_id, periods],
    );

    const selectedLocation = useMemo(
        () => locations.find((location) => String(location.id) === form.data.location_id) ?? null,
        [form.data.location_id, locations],
    );

    const openCreateForm = () => {
        setEditingGroup(null);
        form.reset();
        form.clearErrors();
        setShowForm(true);
    };

    const openEditForm = (group: Group) => {
        setEditingGroup(group);
        form.clearErrors();
        form.setData({
            period_id: String(group.period?.id ?? ''),
            location_id: String(group.location?.id ?? ''),
            lead_lecturer_id: String(group.main_lecturer?.id ?? ''),
            name: group.name,
            capacity: String(group.capacity),
            status: (group.status as GroupFormData['status']) ?? 'draft',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingGroup(null);
        form.reset();
        form.clearErrors();
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload = {
            ...form.data,
            nama_kelompok: form.data.name,
            lecturers: form.data.lead_lecturer_id
                ? [{ id: Number(form.data.lead_lecturer_id), role: 'Ketua' }]
                : [],
        };

        if (editingGroup) {
            router.put(route('admin.kelompok.update', editingGroup.id), payload, {
                preserveScroll: true,
                onSuccess: () => closeForm(),
            });

            return;
        }

        router.post(route('admin.kelompok.store'), payload, {
            preserveScroll: true,
            onSuccess: () => closeForm(),
        });
    };

    const submitImport = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        importForm.post(route('admin.kelompok.import'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => importForm.reset(),
        });
    };

    const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        importForm.setData('file', event.target.files?.[0] ?? null);
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(route('admin.kelompok.destroy', deletingId), {
            preserveScroll: true,
            onSuccess: () => setDeletingId(null),
        });
    };

    const resetFilters = () => {
        setSearch('');
        setPeriodId('');
        setStatus('');
        router.get(route('admin.kelompok.index'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout title="Kelompok KKN">
            <Head title="Kelompok KKN" />

            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Modul Operasional</p>
                            <h1 className="text-3xl font-bold text-slate-900">Kelompok KKN</h1>
                            <p className="max-w-3xl text-sm text-slate-600">
                                Halaman ini dipakai untuk menyiapkan wadah operasional KKN. Admin membuat kelompok,
                                menentukan periode dan lokasi, lalu sistem memakai kelompok aktif untuk penempatan
                                mahasiswa reguler setelah pendaftaran disetujui.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={route('admin.kelompok.template')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <Download className="h-4 w-4" />
                                Unduh Template
                            </Link>
                            <button
                                type="button"
                                onClick={openCreateForm}
                                disabled={!canManage || !hasPeriods}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Kelompok
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                            <p className="font-semibold">Alur sesuai panduan</p>
                            <p className="mt-1 text-emerald-800">
                                Mahasiswa reguler tidak memilih kelompok sendiri. Kelompok aktif dipakai sistem setelah admin
                                menyetujui pendaftaran.
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">Import kelompok</p>
                            <p className="mt-1">
                                File kelompok menjadi pintu bulk utama. Data lokasi akan disesuaikan otomatis dari desa,
                                kecamatan, dan kabupaten pada tiap baris.
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">Penugasan DPL</p>
                            <p className="mt-1">
                                DPL dapat dipasang saat kelompok masih draf atau setelah aktif. Gunakan modul penugasan DPL
                                untuk mengatur pembina per periode dan wilayah.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <SummaryCard label="Total Kelompok" value={summary.total_groups} />
                    <SummaryCard label="Kelompok Aktif" value={summary.active_groups} />
                    <SummaryCard label="Kelompok Draf" value={summary.draft_groups} />
                    <SummaryCard label="Siap Auto-placement" value={summary.groups_ready_for_placement} />
                    <SummaryCard label="Belum Ada DPL Utama" value={summary.groups_without_main_lecturer} />
                    <SummaryCard label="Sisa Kursi" value={summary.total_available_slots} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-base font-semibold text-slate-900">Import Kelompok dari Excel</h2>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                            Gunakan template resmi untuk membuat atau memperbarui kelompok secara massal. Lokasi akan dibuat
                            atau diperbarui otomatis berdasarkan data wilayah pada file.
                        </p>
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">Format minimal file</p>
                            <p className="mt-1">
                                `kode_kelompok`, `nama_kelompok`, `periode`, `desa`, `kecamatan`, `kabupaten`, `kapasitas`,
                                dan `status`.
                            </p>
                        </div>

                        <form onSubmit={submitImport} className="mt-4 flex flex-col gap-3 md:flex-row">
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv,.txt"
                                onChange={handleImportFileChange}
                                className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                required
                            />
                            <button
                                type="submit"
                                disabled={!canImport || importForm.processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {importForm.processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                                Proses Import
                            </button>
                        </form>

                        {!hasPeriods ? (
                            <p className="mt-3 text-sm text-rose-600">Buat periode KKN terlebih dahulu sebelum melakukan import kelompok.</p>
                        ) : null}
                        {hasPeriods ? (
                            <p className="mt-3 text-xs text-slate-500">
                                Cukup satu file kelompok untuk bulk operasional. Sistem akan menyesuaikan data lokasi otomatis
                                dari setiap baris impor.
                            </p>
                        ) : null}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2">
                            <Layers3 className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-base font-semibold text-slate-900">Checklist Kelompok Siap Pakai</h2>
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Periode kelompok aktif dan sesuai skema program.</li>
                            <li>Lokasi lengkap sampai kabupaten/kota.</li>
                            <li>Status kelompok diubah menjadi aktif.</li>
                            <li>Kapasitas cukup untuk penempatan mahasiswa.</li>
                            <li>DPL utama sebaiknya sudah ditetapkan untuk pembinaan.</li>
                            <li>Gunakan tombol “Unduh Template” agar susunan kolom impor tetap sesuai format sistem.</li>
                        </ul>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Daftar Kelompok</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Gunakan filter untuk melihat kesiapan kelompok per periode, lokasi, dan status.
                            </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                            <div className="relative md:col-span-2">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari nama kelompok, kode, lokasi, atau DPL"
                                    className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700"
                                />
                            </div>
                            <select
                                value={periodId}
                                onChange={(event) => setPeriodId(event.target.value)}
                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                            >
                                <option value="">Semua periode</option>
                                {periods.map((period) => (
                                    <option key={period.id} value={period.id}>
                                        {period.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                >
                                    <option value="">Semua status</option>
                                    <option value="draft">Draf</option>
                                    <option value="active">Aktif</option>
                                    <option value="closed">Ditutup</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[1200px] border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Kelompok</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Periode</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lokasi</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Peserta</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">DPL Utama</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Kesiapan</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.data.map((group) => (
                                    <tr key={group.id} className="border-b border-slate-100 align-top hover:bg-slate-50/60">
                                        <td className="px-4 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                                                <p className="text-xs text-slate-500">{group.code}</p>
                                                <p className="text-xs text-slate-500">
                                                    Kapasitas {group.capacity} orang · sisa {group.available_slots}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-900">{group.period?.name || '-'}</p>
                                                <p className="text-xs text-slate-500">{group.governance?.program_type_label || '-'}</p>
                                                <p className="text-xs text-slate-500">{group.governance?.placement_mode_label || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-sm text-slate-900">{group.location?.full_name || '-'}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {group.location?.district_name || '-'} · {group.location?.regency_name || '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                {statusLabel(group.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="space-y-1 text-sm text-slate-700">
                                                <p>Total tercatat: {group.registrations_count}</p>
                                                <p>Disetujui: {group.approved_participants_count}</p>
                                                <p>Menunggu review: {group.pending_participants_count}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-start gap-2">
                                                <UserCheck className="mt-0.5 h-4 w-4 text-slate-400" />
                                                <div>
                                                    <p className="text-sm text-slate-900">{group.main_lecturer?.name || 'Belum ditetapkan'}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {group.main_lecturer ? 'DPL utama aktif' : 'Tetapkan dari form atau modul penugasan DPL'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="space-y-2">
                                                <PlacementBadge ready={group.ready_for_placement} />
                                                <p className="max-w-xs text-xs leading-5 text-slate-500">{group.placement_note}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={route('admin.kelompok.show', group.id)}
                                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Detail
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(group)}
                                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <span className="inline-flex items-center gap-1">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingId(group.id)}
                                                    className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                >
                                                    <span className="inline-flex items-center gap-1">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Hapus
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {groups.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                                            Belum ada data kelompok yang sesuai dengan filter saat ini.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-500">
                            Menampilkan {groups.meta.from || 0} - {groups.meta.to || 0} dari {groups.meta.total} kelompok.
                        </p>
                        <Pagination meta={groups.meta} />
                    </div>
                </section>
            </div>

            <Modal show={showForm} onClose={closeForm} title={editingGroup ? 'Edit Kelompok' : 'Tambah Kelompok'}>
                <form onSubmit={submitForm} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Periode</label>
                            <select
                                value={form.data.period_id}
                                onChange={(event) => form.setData('period_id', event.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                required
                            >
                                <option value="">Pilih periode</option>
                                {periods.map((period) => (
                                    <option key={period.id} value={period.id}>
                                        {period.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.period_id ? <p className="text-xs text-rose-600">{form.errors.period_id}</p> : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Lokasi</label>
                            <select
                                value={form.data.location_id}
                                onChange={(event) => form.setData('location_id', event.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                required
                            >
                                <option value="">Pilih lokasi</option>
                                {locations.map((location) => (
                                    <option key={location.id} value={location.id}>
                                        {location.full_name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.location_id ? <p className="text-xs text-rose-600">{form.errors.location_id}</p> : null}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nama kelompok</label>
                        <input
                            type="text"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                            placeholder="Contoh: Kelompok Anggrek 01"
                            required
                        />
                        {form.errors.name ? <p className="text-xs text-rose-600">{form.errors.name}</p> : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Kapasitas</label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={form.data.capacity}
                                onChange={(event) => form.setData('capacity', event.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                required
                            />
                            {form.errors.capacity ? <p className="text-xs text-rose-600">{form.errors.capacity}</p> : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <select
                                value={form.data.status}
                                onChange={(event) => form.setData('status', event.target.value as GroupFormData['status'])}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                            >
                                <option value="draft">Draf</option>
                                <option value="active">Aktif</option>
                                <option value="closed">Ditutup</option>
                            </select>
                            {form.errors.status ? <p className="text-xs text-rose-600">{form.errors.status}</p> : null}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">DPL utama</label>
                            <select
                                value={form.data.lead_lecturer_id}
                                onChange={(event) => form.setData('lead_lecturer_id', event.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                            >
                                <option value="">Belum ditetapkan</option>
                                {lecturers.map((lecturer) => (
                                    <option key={lecturer.id} value={lecturer.id}>
                                        {lecturer.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.lead_lecturer_id ? <p className="text-xs text-rose-600">{form.errors.lead_lecturer_id}</p> : null}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="font-semibold text-slate-900">Preview</p>
                        <p className="mt-1">
                            {selectedPeriod ? selectedPeriod.name : 'Periode belum dipilih'} ·{' '}
                            {selectedLocation ? selectedLocation.full_name : 'Lokasi belum dipilih'}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeForm}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {editingGroup ? 'Simpan Perubahan' : 'Simpan Kelompok'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={deletingId !== null}
                title="Hapus kelompok"
                message="Kelompok hanya dapat dihapus jika tidak lagi dipakai peserta aktif."
                confirmLabel="Hapus"
                onConfirm={handleDelete}
                onClose={() => setDeletingId(null)}
            />
        </AppLayout>
    );
}
