'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/shared';
import { useTheme } from '@/components/ui/theme-provider';

export default function GroupsPage(): React.JSX.Element {
  const { config: themeConfig, surfaceClass } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.groups,
    queryFn: async () => {
      const res = await dplApi.groups.index();
      return res as unknown as Record<string, unknown>;
    },
  });

  const groups = (data?.groups as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Kelompok Bimbingan" />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />
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
              className={`block rounded-2xl border border-[color:var(--profile-border)] p-6 transition hover:shadow-md ${surfaceClass} ${themeConfig.shadow}`}
            >
              <p className="text-lg font-semibold text-[color:var(--profile-text)]">{g.name as string}</p>
              <p className="text-sm text-[color:var(--profile-muted)]">Kode: {g.code as string}</p>
              <p className="text-sm text-[color:var(--profile-muted)]">{g.village_name as string}</p>
              <div className="mt-3 flex gap-4 font-semibold">
                <span className="text-xs text-[color:var(--profile-primary)]">{g.member_count as number} anggota</span>
                <span className="text-xs text-[color:var(--profile-accent)]">{g.daily_report_count as number} laporan</span>
                <span className="text-xs text-[color:var(--profile-soft-text)]">{g.work_program_count as number} progja</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
