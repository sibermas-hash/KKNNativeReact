'use client';

import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import { ClipboardList, Star } from 'lucide-react';
import { EmptyState, StatCard } from '@/components/ui/shared';
import { useTheme } from '@/components/ui/theme-provider';

interface EvaluationItem {
  id?: number;
  criterion?: string | null;
  score?: number | null;
  weight?: number | null;
}

interface Evaluation {
  id: number;
  evaluator_type?: string | null;
  total_score?: number | null;
  grade?: string | null;
  notes?: string | null;
  kelompok?: { nama_kelompok?: string | null } | null;
  item_evaluasi?: EvaluationItem[];
  item?: EvaluationItem[];
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-[color:var(--profile-soft-text)] bg-[color:var(--profile-soft)] border-[color:var(--profile-border)]',
  B: 'text-[color:var(--profile-soft-text)] bg-[color:var(--profile-soft)] border-[color:var(--profile-border)]',
  C: 'text-[color:var(--profile-warning-text)] bg-[color:var(--profile-warning)] border-[color:var(--profile-border)]',
  D: 'text-[color:var(--profile-warning-text)] bg-[color:var(--profile-warning)] border-[color:var(--profile-border)]',
  E: 'text-[color:var(--profile-danger-text)] bg-[color:var(--profile-danger)] border-[color:var(--profile-border)]',
};

export default function StudentEvaluasiPage(): React.JSX.Element {
  const { config: themeConfig, surfaceClass } = useTheme();

  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'evaluations'],
    queryFn: async () => {
      const res = await (studentApi as unknown as {
        evaluations: { index: () => Promise<unknown> };
      }).evaluations.index();
      return (res as { data?: Evaluation[] }).data ?? [];
    },
    retry: false,
  });

  const isPhaseBlocked = (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error?.code === 'PHASE_BLOCKED';
  const phaseMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;

  const evaluations = data ?? [];
  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((s, e) => s + (e.total_score ?? 0), 0) / evaluations.length)
    : 0;

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div 
        className={`${surfaceClass} border border-[color:var(--profile-border)] ${themeConfig.shadow} p-6`}
        style={{ borderRadius: 'var(--profile-radius)' }}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-[color:var(--profile-primary)] rounded-2xl flex items-center justify-center text-white shadow-lg">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[color:var(--profile-text)] tracking-tight">Hasil Evaluasi</h1>
            <p className="text-xs text-[color:var(--profile-muted)] font-medium">Pantau nilai dan catatan evaluasi aktivitas KKN Anda</p>
          </div>
        </div>
      </div>

      {/* Phase blocked */}
      {isPhaseBlocked && (
        <div className="rounded-2xl border-2 border-dashed border-[color:var(--profile-border)] bg-[color:var(--profile-warning)] p-8 text-center space-y-3">
          <ClipboardList className="h-12 w-12 text-[color:var(--profile-warning-text)] mx-auto" />
          <h2 className="text-lg font-black text-[color:var(--profile-warning-text)]">Belum Tersedia</h2>
          <p className="text-sm text-[color:var(--profile-warning-text)] opacity-95">{phaseMessage ?? 'Hasil evaluasi akan tersedia setelah masa penilaian KKN.'}</p>
        </div>
      )}

      {/* Stats */}
      {!isPhaseBlocked && evaluations.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={ClipboardList} label="Total Evaluasi" value={evaluations.length} color="indigo" />
          <StatCard icon={Star} label="Rata-rata Nilai" value={avgScore} color="emerald" />
        </div>
      )}

      {/* Content */}
      {!isPhaseBlocked && isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)]" />)}
        </div>
      ) : !isPhaseBlocked && evaluations.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="Belum Ada Evaluasi"
          description="Hasil evaluasi akan muncul setelah DPL atau admin menginput penilaian"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {evaluations.map((evaluation) => {
            const items = evaluation.item_evaluasi ?? evaluation.item ?? [];
            const gradeColor = GRADE_COLORS[evaluation.grade ?? ''] ?? 'text-[color:var(--profile-text)] bg-[color:var(--profile-soft)] border-[color:var(--profile-border)]';

            return (
              <div 
                key={evaluation.id} 
                className={`${surfaceClass} border border-[color:var(--profile-border)] ${themeConfig.shadow} p-6 space-y-5`}
                style={{ borderRadius: 'var(--profile-radius)' }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-[color:var(--profile-text)] uppercase tracking-tight">
                      Evaluasi {evaluation.evaluator_type || '-'}
                    </h2>
                    <p className="mt-1 text-xs font-bold text-[color:var(--profile-muted)] uppercase tracking-wider">
                      {evaluation.kelompok?.nama_kelompok || 'Kelompok tidak diketahui'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-black text-[color:var(--profile-text)] tabular-nums">
                      {evaluation.total_score ?? '-'}
                    </p>
                    {evaluation.grade && (
                      <span className={`inline-block mt-1 px-3 py-0.5 rounded-lg border text-xs font-black uppercase tracking-wider ${gradeColor}`}>
                        Grade {evaluation.grade}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                {items.length > 0 && (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={item.id ?? idx}
                        className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-xl border border-[color:var(--profile-border)] bg-[color:var(--profile-soft)]/40 px-4 py-3"
                      >
                        <span className="text-xs font-bold text-[color:var(--profile-text)] uppercase tracking-tight">
                          {item.criterion || '-'}
                        </span>
                        {item.weight != null && (
                          <span className="text-[10px] font-black text-[color:var(--profile-muted)] uppercase">
                            Bobot {item.weight}%
                          </span>
                        )}
                        <span className="text-sm font-black text-[color:var(--profile-text)] tabular-nums">
                          {item.score ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {evaluation.notes && (
                  <div className="rounded-xl bg-[color:var(--profile-soft)] border border-[color:var(--profile-border)] p-4">
                    <p className="text-[10px] font-black text-[color:var(--profile-soft-text)] uppercase tracking-widest mb-1">Catatan</p>
                    <p className="text-sm text-[color:var(--profile-text)] leading-relaxed">{evaluation.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

