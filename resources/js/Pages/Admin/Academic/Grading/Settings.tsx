import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 Save, 
 RefreshCw, 
 Info, 
 CheckCircle2, 
 LayoutGrid, 
 AlertTriangle,
 Sliders,
 Binary,
 Activity,
 Lock,
 Cpu,
 Zap,
 Fingerprint,
 Target,
 Database,
 ShieldCheck,
 ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/Components/ui';
import type { LucideIcon } from '@/types';

interface GradingItem { id: number; config_key: string; label: string; percentage: number; description: string; }
interface Section { group: string; title: string; description: string; enforce_total: boolean; total: number; items: GradingItem[]; }
interface Props { sections: Section[]; programOptions: Array<{ value: string; label: string }>; filters: { kkn_type: string; }; }

export default function GradingSettings({ sections = [], programOptions = [], filters }: Props) {
 const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
 configs: (sections || []).flatMap(s => s.items || []).map(item => ({ id: item.id, percentage: item.percentage }))
 });

 const handleTypeChange = (type: string) => {
 router.get(route('admin.konfigurasi-penilaian.index'), { kkn_type: type }, { preserveState: true, preserveScroll: true });
 };

 const updatePercentage = (id: number, value: string) => {
 const numValue = parseFloat(value) || 0;
 setData('configs', data.configs.map(c => c.id === id ? { ...c, percentage: numValue } : c));
 };

 const getGroupTotal = (group: string) => {
 const groupItems = sections.find(s => s.group === group)?.items || [];
 const itemIds = groupItems.map(i => i.id);
 return data.configs.filter(c => itemIds.includes(c.id)).reduce((sum, c) => sum + c.percentage, 0);
 };

 const isGroupValid = (group: string) => {
 const section = sections.find(s => s.group === group);
 if (!section || !section.enforce_total) return true;
 return Math.abs(getGroupTotal(group) - 100) < 0.01;
 };

 const allGroupsValid = sections.every(s => isGroupValid(s.group));

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!allGroupsValid) { return; }
 patch(route('admin.konfigurasi-penilaian.update'));
 };

 return (
 <AppLayout title="Konfigurasi Bobot Nilai">
 <Head title="Konfigurasi Bobot Nilai - Panel Kontrol" />

 <div className="max-w-[1600px] mx-auto space-y-12 pb-24 font-sans px-4 sm:px-6 lg:px-8">
 {/* --- MODERN HEADER --- */}
 <div className="space-y-6 pt-12">
 <div className="flex items-center gap-4 text-emerald-600">
 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">Manajemen Akademik &middot; Bobot Nilai</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
 <div className="space-y-4">
 <h1 className="text-2xl font-bold text-black tracking-tight leading-tight pt-2">
 Matriks <span>Bobot.</span>
 </h1>
 <p className="text-lg font-bold text-emerald-700/40 tracking-tight leading-relaxed max-w-2xl mt-4">
 Konfigurasi matriks bobot penilaian akademik mahasiswa KKN UIN SAIZU untuk setiap skema pengabdian.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-6 shrink-0">
 <div className="relative group">
 <Sliders size={18} strokeWidth={3} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-300 group-focus-within:text-emerald-500 transition-colors" />
 <select value={filters.kkn_type} onChange={(e) => handleTypeChange(e.target.value)} className="h-10 pl-14 pr-12 bg-white border border-emerald-100 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer text-black min-w-[240px] shadow-sm">
 {programOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>)}
 </select>
 <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-200 rotate-90 pointer-events-none" strokeWidth={3} />
 </div>
 <button 
 onClick={handleSubmit} 
 disabled={processing || !allGroupsValid} 
 className={clsx(
 "h-10 px-6 rounded-xl font-bold transition-all shadow-2xl flex items-center gap-6 active:scale-95 text-sm tracking-wider text-xs font-semibold border-none",
 allGroupsValid ? "bg-emerald-600 text-white hover:bg-emerald-600 shadow-emerald-950/20" : "bg-rose-600 text-white animate-pulse shadow-rose-900/40"
 )}
 >
 {processing ? <RefreshCw size={24} className="animate-spin" /> : <Save size={24} className="text-white" strokeWidth={3} />}
 {recentlySuccessful ? 'BOBOT TERSIMPAN' : 'SIMPAN BOBOT'}
 </button>
 </div>
 </div>
 </div>

 {/* --- STRATEGIC METRICS GRID --- */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
 <MetricCard label="Status Sistem" value="KALIBRASI_AKTIF" icon={Cpu} color="emerald" desc="Pusat Logika Nilai" />
 <MetricCard label="Status Server" value="NOMINAL" icon={Activity} color="emerald" desc="Engine Performance" />
 <MetricCard label="Validasi" value={allGroupsValid ? "NOMINAL" : "KETIMPANGAN"} icon={ShieldCheck} color={allGroupsValid ? "emerald" : "rose"} desc="Pengecekan Matriks" />
 <MetricCard label="Integritas Data" value="vGRAD_2026" icon={Fingerprint} color="emerald" desc="Kalibrasi Akademik" />
 </div>

 {/* --- CONFIGURATION PANELS --- */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {(sections || []).map((section) => {
 const groupTotal = getGroupTotal(section.group);
 const isValid = isGroupValid(section.group);
 return (
 <section key={section.group} className="bg-white border border-gray-200 rounded-[3.5rem] overflow-hidden shadow-sm flex flex-col">
 <div className="px-6 py-8 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-6">
 <div className="h-14 w-14 bg-white border border-gray-200 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
 <Binary size={24} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-xl font-bold text-black tracking-tight leading-none">{section.title}</h3>
 <p className="text-sm font-bold text-emerald-700/40 font-semibold text-xs mt-2">Parameter Segmentasi Nilai</p>
 </div>
 </div>
 <div className={clsx(
 "flex items-center gap-4 px-6 py-3 rounded-2xl border",
 isValid ? "bg-emerald-50 border-gray-200 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600 animate-bounce"
 )}>
 <div className="flex flex-col items-end">
 <span className="text-sm font-bold font-semibold text-xs leading-none mb-1">Total Bobot</span>
 <span className="text-lg font-bold tabular-nums leading-none">{groupTotal}%</span>
 </div>
 <div className="h-2 w-16 bg-current opacity-10 rounded-full overflow-hidden">
 <div className="h-full bg-current transition-all duration-700" style={{ width: `${Math.min(100, groupTotal)}%` }} />
 </div>
 </div>
 </div>
 <div className="flex-1 overflow-x-auto">
 <table className="w-full text-left font-sans">
 <tbody className="divide-y divide-emerald-50/50">
 {(section.items || []).filter(item => item.config_key !== 'weight_admin_workshop').map((item) => (
 <tr key={item.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
 <td className="px-6 py-8">
 <div className="flex flex-col gap-1">
 <span className="text-[14px] font-bold text-black group-hover:text-emerald-700 transition-colors leading-tight">{item.label}</span>
 <span className="text-sm font-bold text-emerald-700/20 font-semibold text-xs max-w-sm">{item.description}</span>
 </div>
 </td>
 <td className="px-6 py-8 w-48">
 <div className="relative group/input">
 <input 
 type="number" 
 step="1" 
 value={data.configs?.find(c => c.id === item.id)?.percentage ?? 0} 
 onChange={e => updatePercentage(item.id, e.target.value)} 
 className="w-full h-14 bg-gray-50/50 border border-gray-200 rounded-xl px-6 text-center text-lg font-bold text-black focus:bg-white focus:border-emerald-500 outline-none transition-all tabular-nums shadow-sm" 
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-200 pointer-events-none group-hover/input:text-emerald-500 transition-colors">%</span>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>
 );
 })}
 </div>

 <div className="bg-emerald-600 rounded-xl p-16 text-white relative overflow-hidden shadow-sm group">
 <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 -mr-32 -mt-32 transition-transform group-hover:rotate-45 duration-1000">
 <Target size={500} strokeWidth={0.5} />
 </div>
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
 <div className="flex items-center gap-6">
 <div className="h-12 w-24 bg-emerald-600 text-black rounded-[2.5rem] flex items-center justify-center shrink-0 border border-emerald-400/20 shadow-2xl">
 <Zap size={56} />
 </div>
 <div className="space-y-4">
 <h4 className="text-3xl font-bold font-bold text-center leading-none">Logika Penilaian Institusi.</h4>
 <p className="text-sm font-bold text-emerald-50/40 max-w-4xl leading-relaxed font-semibold text-xs group-hover:text-emerald-50/60 transition-colors">Konfigurasi bobot nilai adalah instruksi logika dasar bagi DPL dan sistem. Setiap perubahan parameter akan berdampak langsung pada kalkulasi IPK KKN mahasiswa secara simultan. Total kalkulasi setiap segmen wajib mencapai ambang batas 100%.</p>
 </div>
 </div>
 {!allGroupsValid && (
 <div className="flex items-center gap-6 bg-rose-600/20 border border-rose-500/40 px-6 py-5 rounded-xl text-rose-400 animate-pulse backdrop-blur-md">
 <AlertTriangle size={28} strokeWidth={3} />
 <div className="flex flex-col">
 <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none mb-1">Ketimpangan Terdeteksi</span>
 <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">Cek Matriks Bobot</span>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </AppLayout>
 );
}


function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string | number, icon: LucideIcon, color: string, desc: string }) {
 return (
 <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm hover:border-emerald-200 transition-all group relative overflow-hidden">
 <div className="flex items-center gap-6 mb-6">
 <div className={clsx(
 "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm",
 color === 'rose' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
 )}>
 <Icon size={24} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-sm font-bold text-emerald-700/40 tracking-wider text-xs font-semibold leading-none mb-1.5">{label}</p>
 <p className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-none">{desc}</p>
 </div>
 </div>
 <span className={clsx(
 "text-3xl font-bold tracking-tight",
 color === 'rose' ? "text-rose-600" : "text-black"
 )}>{value}</span>
 </div>
 );
}
