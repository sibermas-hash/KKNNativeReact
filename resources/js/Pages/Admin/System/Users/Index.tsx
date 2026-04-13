import { useState } from 'react';
import { router, Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Users as UsersIcon,
    Search,
    UserPlus,
    Lock,
    Unlock,
    KeyRound,
    ShieldCheck,
    ChevronRight,
    Binary,
    ShieldQuestion,
    Filter,
    X,
    ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination, Button } from '@/Components/ui';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

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
    users: { data: User[]; meta: PaginationMeta };
    filters: { search?: string };
}

export default function UsersIndex({ users = { data: [], meta: { total: 0, current_page: 1 } }, filters = {} }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const { flash } = usePage<PageProps>().props;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/pengguna', { search }, { preserveState: true });
    };

    const toggleStatus = (user: User) => {
        const primaryRole = user.roles[0]?.toLowerCase();
        if (primaryRole !== 'student') {
            window.alert('Saat ini hanya akun mahasiswa yang dapat dikelola status aksesnya dari halaman ini.');
            return;
        }
        const actionLabel = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${actionLabel} akun ${user.name}?`)) {
            router.patch(`/admin/pengguna/${user.id}/toggle-status`, {}, { preserveScroll: true });
        }
    };

    const resetTemporaryPassword = (user: User) => {
        if (!confirm(`Buat kata sandi sementara untuk ${user.username}?`)) return;
        router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Akses Pengguna">
            <Head title="Manajemen Pengguna" />

            <div className="max-w-7xl mx-auto space-y-8 pb-20 text-slate-900 font-sans">
                {/* --- HEADER --- */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <KeyRound size={18} />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Otorisasi & Keamanan Akun</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                                Akses <span className="text-emerald-500">Pengguna.</span>
                            </h1>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">
                                Portal Pengelolaan Kredensial dan Level Akses Seluruh Civitas KKN
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                             <Link href="/admin/pengguna/buat" className="h-14 px-8 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 flex items-center gap-3 text-sm transition-all active:scale-95 hover:bg-emerald-600">
                                <UserPlus size={20} /> TAMBAH PENGGUNA
                             </Link>
                        </div>
                    </div>
                </div>

                {/* Password Flash */}
                <AnimatePresence>
                    {flash?.temporary_password && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="bg-emerald-600 rounded-2xl p-6 text-white flex items-center justify-between shadow-2xl shadow-emerald-200">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20"><KeyRound size={28} /></div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest opacity-80">Kata Sandi Sementara Berhasil Diterbitan</p>
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm font-bold uppercase">Pengguna: <span className="text-white">{flash.temporary_username}</span></p>
                                            <div className="h-4 w-px bg-white/20" />
                                            <p className="text-sm font-bold uppercase">Password: <span className="font-mono bg-white text-emerald-700 px-3 py-0.5 rounded-lg select-all">{flash.temporary_password}</span></p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => router.reload()} className="h-10 w-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- SEARCH & ACTIONS --- */}
                <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
                    <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/20">
                        <form onSubmit={handleSearch} className="flex-1 relative w-full sm:max-w-xl group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text" 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-300 uppercase tracking-wider" 
                                placeholder="CARI BERDASARKAN NAMA, EMAIL, ATAU USERNAME..." 
                            />
                        </form>
                        <div className="flex items-center gap-4">
                             <div className="h-10 px-5 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                                <UsersIcon size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest tabular-nums">{users?.meta?.total ?? 0} AKUN TERDAFTAR</span>
                             </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                <tr>
                                    <th className="px-10 py-6">Identitas Pengguna</th>
                                    <th className="px-10 py-6 text-center">Level Akses</th>
                                    <th className="px-10 py-6 text-center">Status Verifikasi</th>
                                    <th className="px-10 py-6 text-right">Aksi & Kontrol</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-slate-50">
                                {(users?.data || []).map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 bg-white border border-slate-100 text-slate-300 rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-sm">
                                                    {user.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-bold text-slate-900 uppercase tracking-tight group-hover:text-emerald-700 transition-colors leading-tight">{user.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">@{user.username} <span className="opacity-20 mx-1">/</span> {user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                             <span className={clsx(
                                                 'inline-flex px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all', 
                                                 user.roles?.[0]?.toLowerCase() === 'superadmin' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 'bg-white border-slate-100 text-slate-500'
                                             )}>
                                                {user.roles?.[0] || 'NONE'}
                                             </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex justify-center">
                                                {user.email_verified_at ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <ShieldCheck size={20} className="text-emerald-500" />
                                                        <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">VERIFIED</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 opacity-20">
                                                        <ShieldQuestion size={20} className="text-slate-400" />
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PENDING</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex justify-end gap-2 outline-none">
                                                <button 
                                                    onClick={() => resetTemporaryPassword(user)} 
                                                    className="h-10 w-10 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-sm rounded-xl flex items-center justify-center transition-all active:scale-90" 
                                                    title="Terbitkan Kata Sandi Sementara"
                                                >
                                                    <KeyRound size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleStatus(user)} 
                                                    disabled={user.roles?.[0]?.toLowerCase() !== 'student'} 
                                                    className={clsx(
                                                        'h-10 w-10 border rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-10', 
                                                        user.is_active ? 'bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:shadow-sm' : 'bg-rose-50 text-rose-500 border-rose-100 shadow-inner'
                                                    )} 
                                                    title={user.is_active ? 'Nonaktifkan Akses' : 'Aktifkan Akses'}
                                                >
                                                    {user.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                                                </button>
                                                <Link 
                                                    href={`/admin/pengguna/${user.id}/edit`} 
                                                    className="h-10 px-5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-sm rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 group/btn"
                                                >
                                                    Kelola
                                                    <ChevronRight size={14} className="opacity-40 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">
                            Data Hal. {users?.meta?.current_page ?? 1} — {users?.meta?.total ?? 0} kredensial terdeteksi
                        </span>
                        {users?.meta && <Pagination meta={users.meta} />}
                    </div>
                </section>

                {/* --- FOOTER GUIDE (CLEAN EMERALD) --- */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-12 text-emerald-900 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12 -mr-16 -mt-16 text-emerald-600">
                         <ShieldCheck size={350} />
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="flex items-center gap-10">
                            <div className="h-24 w-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-xl shadow-emerald-200">
                                <ShieldAlert size={48} />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-2xl font-bold uppercase tracking-tight leading-none">Protokol Keamanan & Otorisasi</h4>
                                <p className="text-sm font-medium text-emerald-700/70 max-w-3xl leading-relaxed">
                                    Seluruh aktivitas pengelolaan akun dalam sistem ini dilakukan di bawah pengawasan administratif institusi. Otorisasi kredensial adalah tanggung jawab LPPM UIN SAIZU untuk menjaga integritas data akademik dan privasi civitas akademika dalam siklus KKN.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
