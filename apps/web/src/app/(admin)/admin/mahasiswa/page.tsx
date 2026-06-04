'use client';

import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { useDeferredValue, useState } from 'react';
import Link from 'next/link';
import { Filter, Search, Users, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

interface Mahasiswa {
  id: number;
  nim?: string;
  nama?: string;
  batch_year?: number;
  semester?: number;
  sks_completed?: number;
  gpa?: string | number;
  status_aktif?: string;
  prodi?: { nama?: string; name?: string } | null;
  fakultas?: { nama?: string; name?: string; id?: number } | null;
  user?: { id: number; email?: string; is_active?: boolean } | null;
}

interface Fakultas { id: number; nama?: string; name?: string }

export default function MahasiswaIndexPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [fakultasId, setFakultasId] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const deferredSearch = useDeferredValue(search.trim());

  const { data, isLoading, isError, refetch, isFetching } = useQuery<{
    data: Mahasiswa[];
    meta?: { current_page: number; last_page: number; total: number; from: number; to: number };
  }>({
    queryKey: ['admin', 'mahasiswa', deferredSearch, fakultasId, page, sortField, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (deferredSearch) params.set('search', deferredSearch);
      if (fakultasId) params.set('fakultas_id', fakultasId);
      params.set('page', String(page));
      if (sortField) { params.set('sort_by', sortField); params.set('sort_dir', sortDir); }
      const res = await rawApi.get(`/admin/mahasiswa?${params}`);
      const body = res.data as { data?: Mahasiswa[]; meta?: { current_page: number; last_page: number; total: number; from: number; to: number } };
      return { data: body.data ?? [], meta: body.meta };
    },
    placeholderData: (prev) => prev,
  });

  const { data: fakultasList } = useQuery<Fakultas[]>({
    queryKey: ['admin', 'fakultas-filter'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/fakultas?per_page=100');
      const body = res.data as { data?: Fakultas[] | { data?: Fakultas[] } };
      const arr = Array.isArray(body.data) ? body.data : (body.data as { data?: Fakultas[] })?.data ?? [];
      return arr;
    },
    staleTime: 5 * 60_000,
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-300" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-cyan-600" /> : <ArrowDown size={12} className="text-cyan-600" />;
  };

  const students = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? students.length;
  const lastPage = meta?.last_page ?? 1;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-cyan-950 via-cyan-800 to-emerald-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Basis Data Mahasiswa</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{isLoading ? 'Memuat...' : total.toLocaleString('id-ID')} Mahasiswa</h2>
            <p className="mt-2 text-sm text-cyan-50">Filter cepat berdasarkan nama, NIM, fakultas, status, dan urutan tabel.</p>
          </div>
          
          <Link href="/admin/mahasiswa/sinkronisasi" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-black text-white ring-1 ring-white/25 hover:bg-white/20">
            <RefreshCw size={15} /> Sinkronisasi
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm focus:border-cyan-500 outline-none"
            placeholder="Cari nama atau NIM..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={fakultasId}
            onChange={e => { setFakultasId(e.target.value); setPage(1); }}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:border-cyan-500 outline-none"
          >
            <option value="">Semua Fakultas</option>
            {(fakultasList ?? []).map(f => (
              <option key={f.id} value={f.id}>{f.nama ?? f.name}</option>
            ))}
          </select>
          {(search || fakultasId) && (
            <button onClick={() => { setSearch(''); setFakultasId(''); setPage(1); }} className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Reset
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cyan-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Total</p>
          <p className="text-2xl font-black text-cyan-800">{isLoading ? '...' : total.toLocaleString('id-ID')}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Halaman</p>
          <p className="text-2xl font-black text-emerald-800">{page} / {lastPage}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-violet-600">Per Halaman</p>
          <p className="text-2xl font-black text-violet-800">25</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : isError ? (
        <div className="rounded-2xl bg-rose-50 p-8 text-center border border-rose-200">
          <p className="font-bold text-rose-700">Gagal memuat data mahasiswa</p>
          <button onClick={() => refetch()} className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">Coba Lagi</button>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <Users className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-bold text-slate-600">Tidak ada mahasiswa ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci atau filter fakultas.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Mahasiswa</p>
              <p className="text-xs text-slate-400">Klik nama untuk membuka detail mahasiswa</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-500">{meta?.from ?? 1}-{meta?.to ?? students.length}</span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th onClick={() => toggleSort('nim')} className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer hover:text-cyan-700 select-none"><span className="inline-flex items-center gap-1">NIM <SortIcon field="nim" /></span></th>
                <th onClick={() => toggleSort('nama')} className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer hover:text-cyan-700 select-none"><span className="inline-flex items-center gap-1">Nama <SortIcon field="nama" /></span></th>
                <th onClick={() => toggleSort('prodi')} className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 hidden md:table-cell cursor-pointer hover:text-cyan-700 select-none"><span className="inline-flex items-center gap-1">Prodi <SortIcon field="prodi" /></span></th>
                <th onClick={() => toggleSort('fakultas')} className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 hidden lg:table-cell cursor-pointer hover:text-cyan-700 select-none"><span className="inline-flex items-center gap-1">Fakultas <SortIcon field="fakultas" /></span></th>
                <th onClick={() => toggleSort('batch_year')} className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer hover:text-cyan-700 select-none"><span className="inline-flex items-center gap-1">Angkatan <SortIcon field="batch_year" /></span></th>
                <th onClick={() => toggleSort('semester')} className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 hidden md:table-cell cursor-pointer hover:text-cyan-700 select-none"><span className="inline-flex items-center gap-1">SMT <SortIcon field="semester" /></span></th>
                <th onClick={() => toggleSort('gpa')} className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 hidden lg:table-cell cursor-pointer hover:text-cyan-700 select-none"><span className="inline-flex items-center gap-1">IPK <SortIcon field="gpa" /></span></th>
                <th onClick={() => toggleSort('status_aktif')} className="p-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer hover:text-cyan-700 select-none"><span className="inline-flex items-center gap-1">Status <SortIcon field="status_aktif" /></span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-mono text-xs font-bold text-cyan-700">{m.nim || '-'}</td>
                  <td className="p-3">
                    <Link href={`/admin/mahasiswa/${m.id}`} className="font-bold text-slate-800 hover:text-cyan-700 hover:underline">
                      {m.nama || '-'}
                    </Link>
                  </td>
                  <td className="p-3 text-xs text-slate-600 hidden md:table-cell">{m.prodi?.nama ?? m.prodi?.name ?? '-'}</td>
                  <td className="p-3 text-xs text-slate-600 hidden lg:table-cell">{m.fakultas?.nama ?? m.fakultas?.name ?? '-'}</td>
                  <td className="p-3 text-xs font-bold text-slate-700">{m.batch_year ?? '-'}</td>
                  <td className="p-3 text-xs text-slate-600 hidden md:table-cell">{m.semester ?? '-'}</td>
                  <td className="p-3 text-xs text-slate-600 hidden lg:table-cell">{m.gpa ?? '-'}</td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black ${
                      m.status_aktif === 'aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {m.status_aktif === 'aktif' ? 'AKTIF' : (m.status_aktif?.toUpperCase() ?? 'N/A')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && students.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Menampilkan {meta?.from ?? 1}–{meta?.to ?? students.length} dari {total.toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || isFetching} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">
              Sebelumnya
            </button>
            <span className="text-xs font-bold text-slate-500">{page} / {lastPage}</span>
            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page >= lastPage || isFetching} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
