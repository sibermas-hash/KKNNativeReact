import { useState } from 'react';
import { router, Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Users,
    Search,
    UserPlus,
    Lock,
    Unlock,
    KeyRound,
    CheckCircle2,
    ShieldCheck,
    ChevronRight,
    ShieldAlert,
    Database,
    Zap,
    Fingerprint,
    Shield
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
            window.alert('Saat ini hanya akun mahasiswa yang dapat dikelola status aksesnya dari halaman ini.');
            return;
        }
        const actionLabel = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${actionLabel} akun ${user.name}?`)) {
            router.patch(`/admin/pengguna/${user.id}/toggle-status`);
        }
    };

    const resetTemporaryPassword = (user: User) => {
        if (!confirm(`Buat kata sandi sementara untuk ${user.username}?`)) return;
        router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Akses Pengguna">
            <Head title="Pengguna | POS-KKN" />

            <div className="space-y-8 font-sans antialiased text-emerald-900">
                {/* Temporary Access Alert */}
                {flash?.temporary_password && flash?.temporary_username && (
                    <div className="bg-emerald-600 p-10 flex items-start gap-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-45 translate-x-12 -translate-y-12" />
                        <div className="h-14 w-14 bg-white/20 rounded flex items-center justify-center shrink-0 border border-white/20">
                            <KeyRound size={28} />
                        </div>
                        <div className="space-y-6 flex-1 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-sm font-black uppercase tracking-widest leading-none">Akses sementara diterbitkan</h3>
                                <p className="text-[10px] font-black text-emerald-100/60 uppercase tracking-widest">Akses berlaku sampai pengguna mengganti kata sandi setelah masuk.</p>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="p-6 bg-white/10 rounded border border-white/10 shadow-inner">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">Username / ID</p>
                                    <p className="text-lg font-black tracking-widest">{flash.temporary_username}</p>
                                </div>
                                <div className="p-6 bg-white/10 rounded border border-white/10 shadow-inner">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">Kata sandi sementara</p>
                                    <p className="text-lg font-black tracking-widest font-mono">{flash.temporary_password}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* HEADER TACTICAL: OTORITAS AKSES */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 -mx-12 -mt-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    {/* Background Visual Element */}
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">User Authorization Matrix</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter italic leading-none">
                            MANAJEMEN <span className="text-emerald-500">PENGGUNA</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Fingerprint size={12} className="text-emerald-500" />
                             Otoritas pengelolaan kredensial dan akses unit sistem informasi.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col items-end border-r border-emerald-50 pr-8">
                            <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic">TOTAL REGISTRY</span>
                            <span className="text-xl font-black text-emerald-950 italic uppercase tracking-tighter">{users.meta.total} PENGGUNA</span>
                        </div>
                        <Link
                            href="/admin/pengguna/buat"
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group"
                        >
                            <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
                            BUAT AKUN BARU
                        </Link>
                    </div>
                </div>

                {/* SEARCH STRIP: TACTICAL FILTER */}
                <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch">
                        <div className="flex-1 relative">
                            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="CARI IDENTITAS (NAMA, USERNAME, EMAIL)..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-20 pl-16 pr-8 bg-white text-[11px] font-black uppercase tracking-[0.2em] italic text-emerald-950 placeholder:text-emerald-100 focus:outline-none transition-all"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="px-12 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest border-l border-emerald-100 hover:bg-emerald-950 hover:text-white transition-all flex items-center justify-center gap-3"
                        >
                            FILTER DATA
                            <Zap size={14} />
                        </button>
                    </form>
                </section>

                {/* DATA GRID: USER REGISTRY */}
                <div className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all">
                    <div className="px-10 py-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-950 text-emerald-400">
                                <Shield size={18} />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Registry Pengguna Aktif</h2>
                                <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Daftar Otoritas Unit Terintegrasi</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase italic tracking-widest border border-emerald-100 shadow-inner">
                            REALTIME MONITOR
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-emerald-50/20 border-b border-emerald-50">
                                    <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">IDENTITAS PENGGUNA</th>
                                    <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">PERAN SISTEM</th>
                                    <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">STATUS VERIFIKASI</th>
                                    <th className="px-10 py-5 text-right text-[9px] font-black text-emerald-900 uppercase tracking-widest italic pr-12">KENDALI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                                {users.data.length > 0 ? users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-emerald-50/20 transition-colors group/row">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 bg-emerald-950 text-white flex items-center justify-center font-black text-lg italic shadow-xl group-hover/row:bg-emerald-600 transition-colors">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tighter leading-none italic group-hover/row:text-emerald-600 transition-colors">{user.name}</span>
                                                    <span className="text-[9px] font-bold text-emerald-300 mt-2 uppercase tracking-widest italic shadow-sm bg-emerald-50 px-2 py-0.5 border border-emerald-100 self-start">{user.username}</span>
                                                    <span className="text-[10px] font-bold text-emerald-100 mt-1 uppercase tracking-widest truncate max-w-xs">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex justify-center">
                                                <span className={clsx(
                                                    "px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.3em] italic border shadow-sm",
                                                    user.roles[0]?.toLowerCase() === 'superadmin' 
                                                        ? "bg-emerald-950 text-white border-emerald-900" 
                                                        : "bg-white text-emerald-600 border-emerald-100"
                                                )}>
                                                    {user.roles[0] || 'TANPA PERAN'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex justify-center">
                                                {user.email_verified_at ? (
                                                    <div className="flex items-center gap-2 px-4 py-1 bg-white text-emerald-500 text-[8px] font-black uppercase italic tracking-widest border border-emerald-50 shadow-sm">
                                                        <CheckCircle2 size={10} strokeWidth={3} /> DATA VALID
                                                    </div>
                                                ) : (
                                                    <div className="px-4 py-1 bg-white text-rose-300 text-[8px] font-black uppercase italic tracking-widest border border-rose-50 opacity-40">
                                                        BELUM VERIFIKASI
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right pr-12">
                                            <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover/row:translate-x-0 group-hover/row:opacity-100 transition-all duration-300">
                                                <button
                                                    onClick={() => resetTemporaryPassword(user)}
                                                    className="h-10 w-10 bg-white border border-emerald-100 text-emerald-200 hover:text-emerald-600 hover:border-emerald-500 flex items-center justify-center transition-all shadow-sm active:scale-90"
                                                    title="RESET PASSWORD"
                                                >
                                                    <KeyRound size={16} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(user)}
                                                    disabled={user.roles[0]?.toLowerCase() !== 'student'}
                                                    className={clsx(
                                                        "h-10 w-10 border flex items-center justify-center transition-all shadow-sm active:scale-90 disabled:opacity-5",
                                                        user.is_active ? "bg-white border-emerald-100 text-emerald-100 hover:text-rose-600 hover:border-rose-500" : "bg-emerald-600 border-emerald-500 text-white"
                                                    )}
                                                    title={user.is_active ? 'KUNCI AKSES' : 'BUKA AKSES'}
                                                >
                                                    {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                                                </button>
                                                <Link 
                                                    href={`/admin/pengguna/${user.id}/edit`}
                                                    className="h-10 w-10 bg-emerald-950 text-white border border-emerald-900 flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-600 transition-all"
                                                >
                                                    <ChevronRight size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-12 py-40 text-center">
                                            <div className="inline-flex flex-col items-center gap-6 opacity-20">
                                                <Database size={64} strokeWidth={1} />
                                                <p className="text-[11px] font-black uppercase tracking-[0.5em] italic text-emerald-900">
                                                    DATABASE PENGGUNA KOSONG
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-emerald-50/10 p-10 border-t border-emerald-50">
                        <Pagination meta={users.meta} />
                    </div>
                </div>

                <div className="bg-emerald-950 p-8 flex items-center justify-center gap-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2" />
                    <ShieldAlert size={20} className="text-emerald-500 relative z-10" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic relative z-10 leading-relaxed max-w-2xl text-center">
                        SELURUH AKTIVITAS AKSES PENGGUNA DICATAT PADA AUDIT LOG SISTEM UNTUK KEPENTINGAN INTEGRITAS DAN KEAMANAN DATA LPPM UIN SAIZU.
                    </span>
                </div>
            </div>

        </AppLayout>
    );
}
