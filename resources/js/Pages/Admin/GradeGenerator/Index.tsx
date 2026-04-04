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
 Scale,
 Search,
 X,
 ChevronRight,
 Zap,
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
 { value: 'all', label: 'ALL_UNITS (ORCHESTRATED)' },
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
 kelompok: 'ALL_UNITS_ACTIVE'
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
 toast({ title: 'SYNC_ERROR', message: 'Failed to access personnel records.', priority: 'error' });
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
 toast({ title: 'COMMIT_SUCCESS', message: 'Evaluation records committed to primary ledger.', priority: 'success' });
 },
 onError: () => {
 setSaving(false);
 toast({ title: 'ORCHESTRATION_ERROR', message: 'Failed to finalize score injection.', priority: 'error' });
 }
 });
 };

 return (
 <AppLayout title="Generator Nilai KKN">
 <Head title="Laboratorium Analisis Nilai" />

 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 GRADE_INGESTION_SYSTEM_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <Calculator className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Grade <span className="text-primary">Generator</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
 <Activity className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Aggregate_Avg</span>
 <span className="text-xs font-semibold text-slate-900 leading-none">
 {summary.avg} SCALE
 </span>
 </div>
 </div>
 </div>

 <button 
 onClick={handleSave}
 disabled={saving || !selectedGroupId || isAllGroups || students.length === 0}
 className="px-6 py-3 bg-slate-900 text-white text-[10px] font-semibold rounded-lg transition-all flex items-center gap-3 disabled:opacity-30"
 >
 <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
 {saving ? 'COMMITTING...' : 'COMMIT_RECORDS'}
 </button>
 </div>
 </div>

 {/* Selection & Meta Console */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-8">
 <div className="bg-white p-8 rounded-lg border border-slate-100">
 <div className="grid gap-6 md:grid-cols-2">
 <div className="space-y-4">
 <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1">
 <History className="h-3 w-3 text-primary/60" /> OPERATIONAL_CYCLE
 </label>
 <FormSelect
 placeholder="SELECT_PERIOD..."
 value={selectedPeriodId}
 onChange={(e) => {
 setSelectedPeriodId(Number(e.target.value) || '');
 setSelectedGroupId('');
 }}
 options={periods.map(p => ({ value: p.id, label: p.name.toUpperCase() }))}
 className="bg-slate-50 border-slate-100 h-12 rounded-lg text-[10px] font-semibold text-slate-900 focus:bg-white transition-all appearance-none"
 />
 </div>

 <div className="space-y-4">
 <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1">
 <IdCard className="h-3 w-3 text-primary/60" /> TARGET_UNIT_VECTOR
 </label>
 <FormSelect
 placeholder="SELECT_UNIT..."
 value={selectedGroupId}
 onChange={(e) => {
 const val = e.target.value;
 setSelectedGroupId(val === 'all' ? 'all' : val ? Number(val) : '');
 }}
 options={dropdownOptions}
 disabled={!selectedPeriodId}
 className="bg-slate-50 border-slate-100 h-12 rounded-lg text-[10px] font-semibold text-slate-900 focus:bg-white transition-all appearance-none disabled:opacity-30"
 />
 </div>
 </div>
 </div>

 {selectedGroupId && !isAllGroups && (
 <div className="bg-white p-8 rounded-lg border border-slate-100 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-10 text-slate-900/5 pointer-events-none ">
 <IdCard className="h-48 w-48" />
 </div>

 <div className="grid grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
 <MetaItem label="CYCLE_BATCH" value={meta.angkatan} />
 <MetaItem label="UNIT_CODE" value={meta.kelompok} />
 <MetaItem label="DEPLOYMENT_ZONE" value={meta.desa} />
 <MetaItem label="DISTRICT_SECTOR" value={meta.kecamatan} />
 <MetaItem label="REGENCY_AREA" value={meta.kabupaten} />
 <MetaItem label="OFFICER_IN_CHARGE" value={meta.dpl} primary />
 </div>

 <div className="mt-8 pt-8 border-t border-slate-50 relative z-10">
 <label className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1 mb-4">
 <CloudUpload className="h-3 w-3 text-primary/60" /> EVIDENCE_SCAN_UPLOAD (PDF/JPG)
 </label>
 <div className="flex flex-col md:flex-row items-center gap-4">
 <div className="relative group/upload flex-1 w-full">
 <input
 type="file"
 accept=".pdf,.jpg,.jpeg,.png"
 onChange={handleFileChange}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
 />
 <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-lg group-hover/upload:border-primary/30 transition-all flex items-center justify-between">
 <span className="text-[10px] font-semibold text-slate-300 truncate pr-4">
 {evidenceFile ? evidenceFile.name : 'SELECT_FILE_PAYLOAD...'}
 </span>
 <CloudUpload className="h-5 w-5 text-slate-200 group-hover/upload:text-primary transition-colors" />
 </div>
 </div>
 {evidenceFile && (
 <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[9px] font-semibold flex items-center gap-2">
 <BadgeCheck className="w-3.5 h-3.5" /> ATTACHED
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>

 <div className="lg:col-span-1">
 <div className="bg-slate-900 p-8 rounded-lg border border-slate-800 h-full flex flex-col justify-between group overflow-hidden relative">
 <div className="absolute top-0 right-0 p-8 opacity-10 text-primary ">
 <Cpu className="h-48 w-48" />
 </div>
 
 <div className="space-y-4 relative z-10">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 w-fit">
 <Beaker className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h3 className="text-[11px] font-semibold text-white leading-none">ANALYTIC_CORE_V3</h3>
 <p className="text-[9px] font-semibold text-slate-500 mt-1.5 opacity-50 leading-none">REALTIME_WEIGHT_CALCULATION</p>
 </div>
 </div>

 <div className="pt-8 relative z-10 space-y-8">
 <div className="flex justify-between items-end border-b border-white/5 pb-4">
 <span className="text-[9px] font-semibold text-slate-500">UNIT_AVG</span>
 <span className="text-4xl font-semibold text-white leading-none">{summary.avg}</span>
 </div>
 <div className="flex justify-between items-end">
 <span className="text-[9px] font-semibold text-slate-500">RECORD_COUNT</span>
 <span className="text-xl font-semibold text-slate-400 leading-none">{summary.count}</span>
 </div>
 <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
 <div 
 className="h-full bg-emerald-500 transition-all" 
 style={{ width: `${(summary.avg / 100) * 100}%` }} 
 />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Ingestion Table */}
 <div className="bg-white rounded-lg border border-slate-100 overflow-hidden relative group">
 <div className="overflow-x-auto relative z-10 custom-scrollbar">
 <table className="min-w-full divide-y divide-slate-50">
 <thead className="bg-slate-50/50">
 <tr>
 <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">ENTITY_MEMBER</th>
 {isAllGroups && <th className="px-8 py-6 text-left text-[9px] font-semibold text-slate-400">UNIT_VECTOR</th>}
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">DISCIPLINE_VAL</th>
 <th className="px-8 py-6 text-center text-[9px] font-semibold text-slate-400">ATTITUDE_VAL</th>
 <th className="px-8 py-6 text-right text-[9px] font-semibold text-slate-400">AGGREGATE</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {loading ? (
 <tr>
 <td colSpan={isAllGroups ? 5 : 4} className="px-8 py-32 text-center">
 <div className="flex flex-col items-center gap-4 opacity-50">
 <RefreshCw className="h-10 w-10 text-primary" />
 <span className="text-[10px] font-semibold text-slate-300">RECORDS_SYNCING...</span>
 </div>
 </td>
 </tr>
 ) : students.length > 0 ? (
 students.map((s, idx) => (
 <tr key={`${s.user_id}-${idx}`} className="group/row hover:bg-slate-50/50 transition-colors">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 text-primary text-[11px] font-semibold flex items-center justify-center ">
 {s.name.charAt(0)}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] group-hover/row:text-primary transition-colors">
 {s.name}
 </span>
 <div className="flex items-center gap-2 mt-0.5">
 <Fingerprint className="h-3 w-3 text-slate-300" />
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 font-mono">
 NIM: {s.nim}
 </span>
 </div>
 </div>
 </div>
 </td>
 {isAllGroups && (
 <td className="px-8 py-6">
 <div className="px-3 py-1 bg-white border border-primary/20 rounded-lg text-[9px] font-semibold text-primary inline-block">
 {s.group_code}
 </div>
 </td>
 )}
 <td className="px-8 py-6 text-center">
 <div className="flex justify-center">
 <input
 type="number"
 min="0"
 max="100"
 value={s.discipline ?? ''}
 onChange={(e) => updateStudent(s.user_id, 'discipline', e.target.value)}
 disabled={isAllGroups}
 className="w-20 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-center text-xs font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all disabled:opacity-30"
 />
 </div>
 </td>
 <td className="px-8 py-6 text-center">
 <div className="flex justify-center">
 <input
 type="number"
 min="0"
 max="100"
 value={s.attitude ?? ''}
 onChange={(e) => updateStudent(s.user_id, 'attitude', e.target.value)}
 disabled={isAllGroups}
 className="w-20 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-center text-xs font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all disabled:opacity-30"
 />
 </div>
 </td>
 <td className="px-8 py-6 text-right">
 <div className="flex flex-col items-end">
 <span className={clsx(
 "text-2xl font-semibold leading-none transition-colors",
 computeTotal(s) > 0 ? "text-slate-900 group-hover/row:text-primary" : "text-slate-100"
 )}>
 {computeTotal(s) || '--'}
 </span>
 {computeTotal(s) > 0 && <span className="text-[8px] font-semibold text-emerald-500 mt-1 opacity-50">SYNC_READY</span>}
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={isAllGroups ? 5 : 4} className="px-8 py-32 text-center">
 <div className="flex flex-col items-center gap-4 opacity-20">
 <ShieldCheck className="h-12 w-12 text-slate-900" />
 <span className="text-[10px] font-semibold text-slate-900">INIT_VECTOR_SELECT_TARGET</span>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Operational Governance Footer */}
 <div className="p-8 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(16,168,83,0.05),transparent_50%)]" />
 <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
 <Scale className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h4 className="text-[11px] font-semibold text-white leading-none">GRADE_GOVERNANCE_PROTOCOL_V3.2</h4>
 <p className="text-[10px] font-semibold text-emerald-500 mt-2">STATUS: SECURE_INJECTION_AUTHORIZED</p>
 </div>
 </div>
 <p className="text-[12px] text-slate-400 text-sm leading-relaxed max-w-4xl opacity-75">
 Protokol Penilaian: Seluruh parameter yang dikomit akan masuk ke dalam orkestrasi rekam jejak akademik mahasiswa secara absolut. 
 Pastikan Evidence_Payload telah diunggah sebagai lampiran autentikasi material demi transparansi audit LPPM.
 </p>
 </div>
 <div className="flex flex-col items-end gap-5 shrink-0 hidden lg:flex border-l border-slate-800 pl-10">
 <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
 <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,168,83,0.5)]" />
 <span className="text-[9px] font-semibold text-slate-100">INGESTION_SYNC_OK</span>
 </div>
 <div className="flex gap-4 opacity-50">
 <button onClick={handleExport} className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors hover:text-primary">
 <FileArchive className="h-5 w-5" />
 </button>
 <button onClick={handleExportPdf} className="h-10 w-10 bg-white/5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 transition-colors hover:text-primary">
 <FileDown className="h-5 w-5" />
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetaItem({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
 return (
 <div className="space-y-2 group/meta min-w-0">
 <span className="text-[9px] font-semibold text-slate-400 group-hover/meta:text-primary transition-colors leading-none block">{label}</span>
 <p className={clsx(
 "text-sm font-semibold truncate leading-none",
 primary ? "text-primary" : "text-slate-900"
 )}>
 {value || 'DATA_PENDING'}
 </p>
 </div>
 );
}

import { History } from 'lucide-react';
