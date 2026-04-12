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
    ShieldCheck,
    Zap,
    ChevronRight,
    ArrowRight,
    UploadCloud,
    Database,
    Cpu,
    Target,
    Activity
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmDialog, Modal, Pagination } from '@/Components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
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
        <AppLayout title="Operational Deployment Hub">
            <Head title="Manajemen Kelompok | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Deployment Groups</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Operational <span>Deployment.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Konfigurasi unit pelaksana KKN di lapangan. <br />
                            <span className="text-slate-900 not-italic">Penyiapan manifest kelompok, integrasi lokasi, dan penugasan personel bimbingan.</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 shrink-0">
                        <Link
                            href={route('admin.kelompok.template')}
                            className="h-20 px-10 rounded-[2.5rem] bg-white border border-slate-200 text-slate-900 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-4 group/btn shadow-sm active:scale-95"
                        >
                            <Download size={22} className="group-hover/btn:-translate-y-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Download Template</span>
                        </Link>
                        <button
                            type="button"
                            onClick={openCreateForm}
                            disabled={!canManage || !hasPeriods}
                            className="h-20 px-10 rounded-[2.5rem] bg-emerald-600 text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            <Plus size={22} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Inisiasi Unit Baru</span>
                        </button>
                    </div>
                </motion.div>

                {/* --- STRATEGIC METRICS MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                    <MetricCard label="Total Unit" value={summary.total_groups.toLocaleString()} icon={Layers3} color="slate" />
                    <MetricCard label="Status Aktif" value={summary.active_groups.toLocaleString()} icon={Activity} color="emerald" />
                    <MetricCard label="Persiapan Draf" value={summary.draft_groups.toLocaleString()} icon={RefreshCw} color="amber" />
                    <MetricCard label="Ready Placement" value={summary.groups_ready_for_placement.toLocaleString()} icon={Target} color="emerald" />
                    <MetricCard label="Tanpa DPL" value={summary.groups_without_main_lecturer.toLocaleString()} icon={UserCheck} color="rose" />
                    <MetricCard label="Slot Tersedia" value={summary.total_available_slots.toLocaleString()} icon={Users} color="emerald" />
                </motion.div>

                {/* --- DATA INGESTION PROTOCOL --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-6 transition-transform">
                             <Database size={240} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                                     <UploadCloud size={24} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                     <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Bulk Ingestion Protocol</h3>
                                     <p className="text-xl font-black uppercase tracking-tighter">Import Kelompok Massal</p>
                                </div>
                            </div>
                            
                            <form onSubmit={submitImport} className="space-y-6">
                                <div className="relative group/input">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleImportFileChange}
                                        className="hidden"
                                        id="import-excel"
                                        required
                                    />
                                    <label 
                                        htmlFor="import-excel"
                                        className="flex items-center justify-between h-20 px-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all cursor-pointer group"
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 truncate max-w-[200px]">
                                            {importForm.data.file ? importForm.data.file.name : 'Pilih File Manifest (.xlsx)...'}
                                        </span>
                                        <div className="h-10 px-6 rounded-xl bg-white/10 text-[9px] font-black uppercase tracking-widest flex items-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                            Browser System
                                        </div>
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!canImport || importForm.processing}
                                    className="w-full h-20 rounded-[2rem] bg-white text-slate-950 hover:bg-emerald-500 hover:text-slate-950 transition-all font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-30"
                                >
                                    {importForm.processing && <RefreshCw className="h-4 w-4 animate-spin text-slate-900" />}
                                    Execute Batch Upload
                                </button>
                            </form>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed opacity-60">
                                Sistem akan melakukan sinkronisasi otomatis terhadap data lokasi berdasarkan manifest yang diunggah.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-sm space-y-10 group">
                        <div className="flex items-center gap-5">
                             <div className="h-14 w-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                  <Cpu size={24} strokeWidth={2.5} />
                             </div>
                             <div>
                                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Intelligence Matrix</h3>
                                  <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Operational Checklist</p>
                             </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <StaticCheck label="Periode Valid" active />
                             <StaticCheck label="Lokasi Presisi" active />
                             <StaticCheck label="Kapasitas Optimal" active />
                             <StaticCheck label="DPL Assigned" />
                             <StaticCheck label="Auto-Plot Ready" />
                             <StaticCheck label="Terminal Sync" />
                        </div>
                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 italic text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                            "Mahasiswa reguler ditempatkan melalui algoritma sistem. Admin wajib memastikan kesiapan unit operasional sebelum pendaftaran ditutup."
                        </div>
                    </div>
                </motion.div>

                {/* --- INTELLIGENT FILTER BAR --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[2.5rem] p-3 shadow-sm flex flex-col lg:flex-row items-center gap-3">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH UNIT CODE / NAME / LOCATION / DPL..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-16 pl-16 pr-6 bg-transparent text-sm font-black text-slate-900 border-none focus:ring-0 outline-none placeholder:text-slate-200 placeholder:italic uppercase tracking-tight"
                        />
                    </div>
                    <div className="h-10 w-px bg-slate-100 hidden lg:block" />
                    <div className="flex items-center gap-3 w-full lg:w-auto px-4 lg:px-0">
                        <div className="relative min-w-[200px] group">
                             <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                             <select
                                value={periodId}
                                onChange={(e) => setPeriodId(e.target.value)}
                                className="w-full h-14 pl-12 pr-10 bg-slate-50 border-none rounded-2xl focus:ring-0 outline-none text-[10px] font-black text-slate-700 appearance-none uppercase tracking-widest group-hover:bg-slate-100 transition-colors"
                             >
                                <option value="">ALL PERIODS</option>
                                {periods.map((period) => (
                                    <option key={period.id} value={period.id}>{period.name}</option>
                                ))}
                             </select>
                        </div>
                        <div className="relative min-w-[180px] group">
                             <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                             <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full h-14 pl-12 pr-10 bg-slate-50 border-none rounded-2xl focus:ring-0 outline-none text-[10px] font-black text-slate-700 appearance-none uppercase tracking-widest group-hover:bg-slate-100 transition-colors"
                             >
                                <option value="">ALL STATUS</option>
                                <option value="draft">DRAFT MODE</option>
                                <option value="active">ACTIVE UNIT</option>
                                <option value="closed">DECOMMISSIONED</option>
                             </select>
                        </div>
                        <button
                            onClick={resetFilters}
                            className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-90"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </motion.div>

                {/* --- CENTRAL OPERATIONS LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-white">
                                    <th className="px-10 py-10 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Matrix</th>
                                    <th className="px-10 py-10 text-[10px] font-black uppercase tracking-[0.4em]">Unit Identity</th>
                                    <th className="px-10 py-10 text-[10px] font-black uppercase tracking-[0.4em]">Deployment Zone</th>
                                    <th className="px-10 py-10 text-[10px] font-black uppercase tracking-[0.4em]">Status Protocol</th>
                                    <th className="px-10 py-10 text-[10px] font-black uppercase tracking-[0.4em]">Personnel Stats</th>
                                    <th className="px-10 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-right">Operational Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {groups.data.length > 0 ? (
                                    groups.data.map((group, idx) => (
                                        <tr key={group.id} className="group hover:bg-emerald-50/20 transition-all">
                                            <td className="px-10 py-8">
                                                <span className="text-xs font-black text-slate-300 font-mono tracking-tighter truncate opacity-50">
                                                    #{idx + 1 + (groups.meta.current_page - 1) * groups.meta.per_page}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-14 w-14 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-sm">
                                                        <Layers3 size={20} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase">{group.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_5px_emerald]" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic">{group.code}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <MapPin size={14} className="text-rose-500" />
                                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none">{group.location?.full_name || 'UNDEFINED'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 opacity-40">
                                                        <Target size={12} className="text-slate-400" />
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{group.period?.name || 'NO PERIOD'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-3">
                                                    <span className={clsx(
                                                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border self-start transition-all",
                                                        (group.status.toLowerCase() === 'active') 
                                                            ? "bg-emerald-600 text-white border-emerald-600" 
                                                            : (group.status.toLowerCase() === 'closed') 
                                                                ? "bg-slate-100 text-slate-500 border-slate-200" 
                                                                : "bg-amber-50 text-amber-700 border-amber-100 shadow-sm"
                                                    )}>
                                                        {statusLabel(group.status)}
                                                    </span>
                                                    <PlacementBadge ready={group.ready_for_placement} />
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Occupancy</span>
                                                        <span className="text-xs font-black text-slate-900 tracking-tighter">{group.approved_participants_count} / {group.capacity}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-emerald-500 transition-all duration-1000" 
                                                            style={{ width: `${group.capacity > 0 ? (group.approved_participants_count / group.capacity) * 100 : 0}%` }} 
                                                        />
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase italic">Remaining: {group.available_slots} Slots</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex justify-end gap-3 translate-x-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                    <Link
                                                        href={route('admin.kelompok.show', group.id)}
                                                        className="h-12 w-12 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-xl hover:shadow-emerald-50/50 transition-all"
                                                        title="Buka Protokol"
                                                    >
                                                        <ChevronRight size={18} strokeWidth={2.5} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditForm(group)}
                                                        className="h-12 w-12 bg-white border border-slate-100 text-slate-400 hover:text-amber-600 hover:border-amber-200 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-xl transition-all"
                                                        title="Modify Unit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingId(group.id)}
                                                        className="h-12 w-12 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-xl transition-all"
                                                        title="Terminate Unit"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-10 text-slate-200 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000">
                                                <Database size={120} strokeWidth={1} />
                                                <p className="text-xl font-black uppercase tracking-[0.4em]">Deployment Cluster Empty</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- PAGINATION PROTOCOL --- */}
                    <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                PAGE IDENTIFIER: {groups.meta.current_page} / {groups.meta.last_page}
                            </span>
                        </div>
                        <Pagination meta={groups.meta} />
                    </div>
                </motion.section>

                {/* --- FOOTER SECURITY HUB --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3rem] p-16 flex flex-col lg:flex-row items-center justify-between gap-12 text-white relative overflow-hidden group/footer shadow-2xl shadow-slate-300">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="h-24 w-24 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 group-hover/footer:rotate-12 transition-transform duration-700 shrink-0">
                            <ShieldCheck size={40} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Security & Governance Ledger</h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-2xl opacity-80">
                                Integrasi unit operasional dimonitor secara terpusat oleh SIKKKN UIN SAIZU. Pastikan seluruh manifest lokasi dan periode telah disinkronisasi untuk menjamin validitas penempatan mahasiswa.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 relative z-10 shrink-0">
                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Infrastructure Node Active</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* --- MODALS --- */}
            <Modal show={showForm} onClose={closeForm} title={editingGroup ? 'Modify Deployment Unit' : 'Initiate New Unit'}>
                <form onSubmit={submitForm} className="space-y-8 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Period Assignment</label>
                            <select
                                value={form.data.period_id}
                                onChange={(e) => form.setData('period_id', e.target.value)}
                                className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                                required
                            >
                                <option value="">Select Target Period</option>
                                {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Geographical Slot</label>
                            <select
                                value={form.data.location_id}
                                onChange={(e) => form.setData('location_id', e.target.value)}
                                className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                                required
                            >
                                <option value="">Select Deployment Location</option>
                                {locations.map((l) => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit Designation Name</label>
                        <input
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="w-full h-16 px-6 rounded-2xl bg-white border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                            placeholder="OPERATIONAL UNIT NAME..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Force Capacity</label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={form.data.capacity}
                                onChange={(e) => form.setData('capacity', e.target.value)}
                                className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Operational Status</label>
                            <select
                                value={form.data.status}
                                onChange={(e) => form.setData('status', e.target.value as GroupFormData['status'])}
                                className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                            >
                                <option value="draft">DRAFT MODE</option>
                                <option value="active">ACTIVE OPS</option>
                                <option value="closed">DECOMMISSIONED</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Main Evaluator (DPL)</label>
                            <select
                                value={form.data.lead_lecturer_id}
                                onChange={(e) => form.setData('lead_lecturer_id', e.target.value)}
                                className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 text-sm font-black uppercase tracking-tight transition-all"
                            >
                                <option value="">SELECT PERSONNEL</option>
                                {lecturers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={closeForm}
                            className="h-14 px-8 rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all"
                        >
                            Abort Protocol
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-14 px-10 rounded-2xl bg-slate-900 text-white hover:bg-emerald-600 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {editingGroup ? 'Update Unit Manifest' : 'Confirm New Unit Deployment'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={deletingId !== null}
                title="Protocol Termination"
                message="Menghapus unit operasional akan membatalkan seluruh plotting mahasiswa dalam manifest ini. Eksekusi tindakan?"
                confirmLabel="Terminate Unit"
                onConfirm={handleDelete}
                onClose={() => setDeletingId(null)}
            />
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: 'emerald' | 'rose' | 'amber' | 'slate' }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-4 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Icon size={80} strokeWidth={1} />
            </div>
            <div className={clsx(
                "h-12 w-12 rounded-xl flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white",
                color === 'emerald' ? "bg-emerald-50 text-emerald-600" : 
                color === 'rose' ? "bg-rose-50 text-rose-600" :
                color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"
            )}>
                <Icon size={20} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">{label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{value}</p>
            </div>
        </div>
    );
}

function StaticCheck({ label, active = false }: { label: string; active?: boolean }) {
    return (
        <div className="flex items-center gap-4 group/check">
             <div className={clsx(
                 "h-8 w-8 rounded-xl border flex items-center justify-center transition-all",
                 active ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30" : "bg-white border-slate-200 text-slate-200 group-hover/check:border-slate-300"
             )}>
                  <ShieldCheck size={14} strokeWidth={2.5} />
             </div>
             <span className={clsx(
                 "text-[10px] font-black uppercase tracking-widest leading-none",
                 active ? "text-slate-900" : "text-slate-300"
             )}>{label}</span>
        </div>
    );
}

function PlacementBadge({ ready }: { ready: boolean }) {
    return (
        <div className={clsx(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-[0.2em] self-start transition-all shadow-sm",
            ready ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
        )}>
            <div className={clsx("h-1.5 w-1.5 rounded-full animate-pulse", ready ? "bg-emerald-500 shadow-[0_0_5px_emerald]" : "bg-slate-300")} />
            {ready ? 'READY FOR AUTOMATION' : 'MANUAL PLOTTING ONLY'}
        </div>
    );
}
