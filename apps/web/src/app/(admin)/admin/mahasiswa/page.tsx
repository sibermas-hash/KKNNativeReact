'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Search, RefreshCw } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

interface Faculty { id: number; nama?: string; name?: string }
interface MahasiswaProfile {
  id?: number;
  nim?: string;
  nama?: string;
  batch_year?: number | string;
  semester?: number | string;
  sks_completed?: number | string;
  gpa?: number | string;
  status_aktif?: string;
  prodi?: { nama?: string; name?: string } | null;
  faculty?: { nama?: string; name?: string } | null;
}
interface StudentUser {
  id: number;
  username?: string;
  name?: string;
  email?: string;
  is_active?: boolean;
  mahasiswa?: MahasiswaProfile | null;
  faculty?: Faculty | null;
}
interface PaginatedResponse<T> {
  data?: T[];
  meta?: { current_page?: number; last_page?: number; total?: number; per_page?: number; from?: number; to?: number };
  links?: unknown;
}

function unwrapList<T>(res: unknown): PaginatedResponse<T> {
  const root = res as { data?: unknown; meta?: unknown };
  if (Array.isArray(root?.data)) return { data: root.data as T[], meta: root.meta as PaginatedResponse<T>['meta'] };
  const nested = root?.data as { data?: unknown; meta?: unknown } | undefined;
  if (Array.isArray(nested?.data)) return { data: nested.data as T[], meta: nested.meta as PaginatedResponse<T>['meta'] };
  if (Array.isArray(res)) return { data: res as T[] };
  return { data: [] };
}

export default function MahasiswaIndexPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [fakultasId, setFakultasId] = useState('');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());

  const studentsQuery = useQuery({
    queryKey: ['admin', 'mahasiswa', { search: deferredSearch, fakultas_id: fakultasId, page }],
    queryFn: async () => {
      const res = await adminApi.users.index({ search: deferredSearch, fakultas_id: fakultasId, page, per_page: 25, role: 'student' });
      return unwrapList<StudentUser>(res);
    },
    placeholderData: (previous) => previous,
  });

  const facultiesQuery = useQuery({
    queryKey: ['admin', 'faculties', 'mahasiswa-filter'],
    queryFn: async () => unwrapList<Faculty>(await adminApi.master.faculties.index({ per_page: 100 })).data ?? [],
    staleTime: 5 * 60 * 1000,
  });

  const students = studentsQuery.data?.data ?? [];
  const meta = studentsQuery.data?.meta;
  const total = meta?.total ?? students.length;
  const lastPage = meta?.last_page ?? 1;

  const subtitle = useMemo(() => {
    if (studentsQuery.isLoading) return 'Memuat data mahasiswa...';
    return `${total.toLocaleString('id-ID')} mahasiswa ditemukan`;
  }, [studentsQuery.isLoading, total]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Data Mahasiswa" subtitle={subtitle} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari NIM, nama, atau email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={fakultasId}
              onChange={(e) => { setFakultasId(e.target.value); setPage(1); }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
            >
              <option value="">Semua Fakultas</option>
              {(facultiesQuery.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.nama ?? f.name ?? `Fakultas #${f.id}`}</option>)}
            </select>
            <button
              type="button"
              onClick={() => studentsQuery.refetch()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${studentsQuery.isFetching ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {studentsQuery.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        </div>
      ) : studentsQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
          <p className="font-black">Gagal memuat data mahasiswa.</p>
          <button onClick={() => studentsQuery.refetch()} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-rose-700">Coba Lagi</button>
        </div>
      ) : students.length === 0 ? (
        <EmptyState icon={<GraduationCap size={40} />} title="Belum ada mahasiswa" description="Tidak ada data mahasiswa yang cocok dengan filter." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">NIM</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Prodi</th>
                  <th className="px-4 py-3">Fakultas</th>
                  <th className="px-4 py-3">Angkatan</th>
                  <th className="px-4 py-3">Akademik</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => {
                  const m = s.mahasiswa;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{m?.nim || s.username || '-'}</td>
                      <td className="px-4 py-3"><p className="font-black text-slate-900">{m?.nama || s.name || '-'}</p><p className="text-xs text-slate-500">{s.email || '-'}</p></td>
                      <td className="px-4 py-3 text-slate-700">{m?.prodi?.nama || m?.prodi?.name || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{m?.faculty?.nama || m?.faculty?.name || s.faculty?.nama || s.faculty?.name || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{m?.batch_year ?? '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">SMT {m?.semester ?? '-'} · SKS {m?.sks_completed ?? '-'} · IPK {m?.gpa ?? '-'}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${s.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>{s.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                      <td className="px-4 py-3 text-right"><Link href={`/admin/mahasiswa/${m?.id ?? s.id}`} className="inline-flex rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-black uppercase text-white hover:bg-cyan-700">Detail</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-slate-500">Menampilkan {meta?.from ?? 1}-{meta?.to ?? students.length} dari {total.toLocaleString('id-ID')}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || studentsQuery.isFetching} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50">Sebelumnya</button>
              <span className="text-xs font-black text-slate-500">{page} / {lastPage}</span>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || studentsQuery.isFetching} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50">Berikutnya</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
