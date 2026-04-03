import { useState, useEffect } from 'react';
import { Link, useForm, router, Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, FormSelect, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
    Users,
    UserPlus,
    Search,
    ShieldCheck,
    Mail,
    Activity,
    Power,
    Fingerprint,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';

interface UserData {
    id: number;
    username: string;
    name: string;
    email: string;
    is_active: boolean;
    roles: { name: string }[];
    mahasiswa?: { nim: string };
    dosen?: { nip: string };
    fakultas?: { nama: string };
}

interface Props extends PageProps {
    users: {
        data: UserData[];
        meta: PaginationMeta;
    };
    filters: { search?: string; role?: string };
}

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const toggleForm = useForm({});

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '') || role !== (filters.role || '')) {
                router.get('/admin/users', { search, role }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, role, filters.search, filters.role]);

    const toggleStatus = (id: number) => {
        if (confirm('KONFIRMASI_KEAMANAN: Apakah Anda yakin ingin mengubah status otorisasi akun ini? Pencabutan status akan memutus seluruh sesi aktif terminal.')) {
            toggleForm.patch(`/admin/users/${id}/toggle-active`, {
                preserveScroll: true
            });
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const roleMap: Record<string, string> = {
        'superadmin': 'Administrator Pusat',
        'faculty_admin': 'Admin Fakultas',
        'dpl': 'Personel DPL',
        'student': 'Peserta Mahasiswa',
        'admin_prodi': 'Koordinator Program'
    };

    return (
        <AppLayout title="Manajemen Akses Pengguna">
            <Head title="Direktori Pengguna" />

            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-10 group">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/15 rounded-xl border border-white/20 backdrop-blur-md">
                                <Activity className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-black text-emerald-100 uppercase  leading-none italic">
                                DIRECTORY_AUTHORIZATION_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white  uppercase italic leading-none drop-shadow-2xl">
                            Direktori <span className="text-emerald-300 text-glow-emerald italic">Pengguna</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium italic leading-relaxed max-w-2xl">
                             Repositori manajemen identitas dan orkestrasi hak akses untuk seluruh personel fungsional dalam ekosistem KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-white/20 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-emerald-200/60 uppercase  block mb-1.5 italic">Total Entri</span>
                                <span className="text-2xl font-black text-white tabular-nums italic leading-none">{users.meta?.total || 0} Akun</span>
                            </div>
                        </div>
                        <Link 
                            href="/admin/users/create" 
                            className="flex items-center gap-4 px-10 py-5.5 bg-white hover:bg-emerald-50 text-primary rounded-[1.5rem] font-black text-xs uppercase  transition-all hover:-translate-y-1 active:scale-95 italic"
                        >
                            <UserPlus className="w-5 h-5" />
                            Pendaftaran User
                        </Link>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
                    <div className="relative group max-w-lg w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                        <input
                            placeholder="Cari Identitas, Email, NIM/NIP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-14 pr-8 py-4.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 outline-none focus:border-primary/50 transition-all italic
                        />
                    </div>
                    
                    <div className="w-full md:w-72">
                         <FormSelect
                            options={[
                                { value: '', label: 'Semua Otoritas' },
                                { value: 'superadmin', label: 'Admin Pusat' },
                                { value: 'faculty_admin', label: 'Admin Fakultas' },
                                { value: 'dpl', label: 'Personel DPL' },
                                { value: 'student', label: 'Peserta Mahasiswa' }
                            ]}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="h-15 bg-white border-slate-200 rounded-lg text-[10px] font-black uppercase  text-slate-500 focus:border-primary/30 transition-all italic"
                        />
                    </div>
                </div>

                {/* Account Ledger (Table) */}
                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden group mx-2">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Personel & Kredensial</th>
                                    <th className="px-10 py-7 text-left text-[11px] font-black uppercase  text-slate-400 italic">Afiliasi & Kontak</th>
                                    <th className="px-10 py-6 text-center text-[11px] font-black uppercase  text-slate-400 italic">Otoritas</th>
                                    <th className="px-10 py-6 text-center text-[11px] font-black uppercase  text-slate-400 italic">Status</th>
                                    <th className="px-10 py-6 text-right text-[11px] font-black uppercase  text-slate-400 italic pr-12">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-5 opacity-30">
                                                <Users className="h-16 w-16 text-slate-200" />
                                                <p className="text-[11px] font-black text-slate-400 uppercase  italic">Tidak ada rekam jejak pengguna ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => (
                                        <tr key={u.id} className="group/row hover:bg-slate-50/30 transition-all">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[16px] font-black text-slate-300 group-hover/row:bg-primary group-hover/row:text-white group-hover/row:border-primary transition-all italic leading-none">
                                                            {getInitials(u.name)}
                                                        </div>
                                                        {u.is_active && <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white animate-pulse" />}
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[16px] font-black text-slate-900 group-hover/row:text-primary transition-colors italic uppercase leading-tight">{u.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase  italic opacity-70">RID: #{u.username}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-[12px] font-bold text-slate-600 italic">
                                                        <Mail className="h-4 w-4 text-primary/50" />
                                                        {u.email}
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase  italic bg-slate-50 px-2 py-0.5 rounded-lg w-fit">
                                                        {u.mahasiswa?.nim || u.dosen?.nip || 'INTERNAL_SYS'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {u.roles.map((r) => (
                                                        <Badge 
                                                            key={r.name} 
                                                            variant="default" 
                                                            className={clsx(
                                                                "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase  italic border-none
                                                                r.name === 'superadmin' ? "bg-amber-100 text-amber-600" :
                                                                r.name === 'faculty_admin' ? "bg-sky-100 text-sky-600" :
                                                                r.name === 'dpl' ? "bg-indigo-100 text-indigo-600" :
                                                                "bg-emerald-100 text-emerald-600"
                                                            )}
                                                        >
                                                            {roleMap[r.name] || r.name.toUpperCase()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <Badge
                                                    variant={u.is_active ? 'success' : 'danger'}
                                                    className="px-5 py-2 rounded-xl text-[10px] font-black uppercase  italic border-none
                                                >
                                                    {u.is_active ? 'Otoritas Aktif' : 'Akses Dicabut'}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-8 text-right pr-12">
                                                <div className="flex justify-end gap-3 translate-x-2 group-hover/row:translate-x-0 transition-all opacity-0 group-hover/row:opacity-100">
                                                    <button
                                                        onClick={() => toggleStatus(u.id)}
                                                        disabled={toggleForm.processing}
                                                        className={clsx(
                                                            "p-3.5 rounded-lg transition-all active:scale-95 border",
                                                            u.is_active 
                                                                ? "bg-white border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white 
                                                                : "bg-white border-primary/20 text-primary hover:bg-primary hover:text-white
                                                        )}
                                                        title={u.is_active ? 'Cabut Akses' : 'Berikan Akses'}
                                                    >
                                                        <Power className="w-5.5 h-5.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {users.meta && (
                        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100">
                            <Pagination meta={users.meta} />
                        </div>
                    )}
                </div>

                {/* 
                    Lush Emerald Footer 
                    Refining from heavy black to premium tactical emerald gradient
                */}
                <div className="p-12 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden group">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                     
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <ShieldCheck className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase  italic leading-none">AUTH_CONTROL_LEDGER_V3</h4>
                                    <p className="text-[10px] text-emerald-400 font-bold  mt-2 italic whitespace-nowrap">SECURITY_HEARTBEAT: ACTIVE_ENCRYPTED</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 font-bold leading-relaxed max-w-4xl italic opacity-80">
                                Operational Notice: Pergerakan status otoritas akun diawasi secara real-time melalui protokol audit sistem. Manajemen identitas Administrator Pusat memiliki wewenang untuk menangguhkan akses personel secara instan demi menjaga integritas data nasional KKN UIN SAIZU.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-2 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-slate-100 uppercase  italic">MONITOR_SYNCHRONIZED</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Fingerprint className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Zap className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
