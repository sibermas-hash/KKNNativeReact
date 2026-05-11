'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/shared';
import { MessageSquare } from 'lucide-react';

export default function EvaluasiDplPage(): React.JSX.Element {
  const [periodeId, _setPeriodeId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'evaluasi-dpl', { periode_id: periodeId }],
    queryFn: async () => {
      const res = await api.get('/admin/evaluasi-dpl', { params: { periode_id: periodeId || undefined } });
      return (res as unknown as { data?: unknown })?.data ?? res;
    },
  });

  const evaluations = (data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluasi DPL oleh Peserta"
        subtitle="Lihat umpan balik yang diberikan peserta kepada DPL mereka."
      />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : evaluations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Belum ada evaluasi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map((e) => (
            <div key={String(e.id)} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="font-semibold text-slate-800">
                {String(((e as Record<string, unknown>)?.dosen as Record<string, unknown>)?.nama || '-')}
              </p>
              <p className="text-sm text-slate-500">Skor: {String((e as Record<string, unknown>)?.average_score || '-')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
