'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function DplReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.dailyReport(Number(id)),
    queryFn: async () => {
      const res = await endpoints.dailyReports.show(Number(id));
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => endpoints.dailyReports.approve(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); toast.success('Laporan disetujui'); router.push('/dosen/laporan-harian'); },
  });

  const revisionMutation = useMutation({
    mutationFn: () => endpoints.dailyReports.revision(Number(id), { review_notes: reviewNotes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); toast.success('Revisi diminta'); router.push('/dosen/laporan-harian'); },
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Laporan tidak ditemukan</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Detail Laporan</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">{data.date_label as string} | {(data.mahasiswa as Record<string, unknown>)?.name as string || '-'}</p>
        <p className="mt-2 text-xl font-semibold text-slate-800">{data.title as string}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{String(data.activity || '')}</p>
        {String(data.reflection || '') && <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Refleksi: {String(data.reflection)}</p>}
        {String(data.review_notes || '') && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">Catatan sebelumnya: {String(data.review_notes)}</p>}
        {String(data.ai_summary || '') && <p className="mt-4 rounded-lg bg-purple-50 p-3 text-sm text-purple-700">AI Summary: {String(data.ai_summary)}</p>}
      </div>

      {data.status === 'submitted' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Review</h2>
          <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} placeholder="Catatan revisi (opsional untuk approval, wajib untuk revisi)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <div className="mt-4 flex gap-3">
            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700">✅ Setujui</button>
            <button onClick={() => { if (!reviewNotes) { toast.error('Masukkan catatan revisi'); return; } revisionMutation.mutate(); }} disabled={revisionMutation.isPending} className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700">📝 Minta Revisi</button>
          </div>
        </div>
      )}
    </div>
  );
}
