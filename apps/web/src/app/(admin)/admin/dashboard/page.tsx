'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS, PHASE_LABELS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const endpoints = adminEndpoints(api);
  const queryClient = useQueryClient();
  const [periodId, setPeriodId] = useState<number | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard', { periode_id: periodId }],
    queryFn: async () => { const res = await endpoints.dashboard({ periode_id: periodId }); return (res.data as { success: boolean; data: Record<string, unknown> }).data; },
  });

  const phaseMutation = useMutation({
    mutationFn: (payload: { periode_id: number; phase: string }) => endpoints.switchPhase(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }); toast.success('Fase berhasil diubah'); },
  });

  const stats = data?.stats as Record<string, unknown> | undefined;
  const period = data?.period as Record<string, unknown> | undefined;
  const phases = ['upcoming', 'registration', 'placement', 'execution', 'grading', 'finished'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Admin</h1>
        {period && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Fase:</span>
            <select value={period?.current_phase as string || ''} onChange={(e) => period && phaseMutation.mutate({ periode_id: period.id as number, phase: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {phases.map((p) => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
            </select>
          </div>
        )}
      </div>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {[
              { label: 'Total Peserta', value: stats?.total_participants, color: 'blue' },
              { label: 'Disetujui', value: stats?.approved_participants, color: 'emerald' },
              { label: 'Menunggu', value: stats?.pending_participants, color: 'amber' },
              { label: 'Kelompok', value: stats?.total_groups, color: 'indigo' },
              { label: 'Laporan Hari Ini', value: stats?.reports_today, color: 'teal' },
              { label: 'Laporan Pending', value: stats?.pending_reports, color: 'rose' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold text-${s.color}-600`}>{(s.value as number) || 0}</p>
              </div>
            ))}
          </div>
          {period && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">{period.name as string}</h2>
              <p className="text-sm text-slate-500">Fase: {PHASE_LABELS[period.current_phase as string] || period.current_phase as string} | Kuota: {period.kuota as number || '-'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
