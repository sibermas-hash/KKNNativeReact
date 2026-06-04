'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { BackButton } from '@/components/ui/shared';

export default function DplFinalReportDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');
  const [score, setScore] = useState<number | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.dpl.finalReports, Number(id)],
    queryFn: async () => {
      const res = await dplApi.finalReports.show(Number(id));
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => dplApi.finalReports.approve(Number(id), { score }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'final-reports'] }); toast.success('Laporan akhir disetujui'); router.push('/dosen/laporan-akhir'); },
  });

  const revisionMutation = useMutation({
    mutationFn: () => dplApi.finalReports.revision(Number(id), { review_notes: reviewNotes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'final-reports'] }); toast.success('Revisi diminta'); router.push('/dosen/laporan-akhir'); },
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Laporan tidak ditemukan</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton href="/dosen/laporan-akhir" label="Kembali ke Laporan Akhir" />
      <h1 className="text-2xl font-bold text-slate-800">Detail Laporan Akhir</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">{(data.mahasiswa as Record<string, unknown>)?.name as string || '-'}</p>
        <p className="mt-2 text-xl font-semibold text-slate-800">{data.title as string}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{(data.abstract as string) || '-'}</p>
      </div>

      {data.status === 'submitted' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Review</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-600">Skor (0-100)</label>
            <input type="number" min={0} max={100} value={score ?? ''} onChange={(e) => setScore(Number(e.target.value))} className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} placeholder="Catatan revisi" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <div className="mt-4 flex gap-3">
            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700">✅ Setujui</button>
            <button onClick={() => { if (!reviewNotes) { toast.error('Masukkan catatan'); return; } revisionMutation.mutate(); }} disabled={revisionMutation.isPending} className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700">📝 Minta Revisi</button>
          </div>
        </div>
      )}
    </div>
  );
}
