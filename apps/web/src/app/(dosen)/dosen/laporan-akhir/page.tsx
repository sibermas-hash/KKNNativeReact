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
        <div className="h-32 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />
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
              className="block rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[color:var(--profile-muted)]">
                    {(r.mahasiswa as Record<string, unknown>)?.name as string || '-'}
                  </p>
                  <p className="font-semibold text-[color:var(--profile-text)]">{r.title as string}</p>
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
