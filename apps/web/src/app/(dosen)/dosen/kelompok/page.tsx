'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

export default function GroupsPage(): React.JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.groups,
    queryFn: async () => {
      const res = await dplApi.groups.index();
      return (res as unknown as { data?: unknown }).data ?? res;
    },
  });

  const groups = (data?.groups as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Kelompok Bimbingan" />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="Belum Ada Kelompok"
          description="Anda belum memiliki kelompok bimbingan."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <Link
              key={g.id as number}
              href={`/dosen/kelompok/${g.id}`}
              className="block rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
            >
              <p className="text-lg font-semibold text-slate-800">{g.name as string}</p>
              <p className="text-sm text-slate-500">Kode: {g.code as string}</p>
              <p className="text-sm text-slate-500">{g.village_name as string}</p>
              <div className="mt-3 flex gap-4">
                <span className="text-xs text-cyan-600">{g.member_count as number} anggota</span>
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
