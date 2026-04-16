import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
 Award, 
 Image as ImageIcon, 
 Save, 
 Info, 
 PenTool, 
 Palette, 
 CheckCircle2,
 Zap,
 Cpu,
 Fingerprint,
 Target,
 Activity,
 Layers,
 Globe,
 ShieldCheck,
 RefreshCw,
 Binary,
 Lock,
 Unlock,
 ChevronRight,
 ArrowRight,
 Scan,
 FileText
} from 'lucide-react';
import { Button } from '@/Components/ui';
import { clsx } from 'clsx';
import type { LucideIcon } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfigItem { id: number; config_key: string; label: string; value: string | null; type: 'text' | 'longtext' | 'gambar'; }
interface Props { configs: ConfigItem[]; }

const containerVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const itemVariants = {
 hidden: { opacity: 0, y: 20 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
};

export default function CertificateSettings({ configs = [] }: Props) {
 const form = useForm({ configs: (configs || []).map((c) => ({ id: c.id, value: c.value ?? '' })) });
 const updateValue = (id: number, value: string) => { form.setData('configs', (form.data.configs || []).map((item) => (item.id === id ? { ...item, value } : item))); };
 const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); form.post('/admin/pengaturan/sertifikat'); };
 const getValue = (id: number) => form.data.configs.find((item) => item.id === id)?.value ?? '';

 return (
 <AppLayout title="Credential Design Protocol">
 <Head title="Pengaturan Sertifikat | SIKKKN" />

 <motion.div 
 initial="hidden"
 animate="visible"
 variants={containerVariants}
 className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16 font-sans"
 >
 {/* --- COMMAND HEADER --- */}
 <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
 <div className="space-y-6">
 <div className="flex items-center gap-4 text-emerald-600">
 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 <span className="text-sm font-bold tracking-wider text-xs font-semibold leading-none">Security Node / Credential Design Protocol</span>
 </div>
 <h1 className="text-2xl font-bold text-black tracking-tight leading-tight flex flex-col">
 Certificate <span>Matrix.</span>
 </h1>
 <p className="text-lg font-bold text-emerald-950 tracking-tight leading-relaxed max-w-2xl opacity-80">
 Konfigurasi desain otentikasi. <br />
 <span className="text-black not-italic">Otorisasi aset visual, narasi resmi, dan pemetaan metadata untuk penerbitan sertifikat digital KKN secara masif.</span>
 </p>
 </div>

 <div className="hidden xl:flex items-center gap-6">
 <div className="h-12 px-6 bg-emerald-50/30 border border-emerald-100/60 rounded-[2.5rem] flex items-center gap-8 shadow-sm relative overflow-hidden group">
 <Scan size={30} className="text-emerald-500" />
 <div className="flex flex-col">
 <span className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-none mb-1">Asset Status</span>
 <span className="text-lg font-bold text-black font-semibold text-xs">VERIFIED_SRC</span>
 </div>
 </div>
 </div>
 </motion.div>

 <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
 {/* Content */}
 <motion.div variants={itemVariants} className="xl:col-span-8 space-y-10">
 <div className="bg-white border border-emerald-100/60 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 group/section flex flex-col h-full">
 <div className="px-6 py-6 bg-emerald-600 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
 <PenTool size={28} />
 </div>
 <div className="space-y-2">
 <h3 className="text-sm font-bold text-emerald-500 tracking-wider text-xs font-semibold">Official Scripting</h3>
 <p className="text-2xl font-bold text-white font-bold text-center leading-none">Authentication Narrative</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <ShieldCheck size={20} className="text-emerald-500" />
 <span className="text-sm font-bold text-white/40 font-semibold text-xs">Integrity Secure</span>
 </div>
 </div>
 
 <div className="p-12 space-y-12">
 {/* Placeholder Tags Bento */}
 <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-[2.5rem] p-10 space-y-8">
 <div className="flex items-center gap-6">
 <div className="h-10 w-10 bg-emerald-900 text-emerald-500 rounded-xl flex items-center justify-center shadow-xl">
 <Binary size={18} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold">Runtime Metadata Tags</h3>
 <p className="text-sm font-bold text-black font-semibold text-xs">Dynamic Injectors</p>
 </div>
 </div>
 <div className="flex flex-wrap gap-3">
 {(['[StudentName]', '[NIM]', '[LOKASI]', '[PERIODE]']).map((tag) => (
 <span key={tag} className="px-5 py-2.5 bg-white rounded-2xl text-sm font-bold text-emerald-950 border border-emerald-100/60 shadow-sm font-semibold text-xs">{tag}</span>
 ))}
 </div>
 </div>

 <div className="space-y-10">
 {(configs || []).filter((c) => c.type !== 'gambar').map((config) => (
 <div key={config.id} className="space-y-4">
 <div className="flex items-center justify-between px-2">
 <label htmlFor={`cert-config-${config.id}`} className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold mb-2 block">{config.label}</label>
 <span className="text-sm font-bold text-emerald-500 font-semibold text-xs opacity-40">NODE_SCRPT</span>
 </div>
 {config.type === 'longtext' ? (
 <div className="relative group/input">
 <textarea
 id={`cert-config-${config.id}`}
 rows={10}
 value={getValue(config.id)}
 onChange={(e) => updateValue(config.id, e.target.value)}
 className="w-full bg-emerald-50/30 border-none rounded-xl px-6 py-6 text-sm font-bold text-black focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all leading-relaxed placeholder:text-slate-200"
 placeholder="ENTER OFFICIAL NARRATIVE PROTOCOL..."
 />
 <div className="absolute bottom-8 right-8 text-sm font-bold text-slate-200 tracking-normal opacity-20">BUFFER_IO</div>
 </div>
 ) : (
 <input 
 type="text" 
 value={getValue(config.id)} 
 onChange={(e) => updateValue(config.id, e.target.value)} 
 className="w-full h-18 bg-emerald-50/30 border-none rounded-xl px-6 text-sm font-bold text-black focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" 
 placeholder="Enter text..." 
 />
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 </motion.div>

 {/* Sidebar */}
 <motion.div variants={itemVariants} className="xl:col-span-4 space-y-10 flex flex-col h-full">
 <div className="bg-white border border-emerald-100/60 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 group/section flex-1">
 <div className="px-6 py-6 bg-emerald-50/30 border-b border-emerald-100/60 flex items-center justify-between">
 <div className="flex items-center gap-8">
 <div className="h-16 w-16 bg-emerald-900 text-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl">
 <Palette size={28} />
 </div>
 <div className="space-y-1">
 <h3 className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold">Visual Identity</h3>
 <p className="text-2xl font-bold text-black font-bold text-center leading-none">Graphic Vault</p>
 </div>
 </div>
 </div>
 
 <div className="p-12 space-y-10">
 {(configs || []).filter((c) => c.type === 'gambar').map((config) => (
 <div key={config.id} className="space-y-4">
 <label htmlFor={`cert-img-${config.id}`} className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold block ml-2">{config.label}</label>
 <div className="relative group/input">
 <ImageIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors" />
 <input
 id={`cert-img-${config.id}`}
 type="text"
 value={getValue(config.id)}
 onChange={(e) => updateValue(config.id, e.target.value)}
 placeholder="https://..."
 className="w-full h-18 pl-18 pr-8 bg-emerald-50/30 border-none rounded-xl text-sm font-bold text-black focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-mono tracking-normal placeholder:text-slate-200"
 />
 </div>
 </div>
 ))}
 
 <div className="p-10 bg-emerald-600 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-6 shadow-2xl relative overflow-hidden group/iv">
 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/iv:rotate-12 transition-transform">
 <ImageIcon size={60} />
 </div>
 <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-500/30">
 <Target size={32} strokeWidth={1} />
 </div>
 <div className="space-y-2">
 <p className="text-sm font-bold text-emerald-500 tracking-wider text-xs font-semibold">Preview Status: Void</p>
 <p className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-relaxed max-w-[180px]">EXTERNAL_CDN LINKED. <br /> ASSETS LOADED ON RUNTIME ONLY.</p>
 </div>
 </div>
 </div>
 </div>

 {/* Control Bar */}
 <div className="bg-emerald-900 rounded-[3.5rem] p-10 flex flex-col gap-6 shadow-2xl relative overflow-hidden group/save">
 <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/save:rotate-12 transition-transform">
 <Save size={120} strokeWidth={1} />
 </div>
 <div className="flex items-start gap-3 relative z-10">
 <Info size={18} className="text-emerald-500 shrink-0 mt-0.5" />
 <p className="text-sm font-bold text-emerald-950 font-semibold text-xs leading-relaxed">
 Pembaruan template akan segera menimpa seluruh antrean penerbitan yang belum diproses. Harap verifikasi aset visual secara mandiri.
 </p>
 </div>
 <Button 
 type="submit" 
 disabled={form.processing} 
 className="h-10 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-6 text-sm tracking-wider text-xs font-semibold active:scale-95 disabled:opacity-20 group duration-500"
 >
 <AnimatePresence mode="wait">
 {form.processing ? (
 <RefreshCw size={24} className="animate-spin" />
 ) : (
 <Save size={24} className="group-hover:animate-bounce" />
 )}
 </AnimatePresence>
 {form.processing ? 'COMMITING_DESIGN...' : 'DEPLOY_MATRIX_DESIGN'}
 </Button>
 </div>
 </motion.div>
 </form>

 {/* --- FOOTER GOVERNANCE --- */}
 <motion.div variants={itemVariants} className="bg-white border border-emerald-100/60 rounded-[3.5rem] p-16 text-black relative overflow-hidden group/f shadow-2xl shadow-slate-200/50">
 <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover/f:rotate-12 transition-transform duration-1000">
 <Award size={300} strokeWidth={1} />
 </div>
 <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
 <div className="space-y-6 flex-1">
 <div className="flex items-center gap-5">
 <FileText className="text-emerald-600" size={32} />
 <div className="space-y-1">
 <span className="text-sm font-bold tracking-wider text-xs font-semibold text-emerald-600">Protocol Oversight</span>
 <h3 className="text-3xl font-bold tracking-tight leading-none text-black">Institutional Credentialing Standard</h3>
 </div>
 </div>
 <p className="text-lg font-bold text-emerald-950 tracking-tight leading-relaxed max-w-2xl opacity-80">
 Sertifikat hádalah bukti otentik partisipasi akademik. Setiap elemen visual dan tekstual dalam matriks ini harus memenuhi standar protokol universitas dan dapat diverifikasi via QR/Blockchain sistem.
 </p>
 </div>
 <div className="px-6 py-6 bg-emerald-50/30 border border-emerald-100/60 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 shadow-sm">
 <Activity size={28} className="text-emerald-500" />
 <span className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold">Validation Stream Nominal</span>
 </div>
 </div>
 </motion.div>
 </motion.div>
 </AppLayout>
 );
}

function MetricCard({ label, value, icon: Icon, color, desc }: { label: string, value: string, icon: LucideIcon, color: 'emerald' | 'amber', desc: string }) {
 return (
 <div className="bg-white border border-emerald-100/60 rounded-xl p-10 space-y-10 hover:shadow-2xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
 <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform">
 <Icon size={140} strokeWidth={1} />
 </div>
 <div className={clsx(
 "h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6",
 color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
 )}>
 <Icon size={30} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-sm font-bold text-emerald-950 tracking-wider text-xs font-semibold mb-2 leading-none">{label}</p>
 <p className="text-3xl font-bold tracking-tight text-black group-hover:text-emerald-600 transition-colors leading-none">{value}</p>
 <p className="mt-6 text-sm font-bold text-slate-300 tracking-wider text-xs font-semibold">{desc}</p>
 </div>
 </div>
 );
}
