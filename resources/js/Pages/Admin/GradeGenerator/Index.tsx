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
    Sparkles,
    BadgeCheck
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
            { value: 'all', label: '📋 SEMUA KELOMPOK (AGREGASI)' },
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
                toast({ title: 'Gagal mengambil data', message: 'Tidak dapat memuat data mahasiswa.', priority: 'error' });
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
                toast({ title: 'Berhasil', message: 'Nilai berhasil disimpan.', priority: 'success' });
            },
            onError: () => {
                setSaving(false);
                toast({ title: 'Gagal menyimpan', message: 'Terjadi kesalahan saat menyimpan nilai.', priority: 'error' });
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
        <AppLayout title="Generator Nilai KKN">
            <Head title="Laboratorium Nilai Merit" />

            <div className="space-y-10 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Professional Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-3 font-bold">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Injeksi Parameter Merit</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight italic uppercase leading-none">
                            Nexus <span className="text-primary italic">Penilaian</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-3 font-medium italic opacity-70">Kalibrasi vektor kedisiplinan dan sikap untuk operasional lapangan mahasiswa KKN.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {selectedPeriodId && periods.find(p => p.id === selectedPeriodId)?.grading_start && (
                            <div className="px-6 py-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-4 group shadow-sm-soft italic">
                                <Calculator className="h-6 w-6 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Jendela Operasional</span>
                                    <span className="text-[10px] font-extrabold text-slate-900 mt-0.5 uppercase tracking-tight tabular-nums italic">
                                        {new Date(periods.find(p => p.id === selectedPeriodId)!.grading_start!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(periods.find(p => p.id === selectedPeriodId)!.grading_end!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selection & Meta Console */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                           <div className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1 italic">Siklus Periode</label>
                                    <FormSelect
                                        placeholder="Pilih Siklus Periode..."
                                        value={selectedPeriodId}
                                        onChange={(e) => {
                                            setSelectedPeriodId(Number(e.target.value) || '');
                                            setSelectedGroupId('');
                                        }}
                                        options={periods.map(p => ({ value: p.id, label: p.name }))}
                                        className="bg-slate-50 border-slate-200 text-xs font-bold tracking-tight text-slate-800 h-14 rounded-2xl focus:border-primary/50 italic"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1 italic">Target Kelompok</label>
                                    <FormSelect
                                        placeholder="Pilih Target Kelompok..."
                                        value={selectedGroupId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedGroupId(val === 'all' ? 'all' : val ? Number(val) : '');
                                        }}
                                        options={dropdownOptions}
                                        disabled={!selectedPeriodId}
                                        className="bg-slate-50 border-slate-200 text-xs font-bold tracking-tight text-slate-800 h-14 rounded-2xl focus:border-primary/50 italic"
                                    />
                                </div>
                            </div>
                        </div>

                        {selectedGroupId && !isAllGroups && (
                            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8">
                                    <MetaItem label="Angkatan" value={meta.angkatan} />
                                    <MetaItem label="ID Kelompok" value={meta.kelompok} />
                                    <MetaItem label="Sektor Lokasi" value={meta.desa} />
                                    <MetaItem label="Wilayah" value={meta.kecamatan} />
                                    <MetaItem label="Kabupaten" value={meta.kabupaten} />
                                    <div className="col-span-full border-t border-slate-50 pt-6">
                                        <MetaItem label="Petugas Lapangan (DPL)" value={meta.dpl} primary />
                                    </div>
                                </div>

                                <div className="mt-10 pt-10 border-t border-slate-100">
                                    <label className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 block flex items-center gap-3 italic">
                                        <CloudUpload className="w-4 h-4" />
                                        Evidence Ingestion (Scan Blanko Nilai)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative group/upload flex-1">
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="px-6 py-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl group-hover/upload:border-primary/50 transition-all flex items-center justify-between shadow-inner-sm italic">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                                                    {evidenceFile ? evidenceFile.name : 'Pilih Artifact PDF/IMG...'}
                                                </span>
                                                <CloudUpload className="h-5 w-5 text-slate-300" />
                                            </div>
                                        </div>
                                        {evidenceFile && (
                                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 text-[9px] font-bold uppercase tracking-widest animate-pulse italic">
                                                <BadgeCheck className="w-4 h-4" /> READY
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm h-full flex flex-col justify-between group overflow-hidden relative italic">
                             <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-900 group-hover:rotate-12 transition-transform duration-1000">
                                <Cpu className="h-32 w-32" />
                            </div>
                            <div className="space-y-4 relative z-10">
                                <div className="p-3.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 w-fit">
                                    <Beaker className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase italic leading-none">Merit Analytics</h3>
                                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase italic mt-2 opacity-70">
                                    Agregasi real-time performa kandidat dalam hub yang terpilih saat ini.
                                </p>
                            </div>

                            <div className="space-y-8 pt-10 relative z-10 italic">
                                <div className="flex justify-between items-end border-b border-slate-50 pb-6">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rerata Agregat</span>
                                    <span className="text-4xl font-black text-slate-900 tabular-nums italic tracking-tighter">
                                        {summary.avg}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kapasitas Unit</span>
                                    <span className="text-xl font-bold text-slate-400 tabular-nums uppercase">
                                        {summary.count} PERSORANGAN
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ingestion Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative italic">
                    <div className="px-10 py-8 border-b border-slate-100 flex flex-wrap gap-8 items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-white rounded-xl text-slate-400 border border-slate-200">
                                <IdCard className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase italic leading-none">Loadout Nilai</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 opacity-70">Interface ingest untuk parameter merit individu.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {(selectedGroupId || isAllGroups) && (
                                <div className="flex gap-2 pr-4 border-r border-slate-200">
                                    <button onClick={handleExport} className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm" title="EXPORT EXCEL">
                                        <FileArchive className="h-5 w-5" />
                                    </button>
                                    <button onClick={handleExportPdf} className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm" title="EXPORT PDF">
                                        <FileDown className="h-5 w-5" />
                                    </button>
                                    {isAllGroups && (
                                        <button onClick={handleExportZip} className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm" title="EXPORT ZIP">
                                            <FolderDown className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={saving || !selectedGroupId || isAllGroups || students.length === 0}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 italic"
                            >
                                <CloudUpload className="h-5 w-5" />
                                KOMIT NILAI MERIT
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative z-10 pr-1">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/20">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">Identitas Mahasiswa</th>
                                    {isAllGroups && <th className="px-10 py-6 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">Hub Kelompok</th>}
                                    <th className="px-10 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">Kedisiplinan (0-100)</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">Sikap (0-100)</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">Mean Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={isAllGroups ? 5 : 4} className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCw className="h-10 w-10 animate-spin text-primary" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 animate-pulse italic">Mencari aliran data operasional...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((s, idx) => (
                                        <tr key={`${s.user_id}-${idx}`} className="group hover:bg-slate-50/50 transition-all duration-300">
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-extrabold text-slate-900 group-hover:text-primary transition-colors tracking-tight uppercase italic leading-none">{s.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter tabular-nums italic">NIM. {s.nim}</span>
                                                </div>
                                            </td>
                                            {isAllGroups && (
                                                <td className="px-10 py-6">
                                                    <span className="px-3 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-bold border border-primary/10 italic">{s.group_code}</span>
                                                </td>
                                            )}
                                            <td className="px-10 py-6 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all shadow-inner-sm disabled:opacity-30 italic"
                                                    value={s.discipline ?? ''}
                                                    onChange={(e) => updateStudent(s.user_id, 'discipline', e.target.value)}
                                                    disabled={isAllGroups}
                                                />
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-primary/50 transition-all shadow-inner-sm disabled:opacity-30 italic"
                                                    value={s.attitude ?? ''}
                                                    onChange={(e) => updateStudent(s.user_id, 'attitude', e.target.value)}
                                                    disabled={isAllGroups}
                                                />
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <span className={clsx(
                                                    "text-xl font-black italic tabular-nums transition-all group-hover:scale-110",
                                                    computeTotal(s) > 0 ? "text-primary" : "text-slate-200"
                                                )}>
                                                    {computeTotal(s) || '--'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAllGroups ? 5 : 4} className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40 italic">
                                                <ShieldCheck className="h-12 w-12 text-slate-300" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                                                    {selectedGroupId ? 'DATA UNIT TIDAK DITEMUKAN.' : 'PILIH HUB TARGET UNTUK INGESTI.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Performance Intelligence */}
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-start gap-5 italic shadow-inner-sm">
                    <Cpu className="w-8 h-8 text-slate-300 shrink-0" />
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">Protokol Merit Akademik</h4>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic max-w-4xl mt-2 opacity-80">
                            Semua parameter yang diinjeksikan dicatat dalam sistem audit secara real-time. 
                            Rerata nilai merit dihitung otomatis oleh mesin nexus. Pastikan bukti fisik telah didigitalisasi untuk keperluan verifikasi audit.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function MetaItem({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
    return (
        <div className="space-y-2 flex flex-col group/meta italic">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest group-hover/meta:text-primary transition-colors leading-none">{label}</span>
            <p className={clsx(
                "text-xs font-extrabold uppercase tracking-tight truncate max-w-full",
                primary ? "text-primary" : "text-slate-800"
            )}>
                {value || '---'}
            </p>
        </div>
    );
}
