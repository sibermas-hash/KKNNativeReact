import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import { router, Link, Head, usePage } from '@inertiajs/react';
import { Search, RefreshCw, Users, KeyRound, Plus, UserCheck, ArrowRight, CheckCircle2, Database, ShieldCheck, type LucideIcon, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface User { id: number; username: string; name: string; email: string; is_active: boolean; dosen?: { nip: string; fakultas?: { nama: string }; }; }
interface Props { users: { data: User[]; meta: PaginationMeta; }; filters: { search: string; }; }

export default function DosenIndex({ users, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const { flash } = usePage<PageProps>().props;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/admin/dosen', { search }, { preserveState: true });
  };

  const resetTemporaryPassword = (user: User) => {
    if (!confirm(`Sistem: Apakah Anda yakin ingin menerbitkan kata sandi sementara untuk ${user.username}?`)) return;
    router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
  };

  return (
    <AppLayout title="Direktori Dosen">
      <Head title="Manajemen Data Dosen" />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-emerald-50 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#1a7a4a]">
              <Users size={16} />
              <span className="text-sm font-medium text-emerald-800">Manajemen Pengguna</span>
            </div>
            <h1 className="text-2xl font-bold text-emerald-950 leading-tight">Direktori Dosen</h1>
            <p className="text-sm text-emerald-800 max-w-2xl mt-1">
              Pengelolaan akun Dosen Pembimbing Lapangan (DPL) dan koordinator wilayah operasional KKN.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/admin/dosen/sinkron" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-emerald-800 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
              <RefreshCw size={15} /> Sinkronisasi
            </Link>
            <Link href="/admin/pengguna/buat?role=dpl" className="inline-flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#15803d] transition-colors">
              <Plus size={15} /> Tambah Dosen
            </Link>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Dosen Terdaftar" value={users.meta.total} icon={Database} />
          <StatCard label="Akun Status Aktif" value={users.data.filter(u => u.is_active).length} icon={UserCheck} color="emerald" />
          <StatCard label="Integritas Layanan" value="Online" isText icon={ShieldCheck} color="emerald" />
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
                    <span className="text-emerald-700">|</span>
                    <span className="text-sm text-emerald-950 font-bold">Password: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 select-all">{flash.temporary_password}</code></span>
                  </div>
                </div>
              </div>
              <button onClick={() => router.reload()} className="text-amber-500 hover:text-amber-700">
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABLE SECTION */}
        <div className="bg-white border border-emerald-50 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-emerald-50 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#1f2937]">
              <Users size={16} className="text-emerald-800" />
              <h3 className="text-sm font-semibold">Daftar Akun DPL</h3>
            </div>
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-800" />
              <input 
                type="text" 
                placeholder="Cari nama atau NIP..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full h-9 pl-9 pr-4 bg-white border border-gray-300 rounded-md text-sm text-emerald-950 focus:border-[#f3f4f6]0 focus:ring-[#1a7a4a] shadow-sm"
              />
            </form>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-emerald-800 uppercase tracking-wider">Profil Dosen</th>
                  <th className="px-6 py-3 text-xs font-medium text-emerald-800 uppercase tracking-wider">Afiliasi Institusi</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-emerald-800 uppercase tracking-wider">Status Akses</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-emerald-800 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-emerald-800">
                      Tidak ada data dosen ditemukan.
                    </td>
                  </tr>
                ) : (
                  users.data.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-emerald-800 text-xs font-bold border border-emerald-50">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-emerald-950">{user.name}</span>
                            <span className="text-xs font-mono text-emerald-800">NIP: {user.dosen?.nip || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-emerald-800">{user.dosen?.fakultas?.nama || 'Belum dipetakan'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={clsx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border",
                          user.is_active ? "bg-[#e8f5ee] text-[#1a7a4a] border-emerald-50" : "bg-rose-50 text-rose-700 border-rose-100"
                        )}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-right">
                          <button 
                            onClick={() => resetTemporaryPassword(user)} 
                            className="p-1.5 text-emerald-800 hover:text-[#1a7a4a] bg-white border border-emerald-50 rounded-md hover:bg-gray-50 transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound size={16} />
                          </button>
                          <Link 
                            href="/admin/dosen/penugasan" 
                            className="inline-flex items-center gap-1.5 text-xs text-[#1a7a4a] font-bold hover:text-[#1a7a4a] transition-colors px-2 py-1"
                          >
                            Penugasan <ArrowRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-emerald-50 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-emerald-800">
              Halaman {users.meta.current_page} — Total {users.meta.total} dosen
            </span>
            <Pagination meta={users.meta} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, icon: Icon, color = 'slate', isText = false }: { label: string; value: number | string; icon: LucideIcon; color?: 'emerald' | 'slate'; isText?: boolean; }) {
  return (
    <div className="bg-white border border-emerald-50 rounded-xl p-5 flex items-center justify-between shadow-sm">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-emerald-800 mb-1">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-emerald-950 leading-none">
              {isText ? value : (typeof value === 'number' ? value.toLocaleString('id-ID') : value)}
            </span>
        </div>
      </div>
      <div className={clsx(
        "h-12 w-12 rounded-lg border flex items-center justify-center shrink-0 shadow-sm",
        color === 'emerald' ? 'bg-[#e8f5ee] border-emerald-50 text-[#1a7a4a]' : 'bg-gray-50 border-gray-100 text-emerald-800'
      )}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
    </div>
  );
}
