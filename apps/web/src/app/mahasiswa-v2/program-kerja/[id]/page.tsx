'use client';

import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Loader2,
  Calendar,
  Target,
  Users,
  Wallet,
  Globe,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  History,
  Tag,
} from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';

type ProposalRevision = {
  id: number;
  version?: number;
  status?: string;
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
};

type WorkProgram = {
  id: number;
  code?: string;
  title?: string;
  description?: string;
  objectives?: string;
  status?: string;
  kategori?: string;
  abcd_stage?: string;
  sdg_goals?: number[];
  target_participants?: number;
  budget?: number;
  start_date?: string;
  end_date?: string;
  location?: string;
  submitted_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  proposal_url?: string;
  proposal_filename?: string;
  proposal_revisions?: ProposalRevision[];
  kelompok?: { nama_kelompok?: string; lokasi?: { village_name?: string } };
  created_by?: { name?: string };
};

const STATUS_INFO: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  approved: { label: 'Disetujui', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40', icon: CheckCircle2 },
  pending: { label: 'Menunggu Review', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40', icon: Clock },
  submitted: { label: 'Menunggu Review', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40', icon: Clock },
  revision: { label: 'Perlu Revisi', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/40', icon: AlertCircle },
  rejected: { label: 'Ditolak', cls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700', icon: XCircle },
  draft: { label: 'Draft', cls: 'bg-slate-50 text-slate-650 border-slate-205 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800', icon: FileText },
};

function formatRupiah(n?: number): string {
  if (!n) return 'Rp -';
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(s?: string): string {
  if (!s) return '-';
  try {
    return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return s;
  }
}

export default function WorkProgramDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { config: themeConfig, surfaceClass } = useTheme();

  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'work-program', Number(id)],
    queryFn: async () => {
      const res = await studentApi.workPrograms.show(Number(id));
      return res as unknown as WorkProgram;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--profile-primary)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link 
          href="/mahasiswa-v2/program-kerja" 
          className="text-sm font-bold text-[color:var(--profile-muted)] hover:text-[color:var(--profile-accent)] inline-flex items-center gap-1 mb-4"
        >
          <ChevronLeft size={16} /> Kembali
        </Link>
        <div 
          className={`border p-10 text-center ${surfaceClass} ${themeConfig.shadow}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <XCircle className="h-12 w-12 text-rose-450 mx-auto mb-3" />
          <p className="font-black text-[color:var(--profile-text)]">Program Tidak Ditemukan</p>
          <p className="text-sm text-[color:var(--profile-muted)] mt-1 font-medium">Program kerja yang Anda cari tidak tersedia atau Anda tidak memiliki akses.</p>
        </div>
      </div>
    );
  }

  const status = (data.status ?? 'pending').toLowerCase();
  const statusInfo = STATUS_INFO[status] ?? STATUS_INFO.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/mahasiswa-v2/program-kerja"
        className="text-sm font-bold text-[color:var(--profile-muted)] hover:text-[color:var(--profile-accent)] inline-flex items-center gap-1"
      >
        <ChevronLeft size={16} /> Kembali ke Program Kerja
      </Link>

      {/* Header card */}
      <div 
        className={`border p-6 ${surfaceClass} ${themeConfig.shadow}`}
        style={{ borderRadius: 'var(--profile-radius)' }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            {data.code && (
              <span className="inline-block text-xs font-black text-blue-750 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 px-2 py-0.5 rounded-lg mb-2">
                {data.code}
              </span>
            )}
            <h1 className="text-2xl font-black text-[color:var(--profile-text)] leading-tight">{data.title ?? 'Tanpa Judul'}</h1>
            {data.kelompok && (
              <p className="mt-1 text-sm text-[color:var(--profile-muted)] font-semibold">
                {data.kelompok.nama_kelompok}
                {data.kelompok.lokasi?.village_name ? ` • ${data.kelompok.lokasi.village_name}` : ''}
              </p>
            )}
          </div>
          <span className={'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ' + statusInfo.cls}>
            <StatusIcon size={12} /> {statusInfo.label}
          </span>
        </div>

        {/* Quick stats grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.kategori && (
            <Stat icon={<Tag size={14} />} label="Kategori" value={data.kategori} />
          )}
          {data.abcd_stage && (
            <Stat icon={<Target size={14} />} label="ABCD" value={data.abcd_stage} />
          )}
          {data.target_participants !== undefined && (
            <Stat icon={<Users size={14} />} label="Target" value={`${data.target_participants}`} />
          )}
          {data.budget !== undefined && (
            <Stat icon={<Wallet size={14} />} label="Anggaran" value={formatRupiah(data.budget)} />
          )}
        </div>

        {/* SDGs */}
        {Array.isArray(data.sdg_goals) && data.sdg_goals.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-wider text-[color:var(--profile-muted)] mb-2 inline-flex items-center gap-1">
              <Globe size={12} /> SDG Goals
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.sdg_goals.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 text-xs font-black text-blue-750 dark:text-blue-400"
                >
                  SDG {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {data.description && (
        <Section title="Deskripsi">
          <p className="text-sm text-[color:var(--profile-text)] opacity-90 font-medium whitespace-pre-wrap leading-relaxed">{data.description}</p>
        </Section>
      )}

      {/* Objectives */}
      {data.objectives && (
        <Section title="Tujuan">
          <p className="text-sm text-[color:var(--profile-text)] opacity-90 font-medium whitespace-pre-wrap leading-relaxed">{data.objectives}</p>
        </Section>
      )}

      {/* Schedule */}
      {(data.start_date || data.end_date || data.location) && (
        <Section title="Pelaksanaan">
          <div className="space-y-2 text-sm text-[color:var(--profile-text)] font-semibold">
            {(data.start_date || data.end_date) && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[color:var(--profile-muted)] shrink-0" />
                <span>{formatDate(data.start_date)} {data.end_date ? `→ ${formatDate(data.end_date)}` : ''}</span>
              </div>
            )}
            {data.location && (
              <div className="flex items-center gap-2">
                <Target size={14} className="text-[color:var(--profile-muted)] shrink-0" />
                <span>{data.location}</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Proposal */}
      {data.proposal_url && (
        <Section title="Proposal">
          <a
            href={data.proposal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 px-4 py-2.5 border border-blue-200 dark:border-blue-800/40 text-xs font-black text-blue-750 dark:text-blue-450 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors uppercase tracking-wider"
          >
            <Download size={14} />
            {data.proposal_filename ?? 'Lihat Proposal'}
          </a>
        </Section>
      )}

      {/* Rejection reason */}
      {status === 'rejected' && data.rejection_reason && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-1.5">Alasan Penolakan</p>
          <p className="text-sm text-rose-900 dark:text-rose-400 font-semibold">{data.rejection_reason}</p>
        </div>
      )}

      {/* Revisions */}
      {Array.isArray(data.proposal_revisions) && data.proposal_revisions.length > 0 && (
        <Section title="Riwayat Revisi" icon={<History size={14} />}>
          <ol className="space-y-3">
            {data.proposal_revisions.map((r) => {
              const ri = STATUS_INFO[(r.status ?? 'pending').toLowerCase()] ?? STATUS_INFO.pending;
              return (
                <li key={r.id} className="border-l-2 border-[color:var(--profile-border)] pl-4 py-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-[color:var(--profile-text)]">v{r.version ?? '-'}</span>
                    <span className={'rounded-full border px-2 py-0.5 text-xs font-bold ' + ri.cls}>{ri.label}</span>
                    <span className="text-xs text-[color:var(--profile-muted)] font-medium">{formatDate(r.reviewed_at ?? r.created_at)}</span>
                  </div>
                  {r.reviewed_by && (
                    <p className="mt-1 text-xs text-[color:var(--profile-muted)] font-bold">Direview: {r.reviewed_by}</p>
                  )}
                  {r.notes && (
                    <p className="mt-1 text-sm text-[color:var(--profile-text)] opacity-90 italic font-semibold">&ldquo;{r.notes}&rdquo;</p>
                  )}
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      {/* Meta */}
      <div className="rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] px-4 py-3 text-xs text-[color:var(--profile-muted)] flex flex-wrap items-center gap-x-5 gap-y-1.5 font-bold">
        {data.submitted_at && <span>Diajukan: <b className="text-[color:var(--profile-text)]">{formatDate(data.submitted_at)}</b></span>}
        {data.approved_at && <span>Disetujui: <b className="text-emerald-600 dark:text-emerald-450">{formatDate(data.approved_at)}</b></span>}
        {data.created_by?.name && <span>Pembuat: <b className="text-[color:var(--profile-text)]">{data.created_by.name}</b></span>}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--profile-muted)] inline-flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="mt-0.5 text-sm font-black text-[color:var(--profile-text)] capitalize truncate">{value}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const { config: themeConfig, surfaceClass } = useTheme();
  return (
    <div 
      className={`border p-6 ${surfaceClass} ${themeConfig.shadow} space-y-3`}
      style={{ borderRadius: 'var(--profile-radius)' }}
    >
      <h2 className="text-xs font-black uppercase tracking-wider text-[color:var(--profile-primary)] inline-flex items-center gap-1.5">
        {icon} {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}
