import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Star, Megaphone, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';

interface Announcement {
    id: number;
    title: string;
    content: string;
    category: string;
    published_at: string;
    is_demo?: boolean;
}

interface Props {
    announcements: {
        data: Announcement[];
        links: unknown[];
    };
}

export default function Announcements({ announcements }: Props) {
    const previewMode = announcements.data.some((item) => item.is_demo);

    return (
        <PublicLayout>
            <Head title="Warta Utama | LPPM UIN Prof. K.H. Saifuddin Zuhri" />
            
            <section className="relative pt-44 lg:pt-60 pb-48 bg-white overflow-hidden min-h-screen">
                <div className="container relative z-10 mx-auto px-6 lg:px-12">
                    
                    {/* PAGE HEADER */}
                    <div className="max-w-4xl space-y-12 mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-full"
                        >
                            <Megaphone size={16} className="text-emerald-500" />
                            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.3em]">Komunikasi Strategis</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl lg:text-[100px] font-black tracking-tighter text-slate-900 leading-[0.85] uppercase"
                        >
                            Warta <br /> 
                            <span className="text-emerald-500 italic lowercase font-medium">utama.</span>
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl lg:text-3xl text-slate-400 font-bold max-w-2xl leading-relaxed italic border-l-8 border-emerald-500 pl-10"
                        >
                            Informasi terkini mengenai pelaksanaan KKN, pendaftaran periodik, dan pengumuman resmi LPPM UIN SAIZU.
                        </motion.p>
                    </div>

                    {/* LIST ANNOUNCEMENTS */}
                    <div className="space-y-12 lg:space-y-16">
                        {announcements.data.map((news, i) => (
                            <motion.div
                                key={news.id}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="group relative bg-white p-12 lg:p-20 rounded-[4rem] border border-slate-100 hover:border-emerald-500 hover:shadow-[0_80px_160px_rgba(0,0,0,0.06)] transition-all cursor-pointer"
                            >
                                <div className="flex flex-col lg:flex-row gap-16 lg:items-center">
                                    {/* Date Display */}
                                    <div className="flex flex-col items-center justify-center p-10 bg-slate-900 rounded-[3rem] min-w-[180px] text-white shadow-2xl group-hover:bg-emerald-600 transition-colors duration-500">
                                        <Calendar className="w-8 h-8 mb-6 text-emerald-400" />
                                        <span className="text-6xl font-black tracking-tighter leading-none italic">{dayjs(news.published_at).format('DD')}</span>
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-4 group-hover:text-emerald-100 transition-colors">
                                            {dayjs(news.published_at).format('MMM YYYY')}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center gap-6">
                                            <span className="inline-block px-5 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full tracking-[0.3em] border border-emerald-100">
                                                {news.category}
                                            </span>
                                            <div className="flex-1 h-[1px] bg-slate-50" />
                                            {news.is_demo && (
                                                 <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">PRATINJAU</span>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            <h4 className="text-3xl lg:text-5xl font-black text-slate-950 group-hover:text-emerald-600 transition-colors leading-none uppercase italic tracking-tighter">
                                                {news.title}
                                            </h4>
                                            <p className="text-slate-500 text-lg lg:text-2xl leading-relaxed font-bold italic line-clamp-3 opacity-80">
                                                {news.content}
                                            </p>
                                        </div>
                                        
                                        <div className="pt-8 flex items-center justify-between">
                                            <div className="inline-flex items-center gap-4 text-[10px] font-black text-emerald-600 uppercase tracking-[0.5em] group-hover:translate-x-4 transition-transform">
                                                Baca Selengkapnya
                                                <ArrowRight size={18} />
                                            </div>
                                            <div className="flex gap-2 opacity-50">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* EMPTY STATE */}
                    {announcements.data.length === 0 && (
                        <div className="py-40 text-center bg-white rounded-[5rem] border border-dashed border-slate-200">
                            <BookOpen size={80} className="text-slate-200 mx-auto mb-10" />
                            <p className="text-slate-400 font-bold italic text-2xl uppercase tracking-tighter">Belum ada warta yang dipublikasikan.</p>
                        </div>
                    )}
                </div>

                {/* BACKGROUND DECORATIVE */}
                <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-50 rounded-full blur-[160px] animate-pulse-slow -z-10" />
                <div className="absolute bottom-0 -left-1/4 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-[140px] -z-10" />
            </section>
        </PublicLayout>
    );
}
