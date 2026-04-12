import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    AlertTriangle,
    FileSpreadsheet,
    MapPinned,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    Upload,
    UserPlus,
    Users,
    ChevronRight,
    ArrowRight,
    Zap,
    Activity,
    Target,
    Database,
    Cpu,
    CheckCircle2,
    UserCheck,
    Briefcase
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import ConfirmDialog from '@/Components/ui/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface DosenOption {
    id: number;
    nama: string;
    nip: string;
    is_cpns?: boolean;
    is_tugas_belajar?: boolean;
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

function statusLabel(status: string): string {
    const s = status.toLowerCase();
    if (s === 'active') return 'Aktif';
    if (s === 'closed') return 'Selesai';
    return 'Draf';
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

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
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        confirmVariant: any;
        confirmLabel: string;
        onConfirm: () => void;
    }>({
        open: false,
        title: '',
        message: '',
        confirmVariant: 'danger',
        confirmLabel: '',
        onConfirm: () => {},
    });

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
                router.get(route('admin.dpl.penugasan'), { search: search || undefined }, {
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
        periodForm.post(route('admin.dpl.tugaskan-periode'), {
            preserveScroll: true,
            onSuccess: () => periodForm.reset('dosen_id'),
        });
    };

    const submitGroupAssignment = (event: FormEvent) => {
        event.preventDefault();

        groupForm.post(route('admin.dpl.tugaskan-kelompok', { group: groupForm.data.group_id }), {
            preserveScroll: true,
            onSuccess: () => groupForm.reset('group_id'),
        });
    };

    const submitDistrictCoordinator = (event: FormEvent) => {
        event.preventDefault();

        coordForm.post(route('admin.dpl.tugaskan-wilayah'), {
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
        setConfirmDialog({
            open: true,
            title: 'Hapus Aktivasi',
            message: 'Hapus aktivasi DPL dari periode ini? Hal ini mungkin berdampak pada kelompok yang sudah dibina.',
            confirmVariant: 'danger',
            confirmLabel: 'Ya, Nonaktifkan',
            onConfirm: () => {
                router.patch(route('admin.dpl.lepas-periode', id), {}, { 
                    preserveScroll: true,
                    onSuccess: () => setConfirmDialog(prev => ({ ...prev, open: false }))
                });
            }
        });
    };

    const deleteCoordinator = (id: number) => {
        setConfirmDialog({
            open: true,
            title: 'Nonaktifkan Koordinator',
            message: 'Nonaktifkan penugasan koordinator wilayah ini?',
            confirmVariant: 'danger',
            confirmLabel: 'Ya, Nonaktifkan',
            onConfirm: () => {
                router.patch(route('admin.dpl.lepas-wilayah', id), {}, { 
                    preserveScroll: true,
                    onSuccess: () => setConfirmDialog(prev => ({ ...prev, open: false }))
                });
            }
        });
    };

    return (
        <AppLayout title="Personnel Deployment Hub">
            <Head title="Penugasan DPL | SIKKKN" />

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmVariant={confirmDialog.confirmVariant}
                confirmLabel={confirmDialog.confirmLabel}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                onConfirm={confirmDialog.onConfirm}
            />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans"
            >
                {/* --- COMMAND HEADER --- */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-emerald-600">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Personnel Assignment</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Personnel <span>Deployment.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Manajemen instruktur dan koordinator lapangan. <br />
                            <span className="text-slate-900 not-italic">Aktivasi DPL per periode, plotting pembimbing unit, dan sinkronisasi komando wilayah.</span>
                        </p>
                    </div>

                    <div className="hidden xl:flex items-center gap-6 p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl">
                         <div className="h-16 w-16 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                              <ShieldCheck size={28} />
                         </div>
                         <div>
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Cluster Status</p>
                              <p className="text-xl font-black tracking-tight uppercase">Infrastructure Secured</p>
                         </div>
                    </div>
                </motion.div>

                {/* --- STRATEGIC METRICS MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                    <MetricCard label="DPL Teraktivasi" value={(summary?.active_assignments ?? assignments.length).toLocaleString()} icon={UserCheck} color="emerald" />
                    <MetricCard label="Unit Operasional" value={(summary?.groups_total ?? groups.length).toLocaleString()} icon={Briefcase} color="slate" />
                    <MetricCard label="Missing DPL" value={(summary?.groups_without_dpl ?? 0).toLocaleString()} icon={AlertTriangle} color="rose" />
                    <MetricCard label="Critical Units" value={(summary?.active_groups_without_dpl ?? 0).toLocaleString()} icon={Activity} color="rose" />
                    <MetricCard label="Regional Coord" value={(summary?.district_coordinators ?? coordinatorRows.length).toLocaleString()} icon={MapPinned} color="amber" />
                </motion.div>

                {/* --- DEPLOYMENT PROTOCOL CONTROLS --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Activation Form */}
                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-sm space-y-10 group">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                <UserPlus size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Activation Protocol</h3>
                                <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Inisiasi Aktivasi DPL</p>
                            </div>
                        </div>

                        <form onSubmit={submitPeriodAssignment} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Selection personnel</label>
                                <select
                                    value={periodForm.data.dosen_id}
                                    onChange={(e) => periodForm.setData('dosen_id', e.target.value)}
                                    className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                                    required
                                >
                                    <option value="">SELECT LECTURER PERSONNEL...</option>
                                    {allDosen.map((d) => <option key={d.id} value={d.id}>{d.nama} ({d.nip})</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Period Target</label>
                                    <select
                                        value={periodForm.data.period_id}
                                        onChange={(e) => periodForm.setData('period_id', e.target.value)}
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                                        required
                                    >
                                        <option value="">SELECT PERIOD...</option>
                                        {allPeriods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit Capacity</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={periodForm.data.max_groups}
                                        onChange={(e) => periodForm.setData('max_groups', parseInt(e.target.value, 10) || 0)}
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={periodForm.processing}
                                className="w-full h-16 rounded-2xl bg-emerald-600 text-white hover:bg-slate-900 hover:text-white transition-all font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {periodForm.processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck size={18} />}
                                Execute Personnel Activation
                            </button>
                        </form>
                    </div>

                    {/* Group Assignment Form */}
                    <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-sm space-y-10 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform">
                             <Users size={200} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-all shadow-sm">
                                    <Users size={24} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Unit Matching protocol</h3>
                                    <p className="text-xl font-black text-white uppercase tracking-tighter">Penempatan DPL ke Unit</p>
                                </div>
                            </div>

                            <form onSubmit={submitGroupAssignment} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Target operational unit</label>
                                    <select
                                        value={groupForm.data.group_id}
                                        onChange={(e) => {
                                            groupForm.setData('group_id', e.target.value);
                                            groupForm.setData('dpl_period_id', '');
                                        }}
                                        className="w-full h-16 px-6 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all text-white"
                                        required
                                    >
                                        <option value="" className="bg-slate-900">SELECT UNIT...</option>
                                        {groups.map((g) => <option key={g.id} value={g.id} className="bg-slate-900">{g.code} · {g.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Personnel instructor match</label>
                                    <select
                                        value={groupForm.data.dpl_period_id}
                                        onChange={(e) => groupForm.setData('dpl_period_id', e.target.value)}
                                        className="w-full h-16 px-6 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all text-white disabled:opacity-30"
                                        disabled={!selectedGroup}
                                        required
                                    >
                                        <option value="" className="bg-slate-900">{selectedGroup ? 'SELECT ASSIGNED DPL...' : 'WAITING FOR UNIT SELECTION...'}</option>
                                        {availableAssignments.map((a) => (
                                            <option key={a.id} value={a.id} className="bg-slate-900">
                                                {a.dosen.nama} · {a.period.name} · ({a.remaining_slots} Unit left)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={groupForm.processing || !selectedGroup || availableAssignments.length === 0}
                                    className="w-full h-16 rounded-2xl bg-white text-slate-950 hover:bg-emerald-500 hover:text-slate-950 transition-all font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:opacity-20"
                                >
                                    {groupForm.processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Target size={18} />}
                                    Finalize assignment
                                </button>
                            </form>
                        </div>
                    </div>
                </motion.div>

                {/* --- REGIONAL COMMAND & IMPORT --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-8">
                    {/* Regional Coordinator Hub */}
                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-sm space-y-10 group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                    <MapPinned size={24} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Regional Command Hub</h3>
                                    <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Koordinator Wilayah</p>
                                </div>
                            </div>

                            <form onSubmit={submitDistrictCoordinator} className="flex flex-wrap items-center gap-4">
                                <select
                                    value={coordForm.data.district_id}
                                    onChange={(e) => coordForm.setData('district_id', e.target.value)}
                                    className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 text-[10px] font-black uppercase tracking-widest appearance-none"
                                    required
                                >
                                    <option value="">DISTRICT...</option>
                                    {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <select
                                    value={coordForm.data.dpl_period_id}
                                    onChange={(e) => coordForm.setData('dpl_period_id', e.target.value)}
                                    className="h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 text-[10px] font-black uppercase tracking-widest appearance-none"
                                    required
                                >
                                    <option value="">PERSONNEL...</option>
                                    {assignments.filter(a => a.is_active).map(a => <option key={a.id} value={a.id}>{a.dosen.nama}</option>)}
                                </select>
                                <button
                                    type="submit"
                                    disabled={coordForm.processing}
                                    className="h-14 px-8 rounded-2xl bg-slate-900 text-white hover:bg-emerald-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-3 disabled:opacity-50"
                                >
                                    {coordForm.processing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                                    EXECUTE
                                </button>
                            </form>
                        </div>

                        <div className="overflow-x-auto rounded-[2rem] border border-slate-50">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Regional Cluster</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Commander (DPL)</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Operation Period</th>
                                        <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredCoordinators.length > 0 ? (
                                        filteredCoordinators.map((c) => (
                                            <tr key={c.id} className="group/row hover:bg-amber-50/10 transition-all">
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none italic">{c.district?.name || c.district_name || '-'}</span>
                                                        <div className="flex items-center gap-2 opacity-40">
                                                            <div className="h-1 w-3 rounded-full bg-slate-400" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest">{c.regency_name || 'UNDEFINED ZONE'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                         <UserCheck size={14} className="text-emerald-500" />
                                                         <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{c.dpl_period?.dosen.nama || c.dosen?.nama || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.period?.name || '-'}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => deleteCoordinator(c.id)}
                                                        className="h-10 w-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm opacity-0 group-hover/row:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic opacity-50">Empty Regional Manifest</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Data Ingestion */}
                    <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white space-y-8 relative overflow-hidden group/import">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="h-14 w-14 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover/import:bg-white group-hover/import:text-slate-950 transition-all shadow-sm">
                                <FileSpreadsheet size={24} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Mass Ingestion</h3>
                                <p className="text-xl font-black text-white uppercase tracking-tighter">Bulk Assignment</p>
                            </div>
                        </div>
                        <p className="relative z-10 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed opacity-60 italic">
                            Import manifest penugasan sekaligus untuk efisiensi Deployment Phase. Hubungkan data unit secara massal ke instruktur terpilih.
                        </p>
                        
                        <form onSubmit={submitImport} className="relative z-10 space-y-5">
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleImportFileChange}
                                className="hidden"
                                id="dpl-import"
                                required
                                disabled={!hasGroups}
                            />
                            <label 
                                htmlFor="dpl-import"
                                className="flex items-center justify-between h-20 px-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all cursor-pointer group"
                            >
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 truncate max-w-[150px]">
                                    {importForm.data.file ? importForm.data.file.name : 'CHOOSE MANIFEST...'}
                                </span>
                                <div className="h-10 px-6 rounded-xl bg-white/10 text-[9px] font-black uppercase tracking-widest flex items-center group-hover:bg-white group-hover:text-slate-950 transition-all">
                                    FILESYSTEM
                                </div>
                            </label>
                            <button
                                type="submit"
                                disabled={!hasGroups || importForm.processing}
                                className="w-full h-20 rounded-3xl bg-emerald-600 text-white hover:bg-white hover:text-slate-950 transition-all font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-emerald-900/40 disabled:opacity-20 translate-y-2"
                            >
                                {importForm.processing ? <RefreshCw size={20} className="animate-spin" /> : <Upload size={20} />}
                                Synchronize Cloud
                            </button>
                        </form>
                    </div>
                </motion.div>

                {/* --- PERSONNEL ACTIVATION LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-10 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                   <Cpu size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Central Registry</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Aktivasi DPL Cloud</p>
                              </div>
                         </div>
                         <div className="h-px w-20 bg-white/10 hidden md:block" />
                         <p className="max-w-md text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed opacity-60">
                             "Instruktur wajib teraktivasi pada periode cloud sebelum dialokasikan ke unit taktis operasional."
                         </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Security Key</th>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Personnel Identity</th>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Target Period</th>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Allocation stats</th>
                                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-right">Ops</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAssignments.length > 0 ? (
                                    filteredAssignments.map((a) => (
                                        <tr key={a.id} className="group hover:bg-emerald-50/20 transition-all">
                                            <td className="px-10 py-8 italic font-mono text-[10px] font-black text-slate-200 group-hover:text-emerald-500 transition-colors uppercase">PERSONNEL-{a.id.toString().padStart(4, '0')}</td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                     <div className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm text-slate-400 uppercase font-black text-xs">{a.dosen.nama.charAt(0)}</div>
                                                     <div className="flex flex-col gap-1">
                                                          <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase">{a.dosen.nama}</span>
                                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none font-mono">ID: {a.dosen.nip}</span>
                                                     </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-3">
                                                     <Target size={14} className="text-amber-500" />
                                                     <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{a.period.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-3 min-w-[150px]">
                                                     <div className="flex items-center justify-between gap-4">
                                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-xs">Load</span>
                                                          <span className="text-xs font-black text-slate-900">{a.current_groups} / {a.max_groups}</span>
                                                     </div>
                                                     <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                          <div 
                                                               className="h-full bg-emerald-500 transition-all duration-1000" 
                                                               style={{ width: `${(a.current_groups / a.max_groups) * 100}%` }} 
                                                          />
                                                     </div>
                                                     <p className="text-[9px] font-bold text-slate-300 uppercase italic">Free Slots: {a.remaining_slots}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <button
                                                    onClick={() => deleteAssignment(a.id)}
                                                    className="h-12 w-12 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] italic opacity-50">Activation Registry Empty</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                {/* --- GLOBAL DEPLOYMENT SURVEILLANCE --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-2xl space-y-10 group">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-slate-50 pb-10">
                         <div className="flex items-center gap-6">
                              <div className="h-16 w-16 bg-slate-900 text-emerald-500 rounded-3xl flex items-center justify-center shadow-xl rotate-3">
                                   <Search size={28} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Surveillance Matrix</h3>
                                   <p className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Operational Registry</p>
                              </div>
                         </div>
                         <div className="relative w-full lg:w-96 group/search">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/search:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="SURVEILLANCE UNIT / PERIOD / ZONE..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-16 pl-16 pr-6 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 transition-all text-xs font-black uppercase tracking-widest placeholder:text-slate-200"
                            />
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                         <table className="w-full text-left">
                              <thead>
                                   <tr className="bg-slate-50 rounded-2xl">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 first:rounded-l-2xl">Unit Identity</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Operation Segment</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Deployment Geo-Lock</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Status Protocol</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 last:rounded-r-2xl text-right">Commander Assigned</th>
                                   </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                   {filteredGroups.length > 0 ? (
                                        filteredGroups.map((g) => (
                                             <tr key={g.id} className="group/ops hover:bg-emerald-50/20 transition-all">
                                                  <td className="px-8 py-6">
                                                       <div className="flex flex-col gap-1.5">
                                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tighter group-hover/ops:text-emerald-700 transition-colors italic">{g.name}</span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic opacity-40 leading-none">#{g.code}</span>
                                                       </div>
                                                  </td>
                                                  <td className="px-8 py-6">
                                                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{g.period?.name || '-'}</span>
                                                  </td>
                                                  <td className="px-8 py-6">
                                                       <div className="flex items-center gap-3">
                                                            <MapPinned size={14} className="text-rose-500" />
                                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest opacity-80">{(g.location?.district_name || '-') + ' · ' + (g.location?.regency_name || '-')}</span>
                                                       </div>
                                                  </td>
                                                  <td className="px-8 py-6">
                                                       <span className={clsx(
                                                            "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all",
                                                            (g.status.toLowerCase() === 'active') 
                                                                 ? "bg-emerald-600 text-white border-emerald-600" 
                                                                 : "bg-slate-100 text-slate-400 border-slate-200" 
                                                       )}>
                                                            {statusLabel(g.status)}
                                                       </span>
                                                  </td>
                                                  <td className="px-8 py-6 text-right">
                                                       <div className="flex items-center justify-end gap-3 italic">
                                                            <span className={clsx(
                                                                 "text-xs font-black uppercase tracking-tighter",
                                                                 g.dpl?.nama ? "text-slate-700" : "text-rose-400 opacity-50"
                                                            )}>{g.dpl?.nama || 'AWAITING COMMANDER'}</span>
                                                            <div className={clsx("h-2 w-2 rounded-full", g.dpl?.nama ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                                       </div>
                                                  </td>
                                             </tr>
                                        ))
                                   ) : (
                                        <tr>
                                             <td colSpan={5} className="px-8 py-20 text-center text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] italic">Surveillance Cluster Offline</td>
                                        </tr>
                                   )}
                              </tbody>
                         </table>
                    </div>
                </motion.section>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: 'emerald' | 'rose' | 'amber' | 'slate' }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-4 hover:shadow-2xl hover:shadow-emerald-50 transition-all group overflow-hidden relative shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <Icon size={100} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-6 shadow-sm",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : 
                color === 'rose' ? "bg-rose-50 text-rose-600" :
                color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"
            )}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none italic">{label}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{value}</p>
            </div>
        </div>
    );
}
