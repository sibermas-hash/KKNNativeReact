'use client';

import { useQuery } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function AdminDailyReportsPage() {
  const endpoints = adminEndpoints(api);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'daily-reports'],
    queryFn: async () => { const res = await endpoints.grades.reports({}); return res.data as { success: boolean; data: unknown[] }; },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Laporan Harian</h1>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : <p className="text-slate-500">Gunakan API endpoint untuk data laporan harian</p>}
    </div>
  );
}
