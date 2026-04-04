import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { motion } from 'framer-motion';
import { BookOpen, Calendar } from 'lucide-react';
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
            
            <section className="py-24 lg:py-48 bg-white min-h-screen">
                <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 gap-24">
                    <div className="mb-12">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-1.5 w-16 bg-amber-400 rounded-full" />
                            <span className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.5em]">PUSAT KOMUNIKASI</span>
                        </div>
                        <h3 className="text-5xl lg:text-7xl font-black text-slate-950 tracking-tighter leading-[0.9]">Warta Utama.</h3>
                        <p className="text-lg text-slate-500 font-bold max-w-2xl mt-8 italic">
                            Informasi terkini mengenai pelaksanaan KKN, pendaftaran periodik, dan pengumuman resmi LPPM.
                        </p>
                        {previewMode && (
                            <div className="mt-6 inline-flex rounded-full bg-amber-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                                Contoh Tampilan Saat Data Belum Tersedia
                            </div>
                        )}
                    </div>

                    <div className="space-y-12">
                        {announcements.data.map((news, i) => (
                            <motion.div
                                key={news.id}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group bg-white p-16 rounded-[4rem] border-2 border-slate-100 hover:border-emerald-500 hover:shadow-2xl transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-12">
                                    <div className="flex flex-col items-center justify-center p-8 bg-emerald-500 rounded-3xl min-w-[150px] text-white shadow-xl shadow-emerald-500/20">
                                        <Calendar className="w-6 h-6 mb-4 text-emerald-100" />
                                        <span className="text-5xl font-black tracking-tighter my-2">{dayjs(news.published_at).format('DD')}</span>
                                        <span className="text-[12px] font-black text-emerald-100 uppercase">{dayjs(news.published_at).format('MMM YYYY')}</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="inline-block px-4 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-full mb-6 tracking-widest">{news.category}</span>
                                        <h4 className="text-4xl font-black text-slate-950 mb-7 group-hover:text-emerald-500 transition-colors leading-tight italic">
                                            {news.title}
                                        </h4>
                                        <div className="text-slate-500 text-xl leading-relaxed font-bold mb-10 italic line-clamp-3">
                                            {news.content}
                                        </div>
                                        <div className="inline-flex items-center gap-3 text-xs font-black text-emerald-600 border-2 border-emerald-500 px-8 py-4 rounded-2xl uppercase tracking-widest">
                                            {news.is_demo ? 'Pratinjau Warta' : 'Publikasi Aktif'}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination Placeholder */}
                    {announcements.data.length === 0 && (
                        <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                            <p className="text-slate-500 font-bold italic text-lg">Belum ada pengumuman untuk ditampilkan.</p>
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
