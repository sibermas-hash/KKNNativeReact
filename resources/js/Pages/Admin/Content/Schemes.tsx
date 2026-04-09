import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Layers3, 
    Plus, 
    Save, 
    Trash2, 
    Zap, 
    Fingerprint, 
    Shield, 
    ChevronRight,
    Target,
    PenTool,
    Database,
    ShieldCheck,
    Palette,
    TextQuote,
    LayoutPanelLeft,
    MonitorIcon,
    Terminal
} from 'lucide-react';
import { clsx } from 'clsx';

type SchemeColor = 'emerald' | 'blue' | 'amber' | 'slate';

interface SchemeItem {
    title: string;
    description: string;
    color: SchemeColor;
}

interface Props {
    content: {
        title: string;
        intro: string;
        items: SchemeItem[];
    };
}

const colorOptions: Array<{ value: SchemeColor; label: string }> = [
    { value: 'emerald', label: 'TERMINAL EMERALD' },
    { value: 'blue', label: 'OPERATIONAL BLUE' },
    { value: 'amber', label: 'CRITICAL AMBER' },
    { value: 'slate', label: 'SHADOW SLATE' },
];

export default function SchemeContentPage({ content }: Props) {
    const form = useForm({
        title: content.title,
        intro: content.intro,
        schemes: content.items,
    });

    const updateScheme = <K extends keyof SchemeItem>(index: number, field: K, value: SchemeItem[K]) => {
        const nextSchemes = [...form.data.schemes];
        nextSchemes[index] = { ...nextSchemes[index], [field]: value };
        form.setData('schemes', nextSchemes);
    };

    const addScheme = () => {
        form.setData('schemes', [
            ...form.data.schemes,
            {
                title: '',
                description: '',
                color: 'emerald',
            },
        ]);
    };

    const removeScheme = (index: number) => {
        form.setData(
            'schemes',
            form.data.schemes.filter((_, currentIndex) => currentIndex !== index),
        );
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/konten-publik/skema');
    };

    return (
        <AppLayout title="Arsitektur Skema KKN">
            <Head title="Kelola Skema KKN | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950 uppercase tracking-tight">
                {/* HEADER TACTICAL: STRATEGI SKEMA PUBLIK */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Strategic Schemes Mapping</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            LAYOUT <span className="text-emerald-500">SKEMA OPERASIONAL</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2 italic">
                             <Fingerprint size={12} className="text-emerald-500" />
                             Pemetaan struktur, narasi, dan kategorisasi skema KKN untuk antarmuka publik pusat data.
                        </p>
                    </div>

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="flex flex-col items-end border-r border-emerald-50 pr-8 italic">
                            <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest leading-none text-nowrap">ENTRI AKTIF</span>
                            <span className="text-xl font-black text-emerald-950 mt-1 uppercase tracking-tighter tabular-nums">{form.data.schemes.length} SKEMA</span>
                        </div>
                        <button
                            type="button"
                            onClick={addScheme}
                            disabled={form.data.schemes.length >= 8}
                            className="h-16 px-10 bg-emerald-950 text-white text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center gap-6 hover:bg-emerald-600 active:scale-95 transition-all shadow-2xl group disabled:opacity-30"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            TAMBAH SKEMA BARU
                        </button>
                    </div>
                </div>

                <form onSubmit={submit} className="px-12 py-12 space-y-12">
                    {/* PAGE CONFIGURATION BLOCK */}
                    <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                         <div className="absolute top-0 right-0 p-12 text-emerald-950/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                            <LayoutPanelLeft size={200} strokeWidth={1} />
                        </div>
                        
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400 shadow-xl">
                                    <PenTool size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic leading-none">Parameter Halaman Skema</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Konfigurasi Header & Intro Landing Page</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-10 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.3em] ml-1 flex items-center gap-2">
                                    <Target size={12} className="text-emerald-500" />
                                    Judul Halaman ( Hero Title )
                                </label>
                                <input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value.toUpperCase())}
                                    className="h-16 w-full bg-emerald-50/10 border border-emerald-50 px-8 text-[13px] font-black uppercase tracking-[0.2em] italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                    placeholder="INPUT JUDUL HALALMAN..."
                                />
                                {form.errors.title && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.title}</p>}
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.3em] ml-1 flex items-center gap-2">
                                    <TextQuote size={12} className="text-emerald-500" />
                                    Narasi Pengantar ( Introduction )
                                </label>
                                <textarea
                                    id="intro"
                                    rows={5}
                                    value={form.data.intro}
                                    onChange={(event) => form.setData('intro', event.target.value)}
                                    className="w-full bg-emerald-50/10 border border-emerald-50 p-8 text-[12px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner leading-relaxed"
                                    placeholder="INPUT NARASI PENGANTAR SKEMA..."
                                />
                                {form.errors.intro && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.intro}</p>}
                            </div>
                        </div>
                    </section>

                    {/* DYNAMIC SCHEME ENTRIES */}
                    <div className="space-y-10">
                        <div className="flex items-center gap-6 px-4">
                            <div className="h-px bg-emerald-50 flex-1" />
                            <div className="flex items-center gap-4">
                                <MonitorIcon size={14} className="text-emerald-400" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-300 italic">SCHEME_REGISTRY_MAPPING</h3>
                            </div>
                            <div className="h-px bg-emerald-50 flex-1" />
                        </div>

                        {form.data.schemes.map((scheme, index) => (
                            <section key={`scheme-${index}`} className="bg-white border border-emerald-100 shadow-sm overflow-hidden group/card hover:border-emerald-500 transition-all relative">
                                <div className="absolute right-0 top-0 h-full w-24 bg-emerald-50/10 -skew-x-12 translate-x-12 pointer-events-none group-hover/card:translate-x-0 transition-transform duration-700" />
                                
                                <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="h-10 w-10 bg-emerald-950 text-emerald-400 flex items-center justify-center font-black text-[12px] italic shadow-xl group-hover/card:bg-emerald-600 transition-all duration-500">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="space-y-0.5">
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic leading-none">SKEMA_UNIT_{index + 1}</h2>
                                            <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1 italic">Entitas KKN Terpeta</p>
                                        </div>
                                    </div>
                                    {form.data.schemes.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeScheme(index)}
                                            className="h-10 px-6 border border-rose-50 text-rose-300 text-[9px] font-black uppercase italic tracking-widest hover:bg-rose-600 hover:text-white hover:border-transparent transition-all shadow-sm active:scale-90 flex items-center gap-3"
                                        >
                                            <Trash2 size={14} />
                                            TERMINASI
                                        </button>
                                    )}
                                </div>

                                <div className="p-10 grid gap-10 lg:grid-cols-[1fr_320px] relative z-10">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1">Identitas Skema</label>
                                            <input
                                                value={scheme.title}
                                                onChange={(event) => updateScheme(index, 'title', event.target.value.toUpperCase())}
                                                className="h-16 w-full bg-emerald-50/10 border border-emerald-50 px-8 text-[12px] font-black uppercase tracking-[0.2em] italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                                                placeholder="NAMA SKEMA KKN..."
                                            />
                                            {form.errors[`schemes.${index}.title`] && (
                                                <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors[`schemes.${index}.title`]}</p>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1">Deskripsi Skema</label>
                                            <textarea
                                                rows={5}
                                                value={scheme.description}
                                                onChange={(event) => updateScheme(index, 'description', event.target.value)}
                                                className="w-full bg-emerald-50/10 border border-emerald-50 p-8 text-[11px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner leading-relaxed"
                                                placeholder="DETAIL OPERASIONAL SKEMA..."
                                            />
                                            {form.errors[`schemes.${index}.description`] && (
                                                <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors[`schemes.${index}.description`]}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1 flex items-center gap-2">
                                                <Palette size={12} className="text-emerald-500" />
                                                Visual Identifier
                                            </label>
                                            <select
                                                value={scheme.color}
                                                onChange={(event) => updateScheme(index, 'color', event.target.value as SchemeColor)}
                                                className="h-16 w-full bg-emerald-50/10 border border-emerald-50 px-6 text-[11px] font-black uppercase tracking-widest italic text-emerald-950 appearance-none focus:bg-white focus:border-emerald-500 outline-none transition-all"
                                            >
                                                {colorOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors[`schemes.${index}.color`] && (
                                                <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors[`schemes.${index}.color`]}</p>
                                            )}
                                        </div>

                                        <div className={clsx(
                                            "aspect-video border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-700 italic font-black shadow-inner grayscale group-hover/card:grayscale-0",
                                            scheme.color === 'emerald' && "bg-emerald-50/50 border-emerald-100 text-emerald-500",
                                            scheme.color === 'blue' && "bg-blue-50/50 border-blue-100 text-blue-500",
                                            scheme.color === 'amber' && "bg-amber-50/50 border-amber-100 text-amber-500",
                                            scheme.color === 'slate' && "bg-slate-50/50 border-slate-100 text-slate-500"
                                        )}>
                                            <Zap size={32} className="animate-pulse" />
                                            <span className="text-[10px] uppercase tracking-[0.4em]">PREVIEW_MODE</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* ACTION MONITOR TACTICAL */}
                    <div className="bg-emerald-950 p-12 text-white shadow-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                            <div className="space-y-4">
                                <div className="flex items-center gap-6">
                                     <div className="p-4 bg-emerald-600 shadow-xl font-black italic">
                                        <ShieldCheck className="h-8 w-8 text-white animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                         <h4 className="text-xl font-black text-white italic tracking-[0.3em] uppercase leading-none">Sinkronisasi Struktur Skema</h4>
                                         <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest italic leading-none">Otorisasi Publikasi Perubahan Registry Skema</p>
                                    </div>
                                </div>
                                <p className="text-[9px] font-bold text-emerald-100/30 uppercase tracking-[0.35em] italic leading-relaxed max-w-2xl">
                                    Pastikan seluruh parameter narasi dan visualisasi skema telah divalidasi. Perubahan akan segera dipublikasikan pada antarmuka publik pusat repositori KKN.
                                </p>
                            </div>
                             
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="h-18 px-12 bg-white text-emerald-950 font-black text-[12px] uppercase tracking-[0.4em] italic transition-all active:scale-95 flex items-center justify-center gap-6 group/btn shadow-[0_40px_80px_rgba(0,0,0,0.4)] hover:bg-emerald-500 hover:text-white"
                            >
                                {form.processing ? 'SYNCHRONIZING...' : 'UPDATE REGISTRY SKEMA'}
                                <Save size={20} className="group-hover/btn:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* STATUS FOOTER TACTICAL */}
                    <div className="flex flex-col items-center justify-center py-6 gap-6 relative group italic">
                         <div className="flex items-center gap-6 opacity-20 italic">
                            <Database size={20} className="text-emerald-200" />
                            <div className="h-px w-32 bg-emerald-50" />
                            <div className="p-2.5 bg-emerald-950 text-emerald-400 font-black text-[8px] tracking-[0.5em] uppercase">SCHEME_ENGINE_READY</div>
                            <div className="h-px w-32 bg-emerald-50" />
                            <Fingerprint size={20} className="text-emerald-200" />
                         </div>
                         <p className="text-[9px] font-black text-emerald-950 uppercase tracking-[0.6em] italic opacity-40 hover:opacity-100 transition-opacity duration-700">
                             PEMETAAN STRUKTUR SKEMA KKN • POS-KKN CENTRAL COMMAND
                         </p>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
