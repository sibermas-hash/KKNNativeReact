'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardList, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/shared';

interface Registration {
  id: number;
  status: string;
  max_kelompok_kkn: number;
  workshop_passed: boolean;
  created_at: string;
  rejection_reason?: string;
  dosen: {
    id: number;
    nama: string;
    nip?: string;
    user_id: number;
    fakultas?: { name?: string; nama?: string };
  };
  periode?: { name: string };
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface Meta { current_page: number; last_page: number; total: number; per_page: number }

export default function DplRegistrationPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState<{ id: number; nama: string; reason: string } | null>(null);

  const { data, isLoading } = useQuery<{ registrations: Registration[]; stats: Stats; meta?: Meta }>({
    queryKey: ['admin', 'dpl-registration', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('per_page', '25');
      const res = await rawApi.get(`/admin/dosen/pendaftaran-dpl?${params}`);
      return ((res.data as { data?: unknown }).data ?? res.data) as { registrations: Registration[]; stats: Stats };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => rawApi.patch(`/admin/dosen/pendaftaran-dpl/${id}/setujui`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dpl-registration'] });
      toast.success('DPL berhasil disetujui dan diaktifkan');
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Gagal menyetujui'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rawApi.patch(`/admin/dosen/pendaftaran-dpl/${id}/tolak`, { rejection_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dpl-registration'] });
      toast.success('Pendaftaran DPL ditolak');
      setRejectModal(null);
    },
    onError: () => toast.error('Gagal menolak'),
  });

  const registrations = data?.registrations ?? [];
  const stats = data?.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pendaftaran DPL"
        subtitle="Verifikasi pendaftaran Dosen Pembimbing Lapangan. Hanya dosen yang sudah lulus Workshop yang boleh mendaftar."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Menunggu', value: stats.pending, color: 'bg-amber-50 text-amber-700' },
          { label: 'Disetujui', value: stats.approved, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Ditolak', value: stats.rejected, color: 'bg-rose-50 text-rose-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{s.label}</p>
            <p className="text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm focus:border-cyan-500 outline-none" placeholder="Cari nama dosen..." />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:border-cyan-500 outline-none">
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : registrations.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-bold text-slate-600">Belum ada pendaftaran DPL</p>
          <p className="text-xs text-slate-400 mt-1">Dosen yang sudah lulus workshop dapat mendaftar sebagai DPL melalui portal dosen.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Nama Dosen</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Fakultas</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Workshop</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Maks Kelompok</th>
                <th className="p-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {registrations.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{r.dosen?.nama || '-'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{r.dosen?.nip || '-'}</p>
                  </td>
                  <td className="p-4 text-xs text-slate-600">{r.dosen?.fakultas?.name || r.dosen?.fakultas?.nama || '-'}</td>
                  <td className="p-4">
                    {r.workshop_passed ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} /> LULUS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-600 border border-rose-200">
                        <XCircle size={12} /> BELUM
                      </span>
                    )}
                  </td>
                  <td className="p-4"><StatusBadge status={r.status} /></td>
                  <td className="p-4 text-xs font-bold text-slate-700">{r.max_kelompok_kkn}</td>
                  <td className="p-4">
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMutation.mutate(r.id)}
                          disabled={approveMutation.isPending || !r.workshop_passed}
                          title={!r.workshop_passed ? 'Dosen belum lulus workshop' : 'Setujui pendaftaran'}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-200"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: r.id, nama: r.dosen?.nama || '', reason: '' })}
                          disabled={rejectMutation.isPending}
                          className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-40 border border-rose-200"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                    {r.status === 'rejected' && r.rejection_reason && (
                      <p className="text-[10px] text-rose-500 max-w-[200px] truncate" title={r.rejection_reason}>Alasan: {r.rejection_reason}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Prev</button>
          <span className="text-xs text-slate-500">{meta.current_page} / {meta.last_page} • {meta.total} pendaftaran</span>
          <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-30">Next</button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-black text-slate-900">Tolak Pendaftaran DPL</h3>
            <p className="mt-1 text-sm text-slate-600">Pendaftaran <strong>{rejectModal.nama}</strong> akan ditolak.</p>
            <textarea
              value={rejectModal.reason}
              onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
              className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-300"
              placeholder="Tuliskan alasan penolakan..."
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold">Batal</button>
              <button
                onClick={() => {
                  if (!rejectModal.reason.trim()) { toast.error('Alasan wajib diisi'); return; }
                  rejectMutation.mutate({ id: rejectModal.id, reason: rejectModal.reason });
                }}
                disabled={rejectMutation.isPending}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-xs text-cyan-800">
        <p className="font-bold">Alur Pendaftaran DPL</p>
        <ol className="mt-1 list-decimal pl-4 space-y-0.5">
          <li>Dosen mengikuti <strong>Workshop & Pembekalan</strong> dan dinyatakan lulus.</li>
          <li>Dosen mendaftar sebagai DPL melalui portal dosen.</li>
          <li>Admin memverifikasi dan menyetujui pendaftaran di halaman ini.</li>
          <li>Dosen yang disetujui dapat ditugaskan ke kelompok KKN.</li>
        </ol>
        <p className="mt-2 text-[10px] text-cyan-600">Tombol "Setujui" tidak aktif jika dosen belum lulus workshop.</p>
      </div>
    </div>
  );
}
