'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/shared';
import {
  AlertCircle, Calendar, CheckCircle2, Clock, FileCheck, FileUp,
  MapPin, RefreshCw, Trash2, Users, XCircle,
} from 'lucide-react';

type UploadedDoc = { document_type?: string; field?: string; file_name?: string; status?: string; uploaded_at?: string };
type Registration = {
  id: number;
  mahasiswa_id: number;
  periode_id: number;
  kelompok_id: number | null;
  status: string;
  role: string | null;
  notes: string | null;
  rejection_reason: string | null;
  registration_date: string | null;
  approved_at: string | null;
  revision_count: number;
  joined_group_at: string | null;
  notification_shown: boolean;
  periode: { id: number; name: string; start_date?: string; end_date?: string } | null;
  kelompok: { id: number; nama_kelompok: string; code?: string; location?: { full_name?: string } } | null;
  dokumen?: UploadedDoc[];
  document_summary?: { required_count?: number; uploaded_count?: number; missing_labels?: string[]; flags?: Record<string, boolean> };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'Menunggu Verifikasi', color: 'text-amber-700', bg: 'bg-amber-50 ring-amber-200', icon: Clock },
  document_submitted: { label: 'Dokumen Dikirim', color: 'text-blue-700', bg: 'bg-blue-50 ring-blue-200', icon: FileCheck },
  approved: { label: 'Disetujui', color: 'text-emerald-700', bg: 'bg-emerald-50 ring-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Ditolak', color: 'text-rose-700', bg: 'bg-rose-50 ring-rose-200', icon: XCircle },
  completed: { label: 'Selesai', color: 'text-indigo-700', bg: 'bg-indigo-50 ring-indigo-200', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', color: 'text-slate-600', bg: 'bg-slate-50 ring-slate-200', icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ring-1 ${config.bg} ${config.color}`}>
      <Icon size={13} /> {config.label}
    </span>
  );
}

