'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';

export default function WorkProgramDetailPage() {
  const { id } = useParams();
  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.workProgram(Number(id)),
    queryFn: async () => {
      const res = await endpoints.workPrograms.show(Number(id));
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />;
  if (!data) return <div className="text-center text-slate-500">Program tidak ditemukan</div>;

  const proposals = (data.proposals as Record<string, unknown>[]) || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{String(data.title || 'Detail Program Kerja')}</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-slate-500">Status</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{String(data.status || '-')}</span></div>
          <div><p className="text-xs text-slate-500">Kategori</p><p className="font-semibold">{String(data.kategori || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Target Peserta</p><p className="font-semibold">{String(data.target_participants || '-')}</p></div>
          <div><p className="text-xs text-slate-500">Anggaran</p><p className="font-semibold">{String(data.budget || '-')}</p></div>
        </div>
        {data.description ? <p className="mt-4 text-sm text-slate-600">{String(data.description)}</p> : null}
        {data.objectives ? <p className="mt-2 text-sm text-slate-600">Tujuan: {String(data.objectives)}</p> : null}
      </div>

      {proposals.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Proposal ({proposals.length})</h2>
          <div className="space-y-2">
            {proposals.map((p) => (
              <div key={String(p.id)} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2">
                <p className="text-sm">Versi {String(p.version || '-')} — {String(p.file_name || '-')}</p>
                <span className="text-xs text-slate-500">{String(p.uploaded_at || '-')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
