import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import { router, Link, Head, usePage } from '@inertiajs/react';
import { 
    Search, 
    RefreshCw, 
    Users, 
    KeyRound, 
    Plus, 
    UserCheck, 
    ArrowRight, 
    CheckCircle2, 
    ChevronRight, 
    Database, 
    ShieldCheck, 
    Info 
} from 'lucide-react';
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
        <AppLayout>
            <Head title="Direktori Dosen" />

            <div className="max-w-7xl mx-auto space-y-8 pb-24 text-slate-900 font-sans">
                {/* --- PREMIUM HEADER --- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <Users size={18} />
                        <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Otoritas Pembimbing Lapangan</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                                Direktori <span className="text-emerald-500">Dosen.</span>
                            </h1>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed max-w-2xl">
                                Manajemen Data Dosen Pembimbing Lapangan (DPL) dan Koordinator Wilayah KKN
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/admin/dosen/sinkron" className="h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3 font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95">
                                <RefreshCw size={18} />
                                SINKRONISASI
                            </Link>
                            <Link href="/admin/pengguna/buat?role=dpl" className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 active:scale-95 text-sm uppercase tracking-wider">
                                <Plus size={20} /> TAMBAH DOSEN
                            </Link>
                        </div>
                    </div>
                </div>

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard label="Total Dosen Terdaftar" value={users.meta.total} icon={Database} color="emerald" desc="Basis Data Lokal" />
                    <MetricCard label="Status Layanan" value="ONLINE" icon={ShieldCheck} color="sky" desc="Sinkronisasi Aktif" />
                    <MetricCard label="Akses Pengguna" value={users.data.filter(u => u.is_active).length} icon={UserCheck} color="amber" desc="Akun Otoritas Aktif" />
                </div>

                {/* --- ALERT PASSWORD --- */}
                <AnimatePresence>
                    {flash?.temporary_password && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div className="bg-emerald-600 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-emerald-100 border border-emerald-500">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-inner">
                                        <KeyRound size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold uppercase tracking-tight">Kredensial Otoritas Diterbitkan</h3>
                                        <p className="text-sm text-emerald-100/80 font-medium">Berikan informasi akses ini kepada dosen yang bersangkutan untuk login sistem.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 shadow-sm min-w-[140px]">
                                        <span className="text-[10px] block opacity-60 font-bold uppercase tracking-widest mb-1">NIP/Username</span>
                                        <span className="text-sm font-bold font-mono select-all tracking-wider">{flash.temporary_username}</span>
                                    </div>
                                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm min-w-[140px]">
                                        <span className="text-[10px] block text-emerald-400 font-bold uppercase tracking-widest mb-1">Password</span>
                                        <span className="text-sm font-bold font-mono text-emerald-700 select-all tracking-wider">{flash.temporary_password}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- MAIN PANEL --- */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm shadow-slate-200/50">
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white border border-slate-200 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                                <Search size={22} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Navigasi Direktori</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pencarian Entitas Akademik</p>
                            </div>
                        </div>
                        <form onSubmit={handleSearch} className="flex-1 max-w-xl relative group">
                            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Cari berdasarkan Nama atau NIP..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none placeholder:text-slate-300 uppercase tracking-wider" 
                            />
                        </form>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-white text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                                <tr>
                                    <th className="px-10 py-6">Profil Dosen</th>
                                    <th className="px-10 py-6">Afiliasi Institusi</th>
                                    <th className="px-10 py-6 text-center">Status Akses</th>
                                    <th className="px-10 py-6 text-right">Opsi Operasional</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.data.length > 0 ? users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 text-slate-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 flex items-center justify-center font-black text-lg transition-all shadow-sm">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[15px] font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase leading-tight tracking-tight">
                                                        {user.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest tabular-nums font-mono opacity-70">
                                                        NIP: {user.dosen?.nip || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-xs font-bold text-slate-700 uppercase leading-snug tracking-tight">{user.dosen?.fakultas?.nama || 'Belum Dipetakan'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className={clsx(
                                                "inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all", 
                                                user.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100 shadow-inner"
                                            )}>
                                                {user.is_active ? 'AKTIF' : 'NONAKTIF'}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-2 outline-none">
                                                <button 
                                                    onClick={() => resetTemporaryPassword(user)} 
                                                    className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-sm flex items-center justify-center transition-all active:scale-90 shadow-sm" 
                                                    title="Reset Kredensial"
                                                >
                                                    <KeyRound size={18} />
                                                </button>
                                                <Link 
                                                    href="/admin/dosen/penugasan" 
                                                    className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-3 transition-all active:scale-95 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-100"
                                                >
                                                    PENUGASAN <ArrowRight size={14} className="opacity-40" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-200">
                                                <Info size={56} strokeWidth={1} />
                                                <p className="text-xs font-bold uppercase tracking-[0.4em]">Entitas data tidak ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-50/30 px-10 py-6 border-t border-slate-100 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Menampilkan Hal. {users.meta.current_page} — Total {users.meta.total} Entitas</span>
                         <Pagination meta={users.meta} />
                    </div>
                </div>

                {/* --- PREMIUM FOOTER --- */}
                <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -mr-16 -mt-16"><UserCheck size={350} /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="flex items-center gap-10">
                            <div className="h-24 w-24 bg-white/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-sm backdrop-blur-md">
                                <GraduationCap size={48} className="text-white" />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-2xl font-bold uppercase tracking-tight">Otoritas Pembimbingan</h4>
                                <p className="text-sm font-medium text-emerald-50 max-w-2xl leading-relaxed">
                                    Dosen Pembimbing Lapangan (DPL) adalah pilar utama dalam penjaminan kualitas akademik dan pendampingan mahasiswa di lokasi KKN. Kelola penugasan dosen secara berkala untuk memastikan integrasi program pengabdian berjalan maksimal.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string; value: string | number; icon: LucideIcon; color: 'emerald' | 'sky' | 'amber'; desc: string }) {
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50',
        sky: 'bg-sky-50 text-sky-600 border-sky-100 shadow-sky-50',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50'
    };
    return (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 hover:shadow-xl transition-all group relative overflow-hidden active:scale-[0.98]">
            <div className="flex items-center justify-between relative z-10">
                <div className={clsx('h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6 shadow-sm', colorMap[color])}>
                    <Icon size={24} />
                </div>
                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">{desc}</div>
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none uppercase">
                    {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                </p>
            </div>
        </div>
    );
}
