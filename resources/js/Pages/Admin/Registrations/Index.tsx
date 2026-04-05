import { useState, useEffect } from 'react'
import { router, Head } from '@inertiajs/react'
import { motion } from 'framer-motion'
import AppLayout from '@/Layouts/AppLayout'
import {
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    Calendar,
    SearchCheck,
    Download,
    Users,
    Clock,
    CheckCheck,
    XOctagon,
    BarChart3,
    ShieldCheck,
    Zap,
    Layers,
    Database,
    ChevronRight,
    Lock,
    Binary,
    Fingerprint,
    IdCard,
    Archive
} from 'lucide-react'
import { clsx } from 'clsx'
import { Pagination, Badge } from '@/Components/ui'
import type { PaginationMeta } from '@/Components/ui/Pagination'

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

export default function RegistrationsIndex({ registrations, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '') || status !== (filters.status || '')) {
                router.get('/admin/pendaftaran', { search, status }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, status, filters.search, filters.status]);

    const handleStatusUpdate = (id: number, newStatus: 'approved' | 'rejected') => {
        if (newStatus === 'approved') {
            router.patch(`/admin/pendaftaran/${id}/setujui`, {}, { preserveScroll: true });
        } else {
            const notes = prompt('Alasan penolakan (wajib):');
            if (notes) {
                router.patch(`/admin/pendaftaran/${id}/tolak`, { notes }, { preserveScroll: true });
            }
        }
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Setujui ${selectedIds.length} pendaftaran terpilih?`)) {
            router.post('/admin/pendaftaran/setuju-massal', { ids: selectedIds }, {
                onSuccess: () => setSelectedIds([]),
            });
        }
    };

    const handleBulkReject = () => {
        if (selectedIds.length === 0) return;
        const notes = prompt(`Tolak ${selectedIds.length} pendaftaran terpilih. Alasan:`);
        if (notes) {
            router.post('/admin/pendaftaran/tolak-massal', { ids: selectedIds, notes }, {
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

        window.location.href = `/admin/pendaftaran/ekspor-bpjs${params.toString() ? `?${params.toString()}` : ''}`;
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const pendingIds = registrations.data
            .filter(r => r.status === 'pending')
            .map(r => r.id);
        setSelectedIds(prev => prev.length === pendingIds.length ? [] : pendingIds);
    };

    return (
        <AppLayout title="Registration Verification Protocol">
            <Head title="Verifikasi Pendaftaran" />

            <div className="space-y-12 pb-32">
                {/* Modern Tactical Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-100 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] italic leading-none">REGISTRATION_VERIFICATION_V4</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-4 italic uppercase">
                            <ShieldCheck className="w-10 h-10 text-emerald-600" />
                            VERIFIKASI <span className="text-emerald-600">PENDAFTARAN</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-400 italic">Otorisasi sistematis pendaftar KKN, audit parameter kelayakan, dan validasi kedaulatan data pendaftaran.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={handleExport}
                            className="h-20 px-10 bg-slate-950 text-white rounded-[2rem] flex items-center gap-6 group hover:bg-emerald-600 transition-all shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                            <Download className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col relative z-10 text-left">
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5">Export Registry</span>
                                <span className="text-sm font-black italic tracking-tighter leading-none whitespace-nowrap">DOCUMENT_COLLECTION_PDF</span>
                            </div>
                        </button>

                        <button
                            onClick={handleBpjsExport}
                            className="h-20 px-10 bg-emerald-600 text-white rounded-[2rem] flex items-center gap-6 group hover:bg-emerald-700 transition-all shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                            <IdCard className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col relative z-10 text-left">
                                <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest leading-none mb-1.5">Export BPJS</span>
                                <span className="text-sm font-black italic tracking-tighter leading-none whitespace-nowrap">PESERTA_APPROVED_XLSX</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Operations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'TOTAL_INBOUND', value: stats.total, icon: Users, color: 'text-slate-400', bg: 'bg-slate-50' },
                        { label: 'AWAITING_REVIEW', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'SECURITY_CLEARED', value: stats.approved, icon: CheckCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'CLEARANCE_DENIED', value: stats.rejected, icon: XOctagon, color: 'text-rose-500', bg: 'bg-rose-50' }
                    ].map((stat, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className={clsx("p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-inner", stat.bg)}>
                                    <stat.icon className={clsx("w-6 h-6", stat.color)} />
                                </div>
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-100 group-hover:bg-emerald-500 transition-colors" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">{stat.label}</span>
                            <span className="text-3xl font-black text-slate-950 italic tracking-tighter tabular-nums">{stat.value}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Faculty Distribution Analyzer */}
                {stats.by_faculty && stats.by_faculty.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-10 bg-slate-50/50 border border-slate-100 rounded-[3.5rem] overflow-hidden relative group shadow-inner"
                    >
                        <div className="absolute top-0 right-0 p-12 text-slate-200 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <BarChart3 size={180} />
                        </div>
                        <div className="flex items-center gap-6 mb-8">
                             <div className="p-4 bg-white rounded-[1.5rem] shadow-sm border border-slate-100">
                                <Layers className="w-5 h-5 text-emerald-500" />
                             </div>
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">FACULTY_DISTRIBUTION_LEGEAL_ANALYSIS</h3>
                        </div>
                        <div className="flex flex-wrap gap-4 relative z-10">
                            {stats.by_faculty.map((faculty, idx) => (
                                <div key={idx} className="flex items-center gap-4 px-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group/tag">
                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest group-hover/tag:text-slate-900 transition-colors italic">{faculty.faculty_name}</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-100 group-hover/tag:bg-emerald-500 transition-colors" />
                                    <span className="text-sm font-black text-emerald-600 italic group-hover/tag:scale-110 transition-transform tabular-nums">{faculty.count}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Bulk Clearance Protocol */}
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-slate-800 p-10 rounded-[3.5rem] shadow-3xl flex flex-col xl:flex-row items-center justify-between gap-10 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)]" />
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="p-6 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] rounded-[2.5rem] rotate-3">
                                <Zap className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-white italic tracking-[0.3em] uppercase leading-none">Security_Bulk_Clearance_Active</h4>
                                <div className="flex items-center gap-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest italic mt-2">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> {selectedIds.length} ENLISTED_PERSONNEL</span>
                                    <span className="flex items-center gap-2 opacity-50"><div className="w-2 h-2 rounded-full bg-slate-500" /> AWAITING_PATCH...</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 relative z-10 w-full xl:w-auto">
                            <button
                                onClick={handleBulkApprove}
                                className="flex-1 h-16 px-10 bg-emerald-600 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] text-[11px] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                            >
                                EXECUTE_APPROVE
                            </button>
                            <button
                                onClick={handleBulkReject}
                                className="flex-1 h-16 px-10 bg-rose-600 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] text-[11px] hover:bg-rose-500 transition-all shadow-xl shadow-rose-500/20 active:scale-95"
                            >
                                EXECUTE_REJECT
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="flex-1 h-16 px-10 bg-slate-800 text-slate-400 rounded-2xl font-black italic uppercase tracking-[0.2em] text-[11px] hover:bg-slate-700 hover:text-white transition-all active:scale-95"
                            >
                                CANCEL_PROTOCOL
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Tactical Search & Filters */}
                <div className="bg-white rounded-[3.5rem] border border-slate-200 p-10 shadow-sm space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                <Search className="w-3 h-3 text-emerald-500" />
                                PERSONNEL_SEARCH_QUERY
                            </span>
                            <div className="relative group flex items-center">
                                <Search className="absolute left-6 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="search"
                                    placeholder="NIM / NAMA / ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-16 bg-slate-50 border-none rounded-2xl pl-16 pr-8 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                                />
                                <div className="absolute right-6 h-8 w-px bg-slate-200" />
                                <div className="absolute right-10">
                                    <Binary className="w-4 h-4 text-slate-200 group-focus-within:text-emerald-500/20 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2 px-2">
                                <Filter className="w-3 h-3 text-emerald-500" />
                                STATUS_PROTOCOL_FILTER
                            </span>
                            <div className="relative">
                                 <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full h-16 bg-slate-50 border-none rounded-2xl pl-6 pr-12 text-sm font-black italic text-slate-900 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none appearance-none uppercase"
                                >
                                    <option value="">ALL_ENTRY_LOGS</option>
                                    <option value="pending">AWAITING_VERIFICATION</option>
                                    <option value="approved">CLEARANCE_GRANTED</option>
                                    <option value="rejected">CLEARANCE_DENIED</option>
                                </select>
                                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none rotate-90" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Ledger Table */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-12 py-8">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length > 0 && selectedIds.length === registrations.data.filter(r => r.status === 'pending').length}
                                                onChange={toggleSelectAll}
                                                className="rounded-lg border-slate-300 text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 w-6 h-6 shadow-inner cursor-pointer"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-8 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">IDENTIFIED_PARTICIPANT_HASH</th>
                                    <th className="px-8 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">SECTOR_FACULTY_NODE</th>
                                    <th className="px-8 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">OPERATIONAL_PERIOD</th>
                                    <th className="px-8 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">SECURITY_CLEARANCE</th>
                                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">COMMAND_DECK</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {registrations.data.length > 0 ? registrations.data.map((reg, idx) => (
                                    <motion.tr 
                                        key={reg.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={clsx(
                                            "group hover:bg-slate-50/50 transition-colors cursor-default",
                                            selectedIds.includes(reg.id) && "bg-emerald-50/30"
                                        )}
                                    >
                                        <td className="px-12 py-8">
                                            {reg.status === 'pending' ? (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(reg.id)}
                                                    onChange={() => toggleSelect(reg.id)}
                                                    className="rounded-lg border-slate-300 text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 w-6 h-6 shadow-inner cursor-pointer"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 flex items-center justify-center opacity-20">
                                                    <Lock className="w-4 h-4 text-slate-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="h-12 w-12 rounded-xl bg-slate-950 text-emerald-500 border border-slate-800 flex items-center justify-center font-black text-lg italic shadow-lg group-hover:scale-110 transition-transform">
                                                    {(reg.student?.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-black text-slate-950 uppercase italic tracking-tighter group-hover:text-emerald-700 transition-colors truncate max-w-[200px]">
                                                        {reg.student?.name || 'UNKNOWN_ENTITY'}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Fingerprint className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">NIM: {reg.student?.nim || '-'}</span>
                                                    </div>
                                                    {reg.status === 'rejected' && (reg.revision_count ?? 0) > 0 ? (
                                                        <span className="mt-2 text-[9px] font-black uppercase tracking-widest italic text-rose-500">
                                                            RESUBMIT: {reg.revision_count}X
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic bg-slate-100 px-3 py-1 rounded-lg">
                                                {reg.student?.faculty?.name || 'NODE_NULL'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-8 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <Calendar className="w-4 h-4 text-emerald-500" />
                                                <span className="text-xs font-black text-slate-950 uppercase italic tracking-tight">{reg.period?.name || 'UNASSIGNED'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-center uppercase font-bold">
                                            <Badge
                                                variant={reg.status === 'approved' ? 'success' : reg.status === 'rejected' ? 'danger' : 'warning'}
                                                className="px-4 py-1.5 font-black italic text-[9px] uppercase tracking-[0.2em] border-none shadow-sm"
                                            >
                                                {reg.status === 'pending' ? 'AWAITING' : reg.status === 'approved' ? 'APPROVED' : 'REJECTED'}
                                            </Badge>
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            {reg.status === 'pending' ? (
                                                <div className="flex justify-end gap-3 group-hover:scale-105 transition-transform duration-300 origin-right">
                                                    <button
                                                        onClick={() => handleStatusUpdate(reg.id, 'approved')}
                                                        className="h-12 w-12 bg-white border border-slate-200 text-slate-300 hover:text-emerald-600 hover:border-emerald-600 rounded-2xl transition-all shadow-sm active:scale-90"
                                                        title="GRANT_CLEARANCE"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(reg.id, 'rejected')}
                                                        className="h-12 w-12 bg-white border border-slate-200 text-slate-300 hover:text-rose-600 hover:border-rose-600 rounded-2xl transition-all shadow-sm active:scale-90"
                                                        title="DENY_CLEARANCE"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase italic tracking-[0.2em] leading-none mb-1">VERIFIED</span>
                                                        <span className="text-[8px] font-bold text-slate-300 uppercase italic tracking-widest leading-none">AUDIT_LOG_COMMITTED</span>
                                                    </div>
                                                    <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner">
                                                        <ShieldCheck className="w-6 h-6" />
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-12 py-40 text-center">
                                            <div className="flex flex-col items-center gap-8 opacity-20">
                                                <Archive className="h-20 w-20 text-slate-300" />
                                                <p className="text-[11px] font-black uppercase tracking-[0.6em] italic text-slate-500 leading-relaxed">SYSTEM_INFO: NO_REGISTRATION_RECORDS_DETECTED</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {registrations.meta && (
                        <div className="px-12 py-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                             <div className="flex items-center gap-6">
                                <div className="h-10 px-6 bg-slate-950 text-white rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest italic shadow-xl">
                                    <Database className="w-4 h-4 text-emerald-500" />
                                    BUFFER: {registrations.data.length} UNITS
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                    TOTAL_REGISTRY: <span className="text-slate-950">{registrations.meta.total}</span> RECORDS
                                </p>
                            </div>
                            <Pagination meta={registrations.meta} />
                        </div>
                    )}
                </motion.section>

                {/* Tactical Footer Monitor */}
                <div className="p-12 bg-slate-950 rounded-[4rem] border border-slate-800 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)]" />
                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                         <div className="space-y-6 flex-1">
                             <div className="flex items-center gap-6">
                                <div className="p-5 bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-[2.5rem] rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                    <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white italic tracking-[0.3em] uppercase leading-none">Security_Verification_Kernel_V4</h4>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic leading-relaxed max-w-2xl">
                                        Protokol verifikasi pendaftaran menjamin setiap entitas personel yang terdaftar memenuhi kriteria kedaulatan data KKN UIN SAIZU. Seluruh keputusan clearance bersifat permanen dan tercatat dalam log audit administratif.
                                    </p>
                                </div>
                            </div>
                        </div>
                         
                        <div className="flex items-center gap-8 text-slate-500 font-black text-[11px] uppercase tracking-[0.5em] italic opacity-30 hover:opacity-100 transition-opacity whitespace-nowrap">
                             <Fingerprint className="w-5 h-5 text-emerald-500" />
                             REGISTRY_AUDIT • {new Date().getFullYear()}
                        </div>
                    </div>
                    
                    <div className="mt-12 pt-10 border-t border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic">
                         <div className="flex items-center gap-3">
                             <SearchCheck className="w-4 h-4 text-emerald-600" />
                             REGISTRATION_INTEGRITY_PROTOCOL_ALPHA
                         </div>
                         <div className="flex items-center gap-3">
                             ENCRYPTED_STATE_AUTHORITY
                         </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
