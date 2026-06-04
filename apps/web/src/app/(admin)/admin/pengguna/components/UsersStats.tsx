import type { PaginationMeta } from '@sibermas/shared-types';
import { Filter, Layers3, Users } from 'lucide-react';
import type { User } from '../lib/user-types';

type Props = { meta?: PaginationMeta; users: User[]; page: number; perPage: number; activeFilterCount: number };

export function UsersStats({ meta, users, page, perPage, activeFilterCount }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        icon={<Users size={18} />}
        label="Total hasil"
        value={meta?.total ?? users.length}
        description="pengguna sesuai filter"
        accent="cyan"
      />
      <StatCard
        icon={<Layers3 size={18} />}
        label="Batch aktif"
        value={`${meta?.current_page ?? page}/${meta?.last_page ?? 1}`}
        description={`${perPage} pengguna per batch`}
        accent="indigo"
      />
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Filter aktif</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{activeFilterCount}</p>
            <p className="text-xs font-semibold text-white/60">search, role, status, fakultas</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 text-cyan-200 ring-1 ring-white/10"><Filter size={18} /></div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, description, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; description: string; accent: 'cyan' | 'indigo' }) {
  const color = accent === 'cyan' ? 'bg-cyan-50 text-cyan-700 ring-cyan-100' : 'bg-indigo-50 text-indigo-700 ring-indigo-100';

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{value}</p>
        <p className="text-xs font-semibold text-slate-500">{description}</p>
      </div>
      <div className={`rounded-2xl p-3 ring-1 ${color}`}>{icon}</div>
    </div>
  );
}
