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
      return res as unknown as Record<string, unknown>;
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

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />;
  if (!data) return <div className="text-center text-[color:var(--profile-muted)]">Laporan tidak ditemukan</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton href="/dosen/laporan-akhir" label="Kembali ke Laporan Akhir" />
      <h1 className="text-2xl font-bold text-[color:var(--profile-text)]">Detail Laporan Akhir</h1>
      <div className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-6 shadow-sm">
        <p className="text-sm text-[color:var(--profile-muted)]">{(data.mahasiswa as Record<string, unknown>)?.name as string || '-'}</p>
        <p className="mt-2 text-xl font-semibold text-[color:var(--profile-text)]">{data.title as string}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-[color:var(--profile-text)]">{(data.abstract as string) || '-'}</p>
      </div>

      {data.status === 'submitted' && (
        <div className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[color:var(--profile-text)]">Review</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[color:var(--profile-muted)]">Skor (0-100)</label>
            <input type="number" min={0} max={100} value={score ?? ''} onChange={(e) => setScore(Number(e.target.value))} className="w-32 rounded-lg border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-3 py-2 text-sm focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--profile-primary)]" />
          </div>
          <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} placeholder="Catatan revisi" className="w-full rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] px-4 py-3 text-sm focus:border-[color:var(--profile-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--profile-primary)]" />
          <div className="mt-4 flex gap-3">
            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="flex-1 rounded-xl bg-[color:var(--profile-primary)] py-3 text-sm font-semibold text-white hover:opacity-90 transition-all">✅ Setujui</button>
            <button onClick={() => { if (!reviewNotes) { toast.error('Masukkan catatan'); return; } revisionMutation.mutate(); }} disabled={revisionMutation.isPending} className="flex-1 rounded-xl bg-[color:var(--profile-danger)] text-[color:var(--profile-danger-text)] border border-[color:var(--profile-border)] py-3 text-sm font-semibold hover:opacity-90 transition-all">📝 Minta Revisi</button>
          </div>
        </div>
      )}
    </div>
  );
}
