'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { dplApi } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import { StatusBadge, EmptyState } from '@/components/ui/shared';
import { useTheme } from '@/components/ui/theme-provider';

export default function DplIzinPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { config: themeConfig, surfaceClass } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.leaveRequests,
    queryFn: async () => { return await dplApi.leaveRequests.index(); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => dplApi.leaveRequests.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'leave-requests'] }); toast.success('Izin disetujui'); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => dplApi.leaveRequests.reject(id, { rejection_reason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'leave-requests'] }); setRejectId(null); setRejectReason(''); toast.success('Izin ditolak'); },
  });

  const izinList = ((data as unknown) || []) as Record<string, unknown>[];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight uppercase">Persetujuan Izin</h1>

      {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />
      : izinList.length === 0 ? <EmptyState icon={<FileText size={48} />} title="Tidak ada pengajuan izin" />
      : (
        <div className="space-y-4">
          {izinList.map((izin) => (
            <div key={String(izin.id)} className={`rounded-2xl border border-[color:var(--profile-border)] p-6 shadow-sm ${surfaceClass} ${themeConfig.shadow}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-[color:var(--profile-text)]">{String((izin.mahasiswa as Record<string, unknown>)?.name || '-')}</p>
                  <p className="text-sm text-[color:var(--profile-text)] opacity-90 capitalize">{String(izin.type || '')}: {String(izin.reason || '')}</p>
                  <p className="text-xs text-[color:var(--profile-muted)] font-semibold mt-1">{String(izin.start_date || '')} — {String(izin.end_date || '')}</p>
                </div>
                <StatusBadge status={String(izin.status || 'pending')} />
              </div>
              {izin.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => approveMutation.mutate(izin.id as number)} disabled={approveMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-[color:var(--profile-primary)] hover:bg-[color:var(--profile-primary-hover)] text-white rounded-xl text-xs font-black uppercase disabled:opacity-50 transition-all hover:-translate-y-0.5"><CheckCircle2 size={14} /> Setujui</button>
                  {rejectId === izin.id ? (
                    <div className="flex flex-1 gap-2">
                      <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Alasan penolakan" className="flex-1 h-10 bg-[color:var(--profile-input)] border border-[color:var(--profile-border)] rounded-lg px-3 text-sm text-[color:var(--profile-text)] outline-none focus:border-[color:var(--profile-accent)] focus:ring-4 focus:ring-[color:var(--profile-ring)] placeholder:text-[color:var(--profile-muted)]" />
                      <button onClick={() => rejectMutation.mutate({ id: izin.id as number, reason: rejectReason })} disabled={!rejectReason} className="px-4 py-2 bg-[color:var(--profile-accent)] hover:opacity-90 text-white rounded-xl text-xs font-black uppercase transition-all hover:-translate-y-0.5">Kirim</button>
                      <button onClick={() => setRejectId(null)} className="px-4 py-2 bg-[color:var(--profile-soft)] hover:bg-[color:var(--profile-surface-strong)] text-[color:var(--profile-soft-text)] rounded-xl text-xs font-bold border border-[color:var(--profile-border)] transition-all hover:-translate-y-0.5">Batal</button>
                    </div>
                  ) : (
                    <button onClick={() => setRejectId(izin.id as number)} className="flex items-center gap-2 px-4 py-2 bg-[color:var(--profile-danger)] text-[color:var(--profile-danger-text)] rounded-xl text-xs font-black uppercase border border-[color:var(--profile-border)] transition-all hover:-translate-y-0.5"><XCircle size={14} /> Tolak</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
