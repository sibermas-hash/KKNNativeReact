import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCheck,
    Clock,
    Clock3,
    ClipboardList,
    Download,
    FilterX,
    IdCard,
    Search,
    Users,
    XCircle,
    ChevronRight,
    Zap,
    Target,
    Database,
    ShieldCheck,
    Layers3,
    Activity,
    Filter,
    Cpu,
    CheckCircle2,
    X,
    MoreVertical,
    ChevronDown,
    Info,
    ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';

interface Registration { id: number; status: 'pending' | 'approved' | 'rejected'; notes?: string | null; rejection_reason?: string | null; revision_count?: number; resubmitted_at?: string | null; student: { nim: string; name: string; phone?: string | null; wa_link?: string | null; faculty?: { name: string }; program?: { name: string }; }; period: { name: string; id: number | null }; group?: { name: string }; registration_date: string; }
interface FacultyStat { faculty_name: string; count: number; }
interface Props { registrations?: { data: Registration[]; meta: PaginationMeta; }; filters: { search?: string; status?: string; period_id?: string; }; stats?: { total: number; pending: number; approved: number; rejected: number; by_faculty: FacultyStat[]; }; periods?: Array<{ id: number; name: string }>; }

function formatDateTime(value: string | null | undefined): string { 
    if (!value) return '—'; 
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', }).format(date);
    } catch (e) {
        return '—';
    }
}

