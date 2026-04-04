import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import {
 Activity,
 Sliders,
 Beaker,
 CheckCircle2,
 Cpu,
 AlertTriangle,
 Sparkles,
 ShieldCheck,
 Info,
 ChevronRight,
 Zap,
 Scale,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ConfigItem {
 id: number;
 config_key: string;
 label: string;
 percentage: number;
 description: string | null;
}

interface Section {
 group: string;
 title: string;
 description: string;
 enforce_total: boolean;
 total: number;
 items: ConfigItem[];
}

interface Props {
 sections: Section[];
}

export default function GradingSettings({ sections }: Props) {
 const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
 configs: sections.flatMap((section) =>
 section.items.map((item) => ({
 id: item.id,
 percentage: item.percentage,
 })),
 ),
 });

 const percentageById = new Map(data.configs.map((item) => [item.id, Number(item.percentage)]));

 const sectionsWithTotals = sections.map((section) => {
 const total = section.items.reduce(
 (sum, item) => sum + (percentageById.get(item.id) ?? Number(item.percentage)),
 0,
 );

 return {
 ...section,
 currentTotal: Number(total.toFixed(2)),
 };
 });

 const invalidSections = sectionsWithTotals.filter(
 (section) => section.enforce_total && section.currentTotal !== 100,
 );

 const handlePercentageChange = (id: number, value: string) => {
 const numericValue = value === '' ? 0 : Number(value);

 setData(
 'configs',
 data.configs.map((config) =>
 config.id === id ? { ...config, percentage: numericValue } : config,
 ),
 );
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 post(route('admin.grading-settings.update'));
 };

 return (
 <AppLayout title="Kalibrasi Algoritma Assessment">
 <Head title="Konfigurasi Algoritma Penilaian" />

 <div className="space-y-8 pb-24">
 {/* Minimalist Tactical Header Strip */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 <span className="text-[9px] font-semibold text-emerald-600">
 ASSESSMENT_CALIBRATION_CORE_V3.2
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
 <Cpu className="h-4 w-4" />
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 leading-none">
 Algoritma <span className="text-primary">Assessment</span>
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className={clsx(
 "px-4 py-2 rounded-lg border flex items-center gap-4 transition-all duration-500",
 invalidSections.length === 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
 )}>
 <div className="flex items-center gap-3">
 <div className={clsx("p-1.5 rounded-lg", invalidSections.length === 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
 <Zap className="h-3 w-3" />
 </div>
 <div className="text-left">
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-0.5">Validation_Result</span>
 <span className={clsx("text-xs font-semibold leading-none", invalidSections.length === 0 ? "text-emerald-600" : "text-rose-600")}>
 {invalidSections.length === 0 ? 'LOGIC_STABLE' : 'CORE_MISMATCH'}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="space-y-8">
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
 <div className="xl:col-span-2 space-y-8">
 {sectionsWithTotals.map((section) => {
 const isValid = !section.enforce_total || section.currentTotal === 100;

 return (
 <section
 key={section.group}
 className="bg-white p-8 rounded-lg border border-slate-100 relative overflow-hidden group"
 >
 <div className="absolute top-0 right-0 p-10 text-slate-900/5 pointer-events-none group-hover:rotate-12 transition-transform">
 <Sliders className="h-32 w-32" />
 </div>

 <div className="relative z-10 space-y-8">
 <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-slate-50 pb-8">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary/20">
 <Beaker className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-slate-900 leading-none mb-2">
 {section.title}
 </h3>
 <p className="text-[10px] font-semibold text-slate-400 opacity-50 max-w-md">
 {section.description}
 </p>
 </div>
 </div>

 <div
 className={clsx(
 'px-6 py-4 rounded-lg border transition-all ',
 isValid ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/60',
 )}
 >
 <span className="block text-[8px] font-semibold text-slate-400 leading-none mb-2">
 {section.enforce_total ? 'AGGREGATE_WEIGHT' : 'DEFAULT_VECTOR'}
 </span>
 <div className={clsx('text-3xl font-semibold leading-none', isValid ? 'text-slate-900' : 'text-rose-600')}>
 {section.currentTotal}%
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 {section.items.map((item) => {
 const currentValue = percentageById.get(item.id) ?? item.percentage;

 return (
 <div key={item.id} className="space-y-4">
 <label htmlFor={`config-${item.id}`} className="flex items-center gap-2 text-[9px] font-semibold text-slate-400 ml-1">
 <Scale className="h-3 w-3 text-primary/60" /> {item.label}
 </label>
 <div className="relative group/field">
 <input
 id={`config-${item.id}`}
 type="number"
 min={0}
 max={100}
 step="0.01"
 value={currentValue}
 onChange={(e) => handlePercentageChange(item.id, e.target.value)}
 className="w-full bg-slate-50 border border-slate-100 text-2xl font-semibold text-slate-900 h-16 rounded-lg px-6 focus:bg-white focus:border-primary/50 outline-none transition-all "
 />
 <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-300">%</span>
 </div>
 <p className="text-[9px] font-semibold text-slate-300 leading-relaxed ml-1 opacity-50">
 {item.description || 'CONFG_PARAMETER_STABLE_V3'}
 </p>
 </div>
 );
 })}
 </div>

 {!isValid && (
 <div className="p-6 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-4 fade-in slide-in-from-top-4 duration-300">
 <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
 <p className="text-[10px] font-semibold text-rose-600 leading-none">
 SYSTEM_ERROR: Aggregation mismatch. Total must equal exactly 100% for deployment.
 </p>
 </div>
 )}
 </div>
 </section>
 );
 })}
 </div>

 <div className="space-y-8">
 <div className="bg-slate-900 p-8 rounded-lg border border-slate-800 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 opacity-10 text-primary group-hover:rotate-12 transition-transform">
 <Sparkles className="w-32 h-32" />
 </div>

 <div className="relative z-10 space-y-6">
 <div>
 <h3 className="text-[11px] font-semibold text-white mb-4">ALGORITHM_GUIDELINES</h3>
 <p className="text-[12px] text-slate-400 leading-relaxed opacity-75">
 Halaman ini mengatur bobot asli yang dipakai mesin kalkulasi nilai, termasuk komponen utama DPL, Mitra, dan Sektor LPPM.
 </p>
 </div>

 <div className="space-y-4">
 <InfoStrip title="AGGREGATE_WEIGHT" value="MUST_EQUALS_100%" />
 <InfoStrip title="DPL_COMPONENT" value="AUTO_CALC_ACTIVE" />
 <InfoStrip title="MITRA_COMPONENT" value="DESA_VECTOR_SYNCED" />
 <InfoStrip title="WORKSHOP_WEIGHT" value="INDEPENDANT_VAL" />
 </div>
 </div>
 </div>

 <div className="bg-white p-8 rounded-lg border border-slate-100 relative overflow-hidden flex flex-col gap-8">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-primary/10 rounded-lg text-primary">
 <ShieldCheck className="w-5 h-5" />
 </div>
 <div className="flex flex-col">
 <h4 className="text-[11px] font-semibold text-slate-900 leading-none mb-1.5">INTEGRITY_CHECK</h4>
 <span className="text-[9px] font-semibold text-slate-400 opacity-50 leading-none">SYSTEM_REALTIME_MONITOR</span>
 </div>
 </div>
 <p className="text-[11px] text-slate-400 font-semibold leading-relaxed border-l-2 border-primary/20 pl-4">
 Perubahan bobot akan langsung memengaruhi perhitungan nilai yang belum difinalisasi secara temporal.
 </p>

 {recentlySuccessful && (
 <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-semibold fade-in zoom-in duration-300">
 SUCCESS: ALGORITHM_CALIBRATED
 </div>
 )}

 <button
 type="submit"
 disabled={processing || invalidSections.length > 0}
 className="w-full py-5 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:-translate-y-1 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
 >
 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
 {processing ? 'SYNCING...' : 'UPDATE_ALGORITHM'}
 </button>
 </div>
 </div>
 </div>
 </form>
 </div>
 </AppLayout>
 );
}

function InfoStrip({ title, value }: { title: string; value: string }) {
 return (
 <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
 <span className="text-[9px] font-semibold text-slate-500 leading-none">{title}</span>
 <span className="text-[10px] font-semibold text-emerald-500 leading-none">{value}</span>
 </div>
 );
}
