import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge, FormInput, FormSelect, FormTextarea } from '@/Components/ui';
import type { PageProps } from '@/types';

interface GroupWithStudents {
    id: number;
    name: string;
    registrations: { student: { id: number; nim: string; name: string } }[];
}

interface Props extends PageProps {
    groups: GroupWithStudents[];
    evaluations: { id: number; student: { name: string; nim: string }; group: { name: string }; total_score?: number; grade?: string }[];
}

export default function DplEvaluationsPage({ groups, evaluations, ...pageProps }: Props) {
    const [showForm, setShowForm] = useState(false);

    // Manual Evaluation Form
    const manualForm = useForm({
        group_id: '',
        student_id: '',
        evaluator_type: 'dpl',
        notes: '',
        items: [
            { criterion: 'Kehadiran', score: '', weight: 20 },
            { criterion: 'Kedisiplinan', score: '', weight: 20 },
            { criterion: 'Partisipasi', score: '', weight: 20 },
            { criterion: 'Output Kerja', score: '', weight: 20 },
            { criterion: 'Laporan', score: '', weight: 20 },
        ]
    });

    // Import Excel Form
    const importForm = useForm({
        group_id: '',
        file: null as File | null,
    });

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        manualForm.post(route('dpl.evaluations.store'), {
            onSuccess: () => {
                setShowForm(false);
                manualForm.reset();
            }
        });
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        importForm.post(route('dpl.evaluations.import'), {
            onSuccess: () => {
                importForm.reset();
                const fileInput = document.getElementById('import-file') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        });
    };

    const selectedGroup = groups.find((g) => String(g.id) === manualForm.data.group_id);
    const students = selectedGroup?.registrations?.map((r) => r.student) ?? [];

    const updateItem = (index: number, score: string) => {
        const newItems = [...manualForm.data.items];
        newItems[index].score = score;
        manualForm.setData('items', newItems);
    };

    return (
        <AppLayout title="Evaluasi Mahasiswa">
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="flex h-full flex-col">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">Daftar Penilaian</h2>
                            {!showForm && <Button onClick={() => setShowForm(true)}>+ Input Manual</Button>}
                        </div>

                        {showForm && (
                            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 font-semibold text-slate-800">Input Penilaian Manual</h3>
                                <form onSubmit={handleManualSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <FormSelect
                                            label="Kelompok"
                                            options={groups.map(g => ({ value: g.id, label: g.name }))}
                                            value={manualForm.data.group_id}
                                            onChange={(e) => manualForm.setData('group_id', e.target.value)}
                                            error={manualForm.errors.group_id}
                                            required
                                        />
                                        <FormSelect
                                            label="Mahasiswa"
                                            options={students.map(s => ({ value: s.id, label: `${s.nim} - ${s.name}` }))}
                                            disabled={!manualForm.data.group_id}
                                            value={manualForm.data.student_id}
                                            onChange={(e) => manualForm.setData('student_id', e.target.value)}
                                            error={manualForm.errors.student_id}
                                            required
                                        />
                                    </div>

                                    <div className="overflow-hidden rounded-lg border border-slate-200">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Kriteria</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 w-24">Bobot (%)</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 w-24">Skor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {manualForm.data.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-2 text-sm">{item.criterion}</td>
                                                        <td className="px-4 py-2 text-sm text-slate-500">{item.weight}%</td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={item.score}
                                                                onChange={(e) => updateItem(i, e.target.value)}
                                                                className="w-20 rounded border border-slate-300 px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                                                required
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <FormTextarea label="Catatan (Opsional)" value={manualForm.data.notes} onChange={(e) => manualForm.setData('notes', e.target.value)} rows={2} />

                                    <div className="flex gap-2">
                                        <Button type="submit" loading={manualForm.processing}>Simpan</Button>
                                        <Button variant="secondary" onClick={() => setShowForm(false)}>Batal</Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mahasiswa</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Kelompok</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Skor</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nilai</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {evaluations.map((ev) => (
                                        <tr key={ev.id}>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-slate-900">{ev.student.name}</div>
                                                <div className="text-xs text-slate-500">{ev.student.nim}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{ev.group.name}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{ev.total_score ?? '-'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={ev.grade === 'A' || ev.grade === 'B' ? 'success' : ev.grade === 'C' ? 'warning' : 'danger'}>
                                                    {ev.grade ?? '-'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {evaluations.length === 0 && (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Belum ada evaluasi.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-slate-800">Import dari Excel</h3>
                        <p className="mb-4 text-xs text-slate-500">Unggah file template untuk melakukan penilaian massal.</p>
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <FormSelect
                                label="Kelompok"
                                options={groups.map(g => ({ value: g.id, label: g.name }))}
                                value={importForm.data.group_id}
                                onChange={(e) => importForm.setData('group_id', e.target.value)}
                                error={importForm.errors.group_id}
                                required
                            />
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">File Excel (.xlsx)</label>
                                <input
                                    id="import-file"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                                    required
                                />
                                {importForm.errors.file && <p className="mt-1 text-xs text-red-500">{importForm.errors.file}</p>}
                            </div>
                            <Button type="submit" variant="primary" className="w-full" loading={importForm.processing}>Proses Import</Button>
                        </form>
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-primary">Petunjuk Import</h4>
                        <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                            <li>Gunakan format sesuai template.xlsx</li>
                            <li>Sistem mencocokkan NIM mahasiswa</li>
                            <li>Nilai Kedisiplinan & Sikap dihitung @50%</li>
                            <li>Data lama akan diperbarui otomatis</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
