'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, adminApi } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

export default function AdminGradesPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [selectedPeriodId, _setSelectedPeriodId] = useState<string>('');
  const [search, _setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'nilai', { periode_id: selectedPeriodId, search }],
    queryFn: async () => {
      const res = await api.get('/admin/nilai', { params: { periode_id: selectedPeriodId || undefined, search: search || undefined } });
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: number) => adminApi.grades.finalize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'grades'] });
      toast.success('Nilai berhasil difinalisasi');
    },
  });

  const scores = (data as unknown as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Rekap Nilai" subtitle="Manajemen nilai akhir mahasiswa KKN" />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : scores.length === 0 ? (
        <EmptyState icon={<ClipboardList size={40} />} title="Belum ada data nilai" description="Tidak ada rekap nilai yang tersedia." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="p-4">Mahasiswa</th>
                <th className="p-4">Kelompok</th>
                <th className="p-4">Total Skor</th>
                <th className="p-4">Grade</th>
                <th className="p-4">Status</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.id as number} className="border-b border-slate-50">
                  <td className="p-4">{((s.user as Record<string, unknown>)?.name as string) || '-'}</td>
                  <td className="p-4">{((s.kelompok as Record<string, unknown>)?.nama_kelompok as string) || '-'}</td>
                  <td className="p-4 font-semibold">{(s.total_score as number)?.toFixed(1) || '-'}</td>
                  <td className="p-4 font-semibold text-amber-600">{(s.letter_grade as string) || '-'}</td>
                  <td className="p-4">
                    {s.is_finalized ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Final</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Draft</span>
                    )}
                  </td>
                  <td className="p-4">
                    {!s.is_finalized && (
                      <button
                        onClick={() => finalizeMutation.mutate(s.id as number)}
                        disabled={finalizeMutation.isPending}
                        className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
                      >
                        Finalisasi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
