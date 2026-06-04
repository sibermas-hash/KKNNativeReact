import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import type { FacultyOption } from '../lib/user-types';
import { roleOptions, statusOptions } from '../lib/user-options';

type Props = {
  search: string; setSearch: (value: string) => void;
  roleFilter: string; setRoleFilter: (value: string) => void;
  statusFilter: string; setStatusFilter: (value: string) => void;
  facultyFilter: string; setFacultyFilter: (value: string) => void;
  perPage: number; setPerPage: (value: number) => void;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  faculties: FacultyOption[]; hasActiveFilters: boolean; activeFilterCount: number;
  resetFilters: () => void; isFetching: boolean; isLoading: boolean; batchLabel: string;
};

export function UsersFilterBar(props: Props) {
  const { search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter, facultyFilter, setFacultyFilter, perPage, setPerPage, setPage, faculties, hasActiveFilters, activeFilterCount, resetFilters, isFetching, isLoading, batchLabel } = props;
  return (
    <div className="rounded-3xl bg-white/95 p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-1 flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="w-full xl:col-span-2">
              <label htmlFor="search-users" className="text-[10px] font-black text-slate-500 uppercase">Cari Pengguna</label>
              <div className="relative mt-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="search-users" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nama, username, atau email..." autoComplete="off" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-4 text-sm font-bold focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-50" />
              </div>
            </div>
            <SelectFilter id="filter-role" label="Role" value={roleFilter} onChange={(value) => { setRoleFilter(value); setPage(1); }} options={[{ value: '', label: 'Semua Role' }, ...roleOptions]} />
            <SelectFilter id="filter-status" label="Status Akun" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={statusOptions} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SelectFilter id="filter-faculty" label="Fakultas" value={facultyFilter} onChange={(value) => { setFacultyFilter(value); setPage(1); }} options={[{ value: '', label: 'Semua Fakultas' }, ...faculties.map((f) => ({ value: String(f.id), label: f.nama }))]} className="w-full sm:max-w-xs" />
            <SelectFilter id="users-per-batch" label="Per Batch" value={String(perPage)} onChange={(value) => { setPerPage(Number(value)); setPage(1); }} options={[10,25,50,100].map((size) => ({ value: String(size), label: `${size} pengguna` }))} className="w-full sm:w-40" />
            {hasActiveFilters && <button type="button" onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-xs font-black uppercase text-slate-600 hover:bg-slate-50"><RotateCcw size={14} /> Reset ({activeFilterCount})</button>}
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-600 ring-1 ring-slate-200">
          <SlidersHorizontal size={14} /> {isFetching && !isLoading ? 'Memuat batch baru...' : batchLabel}
        </div>
      </div>
    </div>
  );
}

type SelectProps = { id: string; label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; className?: string };
function SelectFilter({ id, label, value, onChange, options, className = 'w-full' }: SelectProps) {
  return <div className={className}><label htmlFor={id} className="text-[10px] font-black text-slate-500 uppercase">{label}</label><select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl px-3 text-sm font-bold focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-50">{options.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}</select></div>;
}
