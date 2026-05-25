'use client';

import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import { ClipboardList, Star } from 'lucide-react';
import { EmptyState, StatCard } from '@/components/ui/shared';

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
  A: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  B: 'text-blue-700 bg-blue-50 border-blue-200',
  C: 'text-amber-700 bg-amber-50 border-amber-200',
  D: 'text-orange-700 bg-orange-50 border-orange-200',
  E: 'text-rose-700 bg-rose-50 border-rose-200',
};

export default function StudentEvaluasiPage(): React.JSX.Element {
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Hasil Evaluasi</h1>
            <p className="text-xs text-slate-400">Pantau nilai dan catatan evaluasi aktivitas KKN Anda</p>
          </div>
        </div>
      </div>

      {/* Phase blocked */}
      {isPhaseBlocked && (
        <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center space-y-3">
          <ClipboardList className="h-12 w-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-black text-amber-900">Belum Tersedia</h2>
          <p className="text-sm text-amber-800">{phaseMessage ?? 'Hasil evaluasi akan tersedia setelah masa penilaian KKN.'}</p>
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
          {[1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200" />)}
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
            const gradeColor = GRADE_COLORS[evaluation.grade ?? ''] ?? 'text-slate-600 bg-slate-50 border-slate-200';

            return (
              <div key={evaluation.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Evaluasi {evaluation.evaluator_type || '-'}
                    </h2>
                    <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {evaluation.kelompok?.nama_kelompok || 'Kelompok tidak diketahui'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-black text-slate-900 tabular-nums">
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
                        className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-xl border border-slate-50 bg-slate-50/50 px-4 py-3"
                      >
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                          {item.criterion || '-'}
                        </span>
                        {item.weight != null && (
                          <span className="text-[10px] font-black text-slate-400 uppercase">
                            Bobot {item.weight}%
                          </span>
                        )}
                        <span className="text-sm font-black text-slate-900 tabular-nums">
                          {item.score ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {evaluation.notes && (
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Catatan</p>
                    <p className="text-sm text-indigo-800 leading-relaxed">{evaluation.notes}</p>
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
