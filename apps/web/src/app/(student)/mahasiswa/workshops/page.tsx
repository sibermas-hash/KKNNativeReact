'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function WorkshopsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'workshops'],
    queryFn: async () => {
      const res = await api.get('/student/workshops');
      return (res.data as { success: boolean; data: { workshops: unknown[] } }).data;
    },
  });

  const workshops = data?.workshops || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Workshop & Pembekalan</h1>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : workshops.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">📚</p>
          <p className="mt-4 text-lg font-semibold text-slate-700">Belum Ada Workshop</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workshops.map((w) => (
            <div key={String((w as Record<string, unknown>).id)} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-800">{String((w as Record<string, unknown>).title || '-')}</p>
              <p className="text-sm text-slate-500">{String((w as Record<string, unknown>).workshop_date || '-')} | {String((w as Record<string, unknown>).location || '-')}</p>
              <p className="text-sm text-slate-500">Pembicara: {String((w as Record<string, unknown>).speaker || '-')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
