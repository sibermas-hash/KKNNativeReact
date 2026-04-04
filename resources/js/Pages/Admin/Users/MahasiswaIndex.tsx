import { useState, useEffect } from 'react';
import { useForm, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Pagination } from '@/Components/ui';
import type { PageProps } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
 Mail,
 UserPlus,
 Users,
 ShieldCheck,
 Search,
 UserCheck,
 UserMinus,
 RefreshCw,
 Activity,
} from 'lucide-react';
import { clsx } from 'clsx';

interface UserData {
 id: number;
 username: string;
 name: string;
 email: string;
 is_active: boolean;
 mahasiswa?: {
 nim: string;
 prodi?: { nama: string; fakultas?: { nama: string } };
 fakultas?: { nama: string };
 };
}

interface Props extends PageProps {
 users: {
 data: UserData[];
 links: any[];
 meta: PaginationMeta;
 };
 filters: { search?: string };
 title: string;
}

export default function MahasiswaIndex({ users, filters }: Props) {
 const [search, setSearch] = useState(filters.search || '');
 const toggleForm = useForm({});

 useEffect(() => {
 const timer = setTimeout(() => {
 if (search !== (filters.search || '')) {
 router.get('/admin/mahasiswa', { search }, { preserveState: true, replace: true });
 }
 }, 300);
 return () => clearTimeout(timer);
 }, [search, filters.search]);

 const toggleStatus = (id: number) => {
 if (confirm('Apakah Anda yakin ingin mengubah status aktif akun mahasiswa ini?')) {
 toggleForm.patch(`/admin/users/${id}/toggle-active`, {
 preserveScroll: true
 });
 }
 };

 const getInitials = (name: string) => {
 return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
 };

 return (
 <AppLayout title="Data Mahasiswa">
 <div className="space-y-8 pb-16">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-xs font-semibold text-emerald-600">
 STUDENT_REGISTRY_DATABASE
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <Users className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 ">
 Data <span className="text-primary">Mahasiswa</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-6 transition-all hover:border-slate-200">
 <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <ShieldCheck className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-xs font-semibold text-slate-400  mb-0.5">Terdaftar</span>
 <span className="text-xs font-semibold text-slate-900 ">
 {users.meta?.total || 0} TOTAL
 </span>
 </div>
 </div>
 <Link href="/admin/mahasiswa/sync" className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors group">
 <RefreshCw className="w-3.5 h-3.5 " />
 <span className="text-xs font-semibold">SYNC_SIAKAD</span>
 </Link>
 </div>

 <Link 
 href="/admin/users/create?role=student" 
 className="px-6 py-3 bg-slate-900 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-3"
 >
 <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
 ADD_NEW_STUDENT
 </Link>
 </div>
 </div>

 <div className="space-y-6">
 <div className="relative group max-w-lg">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
 <input
 type="search"
 placeholder="SEARCH_STUDENT_IDENTIFIER (NIM / NAME)..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-lg text-sm font-semibold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 "
 />
 </div>

 <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full border-collapse divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-5 text-left text-xs font-semibold text-slate-400">IDENTITAS_PESERTA</th>
 <th className="px-8 py-5 text-left text-xs font-semibold text-slate-400">PROGRAM_AKADEMIK</th>
 <th className="px-8 py-5 text-center text-xs font-semibold text-slate-400">STATUS_AKSES</th>
 <th className="px-8 py-5 text-right text-xs font-semibold text-slate-400 pr-12">MANAJEMEN</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50/50">
 {users.data.length === 0 ? (
 <tr>
 <td colSpan={4} className="px-8 py-24 text-center">
 <div className="flex flex-col items-center gap-4">
 <Users className="h-10 w-10 text-slate-300" />
 <p className="text-xs font-semibold text-slate-400">DIREKTORI_MAHASISWA_KOSONG</p>
 </div>
 </td>
 </tr>
 ) : (
 users.data.map((user) => (
 <tr key={user.id} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-semibold text-slate-300 group-hover/row:bg-primary group-hover/row:text-white group-hover/row:border-primary transition-all">
 {getInitials(user.name)}
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-semibold text-slate-900 group-hover/row:text-primary transition-colors  mb-1">{user.name}</span>
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold text-slate-300">NIM: {user.mahasiswa?.nim || '---'}</span>
 <span className="text-xs font-semibold text-slate-200">|</span>
 <span className="text-xs font-semibold text-slate-300">@{user.username}</span>
 </div>
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-slate-700 leading-tight">
 {user.mahasiswa?.prodi?.nama || 'UNASSIGNED_PROGRAM'}
 </span>
 <span className="text-xs font-semibold text-slate-300">
 {user.mahasiswa?.fakultas?.nama || user.mahasiswa?.prodi?.fakultas?.nama || 'UNASSIGNED_FACULTY'}
 </span>
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <Badge
 variant={user.is_active ? 'success' : 'danger'}
 className="px-4 py-1.5 rounded-lg text-xs font-semibold border-none"
 >
 {user.is_active ? 'ACTIVE_ACCESS' : 'ACCESS_BLOCKED'}
 </Badge>
 </td>
 <td className="px-8 py-6 text-right pr-12">
 <div className="flex justify-end gap-2 group-hover/row:opacity-100 transition-opacity">
 <button
 onClick={() => toggleStatus(user.id)}
 disabled={toggleForm.processing}
 className={clsx(
 "p-2.5 border rounded-lg transition-all ",
 user.is_active 
 ? "bg-white border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white" 
 : "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white"
 )}
 title={user.is_active ? 'Cabut Akses' : 'Aktifkan Akses'}
 >
 {user.is_active ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 {users.meta && (
 <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-lg">
 <Pagination meta={users.meta} />
 </div>
 )}
 </div>

 {/* Tactical Monitor Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-5">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <Activity className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-white"></h4>
 <p className="text-xs font-semibold text-slate-500 mt-1  max-w-2xl">
 Kontrol akses mahasiswa terintegrasi dengan SIAKAD. <br/>
 STATUS: MONITORING_SESSION_STREAM
 </p>
 </div>
 </div>
 <div className="flex gap-4 text-slate-400">
 <RefreshCw className="h-6 w-6" />
 <ShieldCheck className="h-6 w-6" />
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}
