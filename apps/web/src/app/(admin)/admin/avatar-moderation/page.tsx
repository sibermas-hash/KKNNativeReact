'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Camera, AlertCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/ui/shared';

type PendingAvatar = {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  reviewed_at: string | null;
  updated_at: string;
};

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_LABELS: Record<FilterStatus, string> = {
  pending: 'Menunggu Review',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  all: 'Semua',
};

export default function AvatarModerationPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'avatar-moderation', filter],
    queryFn: async () => {
      const res = await api.get('/admin/avatar-moderation', { params: { status: filter } });
      return (res as unknown as { data?: unknown })?.data ?? res;
    },
  });

  const approve = useMutation({
    mutationFn: (userId: number) => api.patch(`/admin/avatar-moderation/${userId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'avatar-moderation'] });
      toast.success('Foto disetujui');
    },
    onError: () => toast.error('Gagal menyetujui foto'),
  });

  const reject = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      api.patch(`/admin/avatar-moderation/${userId}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'avatar-moderation'] });
      toast.success('Foto ditolak, user akan diminta upload ulang');
      setRejectingId(null);
      setRejectReason('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { errors?: { reason?: string[] }; message?: string } } })?.response?.data?.errors?.reason?.[0] || (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Gagal menolak foto');
    },
  });

  const avatars: PendingAvatar[] = ((data as { data?: unknown })?.data ?? []) as PendingAvatar[];
  const meta = (data as { meta?: { current_page: number; last_page: number; total: number } })?.meta;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <PageHeader
        title="Moderasi Foto Profil"
        subtitle="Review foto yang menunggu verifikasi manual (Layer 4 - PRD_AVATAR_VALIDATION)"
      />

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-slate-500" />
        <div>
          <p className="font-semibold">Kriteria foto profil resmi:</p>
          <p className="mt-1 text-xs text-slate-600">
            1. Latar belakang <strong>MERAH</strong> polos · 2. Mengenakan <strong>Jas Almamater UIN</strong> · 3. Pose formal, wajah lurus ke kamera, tanpa kacamata hitam, rambut/hijab rapi.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
              filter === s
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : avatars.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Camera size={40} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Tidak ada foto dengan status {STATUS_LABELS[filter].toLowerCase()}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col"
            >
              {/* Photo preview */}
              <div className="aspect-[3/4] bg-slate-100 relative">
                {avatar.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar.avatar_url}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Camera size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={avatar.status} />
                </div>
              </div>

              {/* User info */}
              <div className="p-4 space-y-2 flex-1 flex flex-col">
                <div>
                  <p className="text-sm font-bold text-slate-800 truncate">{avatar.name}</p>
                  <p className="text-xs text-slate-500 truncate">{avatar.username} · {avatar.email}</p>
                </div>

                {avatar.reason && (
                  <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                    <span className="font-semibold">Catatan: </span>{avatar.reason}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Diupload: {new Date(avatar.updated_at).toLocaleString('id-ID')}
                </p>

                {/* Actions */}
                <div className="mt-auto pt-2">
                  {avatar.status === 'pending' ? (
                    rejectingId === avatar.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Alasan penolakan (min 5 karakter)"
                          rows={2}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => reject.mutate({ userId: avatar.id, reason: rejectReason })}
                            disabled={rejectReason.length < 5 || reject.isPending}
                            className="flex-1 rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            Konfirmasi Tolak
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approve.mutate(avatar.id)}
                          disabled={approve.isPending}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} /> Setujui
                        </button>
                        <button
                          onClick={() => setRejectingId(avatar.id)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-rose-50 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <XCircle size={14} /> Tolak
                        </button>
                      </div>
                    )
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      {avatar.reviewed_at && `Direview: ${new Date(avatar.reviewed_at).toLocaleString('id-ID')}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.total > 0 && (
        <p className="text-center text-xs text-slate-500">
          Menampilkan {avatars.length} dari {meta.total} foto
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const config = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-900', icon: Clock, label: 'Pending' },
    approved: { bg: 'bg-emerald-100', text: 'text-emerald-900', icon: CheckCircle2, label: 'Disetujui' },
    rejected: { bg: 'bg-rose-100', text: 'text-rose-900', icon: XCircle, label: 'Ditolak' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${c.bg} ${c.text}`}>
      <Icon size={10} /> {c.label}
    </span>
  );
}
