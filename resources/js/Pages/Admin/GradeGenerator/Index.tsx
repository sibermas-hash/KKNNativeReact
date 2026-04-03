import { useMemo, useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FormSelect } from '@/Components/ui';
import {
    FileArchive,
    Calculator,
    RefreshCw,
    CloudUpload,
    FileDown,
    FolderDown,
    ShieldCheck,
    Cpu,
    Beaker,
    IdCard,
    BadgeCheck,
    Activity,
    Fingerprint,
    Scale
} from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { clsx } from 'clsx';
import { route } from 'ziggy-js';
import { useToast } from '@/Contexts/ToastContext';

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
    const { toast } = useToast();
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
            { value: 'all', label: '📋 SEMUA KELOMPOK (ORCHESTRATED)' },
            ...filteredGroups.map(g => ({
                value: g.id,
                label: `KELOMPOK ${g.code} [${g.name}]`
            }))
        ];
        return options;
    }, [filteredGroups]);

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
                kelompok: 'SEMUA KELOMPOK'
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
        const controller = new AbortController();
        const url = isAllGroups
            ? route('admin.grade-generator.students-all')
            : route('admin.grade-generator.students', selectedGroupId);

        axios.get(url, { signal: controller.signal })
            .then(res => {
                setStudents(res.data);
            })
            .catch(err => {
                if (axios.isCancel(err)) return;
                toast({ title: 'Gagal sinkronisasi data', message: 'Tidak dapat memuat record mahasiswa.', priority: 'error' });
            })
            .finally(() => {
                setLoading(false);
            });

        return () => controller.abort();
    }, [selectedGroupId, groups, periods, selectedPeriodId, isAllGroups, toast]);

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

        router.post(route('admin.grade-generator.save-scores'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setSaving(false);
                setEvidenceFile(null);
                toast({ title: 'Success', message: 'Payload nilai berhasil dikomit ke registry.', priority: 'success' });
            },
            onError: () => {
                setSaving(false);
                toast({ title: 'Gagal komit', message: 'Terjadi kegagalan orkestrasi penyimpanan nilai.', priority: 'error' });
            }
        });
    };

    const handleExport = () => {
        if (!selectedGroupId || !selectedPeriodId) return;
        window.location.href = route('admin.grade-generator.export', { id: selectedGroupId, period_id: selectedPeriodId });
    };

    const handleExportPdf = () => {
        if (!selectedGroupId || !selectedPeriodId) return;
        window.location.href = route('admin.grade-generator.export-pdf', { id: selectedGroupId, period_id: selectedPeriodId });
    };

    const handleExportZip = () => {
        if (!selectedPeriodId) return;
        window.location.href = route('admin.grade-generator.export-zip', { period_id: selectedPeriodId });
    };

    return (
        <AppLayout title="Protokol Injeksi Nilai">
            <Head title="Laboratorium Analisis Nilai" />

            <div className="space-y-12 pb-24">
                {/* 
                    Emerald Premium Header 
                    Refining from heavy black to lush tactical emerald gradient
                */}
                <div className="relative overflow-hidden rounded-lg bg-white from-primary-DEFAULT via-primary-dark to-[#043d23] p-10 md:p-14 border border-primary flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                    <div className="absolute top-0 right-0 w-full h-auto bg-white/10 rounded-lg /2x-1/2 opacity-50" />
                    
                    <div className="relative z-10 space-y-5 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-white/10 rounded-xl border border-slate-200
                                <Calculator className="h-4 w-4 text-emerald-300" />
                             </div>
                            <span className="text-[10px] font-semibold text-emerald-100 ">
                                GRADE_ORCHESTRATION_ENGINE_V3
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-white  ">
                            Pusat <span className="text-emerald-300 text-glow-emerald">Penilaian</span>
                        </h1>
                        <p className="text-emerald-50/70 text-sm font-medium leading-normal max-w-2xl">
                             Input dan sinkronisasi parameter nilai merit, kedisiplinan, serta sikap kolektif mahasiswa berdasarkan audit orisinal pengabdian di lapangan.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 relative z-10">
                        {selectedPeriodId && periods.find(p => p.id === selectedPeriodId)?.grading_start && (
                            <div className="bg-white/10 p-6 rounded-lg border border-slate-200 flex items-center gap-6 min-w-[240px] group/stat">
                                <div className="p-3 bg-white rounded-lg text-primary group-hover/stat:scale-110">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-semibold text-emerald-200/60  mb-1.5">Operational_Window</span>
                                    <span className="text-[13px] font-semibold text-white mt-0.5 ">
                                        {new Date(periods.find(p => p.id === selectedPeriodId)!.grading_start!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(periods.find(p => p.id === selectedPeriodId)!.grading_end!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selection & Meta Console */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:mx-2">
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white p-10 rounded-lg border border-slate-200 relative overflow-hidden group">
                           <div className="grid gap-6 md:grid-cols-2 relative z-10">
                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-semibold text-slate-400  ml-2 group-focus-within/field:text-primary transition-colors">Target Siklus Periode</label>
                                    <FormSelect
                                        placeholder="Tentukan Siklus..."
                                        value={selectedPeriodId}
                                        onChange={(e) => {
                                            setSelectedPeriodId(Number(e.target.value) || '');
                                            setSelectedGroupId('');
                                        }}
                                        options={periods.map(p => ({ value: p.id, label: p.name.toUpperCase() }))}
                                        className="bg-slate-50 border-slate-200 text-sm font-semibold  text-slate-900 h-16 rounded-lg focus:bg-white focus:border-primary/50 px-6 appearance-none"
                                    />
                                </div>

                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-semibold text-slate-400  ml-2 group-focus-within/field:text-primary transition-colors">Sektor Kelompok Sasaran</label>
                                    <FormSelect
                                        placeholder="Tentukan Kelompok..."
                                        value={selectedGroupId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedGroupId(val === 'all' ? 'all' : val ? Number(val) : '');
                                        }}
                                        options={dropdownOptions}
                                        disabled={!selectedPeriodId}
                                        className="bg-slate-50 border-slate-200 text-sm font-semibold  text-slate-900 h-16 rounded-lg focus:bg-white focus:border-primary/50 px-6 appearance-none disabled:opacity-30"
                                    />
                                </div>
                            </div>
                        </section>

                        {selectedGroupId && !isAllGroups && (
                            <section className="bg-white p-12 rounded-lg border border-slate-200 relative overflow-hidden group/meta-panel">
                                <div className="absolute top-0 right-0 p-12 text-slate-900 pointer-events-none group-hover/meta-panel:scale-110 transition-transform">
                                    <IdCard className="h-64 w-64" />
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-10 relative z-10">
                                    <MetaItem label="Batch_Angkatan" value={meta.angkatan} />
                                    <MetaItem label="Sektor_ID" value={meta.kelompok} />
                                    <MetaItem label="Lokasi_Penugasan" value={meta.desa} />
                                    <MetaItem label="Distrik_Wilayah" value={meta.kecamatan} />
                                    <MetaItem label="Kabupaten_Regency" value={meta.kabupaten} />
                                    <div className="col-span-full border-t border-slate-200 pt-8 mt-4">
                                        <MetaItem label="Executive_Officer (DPL)" value={meta.dpl} primary />
                                    </div>
                                </div>

                                <div className="mt-12 pt-12 border-t border-slate-200 relative z-10">
                                    <label className="text-[11px] font-semibold text-primary  mb-6 block flex items-center gap-4">
                                        <CloudUpload className="w-5 h-5" />
                                        UNGGAH_EVIDENCE_RECORD (PINDAIAN_BLANKO)
                                    </label>
                                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6">
                                        <div className="relative group/upload flex-1">
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                            />
                                            <div className="px-6 py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg group-hover/upload:border-primary/40 group-hover/upload:bg-whiteflex items-center justify-between">
                                                <span className="text-[11px] font-semibold text-slate-400  truncate pr-8">
                                                    {evidenceFile ? evidenceFile.name : 'SELECT_PAYLOAD_FILE (PDF/IMAGE)...'}
                                                </span>
                                                <CloudUpload className="h-6 w-6 text-slate-300 group-hover/upload:text-primary transition-colors shrink-0" />
                                            </div>
                                        </div>
                                        {evidenceFile && (
                                            <div className="flex items-center gap-4 px-6 py-4 rounded-lg bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 text-xs font-semibold  zoom-in-95 shrink-0">
                                                <BadgeCheck className="w-5 h-5 text-emerald-500" /> PAYLOAD_READY
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <section className="bg-white p-12 rounded-[4rem] border border-slate-200 h-full flex flex-col justify-between group overflow-hidden relative">
                             <div className="absolute top-0 right-0 p-12 text-slate-900 group-hover:rotate-12 transition-transform">
                                <Cpu className="h-48 w-48" />
                             </div>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="p-4 bg-primary text-white rounded-lg w-fit group-hover:scale-110 transition-transform">
                                    <Beaker className="h-8 w-8 stroke-[2px]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-slate-900 ">Analisis_Nilai</h3>
                                    <p className="text-[10px] text-slate-400 font-semibold  mt-4 opacity-50 leading-normal">
                                        RANGKUMAN AGREGAT PERFORMA KOLEKTIF UNIT SEKTOR SAAT INI.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-10 pt-12 relative z-10">
                                <div className="flex justify-between items-end border-b border-slate-200 pb-8 group/val">
                                    <span className="text-[10px] font-semibold text-slate-400  group-hover/val:text-primary transition-colors">AGGREGATE_AVG</span>
                                    <span className="text-5xl font-semibold text-slate-900  group-hover/val:scale-110 transition-transform">
                                        {summary.avg}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end group/val">
                                    <span className="text-[10px] font-semibold text-slate-400  group-hover/val:text-primary transition-colors">TOTAL_POPULATION</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-semibold text-slate-400 group-hover/val:text-slate-600 transition-colors">
                                            {summary.count}
                                        </span>
                                        <span className="text-[9px] font-semibold text-slate-300">RECORDS</span>
                                    </div>
                                </div>
                                <div className="pt-4">
                                     <div className="h-2 w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                                        <div 
                                            className="h-full bg-primary
                                            style={{ width: `${(summary.avg / 100) * 100}%` }} 
                                        />
                                     </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Ingestion Table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden relative lg:mx-2">
                    <div className="px-12 py-6 border-b border-slate-200 flex flex-wrap gap-6 items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-7">
                            <div className="h-14 w-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                <IdCard className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold text-slate-900 ">Matriks_Input_Parameter</h3>
                                <p className="text-[10px] font-semibold text-slate-400  mt-2.5 opacity-50">SINKRONISASI EVALUASI INDIVIDU PERSONEL.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {(selectedGroupId || isAllGroups) && (
                                <div className="flex gap-3 pr-6 border-r border-slate-200">
                                    <button onClick={handleExport} className="h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/40active:scale-95" title="EXPORT_EXCEL">
                                        <FileArchive className="h-5.5 w-5.5" />
                                    </button>
                                    <button onClick={handleExportPdf} className="h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/40active:scale-95" title="EXPORT_PDF">
                                        <FileDown className="h-5.5 w-5.5" />
                                    </button>
                                    {isAllGroups && (
                                        <button onClick={handleExportZip} className="h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/40active:scale-95" title="EXPORT_ARCHIVE">
                                            <FolderDown className="h-5.5 w-5.5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={saving || !selectedGroupId || isAllGroups || students.length === 0}
                                className="inline-flex items-center gap-4 px-6 h-14 bg-primary text-white rounded-lg text-xs font-semibold  hover:bg-primary-darkdisabled:opacity-50 shrink-0"
                            >
                                <CloudUpload className="h-5.5 w-5.5 stroke-[2.5px]" />
                                KOMIT_RECORD_NILAI
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative z-10 pr-1 custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-50">
                            <thead className="bg-slate-50/20">
                                <tr>
                                    <th className="px-12 py-3 text-left text-xs font-semibold  text-slate-400">Identitas_Elemen_Mahasiswa</th>
                                    {isAllGroups && <th className="px-12 py-3 text-left text-xs font-semibold  text-slate-400">Sektor_Unit</th>}
                                    <th className="px-12 py-3 text-center text-xs font-semibold  text-slate-400">Kedisiplinan</th>
                                    <th className="px-12 py-3 text-center text-xs font-semibold  text-slate-400">Etika_Sikap</th>
                                    <th className="px-12 py-3 text-right text-xs font-semibold  text-slate-400 pr-16">Agregat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={isAllGroups ? 5 : 4} className="px-12 py-48 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-50">
                                                <RefreshCw className="h-16 w-16 text-primary" />
                                                <span className="text-[12px] font-semibold  text-slate-400">DATA_SYNCHRONIZING_CORE...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((s, idx) => (
                                        <tr key={`${s.user_id}-${idx}`} className="group/row hover:bg-slate-50/20cursor-default">
                                            <td className="px-12 py-3">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[17px] font-semibold text-slate-900 group-hover/row:text-primary transition-colors ">{s.name}</span>
                                                    <div className="flex items-center gap-3">
                                                       <span className="text-[10px] font-semibold text-slate-400  px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 opacity-50 group-hover/row:opacity-100">NIM: {s.nim}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            {isAllGroups && (
                                                <td className="px-12 py-3">
                                                    <span className="px-4 py-2 rounded-lg bg-primary/5 text-primary text-xs font-semibold border border-primary/10">{s.group_code}</span>
                                                </td>
                                            )}
                                            <td className="px-12 py-3 text-center">
                                                <div className="flex justify-center group/input">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="w-24 px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-primary/50 group-hover/input:border-primary/30disabled:opacity-30"
                                                        value={s.discipline ?? ''}
                                                        onChange={(e) => updateStudent(s.user_id, 'discipline', e.target.value)}
                                                        disabled={isAllGroups}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-12 py-3 text-center">
                                                <div className="flex justify-center group/input">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="w-24 px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-primary/50 group-hover/input:border-primary/30disabled:opacity-30"
                                                        value={s.attitude ?? ''}
                                                        onChange={(e) => updateStudent(s.user_id, 'attitude', e.target.value)}
                                                        disabled={isAllGroups}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-12 py-3 text-right pr-16">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={clsx(
                                                        "text-3xl font-semiboldgroup-hover/row:scale-125 group-hover/row:text-primary ",
                                                        computeTotal(s) > 0 ? "text-slate-900" : "text-slate-100"
                                                    )}>
                                                        {computeTotal(s) || '--'}
                                                    </span>
                                                    {computeTotal(s) > 0 && <span className="text-[8px] font-semibold text-primary  opacity-50">VAL_READY</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAllGroups ? 5 : 4} className="px-12 py-48 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-50">
                                                <div className="h-20 w-20 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200
                                                   <ShieldCheck className="h-10 w-10 text-slate-200" />
                                                </div>
                                                <p className="text-[12px] font-semibold  text-slate-400">
                                                    {selectedGroupId ? 'SYSTEM_INFO: TARGET_POPULATION_NOT_FOUND' : 'COMMAND_INFO: SELECT_TARGET_SECTOR_PRIOR_TO_ACCESS'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tactical Emerald Footer Monitor */}
                <div className="p-12 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group mx-2">
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,168,83,0.05),transparent_50%)]" />

                     <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary">
                                    <Scale className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-semibold text-white ">GRADE_GOVERNANCE_PROTOCOL_V3</h4>
                                    <p className="text-[10px] text-emerald-400 text-sm  mt-2 whitespace-nowrap">STATUS: SECURE_INJECTION_AUTHORIZED</p>
                                </div>
                            </div>
                            <p className="text-[14px] text-slate-400 text-sm leading-normal max-w-4xl opacity-75">
                                Protokol Penilaian: Seluruh parameter nilai yang dikomit akan masuk ke dalam orkestrasi rekam jejak akademik mahasiswa secara absolut. 
                                Pastikan <span className="text-primary font-semibold">"Evidence_Payload"</span> (pindaian blanko) telah diunggah sebagai lampiran autentikasi material 
                                untuk audit kelulusan KKN UIN SAIZU. Sistem mencatat jejak audit per injeksi record.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-5 shrink-0 border-l border-slate-800 pl-12 hidden lg:flex">
                             <div className="flex items-center gap-3 mb-1 px-5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                <div className="h-2.5 w-2.5 rounded-lg bg-emerald-500" />
                                <span className="text-[11px] font-semibold text-slate-100 ">VAL_INTEG_SYNC_OK</span>
                             </div>
                             <div className="flex gap-5">
                                <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help text-glow-emerald">
                                    <Cpu className="h-7 w-7" />
                                </div>
                                <div className="h-14 w-14 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-300 transition-colors group/ic cursor-help">
                                    <Fingerprint className="h-7 w-7" />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 opacity-20">
                    <p className="text-[9px] font-semibold text-slate-300 ">
                        Grade Ingestion Engine • Merit Registry Ver. 3.2.0 • UIN SAIZU © 2024
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

function MetaItem({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
    return (
        <div className="space-y-3 flex flex-col group/meta">
            <span className="text-[10px] font-semibold text-slate-400  group-hover/meta:text-primary transition-colors">{label}</span>
            <p className={clsx(
                "text-[15px] font-semibold  truncate max-w-full mt-1",
                primary ? "text-primary text-glow-emerald" : "text-slate-900"
            )}>
                {value || 'DATA_PENDING'}
            </p>
        </div>
    );
}
