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
    ChevronRight,
    ArrowRight,
    Zap,
    Activity,
    Target,
    Database,
    Cpu,
    ShieldCheck,
    Layers3,
    UserCheck,
    ActivitySquare,
    MoreHorizontal
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';

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
        phone?: string | null;
        wa_link?: string | null;
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

interface TypeStat {
    period_id: number;
    jenis: string;
    program_type: string;
    kuota: number;
    pendaftar: number;
    pending: number;
    setuju: number;
    tolak: number;
}

interface Period {
    id: number;
    name: string;
    periode: number;
}

interface Props {
    registrations: {
        data: Registration[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
        status?: string;
        period_id?: string;
    };
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        by_faculty: FacultyStat[];
    };
    byTypeStats: TypeStat[];
    periods: Period[];
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

export default function RegistrationsIndex({ registrations, filters, stats, byTypeStats, periods }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [periodId, setPeriodId] = useState(filters.period_id ?? '');
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
                period_id: periodId || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setPeriodId('');
        router.get('/admin/pendaftaran', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const filterByPeriod = (pid: number) => {
        setPeriodId(String(pid));
        router.get('/admin/pendaftaran', { period_id: pid }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) return;
        if (confirm(`SETUJUI ${selectedIds.length} PENDAFTARAN TERPILIH?`)) {
            router.post('/admin/pendaftaran/setuju-massal', { ids: selectedIds }, {
                preserveScroll: true,
                onSuccess: () => setSelectedIds([]),
            });
        }
    };

    const handleBulkReject = () => {
        if (selectedIds.length === 0) return;
        const notes = prompt(`ALASAN PENOLAKAN UNTUK ${selectedIds.length} PENDAFTARAN:`);
        if (notes) {
            router.post('/admin/pendaftaran/tolak-massal', { ids: selectedIds, notes }, {
                preserveScroll: true,
                onSuccess: () => setSelectedIds([]),
            });
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
        <AppLayout title="Operational Registry Hub">
            <Head title="Manajemen Pendaftaran | SIKKKN" />

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
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Operation Center / Student Registrations</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] flex flex-col">
                            Student <span>Registry.</span>
                        </h1>
                        <p className="text-lg font-bold text-slate-400 tracking-tight leading-relaxed max-w-2xl uppercase italic opacity-80">
                            Validasi unit pendaftaran KKN. <br />
                            <span className="text-slate-900 not-italic">Review kepatuhan administrasi, plotting reguler, dan sinkronisasi ekspor data BPJS.</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 shrink-0">
                        <button
                            type="button"
                            onClick={handleBpjsExport}
                            className="h-20 px-10 rounded-[2.5rem] bg-white border border-slate-200 text-slate-900 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-4 group/btn shadow-sm active:scale-95"
                        >
                            <IdCard size={22} className="group-hover/btn:-translate-y-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Ekspor Metadata BPJS</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="h-20 px-10 rounded-[2.5rem] bg-emerald-600 text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95"
                        >
                            <Download size={22} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Execute Data Export</span>
                        </button>
                    </div>
                </motion.div>

                {/* --- STRATEGIC METRICS MATRIX --- */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <MetricCard label="Total Ingress" value={stats.total} icon={Layers3} color="slate" />
                    <MetricCard label="Awaiting Review" value={stats.pending} icon={Clock3} color="amber" />
                    <MetricCard label="Approved Nodes" value={stats.approved} icon={CheckCheck} color="emerald" />
                    <MetricCard label="Rejected Nodes" value={stats.rejected} icon={XCircle} color="rose" />
                </motion.div>

                {/* --- FACULTY SEBARAN GRID --- */}
                <AnimatePresence>
                    {stats.by_faculty.length > 0 && (
                        <motion.section 
                            variants={itemVariants}
                            className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                                 <ActivitySquare size={240} strokeWidth={1} />
                            </div>
                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                                         <Users size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-1">
                                         <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Faculty Distribution Matrix</h3>
                                         <p className="text-xl font-black uppercase tracking-tighter italic">Sebaran Pendaftar Aktif</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {stats.by_faculty.map((item) => (
                                        <div key={item.faculty_name} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group/f">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/f:text-emerald-500 transition-colors">{item.faculty_name}</p>
                                            <p className="text-3xl font-black tracking-tighter uppercase">{item.count.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* --- BULK COMMAND HUB --- */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.section 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-emerald-600 rounded-[3rem] p-4 flex flex-col md:flex-row items-center gap-6 shadow-2xl shadow-emerald-500/30 border border-emerald-400"
                        >
                            <div className="flex-1 flex items-center gap-8 pl-8">
                                <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center text-emerald-600 shadow-xl group-hover:rotate-12 transition-transform">
                                     <Zap size={28} strokeWidth={3} />
                                </div>
                                <div>
                                     <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{selectedIds.length} Nodes Selected.</p>
                                     <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mt-1 opacity-80 underline underline-offset-4 pointer-events-none">Awaiting Bulk Command execution</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pr-4 w-full md:w-auto">
                                <button
                                    onClick={handleBulkApprove}
                                    className="h-16 flex-1 md:flex-none px-8 rounded-2xl bg-slate-900 text-white hover:bg-white hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3"
                                >
                                    <CheckCheck size={18} /> Approve All
                                </button>
                                <button
                                    onClick={handleBulkReject}
                                    className="h-16 flex-1 md:flex-none px-8 rounded-2xl bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3"
                                >
                                    <XCircle size={18} /> Reject Batch
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="h-16 w-16 rounded-2xl bg-emerald-700 text-white hover:bg-rose-600 transition-all flex items-center justify-center shadow-xl active:scale-90"
                                >
                                    <FilterX size={20} />
                                </button>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* --- INTELLIGENT FILTER BAR --- */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-[2.5rem] p-3 shadow-sm flex flex-col lg:flex-row items-center gap-3">
                    <form onSubmit={applyFilters} className="flex-1 w-full flex flex-col lg:flex-row items-center gap-3">
                        <div className="flex-1 w-full relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH NIM / NAME / FACULTY / PROGRAM..."
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
                                    {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                                    <option value="pending">AWAITING REVIEW</option>
                                    <option value="approved">APPROVED MODE</option>
                                    <option value="rejected">REJECTED NODES</option>
                                 </select>
                            </div>
                            <button
                                type="submit"
                                className="h-14 px-8 bg-slate-900 border border-slate-900 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-emerald-600 hover:border-emerald-600 transition-all shadow-lg active:scale-90"
                            >
                                Filter Registry
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-90"
                            >
                                <FilterX size={18} />
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* --- CENTRAL REGISTRY LEDGER --- */}
                <motion.section variants={itemVariants} className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="px-10 py-10 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-8">
                         <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                   <Database size={24} />
                              </div>
                              <div className="space-y-1">
                                   <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Registry Ledger</h3>
                                   <p className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Pendaftaran Mahasiswa</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                              <Users size={16} className="text-emerald-500" />
                              <span className="text-xs font-black text-white uppercase tracking-widest">{registrations.meta.total.toLocaleString()} Active Records</span>
                         </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-10 py-8 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={pendingIds.length > 0 && selectedIds.length === pendingIds.length}
                                                onChange={toggleSelectAll}
                                                className="h-6 w-6 rounded-lg border-2 border-slate-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer checked:bg-emerald-600 transition-all"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Student Identity</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Applied Period</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Unit Deployment</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {registrations.data.length > 0 ? (
                                    registrations.data.map((r, idx) => (
                                        <tr key={r.id} className={clsx(
                                            "group hover:bg-emerald-50/20 transition-all",
                                            selectedIds.includes(r.id) && "bg-emerald-50/50"
                                        )}>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-center">
                                                    {r.status === 'pending' ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(r.id)}
                                                            onChange={() => toggleSelect(r.id)}
                                                            className="h-6 w-6 rounded-lg border-2 border-slate-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer checked:bg-emerald-600 transition-all"
                                                        />
                                                    ) : (
                                                        <div className="h-2 w-2 rounded-full bg-slate-100 opacity-20" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm text-slate-400 font-black text-xs uppercase group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                        {r.student?.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase italic">{r.student?.name}</span>
                                                            {r.student?.wa_link && (
                                                                <a href={r.student.wa_link} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center p-1.5 bg-emerald-50 rounded-lg shadow-sm">
                                                                     <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                                </a>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none font-mono">NIM: {r.student?.nim}</span>
                                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">{r.student?.faculty?.name || '-'} · {r.student?.program?.name || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-2">
                                                     <div className="flex items-center gap-3">
                                                          <Target size={14} className="text-emerald-500" />
                                                          <span className="text-xs font-black text-slate-700 uppercase tracking-tight leading-none italic">{r.period?.name || '-'}</span>
                                                     </div>
                                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-6 opacity-60">Submitted: {formatDateTime(r.registration_date)}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-3">
                                                     <div className="flex items-center gap-3">
                                                          <span className={clsx(
                                                               "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm",
                                                               r.status === 'approved' ? "bg-emerald-600 text-white border-emerald-600" :
                                                               r.status === 'rejected' ? "bg-rose-600 text-white border-rose-600" : "bg-amber-50 text-amber-700 border-amber-100"
                                                          )}>
                                                               {r.status.toUpperCase()}
                                                          </span>
                                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50 underline underline-offset-4">{r.group?.name || 'AWAITING PLOT'}</span>
                                                     </div>
                                                     {r.status === 'rejected' && r.rejection_reason && (
                                                         <p className="max-w-[200px] text-[10px] font-bold text-rose-500 uppercase italic leading-relaxed pl-1">— {r.rejection_reason}</p>
                                                     )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <Link
                                                    href={`/admin/pendaftaran/${r.id}`}
                                                    className="inline-flex h-12 w-12 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all"
                                                >
                                                    <ChevronRight size={20} strokeWidth={3} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] italic opacity-50">Operational Registry Empty</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- PAGINATION HUB --- */}
                    <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                NODE IDENTIFIER: {registrations.meta.current_page} OF {registrations.meta.last_page}
                            </span>
                        </div>
                        <Pagination meta={registrations.meta} />
                    </div>
                </motion.section>

                {/* --- FOOTER GOVERNANCE --- */}
                <motion.div variants={itemVariants} className="bg-slate-900 rounded-[3rem] p-16 flex flex-col lg:flex-row items-center justify-between gap-12 text-white relative overflow-hidden group/footer shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="h-24 w-24 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl group-hover/footer:rotate-12 transition-transform duration-700">
                            <ShieldCheck size={40} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Security Registry Ledger</h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-2xl opacity-80">
                                Seluruh unit pendaftaran diproses melalui enkripsi operasional SIKKKN UIN SAIZU. Validitas data mahasiswa adalah tanggung jawab verifikator admin. Sinkronisasi metadata BPJS dilakukan otomatis pasca persetujuan massal.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 relative z-10 opacity-40">
                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Registry Secured</span>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: 'emerald' | 'amber' | 'rose' | 'slate' }) {
    return (
        <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-all duration-700">
                <Icon size={120} strokeWidth={1} />
            </div>
            <div className="flex flex-col gap-6 relative z-10">
                <div className={clsx(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-sm group-hover:bg-slate-900 group-hover:text-white",
                    color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                    color === 'amber' ? "bg-amber-50 text-amber-600" :
                    color === 'rose' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                )}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 opacity-60 italic leading-none">{label}</p>
                   <p className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                </div>
            </div>
        </div>
    );
}
