import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui';
import type { PageProps } from '@/types';

interface EvalItem {
    criterion: string;
    score: number;
    weight: number;
}

interface EvalData {
    id: number;
    evaluator_type: string;
    total_score?: number;
    grade?: string;
    notes?: string;
    group: { name: string };
    items: EvalItem[];
}

interface Props extends PageProps {
    evaluations: EvalData[];
}

export default function StudentEvaluationsIndex({ evaluations }: Props) {
    return (
        <AppLayout title="Nilai Evaluasi">
            {evaluations.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Belum ada evaluasi untuk Anda.
                </div>
            ) : (
                <div className="space-y-6">
                    {evaluations.map((ev) => (
                        <div key={ev.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between bg-slate-50 px-5 py-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800">Evaluasi oleh {ev.evaluator_type === 'dpl' ? 'DPL' : ev.evaluator_type}</h3>
                                    <p className="text-xs text-slate-500">{ev.group.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-slate-800">{ev.total_score ?? '-'}</p>
                                    <Badge variant={ev.grade === 'A' || ev.grade === 'B' ? 'success' : ev.grade === 'C' ? 'warning' : 'danger'} className="mt-1">
                                        Nilai: {ev.grade ?? '-'}
                                    </Badge>
                                </div>
                            </div>

                            <table className="min-w-full divide-y divide-slate-100">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-2 text-left text-xs font-semibold text-slate-500">Kriteria</th>
                                        <th className="px-5 py-2 text-right text-xs font-semibold text-slate-500">Bobot</th>
                                        <th className="px-5 py-2 text-right text-xs font-semibold text-slate-500">Skor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {ev.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="px-5 py-2 text-sm text-slate-700">{item.criterion}</td>
                                            <td className="px-5 py-2 text-right text-sm text-slate-500">{item.weight}%</td>
                                            <td className="px-5 py-2 text-right text-sm font-medium text-slate-800">{item.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {ev.notes && (
                                <div className="border-t border-slate-100 px-5 py-3">
                                    <p className="text-xs text-slate-500"><strong>Catatan:</strong> {ev.notes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
