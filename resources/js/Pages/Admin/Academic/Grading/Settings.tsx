import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 Save, 
 RefreshCw, 
 CheckCircle2, 
 LayoutGrid, 
 AlertTriangle,
 Sliders,
 Binary,
 Activity,
 Zap,
 Target,
 ShieldCheck,
 ChevronRight,
 Settings2,
 ListChecks
} from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';

interface GradingItem { id: number; config_key: string; label: string; percentage: number; description: string; }
interface Section { group: string; title: string; description: string; enforce_total: boolean; total: number; items: GradingItem[]; }
interface Props { sections: Section[]; programOptions: Array<{ value: string; label: string }>; filters: { kkn_type: string; }; }

export default function GradingSettings({ sections = [], programOptions = [], filters }: Props) {
 const { data, setData, patch, processing, recentlySuccessful } = useForm({
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
 <AppLayout title="Pengaturan Bobot Penilaian">
 <Head title="Bobot Penilaian KKN" />

 <div className="max-w-7xl mx-auto space-y-8 pb-24 text-emerald-950 font-sans">
 {/* --- PREMIUM HEADER --- */}
 <div className="space-y-4">
 <div className="flex items-center gap-3 text-emerald-600">
 <Settings2 size={18} />
 <span className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-800">Sistem Konfigurasi Utama</span>
 </div>
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-1">
 <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
 Matriks <span className="text-emerald-600 underline decoration-emerald-100 underline-offset-8">Penilaian.</span>
 </h1>
 <p className="font-semibold text-xs text-emerald-800 mt-3 leading-relaxed max-w-2xl">
 Atur distribusi persentase penilaian akademik mahasiswa untuk setiap skema pengabdian KKN UIN SAIZU sesuai standar institusi.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-4">
 <div className="relative group min-w-[240px]">
 <Sliders size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
 <select 
 value={filters.kkn_type} 
 onChange={(e) => handleTypeChange(e.target.value)} 
 className="w-full h-12 pl-12 pr-10 bg-white border-2 border-emerald-50 rounded-xl text-xs font-bold text-emerald-950 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer shadow-sm"
 >
 {programOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>)}
 </select>
 <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 pointer-events-none rotate-90" size={16} />
 </div>
 <button 
 onClick={handleSubmit} 
 disabled={processing || !allGroupsValid} 
 className={clsx(
 "h-12 px-8 rounded-xl font-bold transition-all shadow-md flex items-center gap-3 active:scale-95 text-[11px] tracking-widest uppercase",
 allGroupsValid ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-rose-500 text-white"
 )}
 >
 {processing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
 {recentlySuccessful ? 'BERHASIL DISIMPAN' : 'SIMPAN PERUBAHAN'}
 </button>
 </div>
 </div>
 </div>

 {/* --- METRIC GRID --- */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <MetricCard label="Validasi Matriks" value={allGroupsValid ? "SEIMBANG" : "BELUM SEIMBANG"} icon={ShieldCheck} status={allGroupsValid ? 'success' : 'danger'} />
 <MetricCard label="Status Engine" value="STABIL" icon={Activity} status="success" />
 <MetricCard label="Tahun Akademik" value="2026/2027" icon={ListChecks} status="success" />
 <MetricCard label="Otoritas" value="LPPM PUSAT" icon={Zap} status="success" />
 </div>

 {/* --- CONFIGURATION PANELS --- */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {(sections || []).map((section) => {
 const groupTotal = getGroupTotal(section.group);
 const isValid = isGroupValid(section.group);
 return (
 <section key={section.group} className="bg-white border border-emerald-100 rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
 <div className="px-6 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-white border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
 <Binary size={20} />
 </div>
 <div className="flex flex-col">
 <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight leading-none mb-1">{section.title}</h3>
 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Parameter Penilaian</p>
 </div>
 </div>
 <div className={clsx(
 "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all",
 isValid ? "bg-white border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
 )}>
 <div className="flex flex-col items-end">
 <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Total Bobot</span>
 <span className="text-lg font-black tabular-nums leading-none text-emerald-950">{groupTotal}%</span>
 </div>
 </div>
 </div>
 <div className="flex-1">
 <table className="w-full text-left font-sans">
 <tbody className="divide-y divide-emerald-50/50">
 {(section.items || []).filter(item => item.config_key !== 'weight_admin_workshop').map((item) => (
 <tr key={item.id} className="group hover:bg-emerald-50/20 transition-all duration-300">
 <td className="px-6 py-6 border-r border-emerald-50/30">
 <div className="flex flex-col gap-1">
 <span className="text-sm font-black text-emerald-950 group-hover:text-emerald-700 transition-colors uppercase leading-tight">{item.label}</span>
 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wide leading-relaxed max-w-xs">{item.description}</span>
 </div>
 </td>
 <td className="px-6 py-6 w-36">
 <div className="relative group/input">
 <input 
 type="number" 
 step="1" 
 value={data.configs?.find(c => c.id === item.id)?.percentage ?? 0} 
 onChange={e => updatePercentage(item.id, e.target.value)} 
 className="w-full h-12 bg-white border border-emerald-100 rounded-xl px-4 text-center text-lg font-black text-emerald-950 focus:border-emerald-500 outline-none transition-all tabular-nums shadow-xs" 
 />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600 pointer-events-none group-hover/input:text-emerald-950 transition-colors">%</span>
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

 {/* FOOTER INFO */}
 <div className="bg-white rounded-[2.5rem] p-10 text-emerald-950 relative overflow-hidden shadow-sm border border-emerald-100 group/footer">
 <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 -mr-20 -mt-20 pointer-events-none">
   <Target size={300} className="text-emerald-600" />
 </div>
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
 <Zap size={32} />
 </div>
 <div className="space-y-2">
 <h4 className="text-xl font-black tracking-tight uppercase leading-none">Otoritas Standar Penilaian Institusi</h4>
 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Matriks Konfigurasi LPPM UIN Saizu</p>
 <p className="text-[11px] font-bold text-emerald-800 leading-relaxed max-w-4xl mt-2 uppercase">
 Konfigurasi ini adalah instruksi logika dasar bagi Dosen Pembimbing Lapangan dan sistem. Setiap perubahan parameter akan berdampak langsung pada kalkulasi nilai akhir mahasiswa secara otomatis. <span className="text-emerald-600 underline decoration-emerald-200">Pastikan total bobot setiap segmen mencapai tepat 100%.</span>
 </p>
 </div>
 </div>
 {!allGroupsValid && (
 <div className="flex items-center gap-4 bg-rose-50 border border-rose-200 px-6 py-4 rounded-xl text-rose-600 animate-pulse backdrop-blur-md shrink-0">
 <AlertTriangle size={24} />
 <div className="flex flex-col">
 <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Ketidakseimbangan Matriks</span>
 <span className="text-xs font-black uppercase">Wajib 100%</span>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, status }: { label: string, value: string | number, icon: LucideIcon, status: 'success' | 'danger' }) {
 return (
 <div className="bg-white border-2 border-emerald-50 rounded-2xl p-6 shadow-sm hover:border-emerald-100 transition-all group relative overflow-hidden">
 <div className="flex items-center gap-4 mb-4">
 <div className={clsx(
 "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
 status === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
 )}>
 <Icon size={20} strokeWidth={2.5} />
 </div>
 <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none">{label}</p>
 </div>
 <span className={clsx(
 "text-2xl font-black tracking-tight",
 status === 'danger' ? "text-rose-600" : "text-emerald-950"
 )}>{value}</span>
 </div>
 );
}
