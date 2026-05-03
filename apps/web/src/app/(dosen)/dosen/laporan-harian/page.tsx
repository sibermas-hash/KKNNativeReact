'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function DplDailyReportsPage() {
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.dailyReports(page),
    queryFn: async () => {
      const res = await endpoints.dailyReports.index({ page, status: status || undefined });
      return res.data as { success: boolean; data: unknown[]; meta?: { current_page: number; last_page: number; total: number } };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => endpoints.dailyReports.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); toast.success('Laporan disetujui'); },
    onError: () => toast.error('Gagal menyetujui'),
  });

  const batchApproveMutation = useMutation({
    mutationFn: (ids: number[]) => endpoints.dailyReports.batchApprove(ids),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); setSelectedIds([]); toast.success('Laporan disetujui'); },
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const reports = (data?.data as Record<string, unknown>[]) || [];
  const meta = data?.meta;

  const toggleSelect = (id: number) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Review Laporan Harian</h1>
        {selectedIds.length > 0 && (
          <button onClick={() => batchApproveMutation.mutate(selectedIds)} disabled={batchApproveMutation.isPending} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            ✅ Setujui {selectedIds.length} Terpilih
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {['', 'submitted', 'approved', 'revision'].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${status === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            {s === '' ? 'Semua' : s === 'submitted' ? 'Pending' : s === 'approved' ? 'Disetujui' : 'Revisi'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><p className="text-slate-500">Tidak ada laporan</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id as number} className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm">
              <input type="checkbox" checked={selectedIds.includes(r.id as number)} onChange={() => toggleSelect(r.id as number)} className="mt-1 h-4 w-4 rounded border-slate-300" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{(r.mahasiswa as Record<string, unknown>)?.name as string || '-'} — {(r.kelompok as Record<string, unknown>)?.name as string || '-'}</p>
                    <p className="font-semibold text-slate-800">{r.title as string}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.activity as string}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'revision' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.status === 'submitted' ? 'Pending' : r.status === 'approved' ? 'Disetujui' : 'Revisi'}
                  </span>
                </div>
                {r.status === 'submitted' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => approveMutation.mutate(r.id as number)} disabled={approveMutation.isPending} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">✅ Setujui</button>
                    <a href={`/dosen/laporan-harian/${r.id}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">Detail →</a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
