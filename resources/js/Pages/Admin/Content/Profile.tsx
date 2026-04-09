import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    BookOpenText, 
    Save, 
    Zap, 
    Fingerprint, 
    Shield, 
    ChevronRight,
    Terminal,
    Target,
    PenTool,
    Database,
    ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    content: {
        about: string;
        visi: string;
        misi: string;
    };
}

export default function ProfileContentPage({ content }: Props) {
    const form = useForm({
        about: content.about,
        visi: content.visi,
        misi: content.misi,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/konten-publik/profil');
    };

    return (
        <AppLayout title="Redaksi Profil LPPM">
            <Head title="Kelola Profil LPPM | POS-KKN" />

            <div className="min-h-screen bg-white italic font-black text-emerald-950 uppercase tracking-tight">
                {/* HEADER TACTICAL: OTORITAS REDAKSI PROFIL */}
                <div className="bg-white border-b border-emerald-50 px-12 py-16 flex flex-col xl:flex-row xl:items-center justify-between gap-12 sticky top-0 z-20 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-emerald-50/5 -skew-x-12 translate-x-20 pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 italic">Public Profile Editorial Terminal</span>
                        </div>
                        <h1 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none italic">
                            MANAGEMENT <span className="text-emerald-500">PROFIL LEMBAGA</span>
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-3 flex items-center gap-2 italic">
                             <Fingerprint size={12} className="text-emerald-500" />
                             Otoritas penuh konfigurasi narasi publik, visi, dan misi operasional LPPM UIN SAIZU.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col items-end border-r border-emerald-50 pr-8 italic">
                            <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest leading-none">TARGET ENDPOINT</span>
                            <span className="text-[11px] font-black text-emerald-950 mt-1 uppercase tracking-widest">/PROFIL_PUBLIK</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="px-12 py-12 space-y-12">
                    {/* PRIMARY CONTENT BLOCK */}
                    <section className="bg-white border border-emerald-100 shadow-sm overflow-hidden group hover:border-emerald-500 transition-all relative">
                         <div className="absolute top-0 right-0 p-12 text-emerald-950/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                            <BookOpenText size={200} strokeWidth={1} />
                        </div>
                        
                        <div className="px-10 py-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-950 text-emerald-400 shadow-xl">
                                    <PenTool size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-950 italic leading-none">Narasi Institusional</h2>
                                    <p className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest mt-1">Konfigurasi Konten Deskriptif LPPM</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-10 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Target size={12} className="text-emerald-500" />
                                    Tentang LPPM ( Narasi Utama )
                                </label>
                                <textarea
                                    rows={10}
                                    value={form.data.about}
                                    onChange={(event) => form.setData('about', event.target.value)}
                                    className="w-full bg-emerald-50/10 border border-emerald-50 p-8 text-[13px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner leading-loose"
                                    placeholder="INPUT NARASI PROFIL LEMBAGA..."
                                />
                                {form.errors.about && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.about}</p>}
                            </div>

                            <div className="grid gap-10 lg:grid-cols-2 italic">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Zap size={12} className="text-amber-500" />
                                        Visi Operasional
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={form.data.visi}
                                        onChange={(event) => form.setData('visi', event.target.value)}
                                        className="w-full bg-emerald-50/10 border border-emerald-50 p-8 text-[13px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner leading-relaxed"
                                        placeholder="PANDANGAN STRATEGIS..."
                                    />
                                    {form.errors.visi && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.visi}</p>}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-emerald-950 uppercase italic tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <ChevronRight size={12} className="text-emerald-500" />
                                        Misi Taktis
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={form.data.misi}
                                        onChange={(event) => form.setData('misi', event.target.value)}
                                        className="w-full bg-emerald-50/10 border border-emerald-50 p-8 text-[13px] font-black uppercase tracking-tight italic text-emerald-950 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner leading-relaxed"
                                        placeholder="MISI OPERASIONAL..."
                                    />
                                    {form.errors.misi && <p className="text-[10px] font-black text-rose-600 uppercase italic tracking-widest">{form.errors.misi}</p>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ACTION MONITOR TACTICAL */}
                    <div className="bg-emerald-950 p-12 text-white shadow-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 -skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                            <div className="space-y-4">
                                <div className="flex items-center gap-6">
                                     <div className="p-4 bg-emerald-600 shadow-xl font-black">
                                        <ShieldCheck className="h-8 w-8 text-white animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                         <h4 className="text-xl font-black text-white italic tracking-[0.3em] uppercase leading-none">Simpan Parameter Redaksi</h4>
                                         <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest italic leading-none">Konfirmasi Perubahan Konten Publik Secara Realtime</p>
                                    </div>
                                </div>
                                <p className="text-[9px] font-bold text-emerald-100/30 uppercase tracking-[0.35em] italic leading-relaxed max-w-2xl">
                                    Seluruh perubahan narasi akan disimpan dalam registry dan langsung dipublikasikan pada antarmuka publik sistem KKN UIN SAIZU.
                                </p>
                            </div>
                             
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="h-18 px-12 bg-white text-emerald-950 font-black text-[12px] uppercase tracking-[0.4em] italic transition-all active:scale-95 flex items-center justify-center gap-6 group/btn shadow-[0_40px_80px_rgba(0,0,0,0.4)] hover:bg-emerald-500 hover:text-white"
                            >
                                {form.processing ? 'DEPLOYYING_DATA...' : 'PUBLIKASIKAN KONTEN'}
                                <Save size={20} className="group-hover/btn:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* STATUS FOOTER TACTICAL */}
                    <div className="flex flex-col items-center justify-center py-6 gap-6 relative group italic">
                         <div className="flex items-center gap-6 opacity-20 italic">
                            <Database size={20} className="text-emerald-200" />
                            <div className="h-px w-24 bg-emerald-50" />
                            <div className="p-2.5 bg-emerald-950 text-emerald-400 font-black text-[8px] tracking-[0.5em] uppercase">SYSTEM_READY</div>
                            <div className="h-px w-24 bg-emerald-50" />
                            <Fingerprint size={20} className="text-emerald-200" />
                         </div>
                         <p className="text-[9px] font-black text-emerald-950 uppercase tracking-[0.6em] italic opacity-40 hover:opacity-100 transition-opacity duration-700">
                             REDAKSI PROFIL LPPM • UIN SAIZU CENTRAL COMMAND
                         </p>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
