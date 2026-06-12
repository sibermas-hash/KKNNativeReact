'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/shared';
import { ClipboardList } from 'lucide-react';

type EvalItem = {
  id: number;
  mahasiswa?: { nama?: string; nim?: string };
  kelompok?: { code?: string; nama_kelompok?: string };
  item?: { label?: string; score?: number }[];
  total_score?: number;
  created_at?: string;
};

type Meta = { current_page: number; last_page: number; total: number };

export default function EvaluasiPage(): React.JSX.Element {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: EvalItem[]; meta: Meta }>({
    queryKey: ['admin', 'evaluasi', page],
    queryFn: async () => {
      const res = await rawApi.get('/admin/evaluasi', { params: { page, per_page: 25 } });
      return ((res.data as { data?: unknown }).data ?? res.data) as { data: EvalItem[]; meta: Meta };
    },
  });

  const evaluations = data?.data ?? [];
  const meta = data?.meta ?? { current_page: 1, last_page: 1, total: 0 };

  return (
    <div className="space-y-6">
      <PageHeader title="Evaluasi Peserta" subtitle={`Total ${meta.total} evaluasi tercatat.`} />

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : evaluations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <ClipboardList className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">Belum ada evaluasi peserta.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Mahasiswa</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Kelompok</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">Skor</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((e, i) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400">{(meta.current_page - 1) * 25 + i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{e.mahasiswa?.nama ?? '-'}</p>
                      <p className="text-xs text-slate-500">{e.mahasiswa?.nim ?? '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{e.kelompok?.code ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-lg bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">{e.total_score ?? '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{e.created_at ? new Date(e.created_at).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Prev</button>
              <span className="text-xs text-slate-500">{meta.current_page} / {meta.last_page}</span>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