function RegistrationCard({ reg, onCancel, isCancelling }: { reg: Registration; onCancel: () => void; isCancelling: boolean }) {
  const summary = reg.document_summary;
  const missing = summary?.missing_labels ?? [];
  const requiredCount = summary?.required_count ?? 0;
  const uploadedCount = summary?.uploaded_count ?? (reg.dokumen?.length ?? 0);
  const isRejected = reg.status === 'rejected';
  const isPending = reg.status === 'pending';
  const isDocSubmitted = reg.status === 'document_submitted';
  const isApproved = reg.status === 'approved';
  const canResubmit = isRejected;
  const canCancel = (isPending || isDocSubmitted) && !reg.kelompok_id;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {/* Status Header */}
      <div className={`px-6 py-4 ${isApproved ? 'bg-emerald-50' : isRejected ? 'bg-rose-50' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-between">
          <StatusBadge status={reg.status} />
          {reg.registration_date && (
            <span className="text-xs text-slate-500">
              <Calendar size={11} className="mr-1 inline" />
              {new Date(reg.registration_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 px-6 py-5">
        {/* Period Info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Periode</p>
          <p className="mt-0.5 text-lg font-bold text-slate-800">{reg.periode?.name || '-'}</p>
          {reg.periode?.start_date && (
            <p className="mt-0.5 text-xs text-slate-500">
              Pelaksanaan: {reg.periode.start_date} — {reg.periode.end_date}
            </p>
          )}
        </div>

        {/* Group Info (if assigned) */}
        {reg.kelompok && (
          <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Users size={12} /> Kelompok
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-900">{reg.kelompok.nama_kelompok}</p>
            {reg.kelompok.location?.full_name && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600">
                <MapPin size={11} /> {reg.kelompok.location.full_name}
              </p>
            )}
          </div>
        )}

        {/* Rejection Reason */}
        {isRejected && reg.rejection_reason && (
          <div className="rounded-xl bg-rose-50 p-4 ring-1 ring-rose-100">
            <p className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
              <AlertCircle size={12} /> Alasan Penolakan
            </p>
            <p className="mt-1 text-sm text-rose-800 italic">&ldquo;{reg.rejection_reason}&rdquo;</p>
            {reg.revision_count > 0 && (
              <p className="mt-2 text-xs text-rose-600">Revisi ke-{reg.revision_count}</p>
            )}
          </div>
        )}

        {/* Pending/DocSubmitted Info */}
        {(isPending || isDocSubmitted) && (
          <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <Clock size={12} /> Menunggu Verifikasi
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {isPending
                ? 'Pendaftaran Anda sedang dalam antrian verifikasi. Silakan upload dokumen persyaratan jika belum.'
                : 'Dokumen Anda sedang diperiksa oleh admin. Harap menunggu.'}
            </p>
          </div>
        )}


        {/* Document Summary */}
        {requiredCount > 0 && (
          <div className="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-100">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
              <FileUp size={12} /> Dokumen Persyaratan
            </p>
            <p className="mt-1 text-sm text-blue-800">{uploadedCount} dari {requiredCount} dokumen sudah diunggah.</p>
            {missing.length > 0 && (
              <div className="mt-2 rounded-lg bg-white/70 p-3 text-xs text-blue-900">
                <p className="font-bold">Belum diunggah:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {missing.map((label) => <li key={label}>{label}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Approved Info */}
        {isApproved && (
          <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={12} /> Pendaftaran Disetujui
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              Selamat! Pendaftaran KKN Anda telah disetujui. {reg.kelompok ? 'Anda sudah ditempatkan di kelompok.' : 'Penempatan kelompok akan segera diproses.'}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4">
        {canResubmit && (
          <Link
            href={`/mahasiswa/pendaftaran/${reg.periode_id}/dokumen`}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md"
          >
            <FileUp size={14} /> Upload Ulang Berkas
          </Link>
        )}
        {(isPending || isDocSubmitted) && (
          <Link
            href={`/mahasiswa/pendaftaran/${reg.periode_id}/dokumen`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            <FileUp size={14} /> {isDocSubmitted ? 'Lihat / Perbarui Dokumen' : 'Upload Dokumen'}
          </Link>
        )}
        {isApproved && (
          <Link
            href="/mahasiswa/program-kerja"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
          >
            <CheckCircle2 size={14} /> Lihat Program Kerja
          </Link>
        )}
        {canCancel && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-50"
          >
            <Trash2 size={14} /> {isCancelling ? 'Membatalkan...' : 'Batalkan Pendaftaran'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RegistrationStatusPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.registration.status,
    queryFn: async () => {
      const res = await studentApi.registration.status();
      return ((res as unknown as { data?: unknown })?.data ?? res) as Record<string, unknown>;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (periodeId: number) => studentApi.registration.leave(periodeId),
    onSuccess: () => {
      toast.success('Pendaftaran berhasil dibatalkan');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.registration.status });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.kknDaftar });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || 'Gagal membatalkan pendaftaran');
    },
  });

  const registrations = ((data as unknown as { registrations?: Registration[] })?.registrations as Registration[]) || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
          <FileCheck size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Status Pendaftaran</h1>
          <p className="text-sm text-slate-500">Pantau status pendaftaran KKN Anda.</p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-teal-500" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
          <FileCheck size={48} className="mx-auto text-slate-300" />
          <p className="mt-4 text-lg font-bold text-slate-700">Belum Pernah Mendaftar</p>
          <p className="mt-2 text-sm text-slate-500">Anda belum mendaftar KKN di periode manapun.</p>
          <Link
            href="/mahasiswa/pendaftaran"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-700"
          >
            Daftar KKN
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <RegistrationCard
              key={reg.id}
              reg={reg}
              onCancel={() => setCancelTarget(reg.periode_id)}
              isCancelling={cancelMutation.isPending}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Batalkan Pendaftaran"
        description="Yakin ingin membatalkan pendaftaran ini? Tindakan ini tidak dapat diurungkan."
        confirmText="Ya, Batalkan"
        variant="danger"
        onConfirm={() => {
          if (cancelTarget !== null) {
            cancelMutation.mutate(cancelTarget);
            setCancelTarget(null);
          }
        }}
      />
    </div>
  );
}
