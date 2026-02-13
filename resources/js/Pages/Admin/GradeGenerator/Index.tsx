import { useMemo, useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormSelect } from '@/Components/ui';
import {
    ArchiveBoxArrowDownIcon,
    CalculatorIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    CloudArrowUpIcon,
    DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import axios from 'axios';

type Group = {
    id: number;
    code: string;
    name: string;
    desa: string;
    kecamatan: string;
    kabupaten: string;
    dpl: string;
};

type Meta = {
    angkatan: string;
    tahun: string;
    kelompok: string;
    desa: string;
    kecamatan: string;
    kabupaten: string;
    dpl: string;
};

type StudentRow = {
    user_id: string | number;
    name: string;
    nim: string;
    discipline: number | null;
    attitude: number | null;
    group_code?: string;
    group_name?: string;
};

const defaultMeta: Meta = {
    angkatan: '57',
    tahun: '2026',
    kelompok: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
    dpl: '',
};

interface Props {
    groups: Group[];
}

function computeTotal({ discipline, attitude }: StudentRow): number {
    const d = Number(discipline) || 0;
    const a = Number(attitude) || 0;
    if (discipline === null || attitude === null) return 0;
    return Math.round((d + a) / 2);
}

export default function GradeGenerator({ groups }: Props) {
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'all' | ''>('');
    const [meta, setMeta] = useState<Meta>(defaultMeta);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const isAllGroups = selectedGroupId === 'all';

    // Fetch students when group changes
    useEffect(() => {
        if (!selectedGroupId) {
            setStudents([]);
            setMeta(defaultMeta);
            return;
        }

        if (isAllGroups) {
            setMeta({ ...defaultMeta, kelompok: 'Semua Kelompok' });
        } else {
            const group = groups.find(g => g.id === selectedGroupId);
            if (group) {
                setMeta({
                    ...defaultMeta,
                    kelompok: group.code,
                    desa: group.desa,
                    kecamatan: group.kecamatan,
                    kabupaten: group.kabupaten || group.name,
                    dpl: group.dpl
                });
            }
        }

        setLoading(true);
        const url = isAllGroups
            ? '/admin/grade-generator/groups/all/students'
            : `/admin/grade-generator/groups/${selectedGroupId}/students`;

        axios.get(url)
            .then(res => {
                setStudents(res.data);
            })
            .catch(err => {
                console.error(err);
                alert('Gagal mengambil data mahasiswa');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [selectedGroupId, groups]);

    const summary = useMemo(() => {
        if (!students.length) return { avg: 0, count: 0 };
        const scoredStudents = students.filter(s => s.discipline !== null && s.attitude !== null);
        if (!scoredStudents.length) return { avg: 0, count: students.length };

        const avg = scoredStudents.reduce((sum, s) => sum + computeTotal(s), 0) / scoredStudents.length;
        return { avg: Number(avg.toFixed(2)), count: students.length };
    }, [students]);

    const updateStudent = (id: string | number, field: keyof Omit<StudentRow, 'user_id' | 'name' | 'nim' | 'group_code' | 'group_name'>, value: string) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.user_id === id
                    ? {
                        ...s,
                        [field]: value === '' ? null : Math.max(0, Math.min(100, Number(value) || 0)),
                    }
                    : s,
            ),
        );
    };

    const handleSave = () => {
        if (!selectedGroupId || isAllGroups) return;

        setSaving(true);
        router.post('/admin/grade-generator/scores', {
            kelompok_id: selectedGroupId,
            scores: students.map(s => ({
                user_id: s.user_id,
                discipline: s.discipline,
                attitude: s.attitude
            }))
        }, {
            onSuccess: () => {
                setSaving(false);
            },
            onError: () => {
                setSaving(false);
                alert('Gagal menyimpan nilai');
            }
        });
    };

    const handleExport = () => {
        if (!selectedGroupId || isAllGroups) return;
        window.location.href = `/admin/grade-generator/export/${selectedGroupId}`;
    };

    const handleExportPdf = () => {
        if (!selectedGroupId || isAllGroups) return;
        window.location.href = `/admin/grade-generator/export-pdf/${selectedGroupId}`;
    };

    const dropdownOptions = [
        { value: 'all', label: '📋 Semua Kelompok' },
        ...groups.map(g => ({
            value: g.id,
            label: `${g.code} - ${g.name}`
        }))
    ];

    return (
        <AppLayout title="Generator Nilai">
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <CalculatorIcon className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Blanko Penilaian & Generator Nilai</h1>
                        <p className="text-sm text-slate-600">
                            Pilih kelompok untuk mengisi nilai kedisiplinan dan sikap, lalu cetak blanko resmi.
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="max-w-md">
                        <FormSelect
                            label="Pilih Kelompok"
                            placeholder="-- Pilih Kelompok --"
                            value={selectedGroupId}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedGroupId(val === 'all' ? 'all' : val ? Number(val) : '');
                            }}
                            options={dropdownOptions}
                        />
                    </div>

                    {selectedGroupId && !isAllGroups && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
                            <div><span className="font-bold not-italic">Angkatan:</span> {meta.angkatan}</div>
                            <div><span className="font-bold not-italic">Tahun:</span> {meta.tahun}</div>
                            <div><span className="font-bold not-italic">Kelompok:</span> {meta.kelompok}</div>
                            <div><span className="font-bold not-italic">Desa:</span> {meta.desa}</div>
                            <div><span className="font-bold not-italic">Kecamatan:</span> {meta.kecamatan}</div>
                            <div><span className="font-bold not-italic">Kabupaten/Mitra:</span> {meta.kabupaten}</div>
                            <div className="sm:col-span-2 lg:col-span-3"><span className="font-bold not-italic">DPL:</span> {meta.dpl}</div>
                        </div>
                    )}

                    {isAllGroups && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-700">
                            Menampilkan semua mahasiswa dari seluruh kelompok. Untuk menyimpan nilai, pilih kelompok tertentu.
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Daftar Mahasiswa</p>
                            <p className="text-xs text-slate-500">Isi nilai kedisiplinan dan sikap (Rentang 60-100).</p>
                        </div>
                        <div className="flex gap-2">
                            {selectedGroupId && !isAllGroups && (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleExport}
                                    >
                                        <ArchiveBoxArrowDownIcon className="h-4 w-4" />
                                        Excel
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleExportPdf}
                                    >
                                        <DocumentArrowDownIcon className="h-4 w-4" />
                                        PDF
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                loading={saving}
                                disabled={!selectedGroupId || isAllGroups || students.length === 0}
                            >
                                <CloudArrowUpIcon className="h-4 w-4" />
                                Simpan Nilai
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px] divide-y divide-slate-100">
                            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold uppercase text-slate-500 bg-slate-50">
                                <div className="col-span-1">No</div>
                                {isAllGroups && <div className="col-span-2">Kelompok</div>}
                                <div className={isAllGroups ? 'col-span-3' : 'col-span-4'}>Nama Mahasiswa</div>
                                <div className={isAllGroups ? 'col-span-2' : 'col-span-3'}>NIM</div>
                                <div className="col-span-1">Disiplin</div>
                                <div className="col-span-1">Sikap</div>
                                <div className="col-span-2 text-right">Total (B)</div>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-slate-500 flex justify-center items-center gap-2">
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                    Memuat data mahasiswa...
                                </div>
                            ) : students.map((s, idx) => (
                                <div key={`${s.user_id}-${s.group_code || idx}`} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-slate-50 transition-colors">
                                    <div className="col-span-1 text-sm text-slate-700">{idx + 1}</div>
                                    {isAllGroups && (
                                        <div className="col-span-2 text-xs font-semibold text-primary">
                                            {s.group_code}
                                        </div>
                                    )}
                                    <div className={`${isAllGroups ? 'col-span-3' : 'col-span-4'} text-sm font-medium text-slate-900`}>{s.name}</div>
                                    <div className={`${isAllGroups ? 'col-span-2' : 'col-span-3'} text-sm text-slate-600`}>{s.nim}</div>
                                    <div className="col-span-1">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            className="w-full text-center px-1 py-1 text-sm rounded border-slate-200 focus:ring-primary focus:border-primary"
                                            value={s.discipline ?? ''}
                                            onChange={(e) => updateStudent(s.user_id, 'discipline', e.target.value)}
                                            disabled={isAllGroups}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            className="w-full text-center px-1 py-1 text-sm rounded border-slate-200 focus:ring-primary focus:border-primary"
                                            value={s.attitude ?? ''}
                                            onChange={(e) => updateStudent(s.user_id, 'attitude', e.target.value)}
                                            disabled={isAllGroups}
                                        />
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className={`text-sm font-bold ${computeTotal(s) > 0 ? 'text-primary' : 'text-slate-300'}`}>
                                            {computeTotal(s) || '-'}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {!loading && students.length === 0 && (
                                <div className="px-4 py-12 text-center text-sm text-slate-500">
                                    {selectedGroupId ? 'Tidak ada mahasiswa di kelompok ini.' : 'Pilih kelompok terlebih dahulu.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="text-sm text-slate-600">
                        Total mahasiswa: <span className="font-semibold text-slate-900">{summary.count}</span> ·
                        Rata-rata nilai total: <span className="font-semibold text-slate-900">{summary.avg}</span>
                    </div>
                    {selectedGroupId && !isAllGroups && students.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-primary font-medium">
                            <CheckCircleIcon className="h-4 w-4" />
                            Data siap untuk disimpan atau di-export
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

