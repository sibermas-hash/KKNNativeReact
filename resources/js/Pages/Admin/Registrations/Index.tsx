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
} from 'lucide-react'
import { clsx } from 'clsx'
import { Pagination } from '@/Components/ui'

interface Registration {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    mahasiswa: {
        nim: string;
        user: { 
            name: string;
            email: string;
            phone: string;
        };
    };
    periode: { name: string; };
    created_at: string;
}

interface Props {
    registrations: {
        data: Registration[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function RegistrationsIndex({ registrations, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.registrations.index'), { search, status }, { preserveState: true });
    };

    const handleStatusUpdate = (id: number, newStatus: 'approved' | 'rejected') => {
        if (confirm(`Apakah Anda yakin ingin ${newStatus === 'approved' ? 'menyetujui' : 'menolak'} pendaftaran ini?`)) {
            router.patch(route('admin.registrations.update', id), { status: newStatus });
        }
    };

    return (
        <AppLayout title="Verifikasi Pendaftaran">
            <Head title="Pendaftaran Peserta" />
            
            <div className="space-y-8 pb-20">
                {/* Simple Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verifikasi Pendaftaran</h1>
                        <p className="text-sm text-slate-500 mt-1">Kelola dan tinjau aplikasi pendaftaran mahasiswa KKN.</p>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full xl:max-w-2xl relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="search"
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
                                <option value="pending">Menunggu Verifikasi</option>
                                <option value="approved">Diterima</option>
                                <option value="rejected">Ditolak</option>
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
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mahasiswa</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {registrations.data.length > 0 ? registrations.data.map((reg) => (
                                    <tr key={reg.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                                    {reg.mahasiswa.user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900  transition-colors  mb-1">
                                                        {reg.mahasiswa.user.name}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-400">NIM: {reg.mahasiswa.nim}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium text-slate-600">
                                            {reg.periode.name}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight border",
                                                reg.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                reg.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {reg.status === 'pending' ? 'Menunggu' : reg.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {reg.status === 'pending' ? (
                                                <div className="flex justify-end gap-2 opacity-0  transition-opacity">
                                                    <button
                                                        onClick={() => handleStatusUpdate(reg.id, 'approved')}
                                                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-100"
                                                        title="Terima"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(reg.id, 'rejected')}
                                                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-100"
                                                        title="Tolak"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-300 uppercase italic opacity-50 pr-4">Terverifikasi</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center opacity-30">
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
