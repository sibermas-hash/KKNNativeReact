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
    CloudDownload,
    Mail,
    Phone,
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
        <AppLayout title="Registrasi Peserta">
            <Head title="Audit Registrasi" />
            
            <div className="space-y-8 pb-20">
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Registrasi</h1>
                        <p className="text-sm text-slate-500 mt-1">Verifikasi dan validasi aplikasi keikutsertaan mahasiswa.</p>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full xl:max-w-2xl relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="search"
                            placeholder="Cari Identitas Peserta (Nama / NIM / Email)..."
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
                                <option value="pending">Menunggu Antrean</option>
                                <option value="approved">Disetujui</option>
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

                {/* Registry Ledger (Table) */}
                <div className="bg-white rounded-lg border border-slate-100 overflow-hidden shadow-sm shadow-slate-200/20">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Identitas_Peserta</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Siklus_Periode</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Status_Audit</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Kendali_Validasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {registrations.data.length > 0 ? registrations.data.map((reg) => (
                                    <tr key={reg.id} className="group/row hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 font-bold italic shadow-lg">
                                                    {reg.mahasiswa.user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-900 group-hover/row:text-emerald-600 transition-colors truncate max-w-[200px]">
                                                        {reg.mahasiswa.user.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">NIM: {reg.mahasiswa.nim}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-bold text-slate-600 text-sm">
                                            {reg.periode.name}
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={clsx(
                                                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight shadow-sm border",
                                                reg.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                reg.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {reg.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            {reg.status === 'pending' ? (
                                                <div className="flex justify-end gap-3 translate-x-2 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => handleStatusUpdate(reg.id, 'approved')}
                                                        className="p-3 bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm group/btn"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(reg.id, 'rejected')}
                                                        className="p-3 bg-white border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-sm group/btn"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic opacity-50 pr-4">AUDIT_FINALIZED</div>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20 italic">
                                                <SearchCheck className="h-12 w-12 text-slate-900" />
                                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.4em]">BELUM_ADA_ANTREAN_REGISTRY</span>
                                            </div>
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
