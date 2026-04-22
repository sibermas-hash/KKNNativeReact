import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Pagination } from '@/Components/ui';
import { router, Link, Head, usePage } from '@inertiajs/react';
import { Users, KeyRound, Plus, UserCheck, ArrowRight, Database, ShieldCheck, X, RefreshCw } from 'lucide-react';
import type { PaginationMeta } from '@/Components/ui/Pagination';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/Components/Premium/PageHeader';
import StatCard from '@/Components/Premium/StatCard';
import ContentPanel from '@/Components/Premium/ContentPanel';
import SearchInput from '@/Components/Premium/SearchInput';
import StatusTag from '@/Components/Premium/StatusTag';
import PremiumTable, { PremiumTableRow, PremiumTableCell } from '@/Components/Premium/PremiumTable';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  is_active: boolean;
  dosen?: {
    nip?: string;
    nama?: string;
    fakultas?: { nama: string };
    active_assignment?: { period_name: string };
  };
}

interface Props {
  users: { data: User[]; meta: PaginationMeta };
  filters: { search: string };
  stats: { total: number; active: number };
}

export default function DosenIndex({ users, filters, stats }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const { flash } = usePage<PageProps>().props;

  const handleSearch = () => {
    router.get('/admin/dosen', { search: search || undefined }, { preserveState: true, replace: true });
  };

  const resetTemporaryPassword = (user: User) => {
    if (!confirm(`Sistem: Apakah Anda yakin ingin menerbitkan kata sandi sementara untuk ${user.username}?`)) return;
    router.post(`/admin/pengguna/${user.id}/reset-password-sementara`, {}, { preserveScroll: true });
  };

  return (
    <AppLayout title="Direktori Dosen">
      <Head title="Manajemen Data Dosen" />

      <div className="space-y-8 pb-24 text-emerald-950">

        <PageHeader
          title="Direktori Dosen."
          subtitle="Pengelolaan akun Dosen Pembimbing Lapangan (DPL) dan koordinator wilayah operasional KKN."
          icon={Users}
          groupLabel="Manajemen Pengguna"
          stats={{
            label: 'Total Dosen',
            value: `${stats.total} DPL`,
            icon: Database,
          }}
        >
          <Link
            href="/admin/dosen/sinkron"
            className="h-12 px-6 bg-white border-2 border-emerald-50 hover:border-emerald-600 text-emerald-950 rounded-xl font-bold text-xs transition-all flex items-center gap-3 active:scale-95 shadow-sm uppercase tracking-wider"
          >
            <RefreshCw size={16} strokeWidth={2.5} /> Sinkronisasi
          </Link>
          <Link
            href="/admin/pengguna/buat?role=dpl"
            className="h-12 px-6 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-3 active:scale-95 shadow-sm uppercase tracking-wider"
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Dosen
          </Link>
        </PageHeader>

        {/* PASSWORD FLASH NOTICE */}
        <AnimatePresence>
          {flash?.temporary_password && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <KeyRound size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Password Sementara Berhasil Diterbitkan</span>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm text-amber-800 font-semibold">Username: <span className="font-bold text-amber-950 underline">{flash.temporary_username}</span></span>
                    <span className="text-emerald-600 font-bold">|</span>
                    <span className="text-sm text-emerald-950 font-bold">Password: <code className="bg-white px-2 py-0.5 rounded-lg border border-amber-200 select-all font-mono text-amber-900">{flash.temporary_password}</code></span>
                  </div>
                </div>
              </div>
              <button onClick={() => router.reload()} className="text-amber-400 hover:text-amber-700 transition-colors p-1">
                <X size={18} strokeWidth={2.5} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Dosen Terdaftar" value={stats.total} icon={Database} />
          <StatCard label="Akun Status Aktif" value={stats.active} icon={UserCheck} variant="success" />
          <StatCard label="Integritas Layanan" value="Online" icon={ShieldCheck} variant="info" />
        </div>

        {/* TABLE */}
        <ContentPanel
          title="Daftar Akun Dosen"
          description="Seluruh Dosen Terdaftar"
          icon={Users}
          padding={false}
          headerAction={
            <SearchInput
              placeholder="Cari nama atau NIP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={handleSearch}
              className="w-72"
            />
          }
          footer={
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-950/40 uppercase tracking-widest">
                Halaman <strong className="text-emerald-950 tabular-nums">{users.meta.current_page}</strong> dari {users.meta.last_page} — Total {users.meta.total} dosen
              </span>
              <Pagination meta={users.meta} />
            </div>
          }
        >
          <PremiumTable
            headers={['Profil Dosen', 'NIP', 'Fakultas', 'Status Penugasan', 'Aksi']}
            isEmpty={users.data.length === 0}
            emptyText="Tidak ada data dosen ditemukan."
          >
            {users.data.map(user => (
              <PremiumTableRow key={user.id}>
                <PremiumTableCell>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#e8f5ee] text-[#1a7a4a] flex items-center justify-center text-xs font-bold border border-emerald-50">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-tight">
                        {user.dosen?.nama || user.name}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-950/30">{user.email || '-'}</span>
                    </div>
                  </div>
                </PremiumTableCell>
                <PremiumTableCell>
                  <span className="text-xs font-bold text-[#1a7a4a] font-mono tracking-wider">
                    {user.dosen?.nip || '—'}
                  </span>
                </PremiumTableCell>
                <PremiumTableCell>
                  <span className="text-xs font-semibold text-emerald-950">
                    {user.dosen?.fakultas?.nama || <span className="font-medium italic text-emerald-950/40">Belum dipetakan</span>}
                  </span>
                </PremiumTableCell>
                <PremiumTableCell>
                  {user.dosen?.active_assignment ? (
                    <div className="flex flex-col gap-1">
                      <StatusTag status="success" label="DPL AKTIF" size="sm" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter truncate max-w-[120px]">
                        {user.dosen.active_assignment.period_name}
                      </span>
                    </div>
                  ) : (
                    <StatusTag status="info" label="DOSEN" size="sm" />
                  )}
                </PremiumTableCell>
                <PremiumTableCell align="right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => resetTemporaryPassword(user)}
                      className="h-9 w-9 inline-flex items-center justify-center bg-white text-emerald-800 hover:bg-amber-50 hover:text-amber-600 border-2 border-[#f3f4f6] rounded-xl transition-all active:scale-95"
                      title="Reset Password Sementara"
                    >
                      <KeyRound size={15} strokeWidth={2.5} />
                    </button>
                    <Link
                      href="/admin/dosen/penugasan"
                      className="h-9 px-4 inline-flex items-center justify-center bg-white text-emerald-950 hover:bg-emerald-900 hover:text-white border-2 border-[#f3f4f6] rounded-xl text-xs font-extrabold transition-all active:scale-95 uppercase tracking-widest shadow-sm shadow-emerald-900/5"
                    >
                      Penugasan <ArrowRight size={14} className="ml-2" strokeWidth={3} />
                    </Link>
                  </div>
                </PremiumTableCell>
              </PremiumTableRow>
            ))}
          </PremiumTable>
        </ContentPanel>
      </div>
    </AppLayout>
  );
}
