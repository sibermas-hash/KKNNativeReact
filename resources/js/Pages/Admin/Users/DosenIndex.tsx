import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination, Button } from '@/Components/ui';
import { router, Link, Head, usePage } from '@inertiajs/react';
import { 
    Search, 
    RefreshCw,
    Users,
    Lock,
    Unlock,
    KeyRound,
    Plus,
    ChevronRight,
    UserCheck,
    ShieldCheck,
    ArrowRight,
    Database,
    Zap,
    Fingerprint,
    Shield,
    FileSpreadsheet
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

    const resetTemporaryPassword = (user: User) => {
        if (!confirm(`Buat kata sandi sementara untuk ${user.username}?`)) return;
        router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Komando Data Dosen">
            <Head title="Manajemen Dosen | POS-KKN" />

            <div className="min-h-screen bg-white">
                {/* HEADER TACTICAL: OTORITAS DATA DOSEN */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    {/* Background Visual Element */}
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Core Faculty Information System</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter italic leading-none">
                            REGISTRY <span className="text-emerald-500">DOSEN DPL</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2">
                             <Fingerprint size={12} className="text-emerald-500" />
                             Manajemen data Dosen Pembimbing Lapangan dan Koordinator Wilayah terpusat.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col items-end border-r border-emerald-50 pr-8">
                            <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest italic">TOTAL DATA</span>
                            <span className="text-xl font-black text-emerald-950 italic uppercase tracking-tighter">{users.meta.total} DOSEN</span>
                        </div>
                        <Link
                            href="/admin/pengguna/buat?role=dpl"
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            TAMBAH MANUAL
                        </Link>
                    </div>
                </div>

                <div className="mx-auto max-w-[1600px] p-8 space-y-8">
                    {/* Alerts */}
                    {flash?.temporary_password && flash?.temporary_username ? (
                        <div className="bg-emerald-950 border-l-4 border-emerald-500 p-6 shadow-2xl">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <KeyRound size={18} />
                                        <h3 className="text-[11px] font-black uppercase tracking-widest">Kata sandi sementara berhasil dibuat</h3>
                                    </div>
                                    <p className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-widest">
                                        Bagikan kredensial ini dan minta pengguna segera mengganti kata sandi saat masuk.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-emerald-900 px-5 py-3 border border-emerald-800">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">USERNAME / NIP</p>
                                        <p className="text-sm font-black text-white tracking-widest">{flash.temporary_username}</p>
                                    </div>
                                    <div className="bg-emerald-900 px-5 py-3 border border-emerald-800">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Kata sandi sementara</p>
                                        <p className="text-sm font-black text-emerald-400 tracking-widest italic">{flash.temporary_password}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* SEARCH STRIP: TACTICAL FILTER */}
                    <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all mx-8">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch">
                            <div className="flex-1 relative">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="CARI IDENTITAS (NIP, NAMA DOSEN)..."
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
                            <Link
                                href="/admin/dosen/sinkron"
                                className="px-10 bg-white border-l border-emerald-100 flex items-center justify-center gap-3 text-emerald-400 hover:text-emerald-600 transition-all font-black text-[10px] uppercase tracking-widest"
                            >
                                <RefreshCw size={14} />
                                SINKRON MASTER
                            </Link>
                        </form>
                    </section>

                    {/* DATA GRID: DOSEN REGISTRY */}
                    <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all mx-8 mt-8">
                        <div className="px-10 py-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic">Registry Dosen Aktif</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Daftar Pembimbing & Koordinator Unit</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase italic tracking-widest border border-emerald-100 shadow-inner">
                                REALTIME OPERATIONAL DATA
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-emerald-50/20 border-b border-emerald-100">
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic">IDENTITAS DOSEN</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">UNIT KERJA</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-emerald-900 uppercase tracking-widest italic text-center">STATUS AKSES</th>
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
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[13px] font-black text-emerald-950 uppercase tracking-tighter leading-none italic group-hover/row:text-emerald-600 transition-colors">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-emerald-400 tabular-nums uppercase tracking-widest bg-emerald-50 px-2 py-0.5 border border-emerald-100 self-start">
                                                            NIP. {user.dosen?.nip || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex justify-center">
                                                    <span className="px-4 py-1.5 text-[8px] font-black text-emerald-600 bg-white border border-emerald-100 uppercase tracking-[0.2em] italic shadow-sm">
                                                        {user.dosen?.fakultas?.nama || 'BELUM DIPETAKAN'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex justify-center">
                                                    <div className={clsx(
                                                        "px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.3em] italic border shadow-sm",
                                                        user.is_active 
                                                            ? "bg-emerald-950 text-white border-emerald-900" 
                                                            : "bg-white text-rose-300 border-rose-50 opacity-40"
                                                    )}>
                                                        {user.is_active ? 'AKUN AKTIF' : 'AKSES TERKUNCI'}
                                                    </div>
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
                                                    <Link 
                                                        href="/admin/dosen/penugasan"
                                                        className="h-10 px-6 bg-white border border-emerald-100 text-emerald-950 hover:bg-emerald-50 text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-3 italic"
                                                    >
                                                        PENUGASAN
                                                        <ArrowRight size={14} className="text-emerald-400 group-hover/row:translate-x-1 transition-transform" />
                                                    </Link>
                                                    <button className="h-10 w-10 bg-emerald-950 text-white border border-emerald-900 flex items-center justify-center shadow-lg active:scale-95 hover:bg-emerald-600 transition-all">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-12 py-40 text-center">
                                                <div className="inline-flex flex-col items-center gap-6 opacity-20">
                                                    <FileSpreadsheet size={64} strokeWidth={1} />
                                                    <p className="text-[11px] font-black uppercase tracking-[0.5em] italic text-emerald-900">
                                                        DATABASE DOSEN KOSONG
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
                    </section>

                    <div className="text-center pt-16 pb-8">
                         <span className="text-emerald-100 font-black text-[10px] uppercase tracking-[1em] italic">
                             Otoritas Data Dosen Pembimbing • POS-KKN Unit Komando
                         </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
