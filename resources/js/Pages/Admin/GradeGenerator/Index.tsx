import { useMemo, useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormSelect } from '@/Components/ui';
import {
    ArchiveBoxArrowDownIcon,
    CalculatorIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    CloudArrowUpIcon,
    DocumentArrowDownIcon,
    FolderArrowDownIcon
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import axios from 'axios';

type Period = {
    id: number;
    name: string;
    grading_start?: string;
    grading_end?: string;
};

type Group = {
    id: number;
    period_id: number;
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
    periods: Period[];
    groups: Group[];
}

function computeTotal({ discipline, attitude }: StudentRow): number {
    const d = Number(discipline) || 0;
    const a = Number(attitude) || 0;
    if (discipline === null || attitude === null) return 0;
    return Math.round((d + a) / 2);
}

export default function GradeGenerator({ periods, groups }: Props) {
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | ''>('');
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'all' | ''>('');
    const [meta, setMeta] = useState<Meta>(defaultMeta);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

    const isAllGroups = selectedGroupId === 'all';

    const filteredGroups = useMemo(() => {
        if (!selectedPeriodId) return [];
        return groups.filter(g => g.period_id === selectedPeriodId);
    }, [groups, selectedPeriodId]);

    const dropdownOptions = useMemo(() => {
        const options = [
            { value: 'all', label: '📋 Semua Kelompok' },
            ...filteredGroups.map(g => ({
                value: g.id,
                label: `Kelompok ${g.code}`
            }))
        ];
        return options;
    }, [filteredGroups]);

    // Fetch students when group changes
    useEffect(() => {
        if (!selectedGroupId) {
            setStudents([]);
            setMeta(defaultMeta);
            return;
        }

        if (isAllGroups) {
            const period = periods.find(p => p.id === selectedPeriodId);
            setMeta({
                ...defaultMeta,
                angkatan: period ? period.name.replace('Angkatan ', '') : '57',
                kelompok: 'Semua Kelompok'
            });
        } else {
            const group = groups.find(g => g.id === selectedGroupId);
            const period = periods.find(p => p.id === selectedPeriodId);
            if (group) {
                setMeta({
                    ...defaultMeta,
                    angkatan: period ? period.name.replace('Angkatan ', '') : '57',
                    kelompok: group.code,
                    desa: group.desa,
                    kecamatan: group.kecamatan,
                    kabupaten: group.kabupaten,
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
    }, [selectedGroupId, groups, periods, selectedPeriodId, isAllGroups]);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEvidenceFile(e.target.files[0]);
        }
    };

    const handleSave = () => {
        if (!selectedGroupId || isAllGroups) return;

        setSaving(true);
        const formData = new FormData();
        formData.append('kelompok_id', String(selectedGroupId));
        if (evidenceFile) {
            formData.append('evidence_file', evidenceFile);
        }

        students.forEach((s, index) => {
            formData.append(`scores[${index}][user_id]`, String(s.user_id));
            if (s.discipline !== null) formData.append(`scores[${index}][discipline]`, String(s.discipline));
            if (s.attitude !== null) formData.append(`scores[${index}][attitude]`, String(s.attitude));
        });

        router.post('/admin/grade-generator/scores', formData, {
            forceFormData: true,
            onSuccess: () => {
                setSaving(false);
                setEvidenceFile(null);
            },
            onError: () => {
                setSaving(false);
                alert('Gagal menyimpan nilai');
            }
        });
    };

    const handleExport = () => {
        if (!selectedGroupId || !selectedPeriodId) return;
        window.location.href = `/admin/grade-generator/export/${selectedGroupId}?period_id=${selectedPeriodId}`;
    };

    const handleExportPdf = () => {
        if (!selectedGroupId || !selectedPeriodId) return;
        window.location.href = `/admin/grade-generator/export-pdf/${selectedGroupId}?period_id=${selectedPeriodId}`;
    };

    const handleExportZip = () => {
        if (!selectedPeriodId) return;
        window.location.href = `/admin/grade-generator/export-zip?period_id=${selectedPeriodId}`;
    };

    return (
        <AppLayout title="Generator Nilai">
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <CalculatorIcon className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Blanko Penilaian & Generator Nilai</h1>
                        <p className="text-sm text-slate-600">
                            Pilih kelompok untuk mengisi nilai kedisiplinan dan sikap, serta upload bukti blanko nilai.
                        </p>
                        {selectedPeriodId && periods.find(p => p.id === selectedPeriodId)?.grading_start && (
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700">
                                <CalculatorIcon className="w-3.5 h-3.5" />
                                Masa Penilaian: {new Date(periods.find(p => p.id === selectedPeriodId)!.grading_start!).toLocaleDateString('id-ID')} s/d {new Date(periods.find(p => p.id === selectedPeriodId)!.grading_end!).toLocaleDateString('id-ID')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <FormSelect
                            label="Pilih Angkatan"
                            placeholder="-- Pilih Angkatan --"
                            value={selectedPeriodId}
                            onChange={(e) => {
                                setSelectedPeriodId(Number(e.target.value) || '');
                                setSelectedGroupId('');
                            }}
                            options={periods.map(p => ({ value: p.id, label: p.name }))}
                        />

                        <FormSelect
                            label="Pilih Kelompok"
                            placeholder="-- Pilih Kelompok --"
                            value={selectedGroupId}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedGroupId(val === 'all' ? 'all' : val ? Number(val) : '');
                            }}
                            options={dropdownOptions}
                            disabled={!selectedPeriodId}
                        />
                    </div>

                    {selectedGroupId && !isAllGroups && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 italic text-sm">
                                <div><span className="font-bold not-italic">Angkatan:</span> ({meta.angkatan})</div>
                                <div><span className="font-bold not-italic">Kelompok:</span> ({meta.kelompok})</div>
                                <div><span className="font-bold not-italic">Desa:</span> {meta.desa}</div>
                                <div><span className="font-bold not-italic">Kecamatan:</span> {meta.kecamatan}</div>
                                <div><span className="font-bold not-italic">Kabupaten:</span> {meta.kabupaten}</div>
                                <div className="sm:col-span-2 lg:col-span-3"><span className="font-bold not-italic">DPL:</span> {meta.dpl}</div>
                            </div>

                            <div className="pt-4 border-t border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Upload Scan Blanko Nilai (PDF/JPG/PNG, Max 5MB)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-primary/10 file:text-primary
                                            hover:file:bg-primary/20
                                        "
                                    />
                                    {evidenceFile && (
                                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircleIcon className="w-4 h-4" /> Siap Upload
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    *Upload bukti fisik penilaian lapangan yang sudah ditandatangani. Data baru akan menimpa file lama.
                                </p>
                            </div>
                        </div>
                    )}

                    {isAllGroups && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-700">
                            Menampilkan semua mahasiswa dari seluruh kelompok. Untuk menyimpan nilai & upload bukti, pilih kelompok tertentu.
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Input Nilai Mahasiswa</h3>
                            <p className="text-sm text-slate-500">Isi nilai kedisiplinan dan sikap dari range 0-100.</p>
                        </div>
                        <div className="flex gap-2">
                            {(selectedGroupId || isAllGroups) && (
                                <div className="flex gap-2 mr-2 border-r border-slate-200 pr-2">
                                    <Button variant="secondary" size="sm" onClick={handleExport}>
                                        <ArchiveBoxArrowDownIcon className="h-4 w-4 mr-1" /> Excel
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={handleExportPdf}>
                                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" /> PDF
                                    </Button>
                                    {isAllGroups && (
                                        <Button variant="secondary" size="sm" onClick={handleExportZip}>
                                            <FolderArrowDownIcon className="h-4 w-4 mr-1" /> ZIP
                                        </Button>
                                    )}
                                </div>
                            )}

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                loading={saving}
                                disabled={!selectedGroupId || isAllGroups || students.length === 0}
                                className="shadow-lg shadow-primary/20"
                            >
                                <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                                Simpan Nilai & Bukti
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">No</th>
                                    {isAllGroups && <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kelompok</th>}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Mahasiswa</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">NIM</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Disiplin (0-100)</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Sikap (0-100)</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={isAllGroups ? 7 : 6} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex justify-center items-center gap-2">
                                                <ArrowPathIcon className="h-5 w-5 animate-spin text-primary" />
                                                Loading data...
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((s, idx) => (
                                        <tr key={`${s.user_id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{idx + 1}</td>
                                            {isAllGroups && <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-primary">{s.group_code}</td>}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.nim}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-20 text-center text-sm rounded-md border-slate-300 focus:border-primary focus:ring focus:ring-primary/20 transition-all font-mono"
                                                    value={s.discipline ?? ''}
                                                    onChange={(e) => updateStudent(s.user_id, 'discipline', e.target.value)}
                                                    disabled={isAllGroups}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-20 text-center text-sm rounded-md border-slate-300 focus:border-primary focus:ring focus:ring-primary/20 transition-all font-mono"
                                                    value={s.attitude ?? ''}
                                                    onChange={(e) => updateStudent(s.user_id, 'attitude', e.target.value)}
                                                    disabled={isAllGroups}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                                <span className={computeTotal(s) > 0 ? 'text-primary' : 'text-slate-300'}>
                                                    {computeTotal(s) || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAllGroups ? 7 : 6} className="px-6 py-12 text-center text-sm text-slate-500 italic">
                                            {selectedGroupId ? 'Tidak ada data mahasiswa.' : 'Silakan pilih kelompok terlebih dahulu.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                    <div className="flex gap-6">
                        <span className="text-slate-600">Total Mahasiswa: <strong className="text-slate-900">{summary.count}</strong></span>
                        <span className="text-slate-600">Rata-rata Nilai: <strong className="text-slate-900">{summary.avg}</strong></span>
                    </div>
                    {selectedGroupId && !isAllGroups && students.length > 0 && (
                        <div className="flex items-center gap-2 text-primary font-medium">
                            <CheckCircleIcon className="h-5 w-5" />
                            Data siap disimpan
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
