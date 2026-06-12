'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import Link from 'next/link';
import { MapPin, Plus } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';

export default function MonitoringPage(): React.JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.monitoring,
    queryFn: async () => {
      return await dplApi.monitoring.index();
    },
  });

  const monitoring = ((data as unknown) || []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring DPL"
        actions={
          <Link
            href="/dosen/monitoring/buat"
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--profile-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
          >
            <Plus size={16} />
            Catat Kunjungan
          </Link>
        }
      />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />
      ) : monitoring.length === 0 ? (
        <EmptyState
          icon={<MapPin size={40} />}
          title="Belum Ada Kunjungan"
          description="Belum ada kunjungan monitoring yang dicatat."
          action={
            <Link
              href="/dosen/monitoring/buat"
              className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--profile-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              <Plus size={16} />
              Catat Kunjungan
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {monitoring.map((m) => (
            <div
              key={m.id as number}
              className="rounded-2xl bg-[color:var(--profile-surface)] border border-[color:var(--profile-border)] p-5 shadow-sm"
            >
              <p className="font-semibold text-[color:var(--profile-text)]">
                {(m.kelompok as Record<string, unknown>)?.nama_kelompok as string || '-'}
              </p>
              <p className="text-sm text-[color:var(--profile-muted)]">Tanggal: {m.visit_date as string}</p>
              <p className="mt-2 text-sm text-[color:var(--profile-text)]">{m.notes as string}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
