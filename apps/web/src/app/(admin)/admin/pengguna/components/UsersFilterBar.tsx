import { RotateCcw, Search, X } from 'lucide-react';
import type { FacultyOption } from '../lib/user-types';
import { roleLabelMap, roleOptions, statusOptions } from '../lib/user-options';

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
  const { search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter, facultyFilter, setFacultyFilter, perPage, setPerPage, setPage, faculties, hasActiveFilters, activeFilterCount, resetFilters, isFetching, isLoading } = props;
  const facultyName = faculties.find((f) => String(f.id) === facultyFilter)?.nama;
  const statusLabel = statusOptions.find((option) => option.value === statusFilter)?.label;
  const clear = (fn: (value: string) => void) => { fn(''); setPage(1); };

  return (
    <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(260px,1fr)_160px_160px_190px_110px_auto] lg:items-center">
        <div className="relative">
          <label htmlFor="search-users" className="sr-only">Cari Pengguna</label>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="search-users" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nama, username, NIM/NIP, email..." autoComplete="off" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold focus:border-cyan-400 focus:outline-none focus:ring-3 focus:ring-cyan-50" />
        </div>
        <SelectFilter id="filter-role" ariaLabel="Role" value={roleFilter} onChange={(value) => { setRoleFilter(value); setPage(1); }} options={[{ value: '', label: 'Semua Role' }, ...roleOptions]} />
        <SelectFilter id="filter-status" ariaLabel="Status Akun" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={statusOptions} />
        <SelectFilter id="filter-faculty" ariaLabel="Fakultas" value={facultyFilter} onChange={(value) => { setFacultyFilter(value); setPage(1); }} options={[{ value: '', label: 'Semua Fakultas' }, ...faculties.map((f) => ({ value: String(f.id), label: f.nama }))]} />
        <SelectFilter id="users-per-batch" ariaLabel="Per Batch" value={String(perPage)} onChange={(value) => { setPerPage(Number(value)); setPage(1); }} options={[10,25,50,100].map((size) => ({ value: String(size), label: `${size}/batch` }))} />
        <button type="button" onClick={resetFilters} disabled={!hasActiveFilters} className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-black uppercase text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
          <span className="inline-flex items-center justify-center gap-1"><RotateCcw size={14} /> Reset</span>
        </button>
      </div>

      {(hasActiveFilters || (isFetching && !isLoading)) && (
        <div className="mt-2 flex min-h-7 flex-wrap gap-2 border-t border-slate-100 pt-2">
          {isFetching && !isLoading && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">Memuat...</span>}
          {search && <FilterChip label={`Cari: ${search}`} onClear={() => clear(setSearch)} />}
          {roleFilter && <FilterChip label={`Role: ${roleLabelMap[roleFilter] ?? roleFilter}`} onClear={() => clear(setRoleFilter)} />}
          {statusFilter && <FilterChip label={`Status: ${statusLabel ?? statusFilter}`} onClear={() => clear(setStatusFilter)} />}
          {facultyFilter && <FilterChip label={`Fakultas: ${facultyName ?? facultyFilter}`} onClear={() => clear(setFacultyFilter)} />}
          {hasActiveFilters && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">{activeFilterCount} aktif</span>}
        </div>
      )}
    </section>
  );
}

type SelectProps = { id: string; ariaLabel: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> };
function SelectFilter({ id, ariaLabel, value, onChange, options }: SelectProps) {
  return <div><label htmlFor={id} className="sr-only">{ariaLabel}</label><select id={id} aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold focus:border-cyan-400 focus:outline-none focus:ring-3 focus:ring-cyan-50">{options.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}</select></div>;
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-black text-cyan-800 ring-1 ring-cyan-100 hover:bg-cyan-100">{label}<X size={12} /></button>;
}
