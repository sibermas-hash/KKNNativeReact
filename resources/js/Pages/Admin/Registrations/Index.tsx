import { useState } from 'react'
import { router, Link, Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { route } from 'ziggy-js'
import {
    CheckCircle2,
    XCircle,
    Search,
    RefreshCw,
    Filter,
    User,
    Calendar,
    ArrowRight,
    SearchCheck,
    Download,
    Users,
    Clock,
    CheckCheck,
    XOctagon,
    BarChart3,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Pagination, Badge } from '@/Components/ui'

interface Registration {
    id: number;
    status: 'menunggu' | 'disetujui' | 'ditolak';
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
        meta: Record<string, unknown>;
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.registrations.index'), { search, status }, { preserveState: true });
    };

    const handleStatusUpdate = (id: number, newStatus: 'disetujui' | 'ditolak') => {
        if (newStatus === 'disetujui') {
            router.patch(route('admin.registrations.approve', id), {}, { preserveScroll: true });
        } else {
            const notes = prompt('Alasan penolakan (wajib):');
            if (notes) {
                router.patch(route('admin.registrations.reject', id), { notes }, { preserveScroll: true });
            }
        }
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Setujui ${selectedIds.length} pendaftaran terpilih?`)) {
            router.post(route('admin.registrations.bulk-approve'), { ids: selectedIds }, {
                onSuccess: () => setSelectedIds([]),
            });
        }
    };

    const handleBulkReject = () => {
        if (selectedIds.length === 0) return;
        const notes = prompt(`Tolak ${selectedIds.length} pendaftaran terpilih. Alasan:`);
        if (notes) {
            router.post(route('admin.registrations.bulk-reject'), { ids: selectedIds, notes }, {
                onSuccess: () => setSelectedIds([]),
            });
        }
    };

    const handleExport = () => {
        window.location.href = route('admin.registrations.export');
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const pendingIds = registrations.data
            .filter(r => r.status === 'menunggu')
            .map(r => r.id);
        setSelectedIds(prev => prev.length === pendingIds.length ? [] : pendingIds);
    };

    return (
        <AppLayout title="Verifikasi Pendaftaran">
            <Head title="Pendaftaran Peserta" />

            <div className="space-y-6 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verifikasi Pendaftaran</h1>
                        <p className="text-sm text-slate-500 mt-1">Kelola dan tinjau aplikasi pendaftaran mahasiswa KKN.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-xs text-slate-500">Total Pendaftaran</p>
                                <p className="text-2xl font-bold text-slate-900">{stats?.total || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-amber-200 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-white">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <div>
                                <p className="text-xs text-slate-500">Menunggu</p>
                                <p className="text-2xl font-bold text-amber-900">{stats?.pending || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-emerald-200 rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-white">
                        <div className="flex items-center gap-3">
                            <CheckCheck className="w-5 h-5 text-emerald-600" />
                            <div>
                                <p className="text-xs text-slate-500">Disetujui</p>
                                <p className="text-2xl font-bold text-emerald-900">{stats?.approved || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="border border-rose-200 rounded-lg p-4 bg-gradient-to-br from-rose-50 to-white">
                        <div className="flex items-center gap-3">
                            <XOctagon className="w-5 h-5 text-rose-600" />
                            <div>
                                <p className="text-xs text-slate-500">Ditolak</p>
                                <p className="text-2xl font-bold text-rose-900">{stats?.rejected || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* By Faculty */}
                {stats?.by_faculty && stats.by_faculty.length > 0 && (
                    <div className="border border-slate-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Pendaftaran per Fakultas
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {stats.by_faculty.map((faculty, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">{faculty.faculty_name}</span>
                                    <Badge variant="default">{faculty.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bulk Actions Bar */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCheck className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">
                                {selectedIds.length} pendaftaran dipilih
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkApprove}
                                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded hover:bg-emerald-700 transition-colors"
                            >
                                Setujui Semua
                            </button>
                            <button
                                onClick={handleBulkReject}
                                className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded hover:bg-rose-700 transition-colors"
                            >
                                Tolak Semua
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded hover:bg-slate-300 transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full xl:max-w-2xl relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="cari"
                            placeholder="Cari Nama, NIM, atau Email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm transition-all focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none shadow-sm shadow-slate-100/10"
                        />
                    </form>

                    <div className="flex gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-56 group">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 appearance-none cursor-pointer font-semibold text-slate-600"
                            >
                                <option value="">Semua Status</option>
                                <option value="menunggu">Menunggu Verifikasi</option>
                                <option value="disetujui">Diterima</option>
                                <option value="ditolak">Ditolak</option>
                            </select>
                        </div>

                        <button
                            onClick={() => router.reload()}
                            className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 rounded-xl flex items-center justify-center transition-all shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        {stats?.pending > 0 && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-slate-300"
                                            />
                                        )}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mahasiswa</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fakultas</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {registrations.data.length > 0 ? registrations.data.map((reg) => (
                                    <tr key={reg.id} className={clsx(
                                        "group hover:bg-slate-50/50 transition-colors",
                                        selectedIds.includes(reg.id) && "bg-blue-50"
                                    )}>
                                        <td className="px-6 py-5">
                                            {reg.status === 'menunggu' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(reg.id)}
                                                    onChange={() => toggleSelect(reg.id)}
                                                    className="rounded border-slate-300"
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                                    {(reg.student?.name || '?').charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 mb-1">
                                                        {reg.student?.name || 'Unknown'}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400">NIM: {reg.student?.nim || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-600">
                                            {reg.student?.faculty?.name || '-'}
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium text-slate-600">
                                            {reg.period?.name || '-'}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <Badge
                                                variant={reg.status === 'disetujui' ? 'berhasil' : reg.status === 'ditolak' ? 'danger' : 'peringatan'}
                                            >
                                                {reg.status === 'menunggu' ? 'Menunggu' : reg.status === 'disetujui' ? 'Disetujui' : 'Ditolak'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {reg.status === 'menunggu' ? (
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleStatusUpdate(reg.id, 'disetujui')}
                                                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-100"
                                                        title="Terima"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(reg.id, 'ditolak')}
                                                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-100"
                                                        title="Tolak"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-300 italic">Terverifikasi</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <SearchCheck className="h-10 w-10 mx-auto mb-4 text-slate-200" />
                                            <p className="text-sm font-semibold text-slate-400">Tidak ada pendaftaran yang ditemukan</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8">
                    <Pagination meta={registrations.meta} />
                </div>
            </div>
        </AppLayout>
    )
}
