import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import { router, Link, Head, usePage } from '@inertiajs/react';
import { Search, RefreshCw, Users, KeyRound, Plus, UserCheck, ArrowRight, CheckCircle2, Database, ShieldCheck, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';

interface User { id: number; username: string; name: string; email: string; is_active: boolean; dosen?: { nip: string; fakultas?: { nama: string }; }; }
interface Props { users: { data: User[]; meta: PaginationMeta; }; filters: { search: string; }; }

export default function DosenIndex({ users, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const { flash } = usePage<PageProps>().props;

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); router.get('/admin/dosen', { search }, { preserveState: true }); };
  const resetTemporaryPassword = (user: User) => {
    if (!confirm(`Buat kata sandi sementara untuk ${user.username}?`)) return;
    router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
  };

  return (
    <AppLayout title="Direktori Dosen">
      <Head title="Manajemen Data Dosen" />

      <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8 font-sans pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-gray-500">Manajemen Pengguna</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Direktori Dosen</h1>
            <p className="text-sm text-gray-500 max-w-2xl mt-1">Manajemen akun Dosen Pembimbing Lapangan (DPL) dan koordinator wilayah KKN.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/admin/dosen/sinkron" className="h-10 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
              <RefreshCw size={15} /> Sinkronisasi
            </Link>
            <Link href="/admin/pengguna/buat?role=dpl" className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Plus size={15} /> Tambah Dosen
            </Link>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Dosen" value={users.meta.total} icon={Database} />
          <StatCard label="Akun Aktif" value={users.data.filter(u => u.is_active).length} icon={UserCheck} color="emerald" />
          <StatCard label="Status Layanan" value="Online" isText icon={ShieldCheck} color="emerald" />
        </div>

        {/* FLASH: TEMPORARY PASSWORD */}
        {flash?.temporary_password && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <KeyRound size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Sandi Sementara Diterbitkan</p>
                <p className="text-xs text-emerald-700 mt-0.5">Berikan informasi akses ini kepada dosen yang bersangkutan.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="px-3 py-2 bg-white border border-emerald-200 rounded-md">
                <p className="text-xs text-gray-500">Username</p>
                <p className="text-sm font-mono font-semibold text-gray-900 select-all">{flash.temporary_username}</p>
              </div>
              <div className="px-3 py-2 bg-white border border-emerald-200 rounded-md">
                <p className="text-xs text-gray-500">Password</p>
                <p className="text-sm font-mono font-semibold text-emerald-700 select-all">{flash.temporary_password}</p>
              </div>
            </div>
          </div>
        )}

        {/* TABLE PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-500"><strong className="text-gray-900">{users.meta.total}</strong> dosen terdaftar</div>
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari nama atau NIP..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 pl-9 pr-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm" />
            </form>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Profil Dosen</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Afiliasi Institusi</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status Akses</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.data.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">Data dosen tidak ditemukan.</td></tr>
                ) : users.data.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                          <span className="text-xs font-mono text-gray-500">NIP: {user.dosen?.nip || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{user.dosen?.fakultas?.nama || 'Belum dipetakan'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", user.is_active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => resetTemporaryPassword(user)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Reset Password">
                          <KeyRound size={16} />
                        </button>
                        <Link href="/admin/dosen/penugasan" className="px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5">
                          Penugasan <ArrowRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">Hal. {users.meta.current_page} — Total <strong>{users.meta.total}</strong> data</span>
            <Pagination meta={users.meta} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, icon: Icon, color = 'slate', isText = false }: { label: string; value: number | string; icon: LucideIcon; color?: 'emerald' | 'slate'; isText?: boolean; }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className={clsx("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600')}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 leading-tight">
          {isText ? value : (typeof value === 'number' ? value.toLocaleString('id-ID') : value)}
        </p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
