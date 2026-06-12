'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/components/ui/theme-provider';

export default function DplReportDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { config: themeConfig, surfaceClass } = useTheme();
  
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dpl', 'daily-report', Number(id)],
    queryFn: async () => { const res = await dplApi.dailyReports.show(Number(id)); return res as unknown as Record<string, unknown>; },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => dplApi.dailyReports.approve(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); toast.success('Laporan disetujui'); router.push('/dosen/laporan-harian'); },
  });

  const revisionMutation = useMutation({
    mutationFn: () => dplApi.dailyReports.revision(Number(id), { review_notes: reviewNotes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); toast.success('Revisi diminta'); router.push('/dosen/laporan-harian'); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--profile-primary)] border-t-transparent" /></div>;
  if (!data) return <div className="text-center py-20 text-[color:var(--profile-muted)] font-semibold">Laporan tidak ditemukan</div>;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-[color:var(--profile-muted)] hover:text-[color:var(--profile-primary)] mb-6"><ChevronLeft size={16} /> Kembali</button>
      <div className={`rounded-[2rem] border border-[color:var(--profile-border)] p-8 shadow-sm space-y-6 ${surfaceClass} ${themeConfig.shadow}`}>
        <div><p className="text-xs text-[color:var(--profile-muted)] font-semibold">{String(data.date_label || '')} | {String((data.mahasiswa as Record<string, unknown>)?.name || '-')}</p><h1 className="text-2xl font-black text-[color:var(--profile-text)] mt-2">{String(data.title || '')}</h1></div>
        <div><p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase mb-2">Kegiatan</p><p className="text-sm text-[color:var(--profile-text)] opacity-90 whitespace-pre-wrap leading-relaxed">{String(data.activity || '')}</p></div>
        {data.reflection ? <div className="bg-[color:var(--profile-soft)]/40 border border-[color:var(--profile-border)] rounded-xl p-4"><p className="text-[10px] font-black text-[color:var(--profile-soft-text)] uppercase mb-1">Refleksi</p><p className="text-sm text-[color:var(--profile-text)] font-semibold">{String(data.reflection)}</p></div> : null}
        {data.review_notes ? <div className="bg-[color:var(--profile-danger)] border border-[color:var(--profile-border)] rounded-xl p-4"><p className="text-[10px] font-black text-[color:var(--profile-danger-text)] uppercase mb-1">Catatan Sebelumnya</p><p className="text-sm text-[color:var(--profile-danger-text)] font-semibold">{String(data.review_notes)}</p></div> : null}
        {data.ai_summary ? <div className="bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] rounded-xl p-4"><p className="text-[10px] font-black text-[color:var(--profile-soft-text)] uppercase mb-1">AI Summary</p><p className="text-sm text-[color:var(--profile-text)] font-semibold">{String(data.ai_summary)}</p></div> : null}
 
         {data.status === 'submitted' && (
           <div className="border-t border-[color:var(--profile-border)]/50 pt-6 space-y-4">
             <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} placeholder="Catatan revisi (opsional untuk approval, wajib untuk revisi)" className="w-full bg-[color:var(--profile-input)] border border-[color:var(--profile-border)] rounded-xl px-4 py-3 text-sm text-[color:var(--profile-text)] outline-none focus:border-[color:var(--profile-accent)] focus:ring-4 focus:ring-[color:var(--profile-ring)] placeholder:text-[color:var(--profile-muted)]" />
             <div className="flex gap-3">
               <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="flex-1 h-12 bg-[color:var(--profile-primary)] hover:bg-[color:var(--profile-primary-hover)] text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"><CheckCircle2 size={16} /> Setujui</button>
               <button onClick={() => { if (!reviewNotes) { toast.error('Masukkan catatan revisi'); return; } revisionMutation.mutate(); }} disabled={revisionMutation.isPending} className="flex-1 h-12 bg-[color:var(--profile-accent)] hover:opacity-90 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"><XCircle size={16} /> Minta Revisi</button>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
