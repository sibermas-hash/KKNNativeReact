import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    FileSpreadsheet,
    MapPinned,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    Upload,
    UserPlus,
    Users,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

interface DosenOption {
    id: number;
    nama: string;
    nip: string;
    is_cpns?: boolean;
    is_tugas_belajar?: boolean;
    is_workshop_passed?: boolean;
}

interface PeriodOption {
    id: number;
    name: string;
    periode?: number | null;
    jenis?: string | null;
}

interface AssignmentRow {
    id: number;
    max_groups: number;
    current_groups: number;
    remaining_slots: number;
    is_active: boolean;
    dosen: DosenOption;
    period: PeriodOption;
}

interface GroupRow {
    id: number;
    name: string;
    code: string;
    status: string;
    dpl_period_id: number | null;
    period: PeriodOption;
    location?: {
        village_name?: string | null;
        district_name?: string | null;
        regency_name?: string | null;
    } | null;
    dpl?: {
        id: number;
        nama: string;
        nip: string;
    } | null;
}

interface DistrictOption {
    id: string;
    name: string;
    sub_districts_count?: number;
    district_id?: string;
    district_name?: string;
    regency_name?: string | null;
}

interface DistrictCoordinatorRow {
    id: number;
    district?: {
        id: number | string;
        name: string;
    };
    dpl_period?: {
        id: number;
        dosen: {
            nama: string;
        };
    };
    district_name?: string;
    regency_name?: string | null;
    dosen?: {
        nama: string;
        nip?: string;
    };
    period?: PeriodOption;
}

interface Summary {
    active_assignments: number;
    groups_total: number;
    groups_without_dpl: number;
    active_groups_without_dpl: number;
    district_coordinators: number;
}

interface Props {
    allDosen: DosenOption[];
    allPeriods: PeriodOption[];
    groups: GroupRow[];
    districts: DistrictOption[];
    assignments: AssignmentRow[];
    currentCoordinators?: DistrictCoordinatorRow[];
    districtCoordinators?: DistrictCoordinatorRow[];
    filters?: {
        search?: string;
    };
    workflow?: {
        has_locations?: boolean;
        has_groups?: boolean;
    };
    summary?: Summary;
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

function statusLabel(status: string): string {
    if (status === 'active') return 'Aktif';
    if (status === 'closed') return 'Ditutup';

    return 'Draf';
}

export default function Assignment({
    allDosen,
    allPeriods,
    groups,
    districts,
    assignments,
    currentCoordinators = [],
    districtCoordinators = [],
    filters,
    workflow,
    summary,
}: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');

    const periodForm = useForm({
        dosen_id: '',
        period_id: '',
        max_groups: 10 as number,
    });

    const groupForm = useForm({
        group_id: '',
        dpl_period_id: '',
    });

    const coordForm = useForm({
        district_id: '',
        dpl_period_id: '',
    });

    const importForm = useForm({
        file: null as File | null,
    });

    const coordinatorRows = currentCoordinators.length > 0 ? currentCoordinators : districtCoordinators;
    const hasGroups = workflow?.has_groups ?? groups.length > 0;

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const normalizedSearch = filters?.search ?? '';

            if (search !== normalizedSearch) {
                router.get(route('admin.dpl.assignment'), { search: search || undefined }, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }
        }, 250);

