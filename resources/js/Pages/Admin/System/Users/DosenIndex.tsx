import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import { router, Link, Head, usePage } from '@inertiajs/react';
import { Search, RefreshCw, Users, KeyRound, Plus, UserCheck, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';

interface User {
    id: number; username: string; name: string; email: string; is_active: boolean;
    dosen?: { nip: string; fakultas?: { nama: string }; };
}
interface Props { users: { data: User[]; meta: PaginationMeta; }; filters: { search: string; }; }

export default function DosenIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const { flash } = usePage<PageProps>().props;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/dosen', { search }, { preserveState: true });
    };

    const resetTemporaryPassword = (user: User) => {
        if (!confirm(`Buat kata sandi sementara untuk ${user.username}?`)) return;
        router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Data Dosen DPL">
            <Head title="Data Dosen DPL | POS-KKN" />

            <div className="min-h-screen bg-slate-50/50 pb-20">
                {/* Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-[1600px] mx-auto px-8 py-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Manajemen DPL</span>
                                </div>
                                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                    Data <span className="text-emerald-600">Dosen DPL</span>
                                </h1>
                                <p className="text-slate-500 max-w-2xl text-lg font-medium">
                                    Manajemen data Dosen Pembimbing Lapangan dan Koordinator Wilayah.
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden xl:flex flex-col items-end pr-6 border-r border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                                    <span className="text-2xl font-black text-slate-900 tabular-nums">{users.meta.total}</span>
                                </div>
                                <Link href="/admin/pengguna/buat?role=dpl" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-3 active:scale-95 group">
                                    <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Tambah Dosen
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1600px] mx-auto px-8 mt-8 space-y-8">
                    {/* Password Alert */}
                    {flash?.temporary_password && flash?.temporary_username ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-emerald-700">
                                    <KeyRound size={18} />
                                    <h3 className="text-sm font-bold">Kata sandi sementara berhasil dibuat</h3>
                                </div>
                                <p className="text-xs text-emerald-600/70">Bagikan kredensial ini dan minta pengguna segera mengganti kata sandi.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-white rounded-xl px-5 py-3 border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Username / NIP</p>
                                    <p className="text-sm font-bold text-slate-900">{flash.temporary_username}</p>
                                </div>
                                <div className="bg-white rounded-xl px-5 py-3 border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Kata sandi sementara</p>
                                    <p className="text-sm font-bold text-emerald-600">{flash.temporary_password}</p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Search */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input type="text" placeholder="Cari nama atau NIP dosen..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-14 border border-slate-200 bg-slate-50 pl-14 pr-6 rounded-2xl text-sm font-medium text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50" />
                            </div>
                            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-3 active:scale-95 shrink-0">
                                <Search size={16} /> Cari
                            </button>
                            <Link href="/admin/dosen/sinkron" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-3 active:scale-95 shrink-0 border border-emerald-100">
                                <RefreshCw size={16} /> Sinkron
                            </Link>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dosen</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Fakultas</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.data.length > 0 ? users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-100">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{user.name}</p>
                                                        <p className="text-xs text-slate-400 tabular-nums">NIP: {user.dosen?.nip || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-xs font-semibold text-slate-600">{user.dosen?.fakultas?.nama || 'Belum dipetakan'}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold border", user.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => resetTemporaryPassword(user)} className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-slate-100" title="Reset Password">
                                                        <KeyRound size={16} />
                                                    </button>
                                                    <Link href="/admin/dosen/penugasan" className="h-10 px-4 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-600 hover:text-white flex items-center gap-2 transition-all active:scale-90 border border-slate-100 text-xs font-bold">
                                                        Penugasan <ArrowRight size={14} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-300">
                                                    <Users size={64} strokeWidth={1.5} />
                                                    <p className="text-lg font-bold">Belum Ada Data Dosen</p>
                                                    <p className="text-sm text-slate-400">Tambah dosen secara manual atau sinkronisasi dari sistem akademik</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-white px-8 py-6 border-t border-slate-100">
                            <Pagination meta={users.meta} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
