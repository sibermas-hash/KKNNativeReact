'use client';

import { useQuery } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api, adminApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { PHASE_LABELS } from '@sibermas/constants';

export default function PeriodDetailPage() {
  const { id } = useParams();
  

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'period', Number(id)],
      queryFn: async () => {
        const res = await adminApi.periods.show(Number(id));
        return res.data;
      },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Periode tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{String(data.name || 'Detail Periode')}</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div><p className="text-xs text-slate-500">Periode</p><p className="font-semibold">{String(data.periode || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Fase</p><p className="font-semibold">{PHASE_LABELS[data.current_phase as string] || String(data.current_phase || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Kuota</p><p className="font-semibold">{String(data.kuota || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Mulai</p><p className="font-semibold">{String(data.start_date || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Selesai</p><p className="font-semibold">{String(data.end_date || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Jenis KKN</p><p className="font-semibold">{String(((data.jenis_kkn as Record<string, unknown>)?.name as string) || '-')}</p></div>
        </div>
      </div>
    </div>
  );
}
