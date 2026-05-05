'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api, studentApi } from '@/lib/api';
import { Plus, Search, Filter, ClipboardList, Activity, List as ListIcon } from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge, PageHeader, EmptyState } from '@/components/ui/shared';

export default function DailyReportsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.dailyReports(page, statusFilter, searchQuery),
    queryFn: async () => {
      const res = await studentApi.dailyReports.index(page, {
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      return res as { success: boolean; data: unknown[]; meta?: { current_page: number; last_page: number; total: number } };
    },
  });

  const reports = (data?.data as Record<string, unknown>[]) || [];
  const meta = data?.meta;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* HEADER */}
      <div className="bg-white rounded-[2rem] p-8 border border-emerald-50 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-950 tracking-tight uppercase">Logbook Harian</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Manajemen Aktivitas & Pelaporan</p>
            </div>
          </div>
          <Link href="/mahasiswa/laporan-harian/buat" className="px-6 py-3 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-emerald-900/20 flex items-center gap-2">
            <Plus size={16} strokeWidth={3} /> Tambah Laporan
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 pt-6 mt-6 border-t border-emerald-50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari aktivitas atau judul laporan..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-6 py-3 bg-slate-50 border-transparent rounded-2xl text-sm font-black uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Semua Status</option>
            <option value="submitted">Menunggu</option>
            <option value="approved">Diterima</option>
            <option value="revision">Revisi</option>
          </select>
        </div>
      </div>

      {/* REPORTS LIST */}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="Belum Ada Laporan"
          description="Buat laporan harian pertama Anda"
          action={<Link href="/mahasiswa/laporan-harian/buat" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm">Buat Laporan</Link>}
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Link
              key={String(report.id)}
              href={`/mahasiswa/laporan-harian/${report.id}/edit`}
              className="block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-400">{String(report.date_label || report.date || '')}</span>
                    <StatusBadge status={String(report.status || 'draft')} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{String(report.title || '')}</h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{String(report.activity || '')}</p>
                  {String(report.review_notes || '') && (
                    <p className="mt-2 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">Catatan: {String(report.review_notes)}</p>
                  )}
                </div>
                <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
                  <Activity size={20} />
                </div>
              </div>
            </Link>
          ))}

          {/* PAGINATION */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 bg-white rounded-xl text-sm font-bold ring-1 ring-slate-200 disabled:opacity-40">Sebelumnya</button>
              <span className="text-sm font-bold text-slate-500">Halaman {meta.current_page} dari {meta.last_page}</span>
              <button onClick={() => setPage((p) => Math.min(meta!.last_page, p + 1))} disabled={page >= meta.last_page} className="px-4 py-2 bg-white rounded-xl text-sm font-bold ring-1 ring-slate-200 disabled:opacity-40">Selanjutnya</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
