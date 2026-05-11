'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { PageHeader, StatusBadge, EmptyState } from '@/components/ui/shared';

export default function DplFinalReportsPage(): React.JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.finalReports,
    queryFn: async () => {
      return await dplApi.finalReports.index();
    },
  });

  const reports = ((data as unknown) || []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Akhir" />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title="Belum Ada Laporan Akhir"
          description="Belum ada laporan akhir yang disubmit."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.id as number}
              href={`/dosen/laporan-akhir/${r.id}`}
              className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {(r.mahasiswa as Record<string, unknown>)?.name as string || '-'}
                  </p>
                  <p className="font-semibold text-slate-800">{r.title as string}</p>
                </div>
                <StatusBadge status={r.status as string} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
