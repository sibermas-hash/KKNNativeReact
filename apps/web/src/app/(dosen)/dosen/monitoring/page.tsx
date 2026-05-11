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

  const monitoring = ((data as any) || []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring DPL"
        actions={
          <Link
            href="/dosen/monitoring/buat"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
          >
            <Plus size={16} />
            Catat Kunjungan
          </Link>
        }
      />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : monitoring.length === 0 ? (
        <EmptyState
          icon={<MapPin size={40} />}
          title="Belum Ada Kunjungan"
          description="Belum ada kunjungan monitoring yang dicatat."
          action={
            <Link
              href="/dosen/monitoring/buat"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
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
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <p className="font-semibold text-slate-800">
                {(m.kelompok as Record<string, unknown>)?.nama_kelompok as string || '-'}
              </p>
              <p className="text-sm text-slate-500">Tanggal: {m.visit_date as string}</p>
              <p className="mt-2 text-sm text-slate-700">{m.notes as string}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
