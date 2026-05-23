'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { Users, Search, GraduationCap } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

type Dosen = {
  id: number;
  nip?: string;
  nama?: string;
  jabatan?: string;
  faculty?: { nama?: string };
  has_workshop?: boolean;
};

type Meta = { current_page: number; last_page: number; total: number; per_page: number };
type Faculty = { id: number; nama: string };

export default function DosenIndexPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [fakultasId, setFakultasId] = useState('');

  const { data, isLoading } = useQuery<{ data: Dosen[]; meta?: Meta }>({
    queryKey: ['admin', 'dosen', { search, page, fakultasId }],
    queryFn: async () => {
      const res = await rawApi.get('/admin/dosen', { params: { search: search || undefined, fakultas_id: fakultasId || undefined, page, per_page: 25 } });
      const body = res.data as { data?: Dosen[] | { data?: Dosen[]; meta?: Meta }; meta?: Meta };
      if (Array.isArray(body.data)) {
        return { data: body.data, meta: body.meta };
      }
      const inner = body.data as { data?: Dosen[]; meta?: Meta };
      return { data: inner?.data ?? [], meta: inner?.meta ?? body.meta };
    },
  });

  const { data: faculties = [] } = useQuery<Faculty[]>({
    queryKey: ['admin', 'fakultas', 'dosen-filter'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/fakultas', { params: { per_page: 100 } });
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      return (Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []) as Faculty[];
    },
    staleTime: 300000,
  });

  const dosen = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader title="Direktori Dosen" subtitle={`${meta?.total ?? dosen.length} dosen terdaftar dalam sistem.`} />

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari NIP/Nama..."
            className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
          />
        </div>
        <select value={fakultasId} onChange={(e) => { setFakultasId(e.target.value); setPage(1); }} className="h-10 min-w-[220px] rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option value="">Semua Fakultas</option>
          {faculties.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : dosen.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="Tidak ada dosen" description="Tidak ada dosen yang sesuai pencarian." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">NIP</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Nama</th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold text-slate-500 md:table-cell">Fakultas</th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold text-slate-500 lg:table-cell">Jabatan</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Workshop</th>
              </tr>
            </thead>
            <tbody>
              {dosen.map((d, i) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400">{((meta?.current_page ?? 1) - 1) * (meta?.per_page ?? 25) + i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{d.nip || '-'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{d.nama || '-'}</td>
                  <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">{d.faculty?.nama || '-'}</td>
                  <td className="hidden px-4 py-3 text-xs text-slate-500 lg:table-cell">{d.jabatan || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {d.has_workshop ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <GraduationCap size={10} />Lulus
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Belum</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Prev</button>
          <span className="text-xs text-slate-500">{meta.current_page} / {meta.last_page} • {meta.total} dosen</span>
          <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
