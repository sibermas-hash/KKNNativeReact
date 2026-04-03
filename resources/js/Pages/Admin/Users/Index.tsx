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
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                    <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/15 rounded-xl border border-slate-200
                                <Activity className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-semibold text-emerald-100 ">
                                DIRECTORY_AUTHORIZATION_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-white  ">
                            Direktori <span className="text-emerald-300 text-glow-emerald">Pengguna</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
                             Repositori manajemen identitas dan orkestrasi hak akses untuk seluruh personel fungsional dalam ekosistem KKN UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[200px] group/stat">
                            <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[9px] font-semibold text-emerald-200/60  block mb-1.5">Total Entri</span>
                                <span className="text-2xl font-semibold text-white">{users.meta?.total || 0} Akun</span>
                            </div>
                        </div>
                        <Link 
                            href="/admin/users/create" 
                            className="flex items-center gap-4 px-6 py-2 bg-white hover:bg-emerald-50 text-primary rounded-lg font-semibold text-xs"
                        >
                            <UserPlus className="w-5 h-5" />
                            Pendaftaran User
                        </Link>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
                    <div className="relative group max-w-lg w-full">
                        <Search className="absolute left-6 top-1/2/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                        <input
                            placeholder="Cari Identitas, Email, NIM/NIP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-15 pl-14 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-sm text-slate-900 outline-none focus:border-primary/50
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
                            className="h-15 bg-white border-slate-200 rounded-lg text-xs font-semibold  text-slate-500 focus:border-primary/30"
                        />
                    </div>
                </div>

                {/* Account Ledger (Table) */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden group mx-2">
                    <div className="overflow-x-auto relative z-10 custom-scrollbar pr-1">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold  text-slate-400">Personel & Kredensial</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold  text-slate-400">Afiliasi & Kontak</th>
                                    <th className="px-6 py-6 text-center text-xs font-semibold  text-slate-400">Otoritas</th>
                                    <th className="px-6 py-6 text-center text-xs font-semibold  text-slate-400">Status</th>
                                    <th className="px-6 py-6 text-right text-xs font-semibold  text-slate-400 pr-12">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center gap-5 opacity-50">
                                                <Users className="h-16 w-16 text-slate-200" />
                                                <p className="text-[11px] font-semibold text-slate-400 ">Tidak ada rekam jejak pengguna ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => (
                                        <tr key={u.id} className="group/row hover:bg-slate-50/30">
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-base font-semibold text-slate-300 group-hover/row:bg-primary group-hover/row:text-white group-hover/row:border-primary">
                                                            {getInitials(u.name)}
                                                        </div>
                                                        {u.is_active && <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-lg border-2 border-white" />}
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[16px] font-semibold text-slate-900 group-hover/row:text-primary transition-colors leading-normal">{u.name}</span>
                                                        <span className="text-[10px] text-sm text-slate-400  opacity-50">RID: #{u.username}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-xs text-sm text-slate-600">
                                                        <Mail className="h-4 w-4 text-primary/50" />
                                                        {u.email}
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-slate-300  bg-slate-50 px-2 py-0.5 rounded-lg w-fit">
                                                        {u.mahasiswa?.nim || u.dosen?.nip || 'INTERNAL_SYS'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center">
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {u.roles.map((r) => (
                                                        <Badge 
                                                            key={r.name} 
                                                            variant="default" 
                                                            className={clsx(
                                                                "px-4 py-1.5 rounded-xl text-xs font-semibold  border-none
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
                                            <td className="px-6 py-8 text-center">
                                                <Badge
                                                    variant={u.is_active ? 'success' : 'danger'}
                                                    className="px-5 py-2 rounded-xl text-xs font-semibold  border-none
                                                >
                                                    {u.is_active ? 'Otoritas Aktif' : 'Akses Dicabut'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-8 text-right pr-12">
                                                <div className="flex justify-end gap-3x-2 group-hover/row:translate-x-0opacity-0 group-hover/row:opacity-100">
                                                    <button
                                                        onClick={() => toggleStatus(u.id)}
                                                        disabled={toggleForm.processing}
                                                        className={clsx(
                                                            "p-3.5 rounded-lgactive:scale-95 border",
                                                            u.is_active 
                                                                ? "bg-white border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white 
                                                                : "bg-white border-primary text-primary hover:bg-primary hover:text-white
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
                        <div className="px-6 py-8 bg-slate-50/50 border-t border-slate-200">
                            <Pagination meta={users.meta} />
                        </div>
                    )}
                </div>

                {/* 
                    Lush Emerald Footer 
                    Refining from heavy black to premium tactical emerald gradient
                */}
                <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
                     
                     <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary">
                                    <ShieldCheck className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-semibold text-white ">AUTH_CONTROL_LEDGER_V3</h4>
                                    <p className="text-[10px] text-emerald-400 text-sm  mt-2 whitespace-nowrap">SECURITY_HEARTBEAT: ACTIVE_ENCRYPTED</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 text-sm leading-normal max-w-4xl opacity-75">
                                Operational Notice: Pergerakan status otoritas akun diawasi secara real-time melalui protokol audit sistem. Manajemen identitas Administrator Pusat memiliki wewenang untuk menangguhkan akses personel secara instan demi menjaga integritas data nasional KKN UIN SAIZU.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-2 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-lg bg-emerald-500" />
                                <span className="text-[11px] font-semibold text-slate-100 ">MONITOR_SYNCHRONIZED</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Fingerprint className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
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
