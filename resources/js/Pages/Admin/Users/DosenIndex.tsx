import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import { router, Link, Head } from '@inertiajs/react';
import { 
    Users,
    Search, 
    RefreshCw,
    Building2,
    Filter,
    Lock,
    Unlock,
    ArrowRight,
    UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    is_active: boolean;
    dosen?: {
        nip: string;
        fakultas?: { nama: string };
    };
}

interface Props {
    users: {
        data: User[];
        meta: PaginationMeta;
    };
    filters: {
        search: string;
    };
}

export default function DosenIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/dosen', { search }, { preserveState: true });
    };

    const toggleStatus = (user: User) => {
        if (confirm(`Apakah Anda yakin ingin ${user.is_active ? 'menonaktifkan' : 'mengaktifkan'} akun ini?`)) {
            router.patch(`/admin/pengguna/${user.id}/toggle-status`, {}, {
                preserveScroll: true
            });
        }
    };

    return (
        <AppLayout title="DATA DOSEN">
            <Head title="Database DPL | KKN UIN SAIZU" />

            <div className="space-y-6">
                
                {/* --- COMPACT HEADER --- */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Database Dosen (DPL)</h2>
                            <p className="text-sm text-slate-500 font-medium">Total: {users.meta?.total || 0} orang terdaftar</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <form onSubmit={handleSearch} className="relative w-full sm:w-80 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="search"
                                placeholder="Cari NIP atau Nama..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm font-medium"
                            />
                        </form>
                        <Link 
                            href="/admin/dosen/sinkron" 
                            className="h-11 px-6 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all shadow-sm active:scale-95 group"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                            <span>Sinkron</span>
                        </Link>
                    </div>
                </div>

                {/* --- DATA TABLE --- */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identitas Dosen</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Homebase</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status Akses</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-sm text-slate-400 italic">
                                            Tidak ada data dosen ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800 tracking-tight">{user.name}</div>
                                                        <div className="text-xs text-slate-500 font-medium tracking-tight">NIP: {user.dosen?.nip || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-block">
                                                    {user.dosen?.fakultas?.nama || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex justify-center">
                                                    {user.is_active ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                                                            <UserCheck size={12} />
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-200">
                                                            Terkunci
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleStatus(user)}
                                                        className={clsx(
                                                            "h-9 w-9 flex items-center justify-center rounded-lg border transition-all active:scale-90",
                                                            user.is_active 
                                                            ? "bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200" 
                                                            : "bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                                                        )}
                                                        title={user.is_active ? 'Kunci Akses' : 'Buka Akses'}
                                                    >
                                                        {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                                                    </button>
                                                    <Link 
                                                        href="/admin/dosen/penugasan"
                                                        className="h-9 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm inline-flex items-center gap-2"
                                                    >
                                                        Penugasan
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* --- PAGINATION --- */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                        <Pagination meta={users.meta} />
                    </div>
                </div>

                {/* --- SIMPLE INFO --- */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-center gap-2">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Integritas Basis Data SDM UIN SAIZU</span>
                </div>
            </div>
        </AppLayout>
    );
}
