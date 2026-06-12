'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import { Plus, Presentation, Target, Globe, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS } from '@/lib/theme-config';

type WorkProgram = {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  kategori?: string;
  abcd_stage?: string;
  sdg_goals?: number[];
  target_participants?: number;
  budget?: number;
  submitted_at?: string;
  approved_at?: string;
};

export default function WorkProgramsPage(): React.JSX.Element {
  const { config: themeConfig, surfaceClass } = useTheme();

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.student.workPrograms,
    queryFn: async () => {
      const res = await studentApi.workPrograms.index();
      const body = res;
      return body as { programs?: WorkProgram[]; data?: WorkProgram[]; message?: string };
    },
    retry: false,
  });

  const programs: WorkProgram[] = useMemo(() => {
    if (!data) return [];
    return (data.programs ?? data.data ?? []) as WorkProgram[];
  }, [data]);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = { approved: 0, pending: 0, revision: 0, rejected: 0 };
    programs.forEach((p) => {
      const s = (p.status ?? 'pending').toLowerCase();
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    });
    return byStatus;
  }, [programs]);

  // Phase-blocked: if 403 with PHASE_BLOCKED
  const isPhaseBlocked = (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error?.code === 'PHASE_BLOCKED';
  const phaseMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-[color:var(--profile-primary)] rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Presentation size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight uppercase">Program Kerja</h1>
            <p className="text-sm text-[color:var(--profile-muted)] font-semibold">
              Kelola program kerja kelompok Anda
              {programs.length > 0 ? ` • ${programs.length} program` : ''}
            </p>
          </div>
        </div>
        {!isPhaseBlocked && (
          <Link
            href="/mahasiswa/program-kerja/buat"
            className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${PRIMARY_CLASS}`}
          >
            <Plus size={16} /> Buat Program
          </Link>
        )}
      </div>

      {/* Phase blocked */}
      {isPhaseBlocked && (
        <div className="rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] p-8 text-center space-y-3 text-[color:var(--profile-warning-text)]">
          <AlertCircle className="h-12 w-12 text-[color:var(--profile-warning-text)] mx-auto" />
          <h2 className="text-lg font-black text-[color:var(--profile-warning-text)]">Belum Bisa Mengakses Program Kerja</h2>
          <p className="text-sm text-[color:var(--profile-warning-text)] opacity-90 font-medium">{phaseMessage ?? 'Fitur ini hanya tersedia saat fase pelaksanaan KKN.'}</p>
        </div>
      )}

      {/* Stats */}
      {!isPhaseBlocked && programs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Disetujui" value={stats.approved ?? 0} icon={<CheckCircle2 size={16} />} color="emerald" />
          <StatCard label="Menunggu" value={stats.pending ?? 0} icon={<Clock size={16} />} color="amber" />
          <StatCard label="Revisi" value={stats.revision ?? 0} icon={<AlertCircle size={16} />} color="rose" />
          <StatCard label="Total" value={programs.length} icon={<Target size={16} />} color="blue" />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div 
              key={i} 
              className="h-28 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" 
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isPhaseBlocked && programs.length === 0 && (
        <div 
          className={`border-2 border-dashed border-[color:var(--profile-border)] p-10 text-center space-y-3 ${surfaceClass} ${themeConfig.shadow}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <Presentation className="h-14 w-14 text-[color:var(--profile-muted)] mx-auto" />
          <p className="font-black text-[color:var(--profile-text)] text-lg">Belum Ada Program Kerja</p>
          <p className="text-sm text-[color:var(--profile-muted)] max-w-md mx-auto font-medium">
            Mulai rancang program kerja KKN kelompok Anda. Setiap program harus selaras dengan SDGs dan tahap ABCD.
          </p>
          <Link
            href="/mahasiswa/program-kerja/buat"
            className={`inline-flex items-center gap-2 mt-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${PRIMARY_CLASS}`}
          >
            <Plus size={14} /> Buat Program Kerja Pertama
          </Link>
        </div>
      )}

      {/* List */}
      {programs.length > 0 && (
        <div className="space-y-3">
          {programs.map((p) => (
            <Link
              key={p.id}
              href={`/mahasiswa/program-kerja/${p.id}`}
              className={`block p-5 border transition-all group border-[color:var(--profile-border)] hover:border-[color:var(--profile-accent)] ${surfaceClass} ${themeConfig.shadow}`}
              style={{ borderRadius: 'var(--profile-radius)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-[color:var(--profile-text)] group-hover:text-[color:var(--profile-accent)] truncate">
                    {p.title ?? 'Tanpa judul'}
                  </h3>
                  {p.description && (
                    <p className="mt-1 text-sm text-[color:var(--profile-muted)] line-clamp-2 font-medium">{p.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.kategori && (
                      <span className="rounded-full bg-[color:var(--profile-soft)] text-[color:var(--profile-text)] px-2 py-0.5 text-xs font-bold capitalize border border-[color:var(--profile-border)]">
                        {p.kategori}
                      </span>
                    )}
                    {p.abcd_stage && (
                      <span className="rounded-full bg-[color:var(--profile-soft)] text-[color:var(--profile-primary)] px-2 py-0.5 text-xs font-bold border border-[color:var(--profile-border)] capitalize">
                        {p.abcd_stage}
                      </span>
                    )}
                    {Array.isArray(p.sdg_goals) && p.sdg_goals.length > 0 && (
                      <span className="rounded-full bg-[color:var(--profile-soft)] text-[color:var(--profile-accent)] px-2 py-0.5 text-xs font-black border border-[color:var(--profile-border)] inline-flex items-center gap-1">
                        <Globe size={10} /> SDG {p.sdg_goals.slice(0, 3).join(', ')}
                        {p.sdg_goals.length > 3 && ` +${p.sdg_goals.length - 3}`}
                      </span>
                    )}
                    {p.target_participants && (
                      <span className="rounded-full bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)] px-2 py-0.5 text-xs font-bold border border-[color:var(--profile-border)]">
                        Target {p.target_participants}
                      </span>
                    )}
                  </div>
                </div>
                <StatusPill status={p.status ?? 'pending'} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'emerald' | 'amber' | 'rose' | 'blue' }) {
  const { config: themeConfig, surfaceClass } = useTheme();
  const cl = {
    emerald: 'text-[color:var(--profile-soft-text)] bg-[color:var(--profile-soft)] border-[color:var(--profile-border)]',
    amber: 'text-[color:var(--profile-warning-text)] bg-[color:var(--profile-warning)] border-[color:var(--profile-border)]',
    rose: 'text-[color:var(--profile-danger-text)] bg-[color:var(--profile-danger)] border-[color:var(--profile-border)]',
    blue: 'text-[color:var(--profile-primary)] bg-[color:var(--profile-soft)] border-[color:var(--profile-border)]',
  }[color];
  return (
    <div 
      className={`border p-4 ${surfaceClass} ${themeConfig.shadow}`}
      style={{ borderRadius: 'var(--profile-radius)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-[color:var(--profile-muted)] font-black tracking-wider">{label}</p>
        <div className={'rounded-lg p-1.5 border ' + cl}>{icon}</div>
      </div>
      <p className="text-2xl font-black mt-1 text-[color:var(--profile-text)] tabular-nums">{value.toLocaleString('id-ID')}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === 'approved'
      ? 'bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)] border-[color:var(--profile-border)]'
      : s === 'pending' || s === 'submitted'
      ? 'bg-[color:var(--profile-warning)] text-[color:var(--profile-warning-text)] border-[color:var(--profile-border)]'
      : s === 'revision' || s === 'rejected'
      ? 'bg-[color:var(--profile-danger)] text-[color:var(--profile-danger-text)] border-[color:var(--profile-border)]'
      : 'bg-[color:var(--profile-surface-strong)] text-[color:var(--profile-muted)] border-[color:var(--profile-border)]';
  const text =
    s === 'approved' ? 'Disetujui' :
    s === 'pending' || s === 'submitted' ? 'Menunggu' :
    s === 'revision' ? 'Revisi' :
    s === 'rejected' ? 'Ditolak' :
    s === 'draft' ? 'Draft' : status;
  return <span className={'shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ' + cls}>{text}</span>;
}
