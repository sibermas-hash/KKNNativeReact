import { useState } from 'react';
import { router, Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Users,
    Search,
    UserPlus,
    Lock,
    Unlock,
    ArrowRight,
    CheckCircle2,
    ShieldAlert,
    KeyRound,
    Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';

interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    roles: string[];
    email_verified_at: string | null;
    is_active?: boolean;
}

interface Props {
    users: {
        data: User[];
        meta: PaginationMeta;
    };
    filters: { search?: string };
}

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { flash } = usePage<PageProps>().props;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/pengguna', { search }, { preserveState: true });
    };

    const toggleStatus = (user: User) => {
        const primaryRole = user.roles[0]?.toLowerCase();

        if (primaryRole !== 'student') {
            window.alert('Saat ini hanya akun mahasiswa yang dapat diaktifkan atau dinonaktifkan dari halaman ini.');
            return;
        }

        const actionLabel = user.is_active ? 'menonaktifkan' : 'mengaktifkan';

        if (confirm(`Apakah Anda yakin ingin ${actionLabel} akun ini?`)) {
            router.patch(`/admin/pengguna/${user.id}/toggle-status`);
        }
    };

    const resetTemporaryPassword = (user: User) => {
        if (!confirm(`Buat password sementara baru untuk akun ${user.username}? Pengguna akan dipaksa mengganti password saat login berikutnya.`)) {
            return;
        }

        router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title="DATA PENGGUNA">
            <Head title="Manajemen Pengguna | KKN UIN SAIZU" />

            <div className="space-y-6 pb-12">
                {flash?.temporary_password && flash?.temporary_username && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
                        <div className="flex items-start gap-3">
                            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            <div className="space-y-1">
                                <p className="font-bold">Password sementara berhasil dibuat.</p>
                                <p>
                                    Username: <span className="font-semibold">{flash.temporary_username}</span>
                                </p>
                                <p>
                                    Password sementara: <span className="font-mono font-semibold">{flash.temporary_password}</span>
                                </p>
                                <p className="text-xs text-amber-700">
                                    Simpan hanya seperlunya dan minta pengguna segera mengganti password setelah berhasil login.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* --- COMPACT ACTION BAR --- */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h2>
                            <p className="text-sm text-slate-500 font-medium">Total: {users.meta?.total || 0} akun terdaftar</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <form onSubmit={handleSearch} className="relative w-full sm:w-80 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                placeholder="Cari berdasarkan nama/email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm font-medium"
                            />
                        </form>
                        <Link 
                            href="/admin/pengguna/buat" 
                            className="h-11 px-6 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-sm active:scale-95 group"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Buat Akun</span>
                        </Link>
                    </div>
                </div>

                {/* --- DATA TABLE --- */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identitas Personel</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Hak Akses</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Verifikasi</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Opsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-sm text-slate-400 italic">
                                            Tidak ada data pengguna ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-lg border border-slate-200">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{user.name}</div>
                                                        <div className="text-xs text-slate-500 font-medium lowercase tracking-tight">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                    user.roles[0]?.toLowerCase() === 'superadmin' 
                                                        ? "bg-emerald-600 text-white border-emerald-500 shadow-sm" 
                                                        : "bg-slate-50 text-slate-600 border-slate-200"
                                                )}>
                                                    {user.roles[0]?.toUpperCase() || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex justify-center">
                                                    {user.email_verified_at ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                                                            <CheckCircle2 size={12} />
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-200">
                                                            Unverified
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => resetTemporaryPassword(user)}
                                                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition-all hover:bg-amber-100 active:scale-90"
                                                        title="Reset Password Sementara"
                                                    >
                                                        <KeyRound size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => toggleStatus(user)}
                                                        disabled={user.roles[0]?.toLowerCase() !== 'student'}
                                                        className={clsx(
                                                            "h-9 w-9 flex items-center justify-center rounded-lg border transition-all active:scale-90",
                                                            user.is_active 
                                                                ? "bg-white border-slate-200 text-slate-300 hover:text-rose-500 hover:border-rose-200 shadow-sm" 
                                                                : "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 shadow-sm"
                                                        )}
                                                        title={user.is_active ? 'Kunci Akses' : 'Buka Akses'}
                                                    >
                                                        {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                                                    </button>
                                                    <button className="h-9 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm inline-flex items-center gap-2">
                                                        Detail
                                                        <ArrowRight size={14} />
                                                    </button>
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

                {/* --- SIMPLE FOOTER --- */}
                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center gap-3">
                    <ShieldAlert size={16} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Keamanan Data Terjamin Melalui Protokol Enkripsi Internal</span>
                </div>
            </div>
        </AppLayout>
    );
}
