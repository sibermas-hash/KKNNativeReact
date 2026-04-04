import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { motion } from 'framer-motion';
import { Download as DownloadIcon, ArrowRight, FileText, Globe } from 'lucide-react';

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
            
            <section className="py-24 lg:py-48 bg-slate-50 min-h-screen">
                <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 gap-24">
                    <div className="mb-12">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-1.5 w-16 bg-amber-400 rounded-full" />
                            <span className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.5em]">OPERATIONAL_HUB</span>
                        </div>
                        <h3 className="text-5xl lg:text-7xl font-black text-slate-950 tracking-tighter leading-[0.9]">Repositori File.</h3>
                        <p className="text-lg text-slate-500 font-bold max-w-2xl mt-8 italic">
                            Unduh dokumen panduan, berkas administrasi, dan referensi akademik untuk kemudahan operasional KKN Anda.
                        </p>
                        {previewMode && (
                            <div className="mt-6 inline-flex rounded-full bg-amber-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                                Contoh Tampilan Saat Repositori Masih Kosong
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {downloads.map((d, i) => (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group bg-white p-16 rounded-[4rem] border-2 border-slate-100 hover:border-emerald-500 hover:shadow-2xl transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-5 text-emerald-500">
                                    <FileText className="w-32 h-32" />
                                </div>
                                <div className="flex flex-col items-start gap-10 relative z-10">
                                    <div className="p-6 bg-emerald-50 text-emerald-600 rounded-[2rem] shadow-xl group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:-rotate-12 group-hover:scale-110">
                                        <DownloadIcon className="w-12 h-12" />
                                    </div>
                                    <h4 className="text-3xl font-black text-slate-950 leading-tight uppercase italic tracking-tighter">
                                        {d.title}
                                    </h4>
                                    {d.is_demo ? (
                                        <div className="inline-flex items-center gap-4 px-10 py-5 bg-slate-200 text-slate-700 rounded-3xl font-black text-xs uppercase tracking-widest">
                                            CONTOH DOKUMEN
                                        </div>
                                    ) : (
                                        <a 
                                            href={d.external_url || d.file_path || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl group-hover:translate-x-2"
                                        >
                                            UNDUH SEKARANG
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        
                        {downloads.length === 0 && (
                            <div className="md:col-span-2 py-40 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                                <Globe className="w-20 h-20 text-slate-200 mx-auto mb-8" />
                                <p className="text-slate-400 font-black uppercase tracking-[0.2em] italic">Tidak ada file dalam repositori publik.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
