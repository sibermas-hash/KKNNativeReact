'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function EvaluasiDplPage() {
  const [periodeId, setPeriodeId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'evaluasi-dpl', { periode_id: periodeId }],
    queryFn: async () => {
      const res = await api.get('/admin/evaluasi-dpl', { params: { periode_id: periodeId || undefined } });
      return res.data as { success: boolean; data: unknown[] };
    },
  });

  const evaluations = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Evaluasi DPL oleh Peserta</h1>
      <p className="text-sm text-slate-500">Lihat umpan balik yang diberikan peserta kepada DPL mereka.</p>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {evaluations.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><p className="text-slate-500">Belum ada evaluasi</p></div>
          ) : evaluations.map((e) => (
            <div key={String(e.id)} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-800">{String(((e as Record<string, unknown>)?.dosen as Record<string, unknown>)?.nama || '-')}</p>
              <p className="text-sm text-slate-500">Skor: {String((e as Record<string, unknown>)?.average_score || '-')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
