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
    FolderArrowDownIcon,
    ShieldCheckIcon,
    CpuChipIcon,
    BeakerIcon,
    IdentificationIcon
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
            { value: 'all', label: '📋 ALL BRIGADES (AGGREGATED)' },
            ...filteredGroups.map(g => ({
                value: g.id,
                label: `BRIGADE ${g.code} [${g.name}]`
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
                kelompok: 'ALL BRIGADES'
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
        <AppLayout title="Merit Injection Nexus">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">MERIT PARAMETER INJECTION</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Merit <span className="text-accent-gold text-glow-gold">Nexus</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Calibrating discipline and attitude vectors for field operatives.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {selectedPeriodId && periods.find(p => p.id === selectedPeriodId)?.grading_start && (
                            <div className="px-6 py-4 glass rounded-2xl border-accent-gold/20 flex items-center gap-4 group">
                                <CalculatorIcon className="h-6 w-6 text-accent-gold group-hover:rotate-12 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">OPERATIONAL WINDOW</span>
                                    <span className="text-[10px] font-bold text-accent-gold mt-1 uppercase tracking-widest">
                                        {new Date(periods.find(p => p.id === selectedPeriodId)!.grading_start!).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(periods.find(p => p.id === selectedPeriodId)!.grading_end!).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selection & Meta Console */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass p-10 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                <BeakerIcon className="h-32 w-32 text-white" />
                            </div>

                            <div className="grid gap-8 md:grid-cols-2 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">TEMPORAL CYCLE</label>
                                    <FormSelect
                                        placeholder="SELECT OPERATIONAL CYCLE..."
                                        value={selectedPeriodId}
                                        onChange={(e) => {
                                            setSelectedPeriodId(Number(e.target.value) || '');
                                            setSelectedGroupId('');
                                        }}
                                        options={periods.map(p => ({ value: p.id, label: p.name }))}
                                        className="bg-black/40 border-white/10 text-[10px] font-black tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">BRIGADE TARGET</label>
                                    <FormSelect
                                        placeholder="SELECT TARGET BRIGADE..."
                                        value={selectedGroupId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedGroupId(val === 'all' ? 'all' : val ? Number(val) : '');
                                        }}
                                        options={dropdownOptions}
                                        disabled={!selectedPeriodId}
                                        className="bg-black/40 border-white/10 text-[10px] font-black tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {selectedGroupId && !isAllGroups && (
                            <div className="glass p-10 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                                    <MetaItem label="CYCLE COHORT" value={meta.angkatan} />
                                    <MetaItem label="BRIGADE IDENTITY" value={meta.kelompok} />
                                    <MetaItem label="DEPLOYMENT SECTOR" value={meta.desa} />
                                    <MetaItem label="TACTICAL DISTRICT" value={meta.kecamatan} />
                                    <MetaItem label="REGIONAL REGISTRY" value={meta.kabupaten} />
                                    <div className="col-span-full">
                                        <MetaItem label="FIELD COMMAND OFFICER (DPL)" value={meta.dpl} primary />
                                    </div>
                                </div>

                                <div className="mt-10 pt-10 border-t border-white/5">
                                    <label className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mb-4 block italic flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
                                        Evidence Ingestion (Scan Blanko Nilai)
                                    </label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group/upload flex-1">
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="px-8 py-5 bg-black/40 border border-dashed border-white/10 rounded-2xl group-hover/upload:border-accent-gold/50 transition-all flex items-center justify-between">
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                    {evidenceFile ? evidenceFile.name : 'SELECT PDF/IMAGE ARTIFACT...'}
                                                </span>
                                                <div className="p-2 bg-white/5 rounded-lg text-white/40">
                                                    <CloudArrowUpIcon className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                        {evidenceFile && (
                                            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                <CheckCircleIcon className="w-5 h-5" /> READY
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-4 italic">
                                        * UPLOAD PHYSICAL FIELD ASSESSMENT MANUSCRIPTS. NEW DATA OVERWRITES EXISTING ARTIFACTS.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        <div className="glass p-10 rounded-[2.5rem] border-white/5 shadow-2xl bg-gradient-to-br from-primary/5 to-transparent h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <CpuChipIcon className="h-12 w-12 text-primary-light" />
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Merit Analytics</h3>
                                <p className="text-[10px] text-white/30 font-black tracking-widest uppercase italic leading-relaxed">
                                    Real-time aggregation of candidate performance vectors within the selected hub.
                                </p>
                            </div>

                            <div className="space-y-8 pt-10">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">AGGREGATE MEAN</span>
                                    <span className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-glow">
                                        {summary.avg}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end border-t border-white/5 pt-6">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">SCHOLAR COUNT</span>
                                    <span className="text-2xl font-black text-white/60 tabular-nums uppercase">
                                        {summary.count} UNIT
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ingestion Table */}
                <div className="bg-white/[0.02] rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                    <div className="p-10 border-b border-white/5 flex flex-wrap gap-8 items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary-light">
                                <IdentificationIcon className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Scholar Loadout</h3>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Injection interface for merit parameters.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {(selectedGroupId || isAllGroups) && (
                                <div className="flex gap-4 pr-6 border-r border-white/10">
                                    <button onClick={handleExport} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-accent-gold transition-all" title="EXPORT EXCEL">
                                        <ArchiveBoxArrowDownIcon className="h-6 w-6" />
                                    </button>
                                    <button onClick={handleExportPdf} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-accent-gold transition-all" title="EXPORT PDF">
                                        <DocumentArrowDownIcon className="h-6 w-6" />
                                    </button>
                                    {isAllGroups && (
                                        <button onClick={handleExportZip} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-accent-gold transition-all" title="EXPORT ZIP">
                                            <FolderArrowDownIcon className="h-6 w-6" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={saving || !selectedGroupId || isAllGroups || students.length === 0}
                                className="group flex items-center gap-4 px-10 py-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 relative overflow-hidden disabled:opacity-50 disabled:grayscale"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <CloudArrowUpIcon className="h-6 w-6 text-accent-gold" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">COMMIT MERIT DATA</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Candidate</th>
                                    {isAllGroups && <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Brigade HUB</th>}
                                    <th className="px-10 py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Discipline (0-100)</th>
                                    <th className="px-10 py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Attitude (0-100)</th>
                                    <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Mean Merit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={isAllGroups ? 5 : 4} className="px-10 py-32 text-center text-white/20">
                                            <div className="flex flex-col items-center gap-6">
                                                <ArrowPathIcon className="h-16 w-16 animate-spin" />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Scanning operational datastream...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((s, idx) => (
                                        <tr key={`${s.user_id}-${idx}`} className="group hover:bg-white/[0.04] transition-all duration-300">
                                            <td className="px-10 py-10">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-white tracking-widest uppercase italic group-hover:text-accent-gold transition-colors">{s.name}</span>
                                                    <span className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase mt-2">NIM // {s.nim}</span>
                                                </div>
                                            </td>
                                            {isAllGroups && (
                                                <td className="px-10 py-10">
                                                    <span className="text-[10px] font-black text-primary-light uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">{s.group_code}</span>
                                                </td>
                                            )}
                                            <td className="px-10 py-10 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-24 px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-center text-sm font-black text-white outline-none focus:border-accent-gold/50 transition-all font-mono shadow-2xl disabled:opacity-20"
                                                    value={s.discipline ?? ''}
                                                    onChange={(e) => updateStudent(s.user_id, 'discipline', e.target.value)}
                                                    disabled={isAllGroups}
                                                />
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-24 px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-center text-sm font-black text-white outline-none focus:border-accent-gold/50 transition-all font-mono shadow-2xl disabled:opacity-20"
                                                    value={s.attitude ?? ''}
                                                    onChange={(e) => updateStudent(s.user_id, 'attitude', e.target.value)}
                                                    disabled={isAllGroups}
                                                />
                                            </td>
                                            <td className="px-10 py-10 text-right">
                                                <span className={`text-xl font-black italic tabular-nums group-hover:scale-110 transition-transform inline-block ${computeTotal(s) > 0 ? 'text-accent-gold text-glow-gold' : 'text-white/10'}`}>
                                                    {computeTotal(s) || '--'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAllGroups ? 5 : 4} className="px-10 py-40 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <ShieldCheckIcon className="h-16 w-16 text-white/5" />
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">
                                                    {selectedGroupId ? 'NO UNIT DATA LOCATED.' : 'TARGET HUB SELECTION REQUIRED.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Strategic Intel */}
                <div className="p-10 glass rounded-[3rem] border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <CpuChipIcon className="h-24 w-24" />
                    </div>
                    <h4 className="text-[10px] font-black text-accent-gold flex items-center gap-3 uppercase tracking-[0.4em] mb-6 italic">
                        <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                        Operational Merit Protocol
                    </h4>
                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-[2] italic border-l-2 border-primary/30 pl-8 max-w-4xl">
                        ALL INJECTED PARAMETERS ARE LOGGED IN THE AUDIT NEXUS. MEAN MERIT IS CALCULATED AUTOMATICALLY. ENSURE PHYSICAL ARTIFACTS ARE DIGITIZED FOR AUDIT COMPLIANCE.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

function MetaItem({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
    return (
        <div className="space-y-2">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{label}</span>
            <p className={`text-xs font-black uppercase tracking-widest leading-none ${primary ? 'text-primary-light' : 'text-white/80'} italic`}>
                {value || '---'}
            </p>
        </div>
    );
}

