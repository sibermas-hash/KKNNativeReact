import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput } from '@/Components/ui';
import { ArrowsRightLeftIcon, CalculatorIcon, ClipboardDocumentIcon, SparklesIcon } from '@heroicons/react/24/outline';

type Criterion = {
    id: string;
    name: string;
    weight: number;
    score: number;
};

type Preset = {
    label: string;
    items: Omit<Criterion, 'id'>[];
};

const presets: Preset[] = [
    {
        label: 'Template KKN (berdasar praktik umum)',
        items: [
            { name: 'Laporan Harian', weight: 20, score: 85 },
            { name: 'Program Kerja', weight: 25, score: 82 },
            { name: 'Laporan Akhir', weight: 25, score: 84 },
            { name: 'Evaluasi DPL', weight: 15, score: 88 },
            { name: 'Kehadiran & Etika', weight: 15, score: 90 },
        ],
    },
    {
        label: 'Preset Ringan (3 komponen)',
        items: [
            { name: 'Output Utama', weight: 50, score: 80 },
            { name: 'Aktivitas Harian', weight: 30, score: 78 },
            { name: 'Kedisiplinan', weight: 20, score: 92 },
        ],
    },
];

const makeId = () => `crit-${Math.random().toString(36).slice(2, 9)}`;

const defaultCriteria: Criterion[] = presets[0].items.map((item) => ({ ...item, id: makeId() }));

function letterGrade(value: number): string {
    if (value >= 85) return 'A';
    if (value >= 75) return 'B';
    if (value >= 65) return 'C';
    if (value >= 55) return 'D';
    return 'E';
}

export default function GradeGenerator() {
    const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria);
    const [newName, setNewName] = useState('');
    const [newWeight, setNewWeight] = useState<number | ''>('');

    const totals = useMemo(() => {
        const totalWeight = criteria.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
        const weightedScore =
            totalWeight === 0
                ? 0
                : criteria.reduce((sum, item) => sum + (Number(item.weight) || 0) * (Number(item.score) || 0), 0) /
                  totalWeight;

        return {
            totalWeight,
            weightedScore: Number(weightedScore.toFixed(2)),
            grade: letterGrade(weightedScore),
        };
    }, [criteria]);

    const applyPreset = (preset: Preset) => {
        setCriteria(preset.items.map((item) => ({ ...item, id: makeId() })));
    };

    const randomizeScores = () => {
        setCriteria((prev) =>
            prev.map((item) => ({
                ...item,
                score: Math.round(70 + Math.random() * 25),
            })),
        );
    };

    const updateCriterion = (id: string, field: keyof Pick<Criterion, 'name' | 'weight' | 'score'>, value: string) => {
        setCriteria((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          [field]: field === 'name' ? value : Number(value) || 0,
                      }
                    : item,
            ),
        );
    };

    const addCriterion = () => {
        if (!newName.trim() || newWeight === '' || Number(newWeight) <= 0) return;
        setCriteria((prev) => [...prev, { id: makeId(), name: newName.trim(), weight: Number(newWeight), score: 80 }]);
        setNewName('');
        setNewWeight('');
    };

    const removeCriterion = (id: string) => {
        setCriteria((prev) => prev.filter((item) => item.id !== id));
    };

    const copyResult = async () => {
        const lines = [
            'Generator Nilai (Standalone)',
            ...criteria.map(
                (item) => `${item.name}: bobot ${item.weight}%, nilai ${item.score} → ${((item.weight * item.score) / 100).toFixed(2)}`,
            ),
            `Total bobot: ${totals.totalWeight}%`,
            `Skor akhir: ${totals.weightedScore}`,
            `Nilai huruf: ${totals.grade}`,
        ];
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
        } catch {
            // ignore copy failure silently
        }
    };

    return (
        <AppLayout title="Generator Nilai">
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <CalculatorIcon className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold text-slate-900">Generator Nilai (Standalone)</h1>
                    </div>
                    <p className="text-sm text-slate-600">
                        Alat cepat untuk menghitung komposit nilai tanpa menarik data sistem. Semua perhitungan berjalan di browser.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Skor Akhir</p>
                        <p className="mt-2 text-4xl font-black text-slate-900">{totals.weightedScore}</p>
                        <p className="text-xs text-slate-500">Tertimbang terhadap bobot</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Nilai Huruf</p>
                        <p className="mt-2 text-4xl font-black text-primary">{totals.grade}</p>
                        <p className="text-xs text-slate-500">Konversi standar sederhana</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Total Bobot</p>
                        <p className="mt-2 text-4xl font-black text-slate-900">{totals.totalWeight}%</p>
                        <p className={`text-xs ${totals.totalWeight === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {totals.totalWeight === 100
                                ? 'Ideal: 100%'
                                : 'Sebaiknya 100% supaya konsisten'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => applyPreset(presets[0])}>
                        Template KKN
                    </Button>
                    <Button variant="secondary" onClick={() => applyPreset(presets[1])}>
                        Preset Ringan
                    </Button>
                    <Button variant="ghost" onClick={randomizeScores}>
                        <SparklesIcon className="h-4 w-4" />
                        Randomkan Nilai
                    </Button>
                    <Button variant="ghost" onClick={copyResult}>
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        Salin Hasil
                    </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Komponen Penilaian</p>
                            <p className="text-xs text-slate-500">Ubah nama, bobot, atau nilai secara langsung.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => applyPreset({ label: 'Kosong', items: [] })}>
                            <ArrowsRightLeftIcon className="h-4 w-4" />
                            Reset Kosong
                        </Button>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {criteria.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-slate-500">
                                Belum ada komponen. Tambahkan di bawah ini.
                            </div>
                        )}

                        {criteria.map((item) => (
                            <div key={item.id} className="grid gap-3 px-4 py-3 sm:grid-cols-12 sm:items-center">
                                <div className="sm:col-span-5">
                                    <FormInput
                                        value={item.name}
                                        onChange={(e) => updateCriterion(item.id, 'name', e.target.value)}
                                        label="Nama Komponen"
                                        className="sm:mt-0"
                                    />
                                </div>
                                <div className="sm:col-span-3">
                                    <FormInput
                                        type="number"
                                        min={0}
                                    max={200}
                                        value={item.weight}
                                        onChange={(e) => updateCriterion(item.id, 'weight', e.target.value)}
                                        label="Bobot (%)"
                                    />
                                </div>
                                <div className="sm:col-span-3">
                                    <FormInput
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={item.score}
                                        onChange={(e) => updateCriterion(item.id, 'score', e.target.value)}
                                        label="Nilai (0-100)"
                                    />
                                </div>
                                <div className="sm:col-span-1 flex items-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600"
                                        onClick={() => removeCriterion(item.id)}
                                    >
                                        Hapus
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Tambah Komponen</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <FormInput
                            label="Nama"
                            placeholder="Contoh: Partisipasi Forum"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <FormInput
                            label="Bobot (%)"
                            type="number"
                            min={1}
                            max={200}
                            value={newWeight}
                            onChange={(e) => setNewWeight(Number(e.target.value) || '')}
                        />
                        <div className="flex items-end">
                            <Button type="button" onClick={addCriterion} className="w-full">
                                Tambah
                            </Button>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                        Alat ini tidak tersambung ke database; aman untuk eksperimen skenario penilaian apa pun.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
