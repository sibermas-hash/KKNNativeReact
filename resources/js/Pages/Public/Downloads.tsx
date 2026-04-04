import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { motion } from 'framer-motion';
import { Download as DownloadIcon, ArrowRight, FileText, Globe, Star, Sparkles, FolderDown } from 'lucide-react';

interface Download {
    id: number;
    title: string;
    file_type?: string | null;
    file_path: string | null;
    external_url: string | null;
    is_demo?: boolean;
}

interface Props {
    downloads: Download[];
}

export default function Downloads({ downloads }: Props) {
    const previewMode = downloads.some((item) => item.is_demo);

    return (
        <PublicLayout>
            <Head title="Repositori | LPPM UIN Prof. K.H. Saifuddin Zuhri" />
            
            <section className="relative pt-44 lg:pt-60 pb-48 bg-white overflow-hidden min-h-screen">
                <div className="container relative z-10 mx-auto px-6 lg:px-12">
                    
                    {/* PAGE HEADER */}
                    <div className="max-w-4xl space-y-12 mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-full"
                        >
                            <FolderDown size={16} className="text-emerald-500" />
                            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.3em]">Pusat Dokumentasi Operasional</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl lg:text-[100px] font-black tracking-tighter text-slate-900 leading-[0.85] uppercase"
                        >
                            Repositori <br /> 
                            <span className="text-emerald-500 italic lowercase font-medium">dokumen.</span>
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl lg:text-3xl text-slate-400 font-bold max-w-2xl leading-relaxed italic border-l-8 border-emerald-500 pl-10"
                        >
                            Unduh dokumen panduan, berkas administrasi, dan referensi akademik untuk kemudahan operasional KKN Anda.
                        </motion.p>
                    </div>

                    {/* GRID DOWNLOADS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                        {downloads.map((d, i) => (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="group relative bg-white p-12 lg:p-16 rounded-[4rem] border border-slate-100 hover:border-emerald-500 hover:shadow-[0_80px_160px_rgba(0,0,0,0.06)] transition-all cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                                    <FileText size={200} />
                                </div>

                                <div className="space-y-12 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="p-6 bg-emerald-50 text-emerald-600 rounded-[2rem] group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-sm">
                                            <FileText size={32} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">{d.file_type || 'PDF'}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none italic group-hover:text-emerald-600 transition-colors">
                                            {d.title}
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PUBLIKASI_RESMI_LPPM</p>
                                    </div>

                                    <div className="pt-10 border-t border-slate-50 flex items-center justify-between">
                                        <a 
                                            href={d.external_url || d.file_path || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-10 py-5 bg-slate-900 text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-4"
                                        >
                                            Unduh Berkas
                                            <DownloadIcon size={16} />
                                        </a>
                                        <div className="flex gap-2">
                                            <Sparkles size={14} className="text-emerald-400" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        {/* EMPTY STATE */}
                        {downloads.length === 0 && (
                            <div className="md:col-span-2 py-40 text-center bg-white rounded-[5rem] border border-dashed border-slate-200">
                                <Globe size={80} className="text-slate-100 mx-auto mb-10" />
                                <p className="text-slate-300 font-bold italic text-2xl uppercase tracking-tighter">Repositori saat ini sedang dalam pemeliharaan.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* BACKGROUND DECORATIVE */}
                <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-50 rounded-full blur-[160px] animate-pulse-slow -z-10" />
                <div className="absolute bottom-0 -left-1/4 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-[140px] -z-10" />
            </section>
        </PublicLayout>
    );
}
