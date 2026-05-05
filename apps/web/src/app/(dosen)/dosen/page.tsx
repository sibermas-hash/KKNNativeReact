'use client';

import { useQuery } from '@tanstack/react-query';
import { dosenEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api, dplApi } from '@/lib/api';
import Link from 'next/link';

export default function DosenDashboard() {
  const endpoints = dosenEndpoints(api);
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dosen.dashboard,
    queryFn: async () => {
      const res = await dplApi.dashboard() as unknown as { success: boolean; data: Record<string, unknown> };
      return res.data;
    },
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;

  const isDpl = (data?.is_dpl as boolean) || false;
  const periods = (data?.dpl_periods as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard Dosen</h1>
      {isDpl && (
        <Link href="/dosen/beranda-dpl" className="block rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shadow-sm hover:shadow-md">
          <p className="text-lg font-semibold">🏠 Buka Dashboard DPL</p>
          <p className="mt-1 text-sm text-blue-100">Kelola kelompok bimbingan Anda</p>
        </Link>
      )}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">Penugasan DPL</h2>
        {periods.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada penugasan DPL</p>
        ) : (
          <div className="space-y-3">
            {periods.map((p) => (
              <div key={p.id as number} className="rounded-xl border border-slate-100 p-4">
                <p className="font-medium text-slate-800">{((p.periode as Record<string, unknown>)?.name as string) || '-'}</p>
                <p className="text-sm text-slate-500">Max kelompok: {p.max_kelompok_kkn as number}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
