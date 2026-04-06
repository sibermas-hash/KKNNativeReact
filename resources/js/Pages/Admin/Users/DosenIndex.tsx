import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import { router, Link, Head, usePage } from '@inertiajs/react';
import { 
    Search, 
    RefreshCw,
    Building2,
    Lock,
    Unlock,
    ArrowRight,
    UserCheck,
    KeyRound,
    Info
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';

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
    const { flash } = usePage<PageProps>().props;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/dosen', { search }, { preserveState: true });
    };

    const toggleStatus = (user: User) => {
        window.alert(`Status akses akun dosen ${user.username} belum dikelola dari halaman ini. Gunakan reset password sementara atau alur pengelolaan akun terpusat.`);
    };

    const resetTemporaryPassword = (user: User) => {
        if (!confirm(`Buat password sementara baru untuk akun ${user.username}? Dosen akan dipaksa mengganti password saat login berikutnya.`)) {
            return;
        }

        router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title="Basis Data Dosen">
            <Head title="Database DPL | KKN UIN SAIZU" />

            <div className="space-y-12 pb-32 font-sans">
                {/* Temporary Access Alert */}
                {flash?.temporary_password && flash?.temporary_username && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm relative overflow-hidden">
                        <div className="flex items-start gap-5 relative z-10">
                            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                                <KeyRound size={24} />
                            </div>
                            <div className="space-y-3 flex-1">
                                <h3 className="text-base font-bold text-slate-900">Kredensial Dosen Diterbitkan</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="p-4 bg-white/60 rounded-xl border border-amber-100">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Username / NIP</p>
                                        <p className="text-base font-bold text-slate-900">{flash.temporary_username}</p>
                                    </div>
                                    <div className="p-4 bg-white/60 rounded-xl border border-amber-100">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Password Sementara</p>
                                        <p className="text-base font-mono font-bold text-slate-900">{flash.temporary_password}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Clean Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Database Dosen Pembimbing</h1>
                        <p className="text-sm text-slate-500 mt-1">Manajemen identitas dan otoritas DPL yang terkoneksi dengan data kepegawaian.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <form onSubmit={handleSearch} className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Cari NIP atau Nama..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 w-64 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            />
                        </form>
                        <Link 
                            href="/admin/dosen/sinkron" 
                            className="h-11 px-6 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-600 transition-all shadow-md active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Sinkron Data
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identitas Pengampu</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Unit Kerja / Fakultas</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status Akses</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right pr-10">Pilihan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-12 py-32 text-center">
                                            <div className="flex flex-col items-center gap-8 opacity-20">
                                                <Building2 size={80} className="text-slate-400" />
                                                <p className="text-xl font-black text-slate-400 uppercase tracking-[0.5em] italic">NULL_RECORDS_MAPPED</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 text-blue-600 flex items-center justify-center font-bold">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{user.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400">NIP: {user.dosen?.nip || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg inline-block uppercase tracking-wider">
                                                    {user.dosen?.fakultas?.nama || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex justify-center">
                                                    {user.is_active ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 tracking-wider">
                                                            <UserCheck size={12} />
                                                            AKTIF
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-3 py-1.5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-200 tracking-wider">
                                                            TERKUNCI
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => resetTemporaryPassword(user)}
                                                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition-all hover:bg-amber-100 active:scale-95 shadow-sm"
                                                        title="Reset Password Sementara"
                                                    >
                                                        <KeyRound size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStatus(user)}
                                                        className={clsx(
                                                            "h-9 w-9 flex items-center justify-center rounded-lg border transition-all active:scale-95 shadow-sm",
                                                            user.is_active 
                                                            ? "bg-white border-slate-200 text-slate-400 hover:text-slate-600" 
                                                            : "bg-blue-600 border-blue-500 text-white"
                                                        )}
                                                        title="Status Akses"
                                                    >
                                                        {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                                                    </button>
                                                    <Link 
                                                        href="/admin/dosen/penugasan"
                                                        className="h-9 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 shadow-sm inline-flex items-center gap-2"
                                                    >
                                                        Tugas
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
                    <div className="px-12 py-8 bg-slate-50/30 border-t border-slate-100">
                        <Pagination meta={users.meta} />
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-none">DATABASE_SDM_UIN_SAIZU_2026</span>
                </div>
            </div>
        </AppLayout>
    );
}
