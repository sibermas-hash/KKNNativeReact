'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api, dplApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function MonitoringPage() {
  
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.monitoring,
    queryFn: async () => {
      const res = await dplApi.monitoring.index();
      return (res as unknown as { success: boolean; data: unknown[] }).data;
    },
  });

  const monitoring = (data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Monitoring DPL</h1>
        <Link href="/dosen/monitoring/buat" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">+ Catat Kunjungan</Link>
      </div>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : monitoring.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><p className="text-4xl">📍</p><p className="mt-4 text-slate-500">Belum ada kunjungan monitoring</p></div>
      ) : (
        <div className="space-y-3">
          {monitoring.map((m) => (
            <div key={m.id as number} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-800">{(m.kelompok as Record<string, unknown>)?.nama_kelompok as string || '-'}</p>
              <p className="text-sm text-slate-500">Tanggal: {m.visit_date as string}</p>
              <p className="mt-2 text-sm text-slate-700">{m.notes as string}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
