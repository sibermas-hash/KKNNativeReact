import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe2, Layers, Navigation, Zap, Sparkles, Star, Target } from 'lucide-react';
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

            <section className="relative pt-44 lg:pt-60 pb-48 bg-white overflow-hidden">
                <div className="container relative z-10 mx-auto px-6 lg:px-12">
                    
                    {/* PAGE HEADER */}
                    <div className="max-w-4xl space-y-12 mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-50 border border-gray-200 rounded-full"
                        >
                            <Target size={16} className="text-[#1a7a4a]" />
                            <span className="text-xs font-bold text-black uppercase tracking-widest">Program & Skema Pengabdian</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl lg:text-[100px] font-bold tracking-tighter text-black leading-[0.85] uppercase"
                        >
                            Opsi <br /> 
                            <span className="text-[#1a7a4a]   font-medium">intervensi.</span>
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl lg:text-3xl text-gray-900 font-bold max-w-2xl leading-relaxed  border-l-8 border-gray-1000 pl-12"
                        >
                            {content.intro}
                        </motion.p>
                    </div>

                    {/* GRID SCHEMES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                        {content.items.map((scheme, i) => {
                            const Icon = icons[i % icons.length];

                            return (
                                <motion.div
                                    key={scheme.title}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group relative bg-white p-16 lg:p-20 rounded-[4rem] border border-gray-200/60 hover:border-gray-1000 transition-all hover:shadow-[0_80px_160px_rgba(0,0,0,0.06)] cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                                        <Icon size={240} />
                                    </div>
                                    
                                    <div className="flex items-center gap-6 mb-12 relative z-10">
                                        <div className="p-6 bg-emerald-50 text-emerald-600 rounded-[2rem] group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-sm">
                                            <Icon size={36} />
                                        </div>
                                        <div className="flex-1 h-[1px] bg-emerald-50/30" />
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{`SCHEME_${i+1}`}</span>
                                    </div>

                                    <div className="space-y-8 relative z-10">
                                        <h4 className="text-4xl lg:text-5xl font-bold text-black uppercase tracking-tighter leading-none  group-hover:text-emerald-600 transition-colors">
                                            {scheme.title}
                                        </h4>
                                        <p className="text-gray-900 text-lg lg:text-xl font-bold leading-relaxed  opacity-80 line-clamp-3">
                                            {scheme.description}
                                        </p>
                                    </div>

                                    <div className="mt-16 pt-12 border-t border-slate-50 relative z-10 flex items-center justify-between">
                                        <Link
                                            href={route('login')}
                                            className="px-10 py-5 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl flex items-center gap-4"
                                        >
                                            Daftar Skema
                                            <ArrowRight size={16} />
                                        </Link>
                                        <div className="flex gap-2">
                                            <Star size={14} className="text-amber-300 fill-amber-300" />
                                            <Star size={14} className="text-amber-300 fill-amber-300" />
                                            <Star size={14} className="text-amber-300 fill-amber-300" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* BACKGROUND DECORATIVE */}
                <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-50 rounded-full blur-[160px] animate-pulse-slow -z-10" />
                <div className="absolute bottom-0 -left-1/4 w-[600px] h-[600px] bg-gray-50 rounded-full blur-[140px] -z-10" />
            </section>
        </PublicLayout>
    );
}
