import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Info, ShieldCheck, Zap } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';

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

            <section className="overflow-hidden bg-white py-24 lg:py-48">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 items-center gap-32 lg:grid-cols-2">
                        <div className="space-y-14">
                            <div>
                                <div className="mb-8 flex items-center gap-4">
                                    <div className="h-1.5 w-16 rounded-full bg-amber-400" />
                                    <span className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-600">
                                        Profil Institusi
                                    </span>
                                </div>
                                <h3 className="mb-10 text-5xl font-black leading-tight tracking-tighter text-slate-950 lg:text-7xl">
                                    Sekilas LPPM <br />
                                    <span className="italic text-emerald-500">UIN Prof. K.H. Saifuddin Zuhri.</span>
                                </h3>
                                <div className="relative rounded-[2rem] border-r-8 border-emerald-500 bg-emerald-50 p-10">
                                    <p className="text-xl font-bold italic leading-relaxed text-slate-800">
                                        "{aboutContent.about}"
                                    </p>
                                    <div className="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 shadow-lg">
                                        <Info className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                                <div className="group relative">
                                    <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-amber-400 transition-transform group-hover:translate-x-0 group-hover:translate-y-0" />
                                    <div className="relative rounded-3xl border-2 border-slate-900 bg-white p-10">
                                        <ShieldCheck className="mb-6 h-8 w-8 text-emerald-600" />
                                        <h5 className="mb-4 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            Visi Pusat
                                        </h5>
                                        <p className="text-sm font-black uppercase leading-relaxed italic text-slate-900">
                                            "{aboutContent.visi}"
                                        </p>
                                    </div>
                                </div>
                                <div className="group relative">
                                    <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-emerald-500 transition-transform group-hover:translate-x-0 group-hover:translate-y-0" />
                                    <div className="relative rounded-3xl border-2 border-slate-900 bg-white p-10">
                                        <Zap className="mb-6 h-8 w-8 text-amber-500" />
                                        <h5 className="mb-4 text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            Misi Operasi
                                        </h5>
                                        <p className="text-sm font-black uppercase leading-relaxed italic text-slate-900">
                                            "{aboutContent.misi}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex justify-center">
                            <div className="group relative w-full max-w-lg rotate-3 overflow-hidden rounded-[3rem] bg-emerald-500 p-4 shadow-[0_50px_100px_-20px_rgba(16,168,83,0.3)] transition-all duration-700 hover:rotate-0">
                                <div className="absolute inset-0 flex flex-col gap-8 p-12 opacity-20">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className="flex gap-10">
                                            {[...Array(5)].map((_, j) => (
                                                <div key={j} className="h-2 w-2 rounded-full bg-white" />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border-8 border-emerald-600 bg-white">
                                    <img
                                        src="https://images.unsplash.com/photo-1541339907198-e08756eaa443?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                        className="h-full w-full object-cover grayscale saturate-150 contrast-125"
                                        alt="Kehidupan kampus"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
