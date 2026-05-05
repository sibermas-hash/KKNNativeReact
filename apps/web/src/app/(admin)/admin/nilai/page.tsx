'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminEndpoints } from '@sibermas/api-client';
import { api, adminApi } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminGradesPage() {
  
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'grades', { page }],
    queryFn: async () => { const res = await adminApi.grades.reports({ page }); return (res as unknown as { success: boolean; data: unknown[]; meta?: Record<string, number> }).data; },
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: number) => adminApi.grades.finalize(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'grades'] }); toast.success('Nilai berhasil difinalisasi'); },
  });

  const scores = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Rekap Nilai</h1>
      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-slate-200" /> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="p-4">Mahasiswa</th><th className="p-4">Kelompok</th><th className="p-4">Total Skor</th><th className="p-4">Grade</th><th className="p-4">Status</th><th className="p-4">Aksi</th></tr></thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.id as number} className="border-b border-slate-50">
                  <td className="p-4">{((s.user as Record<string, unknown>)?.name as string) || '-'}</td>
                  <td className="p-4">{((s.kelompok as Record<string, unknown>)?.nama_kelompok as string) || '-'}</td>
                  <td className="p-4 font-semibold">{(s.total_score as number)?.toFixed(1) || '-'}</td>
                  <td className="p-4 font-semibold text-amber-600">{(s.letter_grade as string) || '-'}</td>
                  <td className="p-4">{s.is_finalized ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Final</span> : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Draft</span>}</td>
                  <td className="p-4">{!s.is_finalized && <button onClick={() => finalizeMutation.mutate(s.id as number)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Finalisasi</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
