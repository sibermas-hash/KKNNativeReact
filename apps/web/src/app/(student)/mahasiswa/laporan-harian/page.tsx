'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  revision: 'bg-rose-100 text-rose-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Menunggu Review',
  approved: 'Disetujui',
  revision: 'Perlu Revisi',
};

export default function DailyReportsPage() {
  const [page, setPage] = useState(1);
  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.dailyReports(page),
    queryFn: async () => {
      const res = await endpoints.dailyReports.index(page);
      return res.data as { success: boolean; data: unknown[]; meta?: { current_page: number; last_page: number; total: number } };
    },
  });

  const reports = (data?.data as Record<string, unknown>[]) || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Laporan Harian</h1>
        <Link
          href="/mahasiswa/laporan-harian/buat"
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          + Buat Laporan
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">📋</p>
          <p className="mt-4 text-lg font-semibold text-slate-700">Belum Ada Laporan</p>
          <p className="mt-2 text-sm text-slate-500">Buat laporan harian pertama Anda</p>
          <Link href="/mahasiswa/laporan-harian/buat" className="mt-4 inline-block rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
            Buat Laporan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report.id as number}
              href={`/mahasiswa/laporan-harian/${report.id}/edit`}
              className="block rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{report.date_label as string}</p>
                  <p className="mt-1 font-semibold text-slate-800">{report.title as string}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{report.activity as string}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[report.status as string] || 'bg-slate-100 text-slate-600'}`}>
                  {STATUS_LABELS[report.status as string] || report.status as string}
                </span>
              </div>
              {String(report.review_notes || '') && (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  Catatan: {String(report.review_notes)}
                </p>
              )}
            </Link>
          ))}

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-slate-600">
                Halaman {meta.current_page} dari {meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta!.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="rounded-lg bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
