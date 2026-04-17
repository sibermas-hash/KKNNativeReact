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
      window.alert('Saat ini hanya akun mahasiswa yang dapat dikunci aksesnya.');
      return;
    }
    const actionLabel = user.is_active ? 'nonaktifkan' : 'aktifkan';
    if (confirm(`Apakah Anda yakin ingin ${actionLabel} akun ${user.name}?`)) {
      router.patch(`/admin/pengguna/${user.id}/toggle-status`, {}, { preserveScroll: true });
    }
  };

  const resetTemporaryPassword = (user: User) => {
    if (!confirm(`Apakah Anda yakin ingin mereset password untuk akun ${user.username}?`)) return;
    router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
  };

  return (
    <AppLayout title="Akses Pengguna">
      <Head title="Manajemen Pengguna"/>

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-[#1a7a4a]" />
                <span className="text-sm font-medium text-gray-700">Administrasi Keamanan</span>
             </div>
             <h1 className="text-2xl font-bold text-gray-900 leading-tight">Manajemen Akses Sistem</h1>
             <p className="text-sm text-gray-700 mt-1">
                Registri kredensial dan pengelolaan hak akses tingkat civitas akademika KKN.
             </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
             <Link 
               href="/admin/pengguna/buat"
               className="inline-flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#15803d] transition-colors"
             >
               <UserPlus size={16} /> Tambah Pengguna
             </Link>
          </div>
        </div>

        {/* PASSWORD FLASH NOTICE */}
        <AnimatePresence>
          {flash?.temporary_password && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-amber-700">Password Sementara Berhasil Diterbitkan</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-amber-900 font-medium">Username: <span className="font-bold underline">{flash.temporary_username}</span></span>
                    <span className="text-gray-500">|</span>
                    <span className="text-sm text-gray-800 font-bold">Password: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 select-all">{flash.temporary_password}</code></span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => router.reload()} 
                className="text-amber-500 hover:text-amber-700"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABLE SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#1f2937]">
              <UsersIcon size={16} className="text-gray-700" />
              <h3 className="text-sm font-semibold">Daftar Akun Pengguna</h3>
            </div>
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input 
                type="text"
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full h-9 pl-9 pr-4 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:border-[#f3f4f6]0 focus:ring-[#1a7a4a] shadow-sm"
                placeholder="Cari nama, email, username..."
              />
            </form>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Informasi Pengguna</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Hak Akses</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Verifikasi</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(!users?.data || users.data.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-700">
                       Tidak ada data pengguna ditemukan.
                    </td>
                  </tr>
                ) : (
                  users.data.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-bold border border-gray-200">
                            {user.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{user.name}</span>
                            <span className="text-xs text-gray-700">@{user.username} · {user.email || 'No Email'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={clsx(
                          "inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase border",
                          user.roles?.[0]?.toLowerCase() === 'superadmin' 
                            ? "bg-[#e8f5ee] text-[#1a7a4a] border-gray-200" 
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        )}>
                          {user.roles?.[0] || 'Member'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.email_verified_at ? (
                          <div className="flex items-center justify-center gap-1.5 text-[#1a7a4a]">
                            <ShieldCheck size={14} />
                            <span className="text-xs font-bold uppercase">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-gray-600">
                            <ShieldQuestion size={14} />
                            <span className="text-xs font-bold uppercase">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => resetTemporaryPassword(user)} 
                            className="p-1.5 text-gray-700 hover:text-[#1a7a4a] bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound size={16} />
                          </button>
                          <button 
                            onClick={() => toggleStatus(user)} 
                            disabled={user.roles?.[0]?.toLowerCase() !== 'student'} 
                            className={clsx(
                              'p-1.5 border rounded-md transition-colors disabled:opacity-20', 
                              user.is_active ? 'text-gray-700 hover:text-rose-600 bg-white border-gray-200 hover:bg-rose-50' : 'text-rose-600 bg-rose-50 border-rose-200'
                            )} 
                            title={user.is_active ? 'Kunci Akun' : 'Buka Kunci'}
                          >
                            {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                          </button>
                          <Link 
                            href={`/admin/pengguna/${user.id}/edit`} 
                            className="inline-flex items-center gap-1.5 text-xs text-[#1a7a4a] font-bold hover:text-[#1a7a4a] transition-colors px-2 py-1"
                          >
                            Edit <ChevronRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-700">
              Total {users?.meta?.total ?? 0} akun aktif ditemukan
            </span>
            {users?.meta && <Pagination meta={users.meta} />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
