'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, apiUrl } from '@/lib/api';
import Link from 'next/link';
import { FileText, Search, Eye, Download } from 'lucide-react';
import { PageHeader, DataTable, StatusBadge, StatCard, EmptyState } from '@/components/ui/shared';

const TYPE_LABELS: Record<string, string> = {
  final_report: 'Laporan Akhir',
  book_anthology: 'Antologi KKN',
  scholarly_article: 'Artikel Ilmiah',
  village_map: 'Peta Aset Desa',
  video_documentation: 'Dokumentasi Video',
  photo_documentation: 'Dokumentasi Foto',
  attendance_sheet: 'Daftar Hadir',
  activity_proposal: 'Proposal Kegiatan',
  evaluation_report: 'Evaluasi Refleksi',
};

export default function AdminReportsPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', { search, status, page }],
    queryFn: async () => {
      const res = await (adminApi as unknown as {
        reports: { index: (p: Record<string, unknown>) => Promise<unknown> };
      }).reports.index({ search: search || undefined, status: status || undefined, page });
      return (res as { data?: unknown }).data ?? res;
    },
  });

  const reports = (data as { data?: Record<string, unknown>[] })?.data ?? [];
  const meta = (data as { meta?: { total?: number; last_page?: number; pending_review?: number } })?.meta ?? {};

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Manajemen Laporan"
        subtitle="Kelola seluruh laporan dan dokumen yang diunggah mahasiswa"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Total Laporan" value={meta.total ?? 0} color="emerald" />
        <StatCard icon={Search} label="Menunggu Review" value={meta.pending_review ?? 0} color="amber" />
        <StatCard icon={FileText} label="Filter Aktif" value={[search, status].filter(Boolean).length} color="indigo" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari judul, nama mahasiswa, kelompok..."
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
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />)}</div>
      ) : reports.length === 0 ? (
        <EmptyState icon={<FileText size={48} />} title="Belum Ada Laporan" />
      ) : (
        <>
          <DataTable columns={['Judul', 'Tipe', 'Mahasiswa', 'Kelompok', 'Status', 'Aksi']}>
            {reports.map((r) => {
              const user = r.user as Record<string, unknown> | undefined;
              const group = r.group as Record<string, unknown> | undefined;
              return (
                <tr key={String(r.id)} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm font-bold text-slate-900 max-w-[200px] truncate">{String(r.title ?? '-')}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {TYPE_LABELS[String(r.type ?? '')] ?? String(r.type ?? '-')}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{String(user?.name ?? '-')}</td>
                  <td className="p-4 text-xs text-slate-500">{String(group?.name ?? '-')}</td>
                  <td className="p-4"><StatusBadge status={String(r.status ?? 'pending')} /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/laporan/akhir/${r.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-black hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <Eye size={12} /> Detail
                      </Link>
                      {!!r.file_path && (
                        <a
                          href={apiUrl(`/admin/laporan/akhir/${r.id}/unduh`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-black hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Download size={12} /> Unduh
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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
