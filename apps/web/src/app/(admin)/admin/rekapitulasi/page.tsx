'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function RekapitulasiPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'rekapitulasi'],
    queryFn: async () => {
      const res = await api.get('/admin/rekapitulasi');
      return res.data as { success: boolean; data: unknown };
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Rekapitulasi</h1>
      <p className="text-sm text-slate-500">Rekapitulasi data KKN per periode.</p>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-slate-500">Data rekapitulasi akan ditampilkan di sini.</p>
        </div>
      )}
    </div>
  );
}
