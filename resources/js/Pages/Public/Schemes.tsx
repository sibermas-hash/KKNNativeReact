import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe2, Layers, Navigation, Zap } from 'lucide-react';
import { route } from 'ziggy-js';
import PublicLayout from '@/Layouts/PublicLayout';

interface SchemeItem {
    title: string;
    description: string;
    color: 'emerald' | 'blue' | 'amber' | 'slate';
}

interface Props {
    content: {
        title: string;
        intro: string;
        items: SchemeItem[];
    };
}

const icons = [Layers, Globe2, Navigation, Zap];

export default function Schemes({ content }: Props) {
    return (
        <PublicLayout>
            <Head title="Skema KKN | LPPM UIN Prof. K.H. Saifuddin Zuhri" />

            <section className="min-h-screen bg-slate-50 py-24 lg:py-48">
                <div className="container relative z-10 mx-auto px-6 lg:px-12">
                    <div className="mb-24 flex flex-col gap-12 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
                        <div className="max-w-3xl">
                            <div className="mb-8 flex items-center justify-center gap-4 lg:justify-start">
                                <div className="h-1.5 w-16 rounded-full bg-emerald-600" />
                                <span className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-600">
                                    Skema Distribusi
                                </span>
                            </div>
                            <h3 className="mb-8 text-5xl font-black tracking-tighter text-slate-950 lg:text-7xl">
                                {content.title}
                            </h3>
                            <p className="max-w-2xl text-lg font-bold italic text-slate-500">
                                {content.intro}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                        {content.items.map((scheme, i) => {
                            const Icon = icons[i % icons.length];

                            return (
                                <motion.div
                                    key={scheme.title}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="group rounded-[4rem] border-2 border-slate-100 bg-white p-16 transition-all hover:border-emerald-500 hover:shadow-2xl"
                                >
                                    <div
                                        className={`mb-12 flex h-28 w-28 items-center justify-center rounded-[2.5rem] transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 ${
                                            scheme.color === 'emerald' ? 'bg-emerald-500 text-white' : ''
                                        } ${
                                            scheme.color === 'blue' ? 'bg-blue-600 text-white' : ''
                                        } ${
                                            scheme.color === 'amber' ? 'bg-amber-400 text-slate-950' : ''
                                        } ${
                                            scheme.color === 'slate' ? 'bg-slate-950 text-white' : ''
                                        }`}
                                    >
                                        <Icon className="h-10 w-10" />
                                    </div>
                                    <h4 className="mb-6 text-4xl font-black uppercase tracking-tighter text-slate-950">
                                        {scheme.title}
                                    </h4>
                                    <p className="mb-14 text-xl font-bold italic leading-relaxed text-slate-500">
                                        {scheme.description}
                                    </p>
                                    <Link
                                        href={route('login')}
                                        className="group inline-flex items-center gap-4 rounded-3xl bg-emerald-500 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-slate-950"
                                    >
                                        Daftar Sekarang
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
