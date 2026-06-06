"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@sibermas/constants";
import { studentApi } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/shared";
import { useTheme } from "@/components/ui/theme-provider";
import { PRIMARY_CLASS, SOFT_CLASS } from "@/lib/theme-config";
import {
  AlertCircle, Calendar, CheckCircle2, Clock, FileCheck, FileUp,
  MapPin, RefreshCw, Trash2, Users, XCircle,
} from "lucide-react";

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
  pending: { label: "Menunggu Verifikasi", color: "text-[color:var(--profile-warning-text)]", bg: "bg-[color:var(--profile-warning)]", icon: Clock },
  document_submitted: { label: "Dokumen Dikirim", color: "text-[color:var(--profile-soft-text)]", bg: "bg-[color:var(--profile-soft)]", icon: FileCheck },
  approved: { label: "Disetujui", color: "text-[color:var(--profile-soft-text)]", bg: "bg-[color:var(--profile-soft)]", icon: CheckCircle2 },
  rejected: { label: "Ditolak", color: "text-[color:var(--profile-danger-text)]", bg: "bg-[color:var(--profile-danger)]", icon: XCircle },
  completed: { label: "Selesai", color: "text-[color:var(--profile-soft-text)]", bg: "bg-[color:var(--profile-soft)]", icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", color: "text-[color:var(--profile-muted)]", bg: "bg-[color:var(--profile-soft)]", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ring-1 ring-[color:var(--profile-border)] ${config.bg} ${config.color}`}>
      <Icon size={13} /> {config.label}
    </span>
  );
}

