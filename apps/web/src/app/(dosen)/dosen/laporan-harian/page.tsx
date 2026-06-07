'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplApi } from '@/lib/api';
import Link from 'next/link';
import { FileText, CheckCircle2 } from 'lucide-react';
import { StatusBadge, PageHeader, EmptyState } from '@/components/ui/shared';
import { toast } from 'sonner';
import { useTheme } from '@/components/ui/theme-provider';

export default function DplDailyReportsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const { config: themeConfig, surfaceClass } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['dpl', 'daily-reports', { status }],
    queryFn: async () => { return await dplApi.dailyReports.index({ status: status || undefined }); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => dplApi.dailyReports.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'daily-reports'] }); toast.success('Laporan disetujui'); },
  });

  const reports = ((data as unknown) || []) as Record<string, unknown>[];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Review Laporan Harian" subtitle="Validasi laporan mahasiswa bimbingan" />

      <div className="flex gap-2">
        {['', 'submitted', 'approved', 'revision'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition border ${status === s ? 'bg-[color:var(--profile-primary)] hover:bg-[color:var(--profile-primary-hover)] text-white border-[color:var(--profile-primary)]' : 'bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] border-[color:var(--profile-border)] hover:border-[color:var(--profile-primary)]'}`}>
            {s === '' ? 'Semua' : s === 'submitted' ? 'Pending' : s === 'approved' ? 'Disetujui' : 'Revisi'}
          </button>
        ))}
      </div>

      {isLoading ? <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />)}</div>
      : reports.length === 0 ? <EmptyState icon={<FileText size={48} />} title="Tidak ada laporan" />
      : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={String(r.id)} className={`rounded-2xl border border-[color:var(--profile-border)] p-6 shadow-sm ${surfaceClass} ${themeConfig.shadow}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-xs text-[color:var(--profile-muted)] font-semibold">{String((r.mahasiswa as Record<string, unknown>)?.name || '-')} — {String((r.kelompok as Record<string, unknown>)?.name || '-')}</p>
                  <h3 className="text-lg font-black text-[color:var(--profile-text)] mt-1">{String(r.title || '')}</h3>
                  <p className="text-sm text-[color:var(--profile-muted)] mt-1 line-clamp-2">{String(r.activity || '')}</p>
                </div>
                <StatusBadge status={String(r.status || '')} />
              </div>
              {r.status === 'submitted' && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => approveMutation.mutate(r.id as number)} disabled={approveMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-[color:var(--profile-primary)] hover:bg-[color:var(--profile-primary-hover)] text-white rounded-xl text-xs font-black uppercase disabled:opacity-50"><CheckCircle2 size={14} /> Setujui</button>
                  <Link href={`/dosen/laporan-harian/${r.id}`} className="flex items-center gap-2 px-4 py-2 bg-[color:var(--profile-soft)] hover:bg-[color:var(--profile-surface-strong)] text-[color:var(--profile-soft-text)] rounded-xl text-xs font-black uppercase border border-[color:var(--profile-border)]">Detail →</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
