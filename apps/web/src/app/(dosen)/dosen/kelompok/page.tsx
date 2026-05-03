'use client';

import { useQuery } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function GroupsPage() {
  const endpoints = dplEndpoints(api);
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.groups,
    queryFn: async () => {
      const res = await endpoints.groups.index();
      return (res.data as { success: boolean; data: { groups: unknown[] } }).data;
    },
  });

  const groups = (data?.groups as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Kelompok Bimbingan</h1>
      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">👥</p>
          <p className="mt-4 text-lg font-semibold text-slate-700">Belum Ada Kelompok</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <Link key={g.id as number} href={`/dosen/kelompok/${g.id}`} className="block rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
              <p className="text-lg font-semibold text-slate-800">{g.name as string}</p>
              <p className="text-sm text-slate-500">Kode: {g.code as string}</p>
              <p className="text-sm text-slate-500">{g.village_name as string}</p>
              <div className="mt-3 flex gap-4">
                <span className="text-xs text-blue-600">{g.member_count as number} anggota</span>
                <span className="text-xs text-amber-600">{g.daily_report_count as number} laporan</span>
                <span className="text-xs text-emerald-600">{g.work_program_count as number} progja</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
