'use client';

import { useQuery } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api, dplApi } from '@/lib/api';

export default function ParticipantFeedbackPage() {
  
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.feedback,
    queryFn: async () => {
      const res = await dplApi.feedback();
      return (res as unknown as { success: boolean; data: unknown[] }).data;
    },
  });

  const feedback = (data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Umpan Balik Peserta</h1>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : feedback.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><p className="text-4xl">⭐</p><p className="mt-4 text-slate-500">Belum ada umpan balik dari peserta</p></div>
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => (
            <div key={f.id as number} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Dari: {(f.mahasiswa as Record<string, unknown>)?.name as string || 'Anonim'}</p>
              {String(f.comment || '') && <p className="mt-2 text-sm text-slate-700">{String(f.comment)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
