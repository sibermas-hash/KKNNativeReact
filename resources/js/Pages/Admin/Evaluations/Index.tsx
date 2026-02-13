import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface EvaluationItem {
    criterion: string;
    score: number;
    weight: number;
}

interface EvaluationData {
    id: number;
    student_name: string;
    group_name: string;
    evaluator_name: string;
    evaluator_type: string;
    total_score: number | null;
    grade: string | null;
    evaluated_at: string;
    notes: string | null;
    items: EvaluationItem[];
}

interface PaginatedData {
    data: EvaluationData[];
    meta?: {
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
}

interface Props extends PageProps {
    evaluations: PaginatedData;
}

export default function EvaluationsIndex({ evaluations }: Props) {
    return (
        <AppLayout title="Evaluasi KKN">
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    {evaluations.meta?.total ?? evaluations.data?.length ?? 0} evaluasi
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mahasiswa</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kelompok</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Evaluator</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tipe</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Skor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nilai</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(evaluations.data ?? []).map((ev) => (
                                <tr key={ev.id} className="transition hover:bg-slate-50/80">
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{ev.student_name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{ev.group_name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{ev.evaluator_name}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={ev.evaluator_type} />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                        {ev.total_score != null ? ev.total_score.toFixed(1) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${ev.grade === 'A' || ev.grade === 'A-'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : ev.grade === 'B+' || ev.grade === 'B'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : ev.grade === 'B-' || ev.grade === 'C+'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {ev.grade ?? '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500">{ev.evaluated_at ?? '-'}</td>
                                </tr>
                            ))}
                            {(evaluations.data ?? []).length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                        Belum ada data evaluasi.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