        return () => window.clearTimeout(timer);
    }, [filters?.search, search]);

    const selectedDosen = useMemo(
        () => allDosen.find((dosen) => String(dosen.id) === periodForm.data.dosen_id) ?? null,
        [allDosen, periodForm.data.dosen_id],
    );

    const selectedGroup = useMemo(
        () => groups.find((group) => String(group.id) === groupForm.data.group_id) ?? null,
        [groupForm.data.group_id, groups],
    );

    const availableAssignments = useMemo(() => {
        if (!selectedGroup?.period?.id) {
            return [];
        }

        return assignments.filter((assignment) => {
            const samePeriod = assignment.period.id === selectedGroup.period.id;
            const isCurrent = selectedGroup.dpl_period_id === assignment.id;

            return samePeriod && assignment.is_active && (assignment.remaining_slots > 0 || isCurrent);
        });
    }, [assignments, selectedGroup]);

    const filteredAssignments = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return assignments;
        }

        return assignments.filter((assignment) =>
            assignment.dosen.nama.toLowerCase().includes(query)
            || assignment.dosen.nip.includes(query)
            || assignment.period.name.toLowerCase().includes(query),
        );
    }, [assignments, search]);

    const filteredGroups = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return groups;
        }

        return groups.filter((group) =>
            group.name.toLowerCase().includes(query)
            || group.code.toLowerCase().includes(query)
            || group.period?.name?.toLowerCase().includes(query)
            || group.location?.district_name?.toLowerCase().includes(query)
            || group.location?.regency_name?.toLowerCase().includes(query),
        );
    }, [groups, search]);

    const filteredCoordinators = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return coordinatorRows;
        }

        return coordinatorRows.filter((coordinator) =>
            (coordinator.district?.name || coordinator.district_name || '').toLowerCase().includes(query)
            || (coordinator.regency_name || '').toLowerCase().includes(query)
            || (coordinator.dpl_period?.dosen.nama || coordinator.dosen?.nama || '').toLowerCase().includes(query),
        );
    }, [coordinatorRows, search]);

    const submitPeriodAssignment = (event: FormEvent) => {
        event.preventDefault();
        periodForm.post(route('admin.dpl.assign-period'), {
            preserveScroll: true,
            onSuccess: () => periodForm.reset('dosen_id'),
        });
    };

    const submitGroupAssignment = (event: FormEvent) => {
        event.preventDefault();

        groupForm.post(route('admin.dpl.assign-group', { group: groupForm.data.group_id }), {
            preserveScroll: true,
            onSuccess: () => groupForm.reset('group_id'),
        });
    };

    const submitDistrictCoordinator = (event: FormEvent) => {
        event.preventDefault();

        coordForm.post(route('admin.dpl.assign-district'), {
            preserveScroll: true,
            onSuccess: () => coordForm.reset(),
        });
    };

    const submitImport = (event: FormEvent) => {
        event.preventDefault();

        importForm.post(route('admin.dpl.impor'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => importForm.reset(),
        });
    };

    const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        importForm.setData('file', event.target.files?.[0] ?? null);
    };

    const deleteAssignment = (id: number) => {
        if (!window.confirm('Hapus aktivasi DPL dari periode ini?')) {
            return;
        }

        router.patch(route('admin.dpl.lepas-periode', id), {}, { preserveScroll: true });
    };

    const deleteCoordinator = (id: number) => {
        if (!window.confirm('Nonaktifkan penugasan koordinator wilayah ini?')) {
            return;
        }

        router.patch(route('admin.dpl.lepas-wilayah', id), {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Penugasan DPL">
            <Head title="Penugasan DPL" />

            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Modul Operasional</p>
                        <h1 className="text-3xl font-bold text-slate-900">Penugasan DPL</h1>
                        <p className="max-w-3xl text-sm text-slate-600">
                            Modul ini dipakai untuk mengaktifkan dosen pembimbing pada periode tertentu, menempatkan DPL ke
                            kelompok, dan menetapkan koordinator wilayah. Alur kerjanya mengikuti urutan operasional:
                            siapkan kelompok, aktifkan DPL pada periode, lalu tetapkan pembimbing kelompok dan koordinator wilayah.
                        </p>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">1. Aktivasi per periode</p>
                            <p className="mt-1">Dosen diaktifkan dulu pada periode KKN agar sistem tahu kuota kelompok yang boleh dibina.</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">2. Penugasan ke kelompok</p>
                            <p className="mt-1">DPL hanya boleh ditugaskan ke kelompok pada periode yang sama dan sesuai kapasitas pembinaan.</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">3. Koordinator wilayah</p>
                            <p className="mt-1">Koordinator kecamatan diambil dari DPL yang sudah aktif, lalu dipasangkan ke wilayah kerja yang sesuai.</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <SummaryCard label="DPL Aktif" value={summary?.active_assignments ?? assignments.length} />
                    <SummaryCard label="Total Kelompok" value={summary?.groups_total ?? groups.length} />
                    <SummaryCard label="Kelompok Belum Ada DPL" value={summary?.groups_without_dpl ?? groups.filter((group) => !group.dpl_period_id).length} />
                    <SummaryCard label="Kelompok Aktif Belum Ada DPL" value={summary?.active_groups_without_dpl ?? groups.filter((group) => group.status === 'active' && !group.dpl_period_id).length} />
                    <SummaryCard label="Koordinator Wilayah" value={summary?.district_coordinators ?? coordinatorRows.length} />
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-base font-semibold text-slate-900">Aktivasi DPL pada Periode</h2>
                        </div>

                        <form onSubmit={submitPeriodAssignment} className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Dosen</label>
                                <select
                                    value={periodForm.data.dosen_id}
                                    onChange={(event) => periodForm.setData('dosen_id', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                    required
                                >
                                    <option value="">Pilih dosen</option>
                                    {allDosen.map((dosen) => (
                                        <option key={dosen.id} value={dosen.id}>
                                            {dosen.nama} ({dosen.nip})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedDosen ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                    <p className="font-semibold text-slate-900">Keterangan dosen</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>Lulus workshop: {selectedDosen.is_workshop_passed ? 'Ya' : 'Belum'}</li>
                                        <li>Status CPNS: {selectedDosen.is_cpns ? 'Ya' : 'Tidak'}</li>
                                        <li>Tugas belajar: {selectedDosen.is_tugas_belajar ? 'Ya' : 'Tidak'}</li>
                                    </ul>
                                </div>
                            ) : null}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Periode</label>
                                    <select
                                        value={periodForm.data.period_id}
                                        onChange={(event) => periodForm.setData('period_id', event.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                        required
                                    >
                                        <option value="">Pilih periode</option>
                                        {allPeriods.map((period) => (
                                            <option key={period.id} value={period.id}>
                                                {period.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Kuota kelompok</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={periodForm.data.max_groups}
                                        onChange={(event) => periodForm.setData('max_groups', parseInt(event.target.value, 10) || 0)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={periodForm.processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {periodForm.processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                                    Aktifkan DPL
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-base font-semibold text-slate-900">Penugasan DPL ke Kelompok</h2>
                        </div>

                        <form onSubmit={submitGroupAssignment} className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Kelompok</label>
                                <select
                                    value={groupForm.data.group_id}
                                    onChange={(event) => {
                                        groupForm.setData('group_id', event.target.value);
                                        groupForm.setData('dpl_period_id', '');
                                    }}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                    required
                                >
                                    <option value="">Pilih kelompok</option>
                                    {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.code} · {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedGroup ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                    <p className="font-semibold text-slate-900">Keterangan kelompok</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>Periode: {selectedGroup.period?.name || '-'}</li>
                                        <li>Status: {statusLabel(selectedGroup.status)}</li>
                                        <li>
                                            Lokasi: {selectedGroup.location?.district_name || '-'} · {selectedGroup.location?.regency_name || '-'}
                                        </li>
                                        <li>DPL saat ini: {selectedGroup.dpl?.nama || 'Belum ditetapkan'}</li>
                                    </ul>
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">DPL aktif yang tersedia</label>
                                <select
                                    value={groupForm.data.dpl_period_id}
                                    onChange={(event) => groupForm.setData('dpl_period_id', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                    disabled={!selectedGroup}
                                    required
                                >
                                    <option value="">{selectedGroup ? 'Pilih DPL aktif' : 'Pilih kelompok terlebih dahulu'}</option>
                                    {availableAssignments.map((assignment) => (
                                        <option key={assignment.id} value={assignment.id}>
                                            {assignment.dosen.nama} · {assignment.period.name} · sisa {assignment.remaining_slots} kelompok
                                        </option>
                                    ))}
                                </select>
                                {selectedGroup && availableAssignments.length === 0 ? (
                                    <p className="text-xs text-rose-600">Belum ada DPL aktif pada periode kelompok ini yang masih memiliki slot.</p>
                                ) : null}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={groupForm.processing || !selectedGroup || availableAssignments.length === 0}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {groupForm.processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                                    Simpan Penugasan
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2">
                            <MapPinned className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-base font-semibold text-slate-900">Koordinator Wilayah</h2>
                        </div>

                        <form onSubmit={submitDistrictCoordinator} className="mt-4 grid gap-4 md:grid-cols-[1fr,1fr,auto]">
                            <select
                                value={coordForm.data.district_id}
                                onChange={(event) => coordForm.setData('district_id', event.target.value)}
                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                required
                            >
                                <option value="">Pilih kecamatan</option>
                                {districts.map((district) => (
                                    <option key={district.id} value={district.id}>
                                        {district.name}{district.regency_name ? ` · ${district.regency_name}` : ''}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={coordForm.data.dpl_period_id}
                                onChange={(event) => coordForm.setData('dpl_period_id', event.target.value)}
                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                required
                            >
                                <option value="">Pilih DPL aktif</option>
                                {assignments.filter((assignment) => assignment.is_active).map((assignment) => (
                                    <option key={assignment.id} value={assignment.id}>
                                        {assignment.dosen.nama} · {assignment.period.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                disabled={coordForm.processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {coordForm.processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                                Tetapkan
                            </button>
                        </form>

                        <div className="mt-5 overflow-x-auto">
                            <table className="w-full min-w-[700px] border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Kecamatan</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Kabupaten/Kota</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">DPL</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Periode</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCoordinators.map((coordinator) => (
                                        <tr key={coordinator.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                            <td className="px-4 py-4 text-sm text-slate-900">
                                                {coordinator.district?.name || coordinator.district_name || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{coordinator.regency_name || '-'}</td>
                                            <td className="px-4 py-4 text-sm text-slate-900">
                                                {coordinator.dpl_period?.dosen.nama || coordinator.dosen?.nama || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{coordinator.period?.name || '-'}</td>
                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => deleteCoordinator(coordinator.id)}
                                                    className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                >
                                                    <span className="inline-flex items-center gap-1">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Nonaktifkan
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCoordinators.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                                                Belum ada koordinator wilayah yang aktif.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-base font-semibold text-slate-900">Import Penugasan DPL</h2>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                            Gunakan file Excel jika penugasan DPL dilakukan sekaligus. Import baru bisa dipakai setelah data kelompok tersedia.
                        </p>

                        <form onSubmit={submitImport} className="mt-4 space-y-3">
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv,.txt"
                                onChange={handleImportFileChange}
                                className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                required
                                disabled={!hasGroups}
                            />
                            <button
                                type="submit"
                                disabled={!hasGroups || importForm.processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {importForm.processing ? <Upload className="h-4 w-4 animate-pulse" /> : <Upload className="h-4 w-4" />}
                                Proses Import
                            </button>
                        </form>

                        {!hasGroups ? (
                            <p className="mt-3 text-sm text-rose-600">Import penugasan DPL belum bisa dilakukan karena data kelompok belum tersedia.</p>
                        ) : null}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <h2 className="text-base font-semibold text-slate-900">Aktivasi DPL per Periode</h2>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Dosen</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Periode</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Kuota Kelompok</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Terpakai</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.map((assignment) => (
                                    <tr key={assignment.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-semibold text-slate-900">{assignment.dosen.nama}</p>
                                            <p className="text-xs text-slate-500">{assignment.dosen.nip}</p>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-700">{assignment.period.name}</td>
                                        <td className="px-4 py-4 text-sm text-slate-700">{assignment.max_groups}</td>
                                        <td className="px-4 py-4 text-sm text-slate-700">
                                            {assignment.current_groups} terpakai · sisa {assignment.remaining_slots}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => deleteAssignment(assignment.id)}
                                                className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                            >
                                                <span className="inline-flex items-center gap-1">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Nonaktifkan
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAssignments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                                            Belum ada aktivasi DPL yang sesuai dengan pencarian.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Daftar Kelompok dan Pembimbing</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Tabel ini membantu operator melihat kelompok mana yang belum mendapat DPL atau masih berada pada status draf.
                            </p>
                        </div>

                        <div className="relative w-full lg:w-80">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari dosen, kelompok, periode, atau wilayah"
                                className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[1100px] border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Kelompok</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Periode</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lokasi</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">DPL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGroups.map((group) => (
                                    <tr key={group.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                                            <p className="text-xs text-slate-500">{group.code}</p>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-700">{group.period?.name || '-'}</td>
                                        <td className="px-4 py-4 text-sm text-slate-700">
                                            {(group.location?.district_name || '-') + ' · ' + (group.location?.regency_name || '-')}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                {statusLabel(group.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-700">{group.dpl?.nama || 'Belum ditetapkan'}</td>
                                    </tr>
                                ))}
                                {filteredGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                                            Tidak ada kelompok yang sesuai dengan pencarian saat ini.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
