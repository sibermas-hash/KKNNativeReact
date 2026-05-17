'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, PaginationMeta } from '@sibermas/shared-types';
import { rawApi } from '@/lib/api';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/shared';

type FinalReportRow = Record<string, unknown>;
type PaginatedFinalReportsResponse = {
  data: FinalReportRow[];
  meta?: Partial<PaginationMeta>;
};

export default function AdminLaporanAkhirPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedFinalReportsResponse>({
    queryKey: ['admin', 'laporan-akhir', { search, status, page }],
    queryFn: async () => {
      const response = await rawApi.get<ApiResponse<FinalReportRow[]>>('/admin/laporan/akhir', {
        params: { search: search || undefined, status: status || undefined, page },
      });
      return {
        data: response.data.data ?? [],
        meta: response.data.meta,
      };
    },
  });

  const reports = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Akhir" subtitle="Kelola dan review laporan akhir KKN mahasiswa" />

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama mahasiswa atau kelompok..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="revision">Revisi</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left">Mahasiswa</th>
              <th className="px-5 py-3 text-left">Kelompok</th>
              <th className="px-5 py-3 text-left">Judul</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
              ))
            ) : reports.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Belum ada laporan akhir</td></tr>
            ) : reports.map((r) => (
              <tr key={String(r.id)} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{String((r.mahasiswa as Record<string, unknown>)?.nama ?? '-')}</td>
                <td className="px-5 py-3 text-slate-600">{String((r.kelompok as Record<string, unknown>)?.nama_kelompok ?? '-')}</td>
                <td className="px-5 py-3 text-slate-600 max-w-xs truncate">{String(r.title ?? '-')}</td>
                <td className="px-5 py-3 text-center"><StatusBadge status={String(r.status ?? '')} /></td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/laporan/akhir/${r.id}`} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                    <Eye size={13} /> Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(meta.last_page ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(meta.last_page)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`h-8 w-8 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
