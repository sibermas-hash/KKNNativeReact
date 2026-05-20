'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, PaginationMeta } from '@sibermas/shared-types';
import { rawApi } from '@/lib/api';
import Link from 'next/link';
import { Activity, Search, FileText, Eye, RefreshCw, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, StatCard, EmptyState } from '@/components/ui/shared';

type DailyReportRow = Record<string, unknown>;
type PaginatedDailyReportsResponse = {
  data: DailyReportRow[];
  meta?: Partial<PaginationMeta>;
};


function pageWindow(current: number, last: number): Array<number | 'dots'> {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, last - 1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const out: Array<number | 'dots'> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('dots');
    out.push(sorted[i]);
  }
  return out;
}

export default function AdminDailyReportsPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery<PaginatedDailyReportsResponse>({
    queryKey: ['admin', 'daily-reports', { search, status, page }],
    queryFn: async () => {
      const response = await rawApi.get<ApiResponse<DailyReportRow[]>>('/admin/laporan/harian', {
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Laporan Harian"
        subtitle="Pantau laporan aktivitas mahasiswa di lokasi KKN"
        actions={
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Laporan" value={meta.total ?? 0} color="emerald" />
        <StatCard icon={Activity} label="Monitoring" value="LANGSUNG" color="blue" />
        <StatCard icon={RefreshCw} label="Pengecekan AI" value="AKTIF" color="amber" />
        <StatCard icon={Filter} label="Filter Aktif" value={[search, status].filter(Boolean).length} color="indigo" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama mahasiswa, judul laporan..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Semua Status</option>
            <option value="submitted">Menunggu Review</option>
            <option value="approved">Disetujui</option>
            <option value="revision">Perlu Revisi</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={<FileText size={48} />} title="Belum Ada Laporan" description="Laporan harian mahasiswa akan muncul di sini" />
      ) : (
        <>
          <DataTable columns={['Tanggal', 'Mahasiswa', <span key="kel" className="hidden md:inline">Kelompok</span>, 'Judul', 'Status', 'Aksi']}>
            {reports.map((r) => (
              <tr key={String(r.id)} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                  {String(r.formatted_date ?? r.date ?? '-')}
                </td>
                <td className="p-4">
                  <p className="text-sm font-bold text-slate-900">{String((r.student as Record<string, unknown>)?.name ?? '-')}</p>
                  <p className="text-xs text-slate-400">{String((r.student as Record<string, unknown>)?.nim ?? '')}</p>
                </td>
                <td className="p-4 text-xs text-slate-600 hidden md:table-cell">{String((r.group as Record<string, unknown>)?.name ?? '-')}</td>
                <td className="p-4 text-sm text-slate-700 max-w-[200px] truncate">{String(r.title ?? '-')}</td>
                <td className="p-4">
                  <StatusBadge status={String(r.status ?? 'pending')} />
                </td>
                <td className="p-4">
                  <Link
                    href={`/admin/laporan/harian/${r.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-black hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <Eye size={12} /> Detail
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>

          {/* Pagination */}
          {(meta.last_page ?? 1) > 1 && (() => { const lp = meta.last_page ?? 1; const cp = meta.current_page ?? page; const pgs = pageWindow(cp, lp); return (
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-xs font-semibold text-slate-500">Halaman <b className="text-slate-800">{cp}</b> dari <b className="text-slate-800">{lp}</b>{meta.total != null && <> &middot; <b className="text-slate-800">{meta.total.toLocaleString('id-ID')}</b> laporan</>}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={() => setPage(1)} disabled={cp <= 1} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronsLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cp <= 1} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                {pgs.map((item, idx) => item === 'dots' ? <span key={`dots-${idx}`} className="px-1 text-xs font-black text-slate-400">&hellip;</span> : <button key={item} onClick={() => setPage(item as number)} className={`h-9 min-w-9 rounded-xl px-3 text-xs font-black transition ${cp === item ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{item}</button>)}
                <button onClick={() => setPage((p) => Math.min(lp, p + 1))} disabled={cp >= lp} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                <button onClick={() => setPage(lp)} disabled={cp >= lp} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronsRight className="h-4 w-4" /></button>
              </div>
            </div>
          ); })()}
        </>
      )}
    </div>
  );
}
