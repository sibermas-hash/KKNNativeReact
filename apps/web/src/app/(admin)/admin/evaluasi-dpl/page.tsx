'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { MessageSquare, Star, User, ChevronRight } from 'lucide-react';

type DplSummary = {
  id: number;
  nama: string;
  nip?: string;
  total_evaluations: number;
  average_score: number;
};

type EvalDetail = {
  id: number;
  peserta?: { nama?: string; nim?: string };
  items: { label: string; score: number }[];
  komentar?: string;
  created_at?: string;
};

export default function EvaluasiDplPage(): React.JSX.Element {
  const [selectedDosen, setSelectedDosen] = useState<DplSummary | null>(null);

  const { data, isLoading } = useQuery<DplSummary[]>({
    queryKey: ['admin', 'evaluasi-dpl'],
    queryFn: async () => {
      const res = await rawApi.get('/admin/evaluasi-dpl');
      const payload = (res.data as { data?: unknown }).data ?? res.data;
      const obj = payload as { summaries?: unknown[] }; return (obj.summaries ?? (Array.isArray(payload) ? payload : [])) as DplSummary[];
    },
  });

  const { data: detailData, isLoading: loadingDetail } = useQuery<{ evaluations: EvalDetail[] }>({
    queryKey: ['admin', 'evaluasi-dpl', selectedDosen?.id],
    queryFn: async () => {
      const res = await rawApi.get(`/admin/evaluasi-dpl/${selectedDosen!.id}`);
      return ((res.data as { data?: unknown }).data ?? res.data) as { evaluations: EvalDetail[] };
    },
    enabled: !!selectedDosen,
  });

  const dosens = data ?? [];
  const evaluations = detailData?.evaluations ?? [];

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={12} className={i < Math.round(score) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
    ));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Evaluasi DPL oleh Peserta" subtitle="Umpan balik peserta terhadap Dosen Pembimbing Lapangan." />

      {!selectedDosen ? (
        <>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : dosens.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
              <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">Belum ada evaluasi DPL.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dosens.map(d => (
                <button key={d.id} onClick={() => setSelectedDosen(d)} className="flex w-full items-center justify-between rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 hover:ring-cyan-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <User size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{d.nama}</p>
                      <p className="text-xs text-slate-500">{d.nip ?? '-'} • {d.total_evaluations} evaluasi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(d.average_score)}</div>
                    <span className="text-sm font-bold text-slate-700">{d.average_score?.toFixed(1) ?? '-'}</span>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button onClick={() => setSelectedDosen(null)} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">← Kembali</button>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="font-black text-slate-900">{selectedDosen.nama}</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex">{renderStars(selectedDosen.average_score)}</div>
              <span className="text-sm text-slate-600">{selectedDosen.average_score?.toFixed(1)} rata-rata dari {selectedDosen.total_evaluations} evaluasi</span>
            </div>
          </div>

          {loadingDetail ? (
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ) : evaluations.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada detail evaluasi.</p>
          ) : (
            <div className="space-y-3">
              {evaluations.map(e => (
                <div key={e.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">{e.peserta?.nama ?? '-'} <span className="font-normal text-slate-400">({e.peserta?.nim})</span></p>
                    {e.created_at && <span className="text-[10px] text-slate-400">{new Date(e.created_at).toLocaleDateString('id-ID')}</span>}
                  </div>
                  {e.items?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {e.items.map((item, i) => (
                        <span key={i} className="rounded-lg bg-slate-50 px-2 py-1 text-[10px]">
                          <span className="text-slate-500">{item.label}:</span> <span className="font-bold text-slate-700">{item.score}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {e.komentar && <p className="mt-2 text-xs text-slate-600 italic">&ldquo;{e.komentar}&rdquo;</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
