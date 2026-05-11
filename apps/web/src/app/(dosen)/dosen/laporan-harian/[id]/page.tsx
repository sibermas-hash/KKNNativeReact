'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DplReportDetailPage(): React.JSX.Element {
  const { id } = useParams();
  const router = useRouter();
  
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dpl', 'daily-report', Number(id)],
    queryFn: async () => { const res = await dplApi.dailyReports.show(Number(id)); return (res as any).data ?? res; },
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

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;
  if (!data) return <div className="text-center py-20 text-slate-500">Laporan tidak ditemukan</div>;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 mb-6"><ChevronLeft size={16} /> Kembali</button>
      <div className="bg-white rounded-[2rem] p-8 ring-1 ring-slate-200 shadow-sm space-y-6">
        <div><p className="text-xs text-slate-400">{String(data.date_label || '')} | {String((data.mahasiswa as Record<string, unknown>)?.name || '-')}</p><h1 className="text-2xl font-black text-slate-900 mt-2">{String(data.title || '')}</h1></div>
        <div><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Kegiatan</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{String(data.activity || '')}</p></div>
        {data.reflection ? <div className="bg-blue-50 rounded-xl p-4"><p className="text-[10px] font-black text-blue-600 uppercase mb-1">Refleksi</p><p className="text-sm text-blue-800">{String(data.reflection)}</p></div> : null}
        {data.review_notes ? <div className="bg-rose-50 rounded-xl p-4"><p className="text-[10px] font-black text-rose-600 uppercase mb-1">Catatan Sebelumnya</p><p className="text-sm text-rose-800">{String(data.review_notes)}</p></div> : null}
        {data.ai_summary ? <div className="bg-purple-50 rounded-xl p-4"><p className="text-[10px] font-black text-purple-600 uppercase mb-1">AI Summary</p><p className="text-sm text-purple-800">{String(data.ai_summary)}</p></div> : null}

        {data.status === 'submitted' && (
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} placeholder="Catatan revisi (opsional untuk approval, wajib untuk revisi)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
            <div className="flex gap-3">
              <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Setujui</button>
              <button onClick={() => { if (!reviewNotes) { toast.error('Masukkan catatan revisi'); return; } revisionMutation.mutate(); }} disabled={revisionMutation.isPending} className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"><XCircle size={16} /> Minta Revisi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
