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
 ShieldQuestion,
 X,
 ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination } from '@/Components/ui';
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
 window.alert('Saat ini hanya protokol mahasiswa yang dapat diunci aksesnya.');
 return;
 }
 const actionLabel = user.is_active ? 'mencabut' : 'membuka';
 if (confirm(`Otorisasi: Yakin ingin ${actionLabel} kunci akses pada akun ${user.name}?`)) {
 router.patch(`/admin/pengguna/${user.id}/toggle-status`, {}, { preserveScroll: true });
 }
 };

 const resetTemporaryPassword = (user: User) => {
 if (!confirm(`Sistem: Terbitkan sandi kontrol sekunder untuk kredensial ${user.username}?`)) return;
 router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
 };

 return (
 <AppLayout title="Akses Pengguna">
 <Head title="Manajemen Pengguna" />

 <div className="max-w-7xl mx-auto space-y-4 pb-12 font-sans">
 {/* --- MODERN COMPACT HEADER --- */}
 <div className="space-y-2 pt-4 pb-2 border-b border-gray-200">
 <div className="flex items-center gap-2 text-emerald-600">
 <KeyRound size={16} />
 <span className="text-[11px] font-semibold tracking-normal leading-none">Otorisasi & Keamanan Akun</span>
 </div>
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
 <div className="space-y-1">
 <h1 className="text-2xl font-semibold text-emerald-950 tracking-tight leading-tight">
 Akses Sistem
 </h1>
 <p className="text-[11px] font-bold text-emerald-900 tracking-wider max-w-xl">
 Registri Kredensial dan Hierarki Tingkat Akses Civitas KKN.
 </p>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <Link href="/admin/pengguna/buat" className="h-10 px-5 bg-emerald-500 text-white font-semibold rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 text-[11px] tracking-normal transition-all active:scale-95 hover:bg-emerald-600 border border-emerald-400/50">
 <UserPlus size={16} /> ENTRI PENGGUNA
 </Link>
 </div>
 </div>
 </div>

 {/* --- PASSWORD FLASH --- */}
 <AnimatePresence>
 {flash?.temporary_password && (
 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
 <div className="bg-emerald-600 rounded-xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-950/10 border border-emerald-800">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-emerald-800/50 rounded-lg flex items-center justify-center border border-emerald-700/50"><KeyRound size={18} className="text-white" /></div>
 <div className="space-y-1">
 <p className="text-[10px] font-semibold text-white tracking-normal leading-none">Manajemen Sekunder Diterbitkan</p>
 <div className="flex items-center gap-3">
 <p className="text-[11px] font-bold tracking-normal">Kredensial: <span className="text-white">{flash.temporary_username}</span></p>
 <div className="h-3 w-px bg-emerald-700" />
 <p className="text-[11px] font-bold tracking-normal flex items-center gap-2">
 Sandi: <span className="font-mono bg-emerald-900 border border-emerald-700 text-emerald-300 px-2 py-0.5 rounded text-[12px] select-all shadow-inner">{flash.temporary_password}</span>
 </p>
 </div>
 </div>
 </div>
 <button onClick={() => router.reload()} className="h-8 w-8 flex items-center justify-center hover:bg-emerald-800 rounded-lg transition-colors border border-transparent hover:border-emerald-700"><X size={16} /></button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* --- SEARCH & DATA TERMINAL --- */}
 <section className="bg-white/90 backdrop-blur-xl border border-emerald-100/60 rounded-2xl overflow-hidden shadow-xl shadow-emerald-900/5">
 <div className="p-4 border-b border-emerald-100/40 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/40 to-transparent">
 <form onSubmit={handleSearch} className="flex-1 relative w-full sm:max-w-md group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-900/40 group-focus-within:text-emerald-500 transition-colors" />
 <input 
 type="text" 
 value={search} 
 onChange={(e) => setSearch(e.target.value)} 
 className="w-full h-10 pl-11 pr-4 bg-white border border-emerald-200/60 rounded-xl text-[11px] font-semibold text-emerald-950 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-emerald-900/30 tracking-normal" 
 placeholder="Pindai EMAIL, NAMA, ATAU IDDATA..." 
 />
 </form>
 <div className="flex items-center gap-4 shrink-0">
 <div className="h-10 px-4 bg-emerald-50 border border-emerald-100/80 rounded-xl flex items-center gap-2 shadow-inner">
 <UsersIcon size={14} className="text-emerald-600" />
 <span className="text-[11px] font-semibold text-emerald-950 tracking-normal tabular-nums">{users?.meta?.total ?? 0} AKUN AKTIF</span>
 </div>
 </div>
 </div>

 <div className="overflow-x-auto min-h-[400px]">
 <table className="w-full text-left border-collapse">
 <thead className="bg-emerald-50/40 border-b border-emerald-100/60 text-[10px] font-semibold tracking-normal text-emerald-900">
 <tr>
 <th className="px-5 py-4">Informasi Kredensial</th>
 <th className="px-5 py-4 text-center">Hierarki Akses</th>
 <th className="px-5 py-4 text-center">Integritas Sistem</th>
 <th className="px-5 py-4 text-right">Konsol Kontrol</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-emerald-50 border-b border-emerald-50">
 {(users?.data || []).map((user) => (
 <tr key={user.id} className="group hover:bg-emerald-50/60 transition-all">
 <td className="px-5 py-3">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-semibold text-sm group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm shrink-0">
 {user.name?.charAt(0) || '?'}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[13px] font-semibold text-emerald-950 tracking-tight truncate leading-none group-hover:text-emerald-700 transition-colors">{user.name}</span>
 <span className="text-[10px] font-bold text-emerald-900 tracking-normal mt-1.5 truncate opacity-80">@{user.username} <span className="text-emerald-300 mx-1">/</span> {user.email}</span>
 </div>
 </div>
 </td>
 <td className="px-5 py-3 text-center">
 <span className={clsx(
 'inline-flex px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-normal border transition-all', 
 user.roles?.[0]?.toLowerCase() === 'superadmin' ? 'bg-emerald-100/50 text-emerald-800 border-emerald-200' : 'bg-white border-emerald-200/60 text-emerald-950 shadow-sm'
 )}>
 {user.roles?.[0] || 'NONE'}
 </span>
 </td>
 <td className="px-5 py-3 text-center">
 <div className="flex justify-center">
 {user.email_verified_at ? (
 <div className="flex items-center gap-1.5 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-gray-200">
 <ShieldCheck size={14} className="text-emerald-500" />
 <span className="text-[10px] font-semibold text-emerald-700 tracking-normal leading-none mt-px">TERVERIFIKASI</span>
 </div>
 ) : (
 <div className="flex items-center gap-1.5 opacity-50 px-3 py-1.5">
 <ShieldQuestion size={14} className="text-emerald-950" />
 <span className="text-[10px] font-semibold text-emerald-950 tracking-normal leading-none mt-px">PENDING</span>
 </div>
 )}
 </div>
 </td>
 <td className="px-5 py-3">
 <div className="flex justify-end gap-2 outline-none items-center">
 <button 
 onClick={() => resetTemporaryPassword(user)} 
 className="h-8 w-8 bg-white border border-emerald-200/60 text-emerald-950 hover:text-emerald-600 hover:border-emerald-300 hover:shadow-sm rounded-lg flex items-center justify-center transition-all active:scale-90" 
 title="Terbitkan Sandi Akses Sekunder"
 >
 <KeyRound size={14} />
 </button>
 <button 
 onClick={() => toggleStatus(user)} 
 disabled={user.roles?.[0]?.toLowerCase() !== 'student'} 
 className={clsx(
 'h-8 w-8 border rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 disabled:hover:scale-100', 
 user.is_active ? 'bg-white border-emerald-200/60 text-emerald-950 hover:text-rose-600 hover:border-rose-200' : 'bg-rose-50 text-rose-600 border-rose-200 shadow-inner'
 )} 
 title={user.is_active ? 'Kunci Penetrasi Akses' : 'Buka Otorisasi Akses'}
 >
 {user.is_active ? <Lock size={14} /> : <Unlock size={14} />}
 </button>
 <Link 
 href={`/admin/pengguna/${user.id}/edit`} 
 className="h-8 px-4 bg-white border border-emerald-200/60 text-emerald-950 hover:text-emerald-700 hover:border-emerald-300 hover:shadow-sm rounded-lg text-[10px] font-semibold tracking-normal flex items-center gap-1.5 transition-all active:scale-95 group/btn"
 >
 OPERASIKAN
 <ChevronRight size={12} className="opacity-40 group-hover/btn:translate-x-0.5 transition-transform -mr-1" />
 </Link>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="px-5 py-4 bg-emerald-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
 <span className="text-[10px] font-semibold text-emerald-900 tracking-normal leading-none">
 HALAMAN {users?.meta?.current_page ?? 1} — {users?.meta?.total ?? 0} IDDATA DITEMUKAN
 </span>
 {users?.meta && <Pagination meta={users.meta} />}
 </div>
 </section>

 {/* --- COMPACT FOOTER GUIDE --- */}
 <div className="bg-emerald-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-emerald-950/20 mt-4">
 <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5 pointer-events-none" />
 <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 -mr-10 -mt-10 pointer-events-none">
 <ShieldCheck size={200} strokeWidth={0.5} />
 </div>
 <div className="flex items-center gap-5 relative z-10">
 <div className="h-14 w-14 bg-emerald-500 rounded-xl flex shrink-0 items-center justify-center shadow-inner shadow-emerald-400">
 <ShieldAlert size={28} className="text-emerald-950" strokeWidth={2.5} />
 </div>
 <div className="space-y-1">
 <h3 className="text-lg font-semibold text-white tracking-tight ">Komando Otorisasi Kredensial</h3>
 <p className="text-[11px] font-bold text-white/80 max-w-4xl tracking-wide">
 Setiap mutasi akses dan penerbitan sandi log diawasi penuh. Jaga selalu integritas data civitas akademika di layar kendali ini.
 </p>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
