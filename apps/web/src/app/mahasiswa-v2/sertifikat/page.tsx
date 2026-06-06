'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@sibermas/constants';
import { studentApi } from '@/lib/api';
import { Download, GraduationCap, Award, AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/components/ui/theme-provider';
import { PRIMARY_CLASS, SOFT_CLASS } from '@/lib/theme-config';

type Score = {
  id: number;
  total_score?: number | null;
  letter_grade?: string | null;
  grade?: string | null;
  is_finalized?: boolean;
  evaluator_name?: string | null;
  notes?: string | null;
  components?: { criterion: string; score: number; weight: number }[];
};

type Certificate = {
  id: number;
  certificate_number?: string;
  nama_mahasiswa?: string;
  nim?: string;
  issued_at?: string;
  status?: string;
};

const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40',
  'A-': 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40',
  'B+': 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40',
  B: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40',
  'B-': 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40',
  'C+': 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40',
  C: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40',
  D: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800/40',
  E: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/40',
};

export default function CertificatesPage(): React.JSX.Element {
  const { config: themeConfig, surfaceClass } = useTheme();
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.student.certificates,
    queryFn: async () => {
      const res = await studentApi.certificates.index();
      return res as unknown as { scores?: Score[]; certificates?: Certificate[] };
    },
    retry: false,
  });

  const scores: Score[] = useMemo(() => data?.scores ?? [], [data]);
  const certificates: Certificate[] = useMemo(() => data?.certificates ?? [], [data]);

  const isPhaseBlocked = (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error?.code === 'PHASE_BLOCKED';
  const phaseMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;

  const downloadCertificate = async (c: Certificate) => {
    try {
      const res = await studentApi.certificates.download(c.id);
      const blob = res instanceof Blob ? res : new Blob([res as unknown as BlobPart], { type: 'application/pdf' });

      if (blob.type && !blob.type.includes('pdf')) {
        const text = await blob.text();
        try {
          const parsed = JSON.parse(text);
          toast.error(parsed?.error?.message ?? 'Gagal mengunduh sertifikat');
        } catch {
          toast.error('Gagal mengunduh sertifikat');
        }
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sertifikat_KKN_${c.nim ?? c.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Sertifikat diunduh');
    } catch {
      toast.error('Gagal mengunduh sertifikat');
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-[color:var(--profile-primary)] rounded-2xl flex items-center justify-center text-white shadow-lg">
          <GraduationCap size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[color:var(--profile-text)] tracking-tight uppercase">Sertifikat & Nilai</h1>
          <p className="text-sm text-[color:var(--profile-muted)] font-medium">Hasil penilaian dan sertifikat resmi KKN Anda</p>
        </div>
      </div>

      {isPhaseBlocked && (
        <div className="rounded-2xl border-2 border-dashed border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] p-8 text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-[color:var(--profile-warning-text)] mx-auto" />
          <h2 className="text-lg font-black text-[color:var(--profile-warning-text)]">Belum Tersedia</h2>
          <p className="text-sm text-[color:var(--profile-warning-text)] opacity-90">{phaseMessage ?? 'Sertifikat dan nilai akan tersedia setelah masa penilaian selesai.'}</p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />)}
        </div>
      )}

      {!isLoading && !isPhaseBlocked && scores.length === 0 && certificates.length === 0 && (
        <div 
          className={`${surfaceClass} rounded-2xl border-2 border-dashed border-[color:var(--profile-border)] p-10 text-center space-y-3 ${themeConfig.shadow}`}
          style={{ borderRadius: 'var(--profile-radius)' }}
        >
          <GraduationCap className="h-14 w-14 text-[color:var(--profile-muted)] mx-auto" />
          <p className="font-black text-[color:var(--profile-text)] text-lg">Belum Ada Nilai atau Sertifikat</p>
          <p className="text-sm text-[color:var(--profile-muted)] max-w-md mx-auto font-medium">
            Nilai akan muncul setelah DPL/admin menginput penilaian Anda. Sertifikat akan diterbitkan setelah seluruh proses KKN selesai dan disetujui LP2M.
          </p>
        </div>
      )}

      {/* Scores */}
      {scores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-[color:var(--profile-text)] inline-flex items-center gap-2">
            <Star size={14} className="text-[color:var(--profile-accent)]" /> Nilai KKN
          </h2>
          {scores.map((s) => {
            const grade = (s.letter_grade ?? s.grade ?? '').toUpperCase();
            const gradeColor = GRADE_COLORS[grade] ?? 'text-[color:var(--profile-text)] bg-[color:var(--profile-soft)] border-[color:var(--profile-border)]';
            return (
              <div 
                key={s.id} 
                className={`${surfaceClass} border border-[color:var(--profile-border)] p-5 ${themeConfig.shadow}`}
                style={{ borderRadius: 'var(--profile-radius)' }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-wider">Total Skor</p>
                    <p className="text-3xl font-black text-[color:var(--profile-primary)] tabular-nums">{s.total_score ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-wider">Grade</p>
                    {grade ? (
                      <span className={'mt-1 inline-block rounded-lg border px-3 py-1 text-xl font-black ' + gradeColor}>
                        {grade}
                      </span>
                    ) : (
                      <p className="text-xl text-[color:var(--profile-muted)]">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-wider">Status</p>
                    <span className={'mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-black ' + (s.is_finalized
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40')}>
                      <CheckCircle2 size={10} /> {s.is_finalized ? 'Final' : 'Sementara'}
                    </span>
                  </div>
                  {s.evaluator_name && (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-wider">Penilai</p>
                      <p className="text-sm font-bold text-[color:var(--profile-text)] truncate">{s.evaluator_name}</p>
                    </div>
                  )}
                </div>

                {Array.isArray(s.components) && s.components.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[color:var(--profile-border)]">
                    <p className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase tracking-wider mb-2">Komponen Penilaian</p>
                    <div className="space-y-1.5">
                      {s.components.map((c, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-3 text-sm">
                          <span className="text-[color:var(--profile-text)] font-semibold">{c.criterion}</span>
                          <span className="text-[color:var(--profile-muted)] text-xs">×{c.weight}</span>
                          <span className="font-black text-[color:var(--profile-text)] tabular-nums">{c.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {s.notes && (
                  <p className="mt-3 text-xs text-[color:var(--profile-muted)] italic">Catatan: {s.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-[color:var(--profile-text)] inline-flex items-center gap-2">
            <Award size={14} className="text-[color:var(--profile-primary)]" /> Sertifikat
          </h2>
          {certificates.map((c) => (
            <div 
              key={c.id} 
              className={`${surfaceClass} border border-[color:var(--profile-border)] p-5 flex items-center justify-between gap-3 flex-wrap ${themeConfig.shadow}`}
              style={{ borderRadius: 'var(--profile-radius)' }}
            >
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${SOFT_CLASS}`}>
                  <Award size={22} />
                </div>
                <div>
                  <p className="font-black text-[color:var(--profile-text)]">{c.nama_mahasiswa ?? '-'}</p>
                  <p className="text-xs text-[color:var(--profile-muted)] mt-0.5 font-medium">
                    No. {c.certificate_number ?? '-'}
                    {c.nim ? ` • NIM ${c.nim}` : ''}
                    {c.issued_at ? ` • Terbit ${new Date(c.issued_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadCertificate(c)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow ${PRIMARY_CLASS}`}
              >
                <Download size={14} /> Unduh PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
