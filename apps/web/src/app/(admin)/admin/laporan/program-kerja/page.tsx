'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { FileText, Search, Target, Globe, Eye } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, StatCard, EmptyState } from '@/components/ui/shared';

export default function AdminWorkProgramsMonitoringPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'work-programs', { search, status, page }],
    queryFn: async () => {
      const res = await (adminApi as unknown as {
        workPrograms: { index: (p: Record<string, unknown>) => Promise<unknown> };
      }).workPrograms.index({ search: search || undefined, status: status || undefined, page });
      return (res as { data?: unknown }).data ?? res;
    },
  });

  const programs = (data as { data?: Record<string, unknown>[] })?.data ?? [];
  const meta = (data as { meta?: { total?: number; last_page?: number; approved?: number; pending?: number } })?.meta ?? {};

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Monitoring Program Kerja"
        subtitle="Pantau program kerja seluruh kelompok KKN"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Proker" value={meta.total ?? 0} color="emerald" />
        <StatCard icon={Target} label="Disetujui" value={meta.approved ?? 0} color="blue" />
        <StatCard icon={Globe} label="Menunggu" value={meta.pending ?? 0} color="amber" />
        <StatCard icon={Search} label="Filter Aktif" value={[search, status].filter(Boolean).length} color="indigo" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari judul program, nama kelompok..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Semua Status</option>
            <option value="approved">Disetujui</option>
            <option value="pending">Menunggu</option>
            <option value="revision">Perlu Revisi</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : programs.length === 0 ? (
        <EmptyState icon={<FileText size={48} />} title="Belum Ada Program Kerja" />
      ) : (
        <>
          <DataTable columns={['Judul Program', 'Kelompok', 'Lokasi', 'SDG', 'Status', 'Aksi']}>
            {programs.map((p) => (
              <tr key={String(p.id)} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <p className="text-sm font-bold text-slate-900 max-w-[200px] truncate">{String(p.title ?? '-')}</p>
                  <p className="text-xs text-slate-400">{String(p.proker_id ?? '')}</p>
                </td>
                <td className="p-4 text-sm text-slate-600">{String(p.group_name ?? '-')}</td>
                <td className="p-4 text-xs text-slate-500">{String(p.location ?? '-')}</td>
                <td className="p-4">
                  {p.sdg_target ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
                      <Globe size={10} /> SDG {String(p.sdg_target)}
                    </span>
                  ) : <span className="text-xs text-slate-300">-</span>}
                </td>
                <td className="p-4">
                  <StatusBadge status={String(p.status ?? 'pending')} />
                </td>
                <td className="p-4">
                  <Link
                    href={`/admin/laporan/program-kerja/${p.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-black hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <Eye size={12} /> Detail
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>

          {(meta.last_page ?? 1) > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black disabled:opacity-40 hover:bg-slate-50 transition-colors">← Sebelumnya</button>
              <span className="text-xs font-bold text-slate-500">Halaman {page} / {meta.last_page}</span>
              <button disabled={page >= (meta.last_page ?? 1)} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black disabled:opacity-40 hover:bg-slate-50 transition-colors">Berikutnya →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
