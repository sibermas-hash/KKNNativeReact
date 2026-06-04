import type { PaginationMeta } from '@sibermas/shared-types';
import type { User } from '../lib/user-types';

type Props = { meta?: PaginationMeta; users: User[]; page: number; perPage: number; activeFilterCount: number };

export function UsersStats({ meta, users, page, perPage, activeFilterCount }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total hasil</p>
        <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{meta?.total ?? users.length}</p>
        <p className="text-xs font-semibold text-slate-500">pengguna sesuai filter</p>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Batch aktif</p>
        <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{meta?.current_page ?? page}/{meta?.last_page ?? 1}</p>
        <p className="text-xs font-semibold text-slate-500">{perPage} pengguna per batch</p>
      </div>
      <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Filter aktif</p>
        <p className="mt-2 text-2xl font-black tabular-nums">{activeFilterCount}</p>
        <p className="text-xs font-semibold text-white/60">search, role, status, fakultas</p>
      </div>
    </div>
  );
}
