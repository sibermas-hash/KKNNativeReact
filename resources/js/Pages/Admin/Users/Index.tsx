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
 Zap,
 ChevronLeft,
 ShieldAlert,
 Cpu,
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
 'superadmin': 'ADMIN_PUSAT',
 'faculty_admin': 'ADMIN_FAKULTAS',
 'dpl': 'PERSONEL_DPL',
 'student': 'PESERTA_MAHASISWA',
 'admin_prodi': 'KOORDINATOR_PRODI'
 };

 return (
 <AppLayout title="Manajemen Akses Pengguna">
 <Head title="Direktori Pengguna" />

 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 DIRECTORY_AUTHORIZATION_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <Users className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Direktori <span className="text-primary">Pengguna</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <Activity className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Active_Directory</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {users.meta?.total || 0} ACCOUNTS
 </span>
 </div>
 </div>
 </div>

 <Link 
 href="/admin/users/create" 
 className="px-6 py-3 bg-slate-900 text-white text-[10px] font-semibold rounded-lg transition-all flex items-center gap-3"
 >
 <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
 REGISTER_RECORD
 </Link>
 </div>
 </div>

 {/* Operations Toolbar */}
 <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
 <div className="flex-1 w-full xl:max-w-2xl relative group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 type="search"
 placeholder="SEARCH_IDENTITY (NAME / ID / EMAIL)..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full h-12 pl-12 pr-6 bg-white border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>

 <div className="flex flex-wrap gap-4 w-full xl:w-auto">
 <div className="relative flex-1 xl:w-56 group">
 <select
 value={role}
 onChange={(e) => setRole(e.target.value)}
 className="w-full bg-white border border-slate-100 rounded-lg px-4 py-3 text-[10px] font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 appearance-none cursor-pointer"
 >
 <option value="">ALL_AUTHORITIES</option>
 <option value="superadmin">ADMIN_PUSAT</option>
 <option value="faculty_admin">ADMIN_FAKULTAS</option>
 <option value="dpl">PERSONEL_DPL</option>
 <option value="student">PESERTA_MAHASISWA</option>
 </select>
 </div>
 </div>
 </div>

 {/* Account Ledger (Table) */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">PERSONNEL_IDENTITY</th>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">AFFILIATION_VECTOR</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">AUTHORITY_LEVEL</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">STATUS</th>
 <th className="px-8 py-6 text-right text-[9px] font-semibold text-slate-400">COMMAND</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {users.data.length === 0 ? (
 <tr>
 <td colSpan={5} className="px-8 py-32 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <Users className="h-12 w-12 text-slate-900" />
 <span className="text-[10px] font-semibold text-slate-900">NO_RECORDS_DETECTED</span>
 </div>
 </td>
 </tr>
 ) : (
 users.data.map((u) => (
 <tr key={u.id} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="relative">
 <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 text-primary text-[11px] font-semibold flex items-center justify-center ">
 {getInitials(u.name)}
 </div>
 {u.is_active && <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-primary rounded-full border-2 border-white " />}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] group-hover/row:text-primary transition-colors">
 {u.name}
 </span>
 <div className="flex items-center gap-2 mt-0.5">
 <Fingerprint className="h-3 w-3 text-slate-300" />
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 font-mono">
 RID: #{u.username}
 </span>
 </div>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex flex-col gap-1.5 min-w-0">
 <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 lowercase truncate max-w-[200px]">
 <Mail className="h-3 w-3 text-primary/40" />
 {u.email}
 </div>
 <span className="text-[9px] font-semibold text-slate-300">
 {u.mahasiswa?.nim || u.dosen?.nip || 'INTERNAL_SYS_ENTRY'}
 </span>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="flex flex-wrap justify-center gap-2">
 {u.roles.map((r) => (
 <span 
 key={r.name} 
 className={clsx(
 "px-3 py-1 rounded-lg text-[9px] font-semibold ",
 r.name === 'superadmin' ? "bg-amber-50 text-amber-600 border border-amber-100" :
 r.name === 'faculty_admin' ? "bg-sky-50 text-sky-600 border border-sky-100" :
 r.name === 'dpl' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
 "bg-emerald-50 text-emerald-600 border border-emerald-100"
 )}
 >
 {roleMap[r.name] || r.name.toUpperCase()}
 </span>
 ))}
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <span className={clsx(
 "px-3 py-1 rounded-lg text-[9px] font-semibold ",
 u.is_active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
 )}>
 {u.is_active ? 'ACTIVE_AUTH' : 'REVOKED_ACCESS'}
 </span>
 </td>
 <td className="px-8 py-6 text-right">
 <button
 onClick={() => toggleStatus(u.id)}
 disabled={toggleForm.processing}
 className={clsx(
 "h-9 w-9 rounded-lg flex items-center justify-center transition-all group/btn",
 u.is_active 
 ? "bg-white border border-rose-100 text-rose-400 hover:bg-rose-500 hover:text-white" 
 : "bg-white border border-primary text-primary hover:bg-primary hover:text-white"
 )}
 >
 <Power className="w-4 h-4 " />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 {users.meta && (
 <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50">
 <Pagination meta={users.meta} />
 </div>
 )}
 </div>

 {/* Operations Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <ShieldAlert className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">AUTH_CONTROL_LEDGER_V3.2</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: ACTIVE_ENCRYPTED_AUTH</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 Manajemen identitas Administrator Pusat memiliki wewenang absolut untuk menangguhkan akses personel secara instan demi menjaga integritas data nasional KKN UIN SAIZU.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">MONITOR_SYNCHRONIZED</span>
 </div>
 <div className="flex gap-4 opacity-50">
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Cpu className="h-5 w-5" />
 </div>
 <div className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors">
 <Zap className="h-5 w-5" />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