function RegistrationCard({ reg, onCancel, isCancelling }: { reg: Registration; onCancel: () => void; isCancelling: boolean }) {
  const summary = reg.document_summary;
  const missing = summary?.missing_labels ?? [];
  const requiredCount = summary?.required_count ?? 0;
  const uploadedCount = summary?.uploaded_count ?? (reg.dokumen?.length ?? 0);
  const isRejected = reg.status === "rejected";
  const isPending = reg.status === "pending";
  const isDocSubmitted = reg.status === "document_submitted";
  const isApproved = reg.status === "approved";
  const canResubmit = isRejected;
  const canCancel = (isPending || isDocSubmitted) && !reg.kelompok_id;

  const { config: themeConfig, surfaceClass } = useTheme();

  return (
    <div 
      className={`overflow-hidden border border-[color:var(--profile-border)] ${themeConfig.shadow} ${surfaceClass}`}
      style={{ borderRadius: 'var(--profile-radius)' }}
    >
      {/* Status Header */}
      <div className="px-6 py-4 border-b border-[color:var(--profile-border)] bg-[color:var(--profile-surface-strong)]">
        <div className="flex items-center justify-between">
          <StatusBadge status={reg.status} />
          {reg.registration_date && (
            <span className="text-xs text-[color:var(--profile-muted)]">
              <Calendar size={11} className="mr-1 inline" />
              {new Date(reg.registration_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 px-6 py-5">
        {/* Period Info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--profile-muted)]">Periode</p>
          <p className="mt-0.5 text-lg font-bold text-[color:var(--profile-text)]">{reg.periode?.name || "-"}</p>
          {reg.periode?.start_date && (
            <p className="mt-0.5 text-xs text-[color:var(--profile-muted)]">
              Pelaksanaan: {reg.periode.start_date} — {reg.periode.end_date}
            </p>
          )}
        </div>

        {/* Group Info (if assigned) */}
        {reg.kelompok && (
          <div className="rounded-xl bg-[color:var(--profile-soft)] p-4 ring-1 ring-[color:var(--profile-border)]">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--profile-soft-text)]">
              <Users size={12} /> Kelompok
            </p>
            <p className="mt-1 text-sm font-bold text-[color:var(--profile-text)]">{reg.kelompok.nama_kelompok}</p>
            {reg.kelompok.location?.full_name && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[color:var(--profile-soft-text)]">
                <MapPin size={11} /> {reg.kelompok.location.full_name}
              </p>
            )}
          </div>
        )}

        {/* Rejection Reason */}
        {isRejected && reg.rejection_reason && (
          <div className="rounded-xl bg-[color:var(--profile-danger)] p-4 ring-1 ring-[color:var(--profile-border)]">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[color:var(--profile-danger-text)]">
              <AlertCircle size={12} /> Alasan Penolakan
            </p>
            <p className="mt-1 text-sm text-[color:var(--profile-danger-text)] opacity-90 italic">&ldquo;{reg.rejection_reason}&rdquo;</p>
            {reg.revision_count > 0 && (
              <p className="mt-2 text-xs text-[color:var(--profile-danger-text)] opacity-80">Revisi ke-{reg.revision_count}</p>
            )}
          </div>
        )}

        {/* Pending/DocSubmitted Info */}
        {(isPending || isDocSubmitted) && (
          <div className="rounded-xl bg-[color:var(--profile-warning)] p-4 ring-1 ring-[color:var(--profile-border)]">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[color:var(--profile-warning-text)]">
              <Clock size={12} /> Menunggu Verifikasi
            </p>
            <p className="mt-1 text-sm text-[color:var(--profile-warning-text)] opacity-90">
              {isPending
                ? "Pendaftaran Anda sedang dalam antrian verifikasi. Silakan upload dokumen persyaratan jika belum."
                : "Dokumen Anda sedang diperiksa oleh admin. Harap menunggu."}
            </p>
          </div>
        )}

        {/* Document Summary */}
        {requiredCount > 0 && (
          <div className="rounded-xl bg-[color:var(--profile-soft)] p-4 ring-1 ring-[color:var(--profile-border)]">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--profile-soft-text)]">
              <FileUp size={12} /> Dokumen Persyaratan
            </p>
            <p className="mt-1 text-sm text-[color:var(--profile-soft-text)] opacity-90">{uploadedCount} dari {requiredCount} dokumen sudah diunggah.</p>
            {missing.length > 0 && (
              <div className="mt-2 rounded-lg bg-[color:var(--profile-surface)]/70 p-3 text-xs text-[color:var(--profile-text)]">
                <p className="font-bold text-[color:var(--profile-soft-text)]">Belum diunggah:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[color:var(--profile-muted)]">
                  {missing.map((label) => <li key={label}>{label}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Approved Info */}
        {isApproved && (
          <div className="rounded-xl bg-[color:var(--profile-soft)] p-4 ring-1 ring-[color:var(--profile-border)]">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[color:var(--profile-soft-text)]">
              <CheckCircle2 size={12} /> Pendaftaran Disetujui
            </p>
            <p className="mt-1 text-sm text-[color:var(--profile-soft-text)] opacity-90">
              Selamat! Pendaftaran KKN Anda telah disetujui. {reg.kelompok ? "Anda sudah ditempatkan di kelompok." : "Penempatan kelompok akan segera diproses."}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[color:var(--profile-border)] bg-[color:var(--profile-surface-strong)] px-6 py-4">
        {canResubmit && (
          <Link
            href={`/mahasiswa-v2/pendaftaran/${reg.periode_id}/dokumen`}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${PRIMARY_CLASS}`}
          >
            <FileUp size={14} /> Upload Ulang Berkas
          </Link>
        )}
        {(isPending || isDocSubmitted) && (
          <Link
            href={`/mahasiswa-v2/pendaftaran/${reg.periode_id}/dokumen`}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${PRIMARY_CLASS}`}
          >
            <FileUp size={14} /> {isDocSubmitted ? "Lihat / Perbarui Dokumen" : "Upload Dokumen"}
          </Link>
        )}
        {isApproved && (
          <Link
            href="/mahasiswa-v2/program-kerja"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${PRIMARY_CLASS}`}
          >
            <CheckCircle2 size={14} /> Lihat Program Kerja
          </Link>
        )}
        {canCancel && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className={`inline-flex items-center gap-2 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-danger)] px-4 py-2.5 text-sm font-bold text-[color:var(--profile-danger-text)] transition-all hover:opacity-90 disabled:opacity-50`}
          >
            <Trash2 size={14} /> {isCancelling ? "Membatalkan..." : "Batalkan Pendaftaran"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RegistrationStatusPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const { config: themeConfig, surfaceClass } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.registration.status,
    queryFn: async () => {
      const res = await studentApi.registration.status();
      return res as unknown as Record<string, unknown>;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (periodeId: number) => studentApi.registration.leave(periodeId),
    onSuccess: () => {
      toast.success("Pendaftaran berhasil dibatalkan");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.registration.status });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.kknDaftar });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e?.response?.data?.error?.message || "Gagal membatalkan pendaftaran");
    },
  });

  const registrations = ((data as unknown as { registrations?: Registration[] })?.registrations as Registration[]) || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--profile-primary)] text-white shadow-lg">
          <FileCheck size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[color:var(--profile-text)] uppercase">Status Pendaftaran</h1>
          <p className="text-sm text-[color:var(--profile-muted)]">Pantau status pendaftaran KKN Anda.</p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-[color:var(--profile-primary)]" />
        </div>
      ) : registrations.length === 0 ? (
        <div 
          className={`border border-[color:var(--profile-border)] p-12 text-center ${themeConfig.shadow} ${surfaceClass}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <FileCheck size={48} className="mx-auto text-[color:var(--profile-muted)] opacity-60" />
          <p className="mt-4 text-lg font-bold text-[color:var(--profile-text)]">Belum Pernah Mendaftar</p>
          <p className="mt-2 text-sm text-[color:var(--profile-muted)]">Anda belum mendaftar KKN di periode manapun.</p>
          <Link
            href="/mahasiswa-v2/pendaftaran"
            className={`mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black ${PRIMARY_CLASS}`}
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
