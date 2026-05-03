'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DplAssignmentPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dpl-assignment'],
    queryFn: async () => {
      const res = await api.get('/admin/dosen/penugasan');
      return res.data as { success: boolean; data: unknown[] };
    },
  });

  const assignments = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Penugasan DPL</h1>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={String(a.id)} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{String(((a as Record<string, unknown>)?.dosen as Record<string, unknown>)?.nama || '-')}</p>
                <p className="text-sm text-slate-500">Periode: {String(((a as Record<string, unknown>)?.periode as Record<string, unknown>)?.name || '-')} | Max: {String((a as Record<string, unknown>)?.max_kelompok_kkn || '-')} kelompok</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${(a as Record<string, unknown>)?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {(a as Record<string, unknown>)?.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
