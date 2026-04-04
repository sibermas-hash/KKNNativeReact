import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { motion } from 'framer-motion';
import { Info, ShieldCheck, Zap } from 'lucide-react';

interface Props {
    aboutContent: {
        about: string;
        visi: string;
        misi: string;
    };
}

export default function About({ aboutContent }: Props) {
    return (
        <PublicLayout>
            <Head title="Profil | LPPM UIN Prof. K.H. Saifuddin Zuhri" />
            
            <section className="py-24 lg:py-48 bg-white overflow-hidden">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
                        <div className="space-y-14">
                            <div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-1.5 w-16 bg-amber-400 rounded-full" />
                                    <span className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.4em]">PROFIL INSTITUSI</span>
                                </div>
                                <h3 className="text-5xl lg:text-7xl font-black text-slate-950 mb-10 tracking-tighter leading-tight">Sekilas LPPM <br /> <span className="text-emerald-500 italic">UIN Prof. K.H. Saifuddin Zuhri.</span></h3>
                                <div className="p-10 bg-emerald-50 rounded-[2rem] border-r-8 border-emerald-500 relative">
                                    <p className="text-slate-800 text-xl leading-relaxed font-bold italic">
                                        "{aboutContent.about}"
                                    </p>
                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Info className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-amber-400 rounded-3xl translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
                                    <div className="relative p-10 bg-white rounded-3xl border-2 border-slate-900">
                                        <ShieldCheck className="w-8 h-8 text-emerald-600 mb-6" />
                                        <h5 className="text-[12px] font-black text-slate-400 mb-4 uppercase tracking-[0.3em]">VISI PUSAT</h5>
                                        <p className="text-sm font-black text-slate-900 leading-relaxed italic uppercase">
                                            "{aboutContent.visi}"
                                        </p>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-emerald-500 rounded-3xl translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
                                    <div className="relative p-10 bg-white rounded-3xl border-2 border-slate-900">
                                        <Zap className="w-8 h-8 text-amber-500 mb-6" />
                                        <h5 className="text-[12px] font-black text-slate-400 mb-4 uppercase tracking-[0.3em]">MISI OPERASI</h5>
                                        <p className="text-sm font-black text-slate-900 leading-relaxed italic uppercase">
                                            "{aboutContent.misi}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex justify-center">
                            <div className="w-full max-w-lg aspect-square bg-emerald-500 rounded-[3rem] p-4 rotate-3 relative overflow-hidden group hover:rotate-0 transition-all duration-700 shadow-[0_50px_100px_-20px_rgba(16,168,83,0.3)]">
                                <div className="absolute inset-0 bg-white/10 opacity-20 flex flex-col gap-8 p-12">
                                     {[...Array(10)].map((_, i) => (
                                         <div key={i} className="flex gap-10">
                                            {[...Array(5)].map((_, j) => (
                                                <div key={j} className="w-2 h-2 rounded-full bg-white" />
                                            ))}
                                         </div>
                                     ))}
                                </div>
                                <div className="w-full h-full rounded-[2.5rem] bg-white border-8 border-emerald-600 overflow-hidden relative">
                                     <img 
                                        src="https://images.unsplash.com/photo-1541339907198-e08756eaa443?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                                        className="w-full h-full object-cover grayscale saturate-150 contrast-125" 
                                        alt="Campus Life" 
                                     />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
        </div>
        </div>
        </div>
        </PublicLayout>
    );
}
