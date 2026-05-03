'use client';

import { useQuery } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';

export default function DplDashboard() {
  const endpoints = dplEndpoints(api);
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.dashboard,
    queryFn: async () => {
      const res = await endpoints.dashboard();
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;

  const groups = (data?.groups as Record<string, unknown>[]) || [];
  const atRisk = (data?.at_risk_students as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard DPL</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Kelompok</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">{groups.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Laporan Pending</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{data?.pending_reports as number || 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Progres Nilai</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{(data?.grading_progress as string) || '0%'}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Mahasiswa Berisiko</p>
          <p className="mt-1 text-3xl font-bold text-rose-600">{atRisk.length}</p>
        </div>
      </div>

      {atRisk.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h2 className="mb-3 text-lg font-semibold text-rose-700">⚠️ Mahasiswa Tidak Aktif (3+ hari)</h2>
          <div className="space-y-2">
            {atRisk.map((s) => (
              <div key={s.id as number} className="flex items-center justify-between rounded-lg bg-white px-4 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.name as string}</p>
                  <p className="text-xs text-slate-500">NIM: {s.nim as string} | Kelompok: {s.group_code as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Kelompok Bimbingan</h2>
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.id as number} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{g.name as string} ({g.code as string})</p>
                  <p className="text-sm text-slate-500">{g.village_name as string} | {g.period_name as string}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">{g.member_count as number} anggota</p>
                  <p className="text-xs text-slate-500">{g.daily_report_count as number} laporan</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
