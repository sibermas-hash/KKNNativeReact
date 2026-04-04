import { useForm, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import React from 'react';
import { 
 Target, 
 ChevronLeft,
 Sparkles,
 ShieldCheck,
 CheckCircle2,
 
 HelpCircle,
 Activity,
 PlusCircle,
 FileText,
 TrendingUp,
 ListChecks,
} from 'lucide-react';
import { clsx } from 'clsx';

const SDG_LIST = [
 { id: 1, name: 'Tanpa Kemiskinan', color: 'bg-red-600' },
 { id: 2, name: 'Tanpa Kelaparan', color: 'bg-amber-600' },
 { id: 3, name: 'Kehidupan Sehat & Sejahtera', color: 'bg-emerald-600' },
 { id: 4, name: 'Pendidikan Berkualitas', color: 'bg-rose-700' },
 { id: 5, name: 'Kesetaraan Gender', color: 'bg-orange-600' },
 { id: 6, name: 'Air Bersih & Sanitasi', color: 'bg-sky-500' },
 { id: 7, name: 'Energi Bersih & Terjangkau', color: 'bg-yellow-500' },
 { id: 8, name: 'Pekerjaan Layak & Pertumbuhan Ekonomi', color: 'bg-red-800' },
 { id: 9, name: 'Industri, Inovasi & Infrastruktur', color: 'bg-orange-700' },
 { id: 10, name: 'Berkurangnya Kesenjangan', color: 'bg-pink-600' },
 { id: 11, name: 'Kota & Pemukiman Berkelanjutan', color: 'bg-amber-500' },
 { id: 12, name: 'Konsumsi & Produksi Bertanggung Jawab', color: 'bg-orange-800' },
 { id: 13, name: 'Penanganan Perubahan Iklim', color: 'bg-emerald-800' },
 { id: 14, name: 'Ekosistem Lautan', color: 'bg-blue-600' },
 { id: 15, name: 'Ekosistem Daratan', color: 'bg-lime-600' },
 { id: 16, name: 'Perdamaian, Keadilan & Kelembagaan Kuat', color: 'bg-blue-800' },
 { id: 17, name: 'Kemitraan untuk Mencapai Tujuan', color: 'bg-slate-800' },
];

export default function StudentWorkProgramCreate(_props: PageProps) {
 const form = useForm({
 title: '',
 description: '',
 sdg_goals: [] as number[],
 objectives: '',
 target_participants: '',
 budget: '',
 });

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 form.post('/student/work-programs');
 }

 const toggleSdg = (id: number) => {
 const current = [...form.data.sdg_goals];
 const index = current.indexOf(id);
 if (index > -1) current.splice(index, 1);
 else current.push(id);
 form.setData('sdg_goals', current);
 };

 return (
 <AppLayout title="Ajukan Program Kerja">
 <Head title="Pengajuan Program Kerja Baru" />
 
 <div className="max-w-6xl mx-auto space-y-6 pb-24">
 {/* Modern Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-200">
 <div className="flex items-center gap-8">
 <Link 
 href="/student/work-programs"
 className="h-16 w-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 hover:text-primary hover:border-primary:group font-semibold"
 >
 <ChevronLeft className="h-7 w-7 group-hover:-translate-x-1 transition-transform" />
 </Link>
 <div>
 <div className="flex items-center gap-2 mb-3">
 <Target className="h-4 w-4 text-primary" />
 <span className="text-[10px] font-semibold text-slate-400 decoration-slate-100">Inisiasi Program Pengabdian</span>
 </div>
 <h1 className="text-4xl font-extrabold text-slate-900 ">
 Ajukan <span className="text-primary">Program</span> Kerja
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-5 bg-white p-6rounded-lg border border-slate-200 min-w-[240px]">
 <div className="p-4 bg-emerald-50 rounded-lg text-emerald-500 border border-emerald-100 font-semibold
 <TrendingUp className="h-6 w-6" />
 </div>
 <div>
 <span className="text-[9px] font-semibold text-slate-400 block mb-1 opacity-50">Status Target</span>
 <span className="text-xs font-semibold text-slate-900 ">Menuju Tujuan SDGs</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2">
 <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-12 space-y-6 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-16 text-slate-900 pointer-events-none group-transition-transform[2000ms]">
 <FileText className="h-96 w-full" />
 </div>

 <div className="relative z-10 space-y-6">
 <section className="space-y-8">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-slate-900 text-primary rounded-lg
 <ListChecks className="h-6 w-6" />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 Program</h3>
 </div>
 <div className="space-y-6">
 <div className="space-y-4">
 <label className="text-[11px] font-semibold text-slate-400 ml-2">Judul Program Kerja</label>
 <input 
 type="text" 
 value={form.data.title} 
 onChange={(e) => form.setData('title', e.target.value)} 
 placeholder="Contoh: Pemberdayaan UMKM Digital..."
 className="w-full bg-slate-50 border-slate-200 rounded-lg h-16 px-6 text-base font-semibold text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primaryoutline-none placeholder:text-slate-200"
 required 
 />
 {form.errors.title && <p className="text-[10px] text-rose-500 font-semibold ml-2">{form.errors.title}</p>}
 </div>
 <div className="space-y-4">
 <label className="text-[11px] font-semibold text-slate-400 ml-2">Deskripsi Operasional</label>
 <textarea 
 value={form.data.description} 
 onChange={(e) => form.setData('description', e.target.value)} 
 rows={4} 
 placeholder="Jelaskan mekanisme dan latar belakang program secara mendalam..."
 className="w-full bg-slate-50 border-slate-200rounded-lg p-8 text-sm font-medium leading-normal focus:ring-4 focus:ring-primary/5 focus:border-primary outline-noneplaceholder:text-slate-300"
 />
 </div>
 </div>
 </section>

 <section className="space-y-8 pt-10 border-t border-slate-200">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-slate-50 text-slate-400 rounded-lg font-semibold
 <Target className="h-6 w-6" />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 SDG</h3>
 </div>
 <span className={clsx(
 "text-[10px] font-semibold px-5 py-2 rounded-xl",
 form.data.sdg_goals.length > 0 ? "bg-primary text-white : "bg-slate-50 text-slate-400"
 )}>
 {form.data.sdg_goals.length} Target Terpilih
 </span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {SDG_LIST.map((sdg) => {
 const isSelected = form.data.sdg_goals.includes(sdg.id);
 return (
 <button
 key={sdg.id}
 type="button"
 onClick={() => toggleSdg(sdg.id)}
 className={clsx(
 "flex items-center gap-4 p-5 rounded-lg bordertext-left group/sdg relative overflow-hidden",
 isSelected
 ? `${sdg.color} text-white border-transparent ring-4 ring-white/10`
 : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-primary'
 )}
 >
 <div className={clsx(
 "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-xs",
 isSelected ? "bg-white/20" : "bg-white border border-slate-200 text-slate-300 group-hover/sdg:text-primary transition-colors"
 )}>
 {sdg.id}
 </div>
 <span className="text-[11px] font-semibold leading-normal line-clamp-2">{sdg.name}</span>
 {isSelected && <CheckCircle2 className="h-5 w-5 absolute top-4 right-4 opacity-50" />}
 </button>
 );
 })}
 </div>
 </section>

 <section className="space-y-8 pt-10 border-t border-slate-200">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-slate-50 text-slate-400 rounded-lg font-semibold
 <Zap className="h-6 w-6" />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 & Anggaran</h3>
 </div>
 <div className="space-y-6">
 <div className="space-y-4">
 <label className="text-[11px] font-semibold text-slate-400 ml-2">Tujuan & Luaran</label>
 <textarea 
 value={form.data.objectives} 
 onChange={(e) => form.setData('objectives', e.target.value)} 
 rows={2} 
 placeholder="Hasil nyata yang diharapkan dari program ini..."
 className="w-full bg-slate-50 border-slate-200rounded-lg p-8 text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary outline-noneplaceholder:text-slate-300"
 />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-semibold">
 <div className="space-y-4">
 <label className="text-[11px] font-semibold text-slate-400 ml-2">Estimasi Peserta</label>
 <input 
 type="number" 
 value={form.data.target_participants} 
 onChange={(e) => form.setData('target_participants', e.target.value)} 
 placeholder="Contoh: 50"
 className="w-full bg-slate-50 border-slate-200 rounded-lg h-16 px-6 text-base font-semibold text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primaryoutline-none"
 />
 </div>
 <div className="space-y-4">
 <label className="text-[11px] font-semibold text-slate-400 ml-2">Anggaran (RP)</label>
 <input 
 type="number" 
 value={form.data.budget} 
 onChange={(e) => form.setData('budget', e.target.value)} 
 placeholder="Contoh: 500000"
 className="w-full bg-slate-50 border-slate-200 rounded-lg h-16 px-6 text-base font-semibold text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primaryoutline-none"
 required 
 />
 </div>
 </div>
 </div>
 </section>

 <div className="flex justify-end pt-12 border-t border-slate-200">
 <button
 type="submit"
 disabled={form.processing}
 className="h-20 px-16rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs w-full md:w-auto flex items-center justify-center gap-4 group/submit"
 >
 <PlusCircle className={clsx("h-6 w-6 text-primary", form.processing ?  : "group-hover/submit:rotate-90")} />
 {form.processing ? 'Sedang Memproses...' : 'Luncurkan Program'}
 </button>
 </div>
 </div>
 </form>
 </div>

 <div className="space-y-12">
 <section className="bg-slate-900 rounded-lg p-10 border border-slate-800 relative overflow-hidden group
 <div className="absolute top-0 right-0 p-8 text-primary group-transition-transform pointer-events-none">
 <Sparkles className="h-32 w-32" />
 </div>
 
 <h4 className="text-[11px] font-semibold mb-10 flex items-center gap-4 text-primary">
 <span className="flex h-2.5 w-2.5 rounded-lg bg-primary" />
 Validasi Program
 </h4>
 
 <div className="space-y-10 relative z-10">
 <InfoItem 
 icon={Activity} 
 title="Penyelarasan SDG" 
 desc="Setiap program kerja wajib berkontribusi minimal pada satu target pembangunan berkelanjutan."
 />
 <InfoItem 
 icon={ShieldCheck} 
 title="Akal Sehat & Etika" 
 desc="Pastikan program tidak melanggar norma sosial dan hukum yang berlaku di lokasi pengabdian."
 />
 <InfoItem 
 icon={HelpCircle} 
 title="Bimbingan DPL" 
 desc="Draf program harus dikonsultasikan dengan DPL sebelum dilakukan pengajuan resmi melalui portal ini."
 />
 </div>
 </section>

 <div className="bg-white border border-slate-200 rounded-lg p-10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 text-slate-900 group-hover:rotate-12 transition-transform[2000ms]">
 <Activity className="h-[200px] w-full" />
 </div>
 <h4 className="text-[10px] font-semibold mb-8 text-slate-400">Arsip Strategis</h4>
 <p className="text-[12px] text-sm leading-normal relative z-10 text-slate-500 opacity-75">
 Program kerja yang telah diajukan akan menjadi dasar evaluasi kinerja unit dan penentuan luaran KKN di akhir periode pelaksanaan.
 </p>
 </div>
 </div>
 </div>

 <div className="text-center pt-8 opacity-20">
 <p className="text-[10px] font-semibold text-slate-300 ">
 Pusat Perencanaan Program • UIN SAIZU © 2024
 </p>
 </div>
 </div>
 </AppLayout>
 );
}

function InfoItem({ icon: Icon, title, desc }: any) {
 return (
 <div className="flex gap-6 items-start">
 <div className="h-10 w-10 rounded-xl bg-white/5 border border-slate-200 flex items-center justify-center shrink-0 text-primary">
 <Icon className="h-5 w-5" />
 </div>
 <div className="min-w-0">
 <p className="text-[11px] font-semibold text-white mb-1.5">{title}</p>
 <p className="text-[11px] text-sm text-slate-400 leading-normal opacity-50">{desc}</p>
 </div>
 </div>
 );
}
