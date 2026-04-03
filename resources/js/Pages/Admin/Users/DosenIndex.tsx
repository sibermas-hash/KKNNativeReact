import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Pagination } from '@/Components/ui';
import { router, Link } from '@inertiajs/react';
import { 
    Users,
    ShieldCheck, 
    Search, 
    UserCheck, 
    UserMinus,
    RefreshCw,
    Building2,
    Activity,
    Fingerprint,
    Briefcase,
    Mail
} from 'lucide-react';
import { clsx } from 'clsx';

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
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    filters: {
        search: string;
    };
}

export default function DosenIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/dpl', { search }, { preserveState: true });
    };

    const toggleStatus = (id: number) => {
        if (confirm('Apakah Anda yakin ingin mengubah status aktif akun DPL ini?')) {
            router.patch(`/admin/users/${id}/toggle-active`);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    return (
        <AppLayout title="Direktori DPL">
            <div className="space-y-10 pb-16">
                {/* 
                    Emerald Premium Header 
                    Refining from basic header to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                    <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-slate-200
                                <Users className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-semibold text-emerald-100 ">
                                DPL_REGISTRY_CORE_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-white  ">
                            Direktori <span className="text-emerald-300">DPL</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
                             Manajemen identitas, verifikasi penugasan, dan kontrol otorisasi Dosen Pembimbing Lapangan (DPL) secara tersentralisasi dalam ekosistem KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat hover:scale-105 transition-transform">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:rotate-6">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold text-emerald-200/60  block mb-1.5">Personel Aktif</span>
                                <span className="text-2xl font-semibold text-white">{users.total} DPL</span>
                            </div>
                        </div>

                        <Link 
                            href="/admin/dpl/sync" 
                            className="flex items-center gap-4 px-6 py-2 bg-white hover:bg-emerald-50 text-primary rounded-lg font-semibold text-xs"
                        >
                            <RefreshCw className="w-5 h-5 text-primary" />
                            Sinkronisasi Data
                        </Link>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                    <form onSubmit={handleSearch} className="relative group max-w-lg w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                        <input
                            placeholder="Cari NIP atau Nama Lengkap..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-14 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-sm text-slate-900 outline-none focus:border-primary/50
                        />
                    </form>
                    
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dpl/assignment" className="group flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 rounded-lg font-semibold text-xs overflow-hidden relative">
                            <div className="absolute inset-0 bg-primary/5y-full group-hover:translate-y-0 transition-transform" />
                            <Briefcase className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">Penugasan Lapangan</span>
                        </Link>
                    </div>
                </div>

                {/* Personnel Ledger (Table) */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden group">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-6 text-left text-xs text-sm  text-slate-400">Identitas DPL</th>
                                    <th className="px-6 py-6 text-left text-xs text-sm  text-slate-400">Otoritas Fakultas</th>
                                    <th className="px-6 py-6 text-left text-xs text-sm  text-slate-400">Kontak & Perangkat</th>
                                    <th className="px-6 py-6 text-center text-xs text-sm  text-slate-400">Otorisasi</th>
                                    <th className="px-6 py-6 text-right text-xs text-sm  text-slate-400">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center gap-5 opacity-50">
                                                <Users className="h-14 w-14 text-slate-200" />
                                                <p className="text-[11px] text-sm text-slate-400 ">Direktori personel masih kosong</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="group/row hover:bg-slate-50/30">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-400 group-hover/row:bg-primary group-hover/row:text-white">
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[15px] font-semibold text-slate-900 group-hover/row:text-primary transition-colors leading-normal">{user.name}</span>
                                                        <span className="text-[9px] text-sm text-slate-400 ">NIP: {user.dosen?.nip || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-sm text-slate-500 ">
                                                    <Building2 className="w-3 h-3 text-primary/40" />
                                                    {user.dosen?.fakultas?.nama || 'Fakultas Belum Ditentukan'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2.5 text-xs text-sm text-slate-500">
                                                        <Mail className="h-3.5 w-3.5 text-primary/40" />
                                                        {user.email || '-'}
                                                    </div>
                                                    <span className="text-[9px] font-semibold text-primary/60  bg-primary/5 px-2 py-0.5 rounded-lg w-fit">@{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <Badge
                                                    variant={user.is_active ? 'success' : 'danger'}
                                                    className="px-4 py-1.5 rounded-xl text-[9px] font-semibold  border-none
                                                >
                                                    {user.is_active ? 'Akses Aktif' : 'Terblokir'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-endx-2 group-hover/row:translate-x-0opacity-0 group-hover/row:opacity-100">
                                                    <button
                                                        onClick={() => toggleStatus(user.id)}
                                                        className={clsx(
                                                            "p-3 rounded-lgactive:scale-90",
                                                            user.is_active 
                                                                ? "bg-white border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white 
                                                                : "bg-white border border-primary text-primary hover:bg-primary hover:text-white
                                                        )}
                                                        title={user.is_active ? 'Cabut Otorisasi' : 'Berikan Otorisasi'}
                                                    >
                                                        {user.is_active ? <UserMinus className="w-5 h-5 /> : <UserCheck className="w-5 h-5 />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-6 bg-slate-50/50 border-t border-slate-200">
                        <Pagination meta={users as any} />
                    </div>
                </div>

                {/* Tactical Footer Monitor */}
                <div className="p-10 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary">
                                    <ShieldCheck className="h-5.5 w-5.5 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-semibold text-white ">KEBIJAKAN_AKSES_PERSONEL_DPL</h4>
                            </div>
                            <p className="text-[12px] text-slate-400 text-sm leading-normal max-w-4xl opacity-50">
                                Seluruh data Dosen Pembimbing Lapangan terhubung secara real-time dengan basis data kepegawaian pusat. 
                                Status <span className="text-primary font-semibold">Akses Aktif</span> memberikan wewenang penuh untuk melakukan audit penilaian, 
                                verifikasi logbook operasional, dan pendampingan lapangan kepada mahasiswa bimbingan terkait.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0 border-l border-slate-800 pl-10">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-lg bg-primary />
                                <span className="text-[10px] font-semibold text-slate-100 ">SECURITY_LEDGER_ACTIVE</span>
                             </div>
                             <div className="flex gap-4">
                                <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:text-primary transition-colors cursor-help
                                    <Fingerprint className="h-5 w-5" />
                                </div>
                                <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600
                                    <Activity className="h-5 w-5" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
