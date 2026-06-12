'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { toast } from 'sonner';
import { ClipboardList, Info } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

type Score = {
  id: number;
  total_score?: number | string | null;
  letter_grade?: string | null;
  is_finalized?: boolean;
  user?: { name?: string | null } | null;
  kelompok?: { nama_kelompok?: string | null; code?: string | null } | null;
};

function unwrapScores(payload: unknown): Score[] {
  const root = payload as { data?: unknown };
  const data = root?.data ?? payload;
  if (Array.isArray(data)) return data as Score[];
  if (data && typeof data === 'object') {
    const obj = data as { data?: unknown };
    if (Array.isArray(obj.data)) return obj.data as Score[];
    if (obj.data && typeof obj.data === 'object' && Array.isArray((obj.data as { data?: unknown }).data)) {
      return (obj.data as { data: Score[] }).data;
    }
  }
  return [];
}

export default function AdminGradesPage(): React.JSX.Element {
  const queryClient = useQueryClient();

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['admin', 'nilai', 'active-only'],
    queryFn: async () => unwrapScores((await rawApi.get('/admin/nilai')).data),
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: number) => rawApi.patch(`/admin/grade-reports/${id}/finalize`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'nilai', 'active-only'] });
      toast.success('Nilai berhasil difinalisasi');
    },
    onError: () => toast.error('Gagal finalisasi nilai'),
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Input Nilai" subtitle="Manajemen nilai akhir KKN aktif (KKN 58 dan seterusnya)." />

      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-black">KKN 58 saat ini masih fase plotting/placement.</p>
          <p>Nilai aktif akan muncul saat periode masuk fase penilaian. Data KKN Reguler 51–57 tersedia di menu <b>Riwayat KKN 51–57</b>.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : scores.length === 0 ? (
        <EmptyState icon={<ClipboardList size={40} />} title="Belum ada data nilai aktif" description="Belum ada nilai KKN 58+ yang tersedia pada fase ini." />
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
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="p-4">{s.user?.name || '-'}</td>
                  <td className="p-4">{s.kelompok?.nama_kelompok || s.kelompok?.code || '-'}</td>
                  <td className="p-4 font-semibold">{Number.isFinite(Number(s.total_score)) ? Number(s.total_score).toFixed(1) : '-'}</td>
                  <td className="p-4 font-semibold text-amber-600">{s.letter_grade || '-'}</td>
                  <td className="p-4">{s.is_finalized ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Final</span> : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Draft</span>}</td>
                  <td className="p-4">{!s.is_finalized && <button onClick={() => finalizeMutation.mutate(s.id)} disabled={finalizeMutation.isPending} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">Finalisasi</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}