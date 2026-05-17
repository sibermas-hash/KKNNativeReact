'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { ClipboardList, CheckCircle2, XCircle, X } from 'lucide-react';
import { StatusBadge, PageHeader, EmptyState } from '@/components/ui/shared';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

interface Registration {
  id: number;
  mahasiswa: {
    nama: string;
    nim: string;
    fakultas: { nama: string };
  };
  status: string;
  [key: string]: unknown;
}

export default function AdminRegistrationsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [approveConfirm, setApproveConfirm] = useState<Registration | null>(null);
  const [bulkApproveConfirm, setBulkApproveConfirm] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const periodeId = searchParams.get('periode_id') ?? '';
  const periodeName = (searchParams.get('periode_name') ?? '').trim();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'registrations', { status, search, periodeId }],
    queryFn: async () => {
      const res = await adminApi.registrations.index({
        status,
        search,
        periode_id: periodeId || undefined,
      });
      return ((res as unknown as { data?: Registration[] }).data ?? res) as Registration[];
    },
  });

  const registrations = data || [];

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.registrations.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] }); toast.success('Disetujui'); },
    onError: () => toast.error('Gagal menyetujui pendaftaran'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminApi.registrations.reject(id, { rejection_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] });
      toast.success('Ditolak');
      setRejectTarget(null);
      setRejectReason('');
    },
    onError: () => toast.error('Gagal menolak pendaftaran'),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: number[]) => adminApi.registrations.bulkApprove(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] });
      toast.success(`${selectedIds.length} pendaftaran disetujui`);
      setSelectedIds([]);
    },
    onError: () => toast.error('Gagal menyetujui pendaftaran secara massal'),
  });

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const submitReject = () => {
    const reason = rejectReason.trim();
    if (reason.length < 5) {
      toast.error('Alasan minimal 5 karakter');
      return;
    }
    if (rejectTarget !== null) {
      rejectMutation.mutate({ id: rejectTarget.id, reason });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader title="Pendaftaran KKN" subtitle="Kelola pendaftaran mahasiswa" />

      {periodeId && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          <span className="font-semibold">
            Filter periode aktif:
            {' '}
            {periodeName || `#${periodeId}`}
          </span>
          <Link href="/admin/pendaftaran" className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-100">
            Tampilkan semua
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="search-pendaftaran" className="sr-only">Cari pendaftaran</label>
        <input
          id="search-pendaftaran"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari NIM/Nama..."
          autoComplete="off"
          className="w-64 h-10 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold"
        />
        <label htmlFor="filter-status" className="sr-only">Filter status</label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setBulkApproveConfirm(true)}
            disabled={bulkApproveMutation.isPending}
            className="h-10 px-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase hover:bg-emerald-700 disabled:opacity-50"
          >
            Setujui {selectedIds.length} Terpilih
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : isError ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center space-y-3">
          <p className="text-sm font-bold text-rose-700">Gagal memuat data pendaftaran.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : registrations.length === 0 ? (
        <EmptyState icon={<ClipboardList size={48} />} title="Tidak ada pendaftaran" />
      ) : (
        <div className="space-y-3">
          {registrations.map((r) => {
            const mhs = r.mahasiswa as Record<string, unknown> | undefined;
            return (
              <div key={String(r.id)} className="flex items-start gap-3 bg-white rounded-2xl p-5 ring-1 ring-slate-200 shadow-sm">
                <input
                  type="checkbox"
                  aria-label={`Pilih pendaftaran ${String(mhs?.nama || '-')}`}
                  checked={selectedIds.includes(r.id as number)}
                  onChange={() => toggleSelect(r.id as number)}
                  className="mt-1 h-5 w-5"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-slate-900">{String(mhs?.nama || '-')}</p>
                      <p className="text-xs text-slate-500">
                        NIM: {String(mhs?.nim || '-')} | {String((mhs?.fakultas as Record<string, unknown>)?.nama || '-')}
                      </p>
                    </div>
                    <StatusBadge status={String(r.status || '')} />
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        disabled={approveMutation.isPending}
                        onClick={() => setApproveConfirm(r)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} /> Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRejectTarget(r); setRejectReason(''); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-black hover:bg-rose-200"
                      >
                        <XCircle size={12} /> Tolak
                      </button>
                      <Link href={`/admin/pendaftaran/${r.id}`} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200">
                        Detail →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve single confirmation */}
      <ConfirmDialog
        open={approveConfirm !== null}
        onClose={() => setApproveConfirm(null)}
        onConfirm={() => {
          if (approveConfirm !== null) {
            approveMutation.mutate(approveConfirm.id);
          }
        }}
        title="Setujui Pendaftaran"
        description={
          approveConfirm
            ? `Setujui pendaftaran ${approveConfirm.mahasiswa?.nama ?? '-'} (NIM ${approveConfirm.mahasiswa?.nim ?? '-'})?`
            : ''
        }
        confirmText="Setujui"
        variant="info"
      />

      {/* Bulk approve confirmation */}
      <ConfirmDialog
        open={bulkApproveConfirm}
        onClose={() => setBulkApproveConfirm(false)}
        onConfirm={() => bulkApproveMutation.mutate(selectedIds)}
        title={`Setujui ${selectedIds.length} Pendaftaran`}
        description={`${selectedIds.length} pendaftaran akan disetujui sekaligus. Lanjutkan?`}
        confirmText="Setujui Semua"
        variant="info"
      />

      {/* Reject modal dengan text-area (gantikan native prompt) */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setRejectTarget(null); setRejectReason(''); } }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setRejectTarget(null); setRejectReason(''); } }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="reject-title" className="font-black text-slate-900 text-lg">Tolak Pendaftaran</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {rejectTarget.mahasiswa?.nama ?? '-'} (NIM {rejectTarget.mahasiswa?.nim ?? '-'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                aria-label="Tutup"
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label htmlFor="reject-reason" className="text-[10px] font-black text-slate-500 uppercase">
                Alasan Penolakan <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan (akan terlihat oleh mahasiswa)..."
                rows={4}
                minLength={5}
                maxLength={500}
                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm resize-none"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">{rejectReason.length}/500 karakter (min 5)</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitReject}
                disabled={rejectMutation.isPending || rejectReason.trim().length < 5}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Menolak...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
