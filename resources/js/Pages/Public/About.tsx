import { Head } from '@inertiajs/react';
import { Info, ShieldCheck, Zap, Star, Sparkles, Target, Award } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { motion } from 'framer-motion';

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
            <Head title="Profil Institusi | LPPM UIN Prof. K.H. Saifuddin Zuhri" />

            {/* HERO - ABOUT */}
            <section className="relative pt-44 lg:pt-60 pb-32 bg-white overflow-hidden">
                <div className="container mx-auto px-6 lg:px-12 relative z-10">
                    <div className="max-w-4xl space-y-12 mb-24">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-full"
                        >
                            <Star size={16} className="text-emerald-500 fill-emerald-500" />
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Profil Institusi</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl lg:text-[100px] font-bold tracking-tighter text-slate-900 leading-[0.85] uppercase"
                        >
                            Dedikasi Untuk <br /> 
                            <span className="text-emerald-500   font-medium">negeri.</span>
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl lg:text-2xl text-slate-500 font-bold max-w-2xl leading-relaxed  border-l-8 border-emerald-500 pl-12"
                        >
                            LPPM UIN SAIZU hadir sebagai pusat inkubasi riset dan orkestrasi pengabdian masyarakat yang berlandaskan nilai-nilai Islam dan kearifan lokal.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-16"
                        >
                             <div className="bg-emerald-50/50 p-12 lg:p-20 rounded-[4rem] border border-emerald-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                    <Info size={200} />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-4  font-medium  ">
                                    Tentang <span className="text-emerald-600 font-medium  ">lppm.</span>
                                </h2>
                                <p className="text-slate-600 text-lg lg:text-xl font-bold leading-relaxed  opacity-80">
                                    "{aboutContent.about}"
                                </p>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-[0_40px_80px_rgba(0,0,0,0.03)] space-y-6 group hover:border-emerald-500 transition-all">
                                    <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl w-fit group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <Target size={28} />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Visi Utama</h4>
                                    <p className="text-lg font-bold text-slate-900 leading-tight uppercase  group-hover:text-emerald-600 transition-colors">"{aboutContent.visi}"</p>
                                </div>

                                <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-[0_40px_80px_rgba(0,0,0,0.03)] space-y-6 group hover:border-emerald-500 transition-all">
                                    <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl w-fit group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <Award size={28} />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Misi Strategis</h4>
                                    <p className="text-lg font-bold text-slate-900 leading-tight uppercase  group-hover:text-emerald-600 transition-colors">"{aboutContent.misi}"</p>
                                </div>
                             </div>
                        </motion.div>

                        <div className="relative">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative rounded-[5rem] overflow-hidden shadow-[0_80px_160px_rgba(0,0,0,0.1)] group"
                            >
                                <img 
                                    src="https://images.unsplash.com/photo-1541339907198-e08756eaa443?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                                    alt="UIN SAIZU Campus" 
                                    className="w-full aspect-[4/5] object-cover saturate-[1.2] group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-slate-900/60 to-transparent text-white">
                                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                        <Sparkles size={14} className="text-emerald-400 fill-emerald-400" />
                                        <span>Layanan Terbaik</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Floating decorative elements */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] -z-10 animate-pulse" />
                            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-100 rounded-full blur-[100px] -z-10" />
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
