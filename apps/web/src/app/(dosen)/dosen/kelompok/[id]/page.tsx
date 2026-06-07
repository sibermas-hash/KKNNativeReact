'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { BackButton } from '@/components/ui/shared';
import { useTheme } from '@/components/ui/theme-provider';

export default function GroupDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { config: themeConfig, surfaceClass } = useTheme();
  
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.group(Number(id)),
    queryFn: async () => {
      return await dplApi.groups.show(Number(id));
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />;
  if (!data) return <div className="text-center text-[color:var(--profile-muted)] font-semibold">Kelompok tidak ditemukan</div>;

  const d = data as unknown as Record<string, unknown>;
  const members = (d.members as Record<string, unknown>[]) || [];
  const workPrograms = (d.work_programs as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <BackButton href="/dosen/kelompok" label="Kembali ke Kelompok" />
      <h1 className="text-2xl font-bold text-[color:var(--profile-text)]">{d.name as string}</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className={`rounded-2xl border border-[color:var(--profile-border)] p-4 ${surfaceClass} ${themeConfig.shadow}`}>
          <p className="text-xs text-[color:var(--profile-muted)] font-semibold">Kode</p>
          <p className="font-bold text-[color:var(--profile-text)]">{d.code as string}</p>
        </div>
        <div className={`rounded-2xl border border-[color:var(--profile-border)] p-4 ${surfaceClass} ${themeConfig.shadow}`}>
          <p className="text-xs text-[color:var(--profile-muted)] font-semibold">Lokasi</p>
          <p className="font-bold text-[color:var(--profile-text)]">{d.village_name as string}</p>
        </div>
        <div className={`rounded-2xl border border-[color:var(--profile-border)] p-4 ${surfaceClass} ${themeConfig.shadow}`}>
          <p className="text-xs text-[color:var(--profile-muted)] font-semibold">Kapasitas</p>
          <p className="font-bold text-[color:var(--profile-text)]">{String(d.capacity ?? '-')}</p>
        </div>
        <div className={`rounded-2xl border border-[color:var(--profile-border)] p-4 ${surfaceClass} ${themeConfig.shadow}`}>
          <p className="text-xs text-[color:var(--profile-muted)] font-semibold">Status</p>
          <p className="font-bold text-[color:var(--profile-text)] capitalize">{(d.status as string) || '-'}</p>
        </div>
      </div>

      <div className={`rounded-2xl border border-[color:var(--profile-border)] p-6 ${surfaceClass} ${themeConfig.shadow}`}>
        <h2 className="mb-4 text-lg font-bold text-[color:var(--profile-text)]">Anggota ({members.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--profile-border)] text-left text-xs text-[color:var(--profile-muted)] font-bold">
                <th className="pb-2">NIM</th>
                <th className="pb-2">Nama</th>
                <th className="pb-2">Prodi</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Status Nilai</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id as number} className="border-b border-[color:var(--profile-border)]/40 text-[color:var(--profile-text)] font-medium">
                  <td className="py-2">{(m.student as Record<string, unknown>)?.nim as string}</td>
                  <td className="py-2">{(m.student as Record<string, unknown>)?.name as string}</td>
                  <td className="py-2">{(m.student as Record<string, unknown>)?.program_name as string}</td>
                  <td className="py-2">
                    <span className="rounded-full bg-[color:var(--profile-soft)] px-2 py-0.5 text-xs font-bold text-[color:var(--profile-soft-text)] border border-[color:var(--profile-border)]">
                      {m.role as string || 'Anggota'}
                    </span>
                  </td>
                  <td className="py-2">{m.nilai ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {workPrograms.length > 0 && (
        <div className={`rounded-2xl border border-[color:var(--profile-border)] p-6 ${surfaceClass} ${themeConfig.shadow}`}>
          <h2 className="mb-4 text-lg font-bold text-[color:var(--profile-text)]">Program Kerja</h2>
          <div className="space-y-2">
            {workPrograms.map((p) => {
              const pStatus = String(p.status || '').toLowerCase();
              const badgeCls = pStatus === 'approved' 
                ? 'bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)] border border-[color:var(--profile-border)]' 
                : pStatus === 'rejected'
                  ? 'bg-[color:var(--profile-danger)] text-[color:var(--profile-danger-text)] border border-[color:var(--profile-border)]'
                  : 'bg-[color:var(--profile-warning)] text-[color:var(--profile-warning-text)] border border-[color:var(--profile-border)]';
              return (
                <div key={p.id as number} className="flex items-center justify-between rounded-xl border border-[color:var(--profile-border)]/45 px-4 py-2 bg-[color:var(--profile-soft)]/20">
                  <p className="text-sm font-bold text-[color:var(--profile-text)]">{p.title as string}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeCls}`}>{p.status as string}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
