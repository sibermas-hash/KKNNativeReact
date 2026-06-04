import { Ban, CheckCircle2, Mail, UserCircle, Users } from 'lucide-react';
import type { PaginationMeta } from '@sibermas/shared-types';
import { EmptyState, ResponsiveTable } from '@/components/ui/shared';
import type { User } from '../lib/user-types';
import { roleLabelMap } from '../lib/user-options';
import { normalizeAvatarUrl, roleBadgeClass } from '../lib/user-helpers';

type Props = { users: User[]; meta?: PaginationMeta; batchLabel: string; hasActiveFilters: boolean; listErrorMessage: string | null; isLoading: boolean; refetch: () => void; setPage: React.Dispatch<React.SetStateAction<number>>; rowActions: (user: User) => React.ReactNode };

export function UsersTable({ users, meta, batchLabel, hasActiveFilters, listErrorMessage, isLoading, refetch, setPage, rowActions }: Props) {
  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />)}</div>;
  if (listErrorMessage) return <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center space-y-3"><p className="text-sm font-bold text-rose-700">Gagal memuat data pengguna.</p><p className="text-sm text-rose-700">{listErrorMessage}</p><button onClick={() => refetch()} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700">Coba Lagi</button></div>;
  if (users.length === 0) return <EmptyState icon={<Users size={40} />} title="Belum ada pengguna" description={hasActiveFilters ? 'Tidak ada pengguna yang cocok dengan filter saat ini.' : 'Tidak ada pengguna yang ditemukan.'} />;

  return (
    <div className="space-y-4">
      <ResponsiveTable columns={[
        { key: 'user', label: 'Pengguna', render: (u) => <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">{normalizeAvatarUrl(u.avatar_url) ? <img src={normalizeAvatarUrl(u.avatar_url) ?? ''} alt={String(u.name || 'Avatar pengguna')} className="h-full w-full object-cover" loading="lazy" /> : <UserCircle size={20} />}</div><div><p className="font-black text-slate-900">{String(u.name || '-')}</p><p className="text-xs font-semibold text-slate-400">@{String(u.username || '-')}</p></div></div> },
        { key: 'email', label: 'Kontak', hideOnMobile: true, render: (u) => <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><Mail size={14} className="text-slate-400" />{String(u.email || '-')}</span> },
        { key: 'role', label: 'Role', render: (u) => <div className="flex flex-wrap gap-1">{(u.roles?.length ? u.roles : ['-']).map((role) => <span key={`${u.id}-${role}`} className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${roleBadgeClass(role)}`}>{roleLabelMap[role] ?? role}</span>)}</div> },
        { key: 'status', label: 'Status', render: (u) => <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${u.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>{u.is_active ? <CheckCircle2 size={12} /> : <Ban size={12} />} {u.is_active ? 'Aktif' : 'Nonaktif'}</span> },
      ]} data={users} keyExtractor={(u) => u.id} rowActions={rowActions} />
      {meta && meta.last_page > 1 && <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-semibold text-slate-500">{batchLabel}</span><div className="flex gap-2 self-end sm:self-auto"><button onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))} disabled={meta.current_page <= 1} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-50">{'<'} Sebelumnya</button><button onClick={() => setPage((currentPage) => Math.min(meta.last_page, currentPage + 1))} disabled={meta.current_page >= meta.last_page} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-50">Berikutnya {'>'}</button></div></div>}
    </div>
  );
}
