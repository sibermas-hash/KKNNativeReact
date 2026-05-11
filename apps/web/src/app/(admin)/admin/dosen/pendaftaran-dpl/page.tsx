'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';
import { PageHeader, ConfirmDialog, StatusBadge, EmptyState } from '@/components/ui/shared';

export default function DplRegistrationPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [confirmApprove, setConfirmApprove] = useState<number | null>(null);
  const [confirmReject, setConfirmReject] = useState<{ id: number; reason: string } | null>(null);

  const { data, isLoading } = useQuery<unknown[]>({
    queryKey: ['admin', 'dpl-registration'],
    queryFn: async () => {
      return await api.get('/admin/dosen/pendaftaran-dpl');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/dosen/pendaftaran-dpl/${id}/setujui`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dpl-registration'] });
      toast.success('DPL disetujui');
      setConfirmApprove(null);
    },
    onError: () => toast.error('Gagal menyetujui DPL'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.patch(`/admin/dosen/pendaftaran-dpl/${id}/tolak`, { rejection_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dpl-registration'] });
      toast.success('DPL ditolak');
      setConfirmReject(null);
    },
    onError: () => toast.error('Gagal menolak DPL'),
  });

  const registrations = data ?? [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Pendaftaran DPL"
        subtitle="Kelola permohonan pendaftaran Dosen Pembimbing Lapangan."
      />

      <ConfirmDialog
        open={confirmApprove !== null}
        onClose={() => setConfirmApprove(null)}
        onConfirm={() => confirmApprove !== null && approveMutation.mutate(confirmApprove)}
        title="Setujui Pendaftaran DPL"
        description="Dosen akan diaktifkan sebagai DPL. Lanjutkan?"
        confirmText="Setujui"
        variant="info"
      />

      <ConfirmDialog
        open={confirmReject !== null}
        onClose={() => setConfirmReject(null)}
        onConfirm={() => {
          if (!confirmReject?.reason.trim()) {
            toast.error('Alasan penolakan wajib diisi');
            return;
          }
          rejectMutation.mutate(confirmReject);
        }}
        title="Tolak Pendaftaran DPL"
        description="Pendaftaran DPL ini akan ditolak. Lanjutkan?"
        confirmText="Tolak"
        variant="danger"
      />
      {confirmReject && (
        <div className="fixed inset-x-4 bottom-6 z-[70] mx-auto max-w-md rounded-2xl border border-rose-100 bg-white p-4 shadow-xl">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">Alasan Penolakan</label>
          <textarea
            value={confirmReject.reason}
            onChange={(e) => setConfirmReject({ ...confirmReject, reason: e.target.value })}
            className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            placeholder="Tuliskan alasan penolakan..."
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : registrations.length === 0 ? (
        <EmptyState icon={<ClipboardList size={40} />} title="Belum ada pendaftaran" description="Tidak ada permohonan DPL yang masuk." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Nama</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">NIP</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs text-slate-500 font-black uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r: unknown) => {
                const item = r as Record<string, unknown>;
                const dosen = item.dosen as Record<string, unknown>;
                return (
                  <tr key={String(item.id)} className="border-b border-slate-50 last:border-0">
                    <td className="p-4 font-semibold text-slate-800">{String(dosen?.nama || '-')}</td>
                    <td className="p-4 font-mono text-xs text-slate-600">{String(dosen?.nip || '-')}</td>
                    <td className="p-4">
                      <StatusBadge status={String(item.status || 'pending')} />
                    </td>
                    <td className="p-4">
                      {item.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmApprove(item.id as number)}
                            className="h-8 px-3 flex items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100 text-xs font-semibold"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => setConfirmReject({ id: item.id as number, reason: '' })}
                            className="h-8 px-3 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 text-xs font-semibold"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