export default function RegistrationsIndex({ registrations, filters, stats, periods }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [periodId, setPeriodId] = useState(filters.period_id ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => { setSearch(filters.search ?? ''); setStatus(filters.status ?? ''); setPeriodId(filters.period_id ?? ''); }, [filters]);

    const pendingIds = useMemo(() => registrations?.data?.filter((r) => r.status === 'pending').map((r) => r.id) ?? [], [registrations?.data]);

    const applyFilters = () => { router.get('/admin/pendaftaran', { search: search || undefined, status: status || undefined, period_id: periodId || undefined, }, { preserveState: true, preserveScroll: true, replace: true }); };
    const resetFilters = () => { setSearch(''); setStatus(''); setPeriodId(''); router.get('/admin/pendaftaran', {}, { preserveState: true, preserveScroll: true, replace: true }); };

    const handleBulkApprove = () => { if (selectedIds.length === 0) return; if (confirm(`Setujui ${selectedIds.length} pendaftaran mahasiswa terpilih?`)) { router.post('/admin/pendaftaran/setuju-massal', { ids: selectedIds }, { preserveScroll: true, onSuccess: () => setSelectedIds([]), }); } };
    const handleBulkReject = () => { if (selectedIds.length === 0) return; const notes = prompt(`Alasan penolakan untuk ${selectedIds.length} pendaftaran:`); if (notes) { router.post('/admin/pendaftaran/tolak-massal', { ids: selectedIds, notes }, { preserveScroll: true, onSuccess: () => setSelectedIds([]), }); } };

    const handleExport = (type: 'standard' | 'bpjs') => {
        const url = type === 'standard' ? '/admin/pendaftaran/ekspor' : '/admin/pendaftaran/ekspor-bpjs';
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        if (periodId) params.set('period_id', periodId);
        window.location.href = `${url}${params.toString() ? `?${params.toString()}` : ''}`;
    };

    const toggleSelect = (id: number) => { setSelectedIds((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id])); };
    const toggleSelectAll = () => { setSelectedIds((current) => (current.length === pendingIds.length ? [] : pendingIds)); };

    const activeFilterCount = (search ? 1 : 0) + (status ? 1 : 0) + (periodId ? 1 : 0);

    return (
        <AppLayout title="Manajemen Pendaftaran Mahasiswa">
            <Head title="Manajemen Pendaftaran" />

            <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
                {/* --- PREMIUM HEADER --- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <ClipboardList size={18} />
                        <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Administrasi Operasional</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                                Manajemen <span className="text-emerald-500">Pendaftaran.</span>
                            </h1>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                                Otoritas Verifikasi Registrasi Peserta dan Pengarsipan Berkas KKN
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="h-14 px-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
                                <Database size={18} className="text-emerald-500" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Entri</span>
                                    <span className="text-sm font-black text-slate-900 uppercase tabular-nums leading-none tracking-tight">{stats?.total ?? 0} PENGAJUAN</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleExport('bpjs')}
                                    className="h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all flex items-center gap-2 text-xs font-bold active:scale-95 uppercase tracking-widest"
                                    title="Ekspor Data BPJS Mahasiswa"
                                >
                                    <IdCard size={18} />
                                    BPJS
                                </button>
                                <button
                                    onClick={() => handleExport('standard')}
                                    className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm uppercase tracking-wider"
                                >
                                    <Download size={18} />
                                    EKSPOR EXCEL
                                </button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <RegMetric label="Total Pengajuan" value={stats?.total ?? 0} icon={Layers3} color="emerald" desc="Pendaftar masuk" />
                    <RegMetric label="Menunggu Review" value={stats?.pending ?? 0} icon={Clock3} color="amber" desc="Perlu verifikasi" />
                    <RegMetric label="Telah Disetujui" value={stats?.approved ?? 0} icon={CheckCheck} color="emerald" desc="Lolos kualifikasi" />
                    <RegMetric label="Ditolak / Blokir" value={stats?.rejected ?? 0} icon={XCircle} color="rose" desc="Tidak memenuhi syarat" />
                </div>

                {/* --- MASS ACTIONS --- */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-emerald-700/90 backdrop-blur-md rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-emerald-200/50 border border-emerald-400/20">
                            <div className="flex items-center gap-4 pl-4">
                                <div className="h-10 w-10 bg-emerald-400 text-emerald-900 rounded-xl flex items-center justify-center">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase">{selectedIds.length} Pendaftaran Terpilih</p>
                                    <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest leading-none mt-1">Tindakan Massal Aktif</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pr-2">
                                <button onClick={handleBulkApprove} className="px-6 py-2.5 bg-white text-emerald-700 text-xs font-bold uppercase rounded-xl hover:bg-emerald-50 active:scale-95 transition-all shadow-sm">Setujui Massal</button>
                                <button onClick={handleBulkReject} className="px-6 py-2.5 bg-red-500 text-white text-xs font-bold uppercase rounded-xl hover:bg-red-600 active:scale-95 transition-all shadow-sm">Tolak Massal</button>
                                <button onClick={() => setSelectedIds([])} className="h-10 w-10 bg-white/10 text-emerald-100 rounded-xl hover:text-white flex items-center justify-center hover:bg-white/20 transition-all"><X size={20}/></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- MAIN TABLE --- */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white border border-slate-200 text-emerald-600 rounded-xl flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-black uppercase tracking-wider">Daftar Pengajuan Masuk</h3>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="relative w-full md:w-64 group">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <input 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()} 
                                    className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300" 
                                    placeholder="Cari Nama atau NIM..." 
                                />
                             </div>
                             <button 
                                onClick={() => setShowFilters(!showFilters)} 
                                className={clsx(
                                    "h-11 px-5 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all border", 
                                    showFilters ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <Filter size={16} /> 
                                {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
                             </button>
                             <Button onClick={applyFilters} className="h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase transition-all">Update</Button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white border-b border-slate-100 overflow-hidden">
                                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                     <div className="space-y-2">
                                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">Periode KKN</label>
                                         <div className="relative">
                                            <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700 outline-none transition focus:bg-white focus:border-emerald-500 appearance-none cursor-pointer pr-10">
                                                 <option value="">— Semua Periode —</option>
                                                {periods?.map((p) => <option key={p.id} value={p.id || ''}>{p.name.toUpperCase()}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                         </div>
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">Status Verifikasi</label>
                                         <div className="relative">
                                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-700 outline-none transition focus:bg-white focus:border-emerald-500 appearance-none cursor-pointer">
                                                <option value="">— Semua Status —</option>
                                                <option value="pending">Menunggu Review</option>
                                                <option value="approved">Disetujui</option>
                                                <option value="rejected">Ditolak</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                         </div>
                                     </div>
                                     <div className="flex items-end gap-3 pb-0.5">
                                         <button onClick={resetFilters} className="px-6 py-3 font-bold text-slate-400 hover:text-red-500 transition-colors uppercase text-xs">Reset Filter</button>
                                     </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 w-10 text-center">
                                        <input type="checkbox" checked={pendingIds.length > 0 && selectedIds.length === pendingIds.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                    </th>
                                    <th className="px-6 py-4">Informasi Mahasiswa</th>
                                    <th className="px-6 py-4">Fakultas / Prodi</th>
                                    <th className="px-6 py-4">Periode Terdaftar</th>
                                    <th className="px-6 py-4">Status & Kelompok</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                                {(!registrations || !registrations.data || registrations.data.length === 0) ? (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-300">
                                                <Info size={40} className="mb-2" />
                                                <p className="text-sm font-bold uppercase tracking-[0.2em]">Data pendaftaran mahasiswa tidak ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    registrations.data.map((r) => (
                                        <tr key={r.id} className={clsx("hover:bg-slate-50/30 transition-colors group", selectedIds.includes(r.id) && "bg-emerald-50/50")}>
                                            <td className="px-6 py-4 text-center">
                                                {r.status === 'pending' ? 
                                                    <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /> : 
                                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200 mx-auto" />
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-extrabold text-black group-hover:text-emerald-700 transition-colors uppercase leading-tight truncate max-w-[200px]">
                                                        {r.student.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">NIM: {r.student.nim}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 uppercase leading-none truncate max-w-[150px]">{r.student.program?.name || '—'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase leading-none">{r.student.faculty?.name || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Target size={14} className="text-emerald-500" />
                                                        <span className="text-xs font-bold text-black uppercase tracking-tight italic">{r.period.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase italic">
                                                        <Clock size={10} />
                                                        {formatDateTime(r.registration_date)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                 <div className="flex flex-col gap-1.5">
                                                     <div className="flex items-center gap-2">
                                                        <span className={clsx(
                                                            "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border", 
                                                            r.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                                            r.status === 'rejected' ? "bg-red-50 text-red-700 border-red-100 shadow-sm shadow-red-50" : 
                                                            "bg-amber-50 text-amber-700 border-amber-100 shadow-sm shadow-amber-50"
                                                        )}>
                                                            {r.status === 'pending' ? 'MENUNGGU' : r.status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                            {r.group?.name || 'BELUM DI-PLOT'}
                                                        </span>
                                                     </div>
                                                     {r.status === 'rejected' && r.rejection_reason && <p className="text-[10px] font-bold text-red-400 uppercase italic line-clamp-1">— {r.rejection_reason}</p>}
                                                 </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/admin/pendaftaran/${r.id}`} className="h-9 px-6 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 group">
                                                    Detail
                                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menampilkan {registrations?.data?.length ?? 0} dari {registrations?.meta?.total ?? 0} Pengajuan</span>
                        {registrations?.meta && <Pagination meta={registrations.meta} />}
                    </div>
                </div>

                {/* --- FOOTER GUIDE --- */}
                <div className="bg-emerald-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl shadow-emerald-200">
                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none rotate-12">
                         <ShieldCheck size={200} />
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                        <div className="flex items-center gap-8">
                            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
                                <Activity size={32} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-bold uppercase tracking-tight">Otoritas Validasi Pendaftaran</h4>
                                <p className="text-sm font-medium text-emerald-50 opacity-80 max-w-2xl leading-relaxed">
                                    Pendaftaran mahasiswa diverifikasi berdasarkan kelayakan berkas dan pemenuhan syarat akademik. Anda dapat melakukan persetujuan massal untuk mempercepat proses administratif.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function RegMetric({ label, value, icon: Icon, color, desc }: { label: string; value: number | string; icon: LucideIcon; color: 'emerald' | 'amber' | 'rose' | 'slate', desc: string }) {
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rose: 'bg-red-50 text-red-600 border-red-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        slate: 'bg-slate-50 text-slate-400 border-slate-100'
    };
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 hover:shadow-lg transition-all group overflow-hidden relative">
            <div className="flex items-center justify-between relative z-10">
                <div className={clsx('h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-sm', colorMap[color])}>
                    <Icon size={20} />
                </div>
                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">{desc}</div>
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-3xl font-black text-black tracking-tighter tabular-nums leading-none">
                    {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                </p>
            </div>
        </div>
    );
}
