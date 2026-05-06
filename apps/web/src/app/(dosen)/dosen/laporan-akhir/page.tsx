'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api, dplApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DplFinalReportsPage() {
  
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.finalReports,
    queryFn: async () => {
      const res = await dplApi.finalReports.index();
      return (res as unknown as { success: boolean; data: unknown[] }).data;
    },
  });

  const reports = (data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Laporan Akhir</h1>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : reports.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><p className="text-4xl">📄</p><p className="mt-4 text-slate-500">Belum ada laporan akhir</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link key={r.id as number} href={`/dosen/laporan-akhir/${r.id}`} className="block rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{(r.mahasiswa as Record<string, unknown>)?.name as string || '-'}</p>
                  <p className="font-semibold text-slate-800">{r.title as string}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'revision' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status === 'submitted' ? 'Pending' : r.status as string}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
