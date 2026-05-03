'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dplEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function IzinApprovalPage() {
  const endpoints = dplEndpoints(api);
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dpl.leaveRequests,
    queryFn: async () => {
      const res = await endpoints.leaveRequests.index();
      return res.data as { success: boolean; data: unknown[] };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => endpoints.leaveRequests.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'leave-requests'] }); toast.success('Izin disetujui'); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => endpoints.leaveRequests.reject(id, { rejection_reason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dpl', 'leave-requests'] }); setRejectId(null); setRejectReason(''); toast.success('Izin ditolak'); },
  });

  const izinList = (data?.data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Persetujuan Izin</h1>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : izinList.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><p className="text-4xl">✈️</p><p className="mt-4 text-slate-500">Tidak ada pengajuan izin</p></div>
      ) : (
        <div className="space-y-3">
          {izinList.map((izin) => (
            <div key={izin.id as number} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{(izin.mahasiswa as Record<string, unknown>)?.name as string || '-'}</p>
                  <p className="text-sm capitalize text-slate-600">{izin.type as string}: {izin.reason as string}</p>
                  <p className="text-xs text-slate-500">{izin.start_date as string} — {izin.end_date as string}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${izin.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : izin.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {izin.status === 'approved' ? 'Disetujui' : izin.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                </span>
              </div>
              {izin.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => approveMutation.mutate(izin.id as number)} disabled={approveMutation.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">✅ Setujui</button>
                  {rejectId === izin.id ? (
                    <div className="flex flex-1 gap-2">
                      <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Alasan penolakan" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <button onClick={() => rejectMutation.mutate({ id: izin.id as number, reason: rejectReason })} disabled={!rejectReason} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Kirim</button>
                      <button onClick={() => setRejectId(null)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">Batal</button>
                    </div>
                  ) : (
                    <button onClick={() => setRejectId(izin.id as number)} className="rounded-lg bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200">❌ Tolak</button>
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
