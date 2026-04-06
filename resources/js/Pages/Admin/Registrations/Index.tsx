import { useState, useEffect } from 'react'
import { router, Head, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import {
    CheckCircle2,
    XCircle,
    Search,
    Download,
    Users,
    Clock,
    CheckCheck,
    XOctagon,
    ShieldCheck,
    Zap,
    Fingerprint,
    IdCard,
    Archive,
    Lock
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
        <AppLayout title="Proses Verifikasi Pendaftaran">
            <Head title="Verifikasi | POS-KKN" />

            <div className="space-y-8 font-sans antialiased">
                {/* SYSTEM HEADER */}
                <div className="bg-white border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">VERIFIKASI PENDAFTARAN</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            SISTEM VALIDASI KEPESERTAAN MAHASISWA
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExport}
                            className="h-10 px-4 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                        >
                            <Download size={14} />
                            EKSPOR PDF
                        </button>
                        <button
                            onClick={handleBpjsExport}
                            className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                        >
                            <IdCard size={14} />
                            EKSPOR BPJS
                        </button>
                    </div>
                </div>

                {/* STATS STRIP */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatBox title="TOTAL PENDAFTAR" value={stats.total} icon={Users} color="emerald" />
                    <StatBox title="MENUNGGU" value={stats.pending} icon={Clock} color="emerald" />
                    <StatBox title="DISETUJUI" value={stats.approved} icon={CheckCheck} color="emerald" />
                    <StatBox title="DITOLAK" value={stats.rejected} icon={XOctagon} color="rose" />
                </div>

                {/* BULK PANEL */}
                {selectedIds.length > 0 && (
                    <div className="bg-emerald-600 border border-emerald-500 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg shadow-emerald-600/10 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-white/20 rounded flex items-center justify-center">
                                <Zap size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-[0.2em]">AKSI MASSAL AKTIF ({selectedIds.length})</h4>
                                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-tighter">DATA TERPILIH SIAP DIPROSES</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black">
                            <button onClick={handleBulkApprove} className="h-10 px-6 bg-white text-emerald-600 hover:bg-emerald-50 uppercase tracking-widest transition-all shadow-sm">SETUJUI MASSAL</button>
                            <button onClick={handleBulkReject} className="h-10 px-6 bg-rose-600 hover:bg-rose-700 uppercase tracking-widest transition-all shadow-sm">TOLAK MASSAL</button>
                            <button onClick={() => setSelectedIds([])} className="h-10 px-6 bg-emerald-700 hover:bg-emerald-800 uppercase tracking-widest transition-all">BATAL</button>
                        </div>
                    </div>
                )}

                {/* SEARCH/FILTER */}
                <div className="bg-white border border-slate-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input
                                 type="search"
                                 placeholder="CARI NIM, NAMA, ATAU ID..."
                                 value={search}
                                 onChange={(e) => setSearch(e.target.value)}
                                 className="w-full h-10 bg-slate-50 border border-slate-200 rounded px-10 text-xs font-bold text-slate-700 uppercase tracking-wider focus:bg-white focus:ring-0 focus:border-emerald-500 outline-none transition-all"
                             />
                        </div>
                        <div className="md:col-span-4">
                             <select
                                 value={status}
                                 onChange={(e) => setStatus(e.target.value)}
                                 className="w-full h-10 bg-slate-50 border border-slate-200 rounded px-4 text-xs font-black text-slate-700 uppercase tracking-wider focus:bg-white focus:border-emerald-500 outline-none transition-all"
                             >
                                 <option value="">SEMUA STATUS</option>
                                 <option value="pending">WAITING</option>
                                 <option value="approved">APPROVED</option>
                                 <option value="rejected">REJECTED</option>
                             </select>
                        </div>
                    </div>
                </div>

                {/* DATA GRID */}
                <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                                    <th className="px-6 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length > 0 && selectedIds.length === registrations.data.filter(r => r.status === 'pending').length}
                                            onChange={toggleSelectAll}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">IDENTITAS MAHASISWA</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">UNIT / FAKULTAS</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">PERIODE</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">STATUS</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-6">INSTRUMEN</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {registrations.data.length > 0 ? registrations.data.map((reg) => (
                                    <tr key={reg.id} className={clsx("hover:bg-slate-50 transition-colors", selectedIds.includes(reg.id) && "bg-emerald-50/50")}>
                                        <td className="px-6 py-4">
                                            {reg.status === 'pending' ? (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(reg.id)}
                                                    onChange={() => toggleSelect(reg.id)}
                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                                                />
                                            ) : <Lock size={12} className="text-slate-300 mx-auto" />}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                                    {(reg.student?.name || '?').charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate w-48">{reg.student?.name}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">NIM: {reg.student?.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                {reg.student?.faculty?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{reg.period?.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusTag status={reg.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right pr-6">
                                            {reg.status === 'pending' ? (
                                                <div className="flex justify-end gap-2 text-white">
                                                    <button onClick={() => handleStatusUpdate(reg.id, 'approved')} className="h-8 w-8 bg-emerald-600 flex items-center justify-center rounded hover:bg-emerald-700 transition-colors">
                                                        <CheckCheck size={14} />
                                                    </button>
                                                    <button onClick={() => handleStatusUpdate(reg.id, 'rejected')} className="h-8 w-8 bg-rose-600 flex items-center justify-center rounded hover:bg-rose-700 transition-colors">
                                                        <XOctagon size={14} />
                                                    </button>
                                                </div>
                                            ) : <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LOCKED</span>}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center text-slate-300">
                                            <Archive size={48} className="mx-auto mb-4 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">TIDAK ADA DATA</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {registrations.meta && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL DATA: {registrations.meta.total}</span>
                             <Pagination meta={registrations.meta} />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}

function StatBox({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
    return (
        <div className="bg-white border border-slate-200 p-6 flex flex-col items-center justify-center text-center gap-3">
             <div className={clsx(
                 "p-2 rounded",
                 color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                 color === 'amber' ? 'bg-amber-50 text-amber-600' :
                 color === 'rose' ? 'bg-rose-50 text-rose-600' :
                 'bg-slate-100 text-slate-500'
             )}>
                 <Icon size={16} />
             </div>
             <div className="flex flex-col">
                 <span className="text-2xl font-black text-slate-800 tabular-nums leading-none mb-1">{value.toLocaleString()}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
             </div>
        </div>
    );
}

function StatusTag({ status }: { status: string }) {
    return (
        <span className={clsx(
            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
            status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
            status === 'pending' ? 'bg-amber-100 text-amber-700' : 
            'bg-rose-100 text-rose-700'
        )}>
            {status === 'approved' ? 'OK' : status === 'pending' ? 'WAIT' : 'FAIL'}
        </span>
    );
}
