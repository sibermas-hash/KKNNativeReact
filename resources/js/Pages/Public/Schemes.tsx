import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { motion } from 'framer-motion';
import { Layers, Globe2, Navigation, Zap, ArrowRight } from 'lucide-react';

export default function Schemes() {
    const schemes = [
        {
            icon: <Layers className="w-10 h-10" />,
            title: 'KKN REGULER',
            description: 'Penempatan wilayah regional dengan fokus pemberdayaan masyarakat lokal berbasis kearifan setempat.',
            color: 'emerald'
        },
        {
            icon: <Globe2 className="w-10 h-10" />,
            title: 'KKN INTERNASIONAL',
            description: 'Kolaborasi global melalui kemitraan universitas luar negeri untuk peningkatan kapasitas lintas budaya.',
            color: 'blue'
        },
        {
            icon: <Navigation className="w-10 h-10" />,
            title: 'KKN NUSANTARA',
            description: 'Pengabdian di wilayah 3T (Terdepan, Terluar, Tertinggal) untuk mendukung pemerataan pembangunan nasional.',
            color: 'yellow'
        },
        {
            icon: <Zap className="w-10 h-10" />,
            title: 'KKN MANDIRI',
            description: 'Inisiatif kelompok dengan program kerja spesifik dan kemitraan strategis dengan lembaga eksternal.',
            color: 'purple'
        }
    ];

    return (
        <PublicLayout>
            <Head title="Skema KKN | LPPM UIN Prof. K.H. Saifuddin Zuhri" />
            
            <section className="py-24 lg:py-48 bg-slate-50 min-h-screen">
                <div className="container mx-auto px-6 lg:px-12 relative z-10">
                    <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-24 text-center lg:text-left">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-8 justify-center lg:justify-start">
                                <div className="h-1.5 w-16 bg-emerald-600 rounded-full" />
                                <span className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.4em]">SKEMA DISTRIBUSI</span>
                            </div>
                            <h3 className="text-5xl lg:text-7xl font-black text-slate-950 mb-8 tracking-tighter">
                                Skema Operasional <br /> <span className="text-emerald-500 italic">Terintegrasi.</span>
                            </h3>
                            <p className="text-lg text-slate-500 font-bold max-w-2xl italic">
                                Beragam pilihan skema pengabdian yang dirancang untuk menjawab tantangan spesifik di berbagai level masyarakat.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {schemes.map((scheme, i) => (
                            <motion.div
                                key={scheme.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="bg-white p-16 rounded-[4rem] border-2 border-slate-100 hover:border-emerald-500 hover:shadow-2xl transition-all group"
                            >
                                <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center mb-12 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6
                                    ${scheme.color === 'emerald' ? 'bg-emerald-500 text-white' : ''}
                                    ${scheme.color === 'blue' ? 'bg-blue-600 text-white' : ''}
                                    ${scheme.color === 'yellow' ? 'bg-amber-400 text-slate-950' : ''}
                                    ${scheme.color === 'purple' ? 'bg-slate-950 text-white' : ''}
                                `}>
                                    {scheme.icon}
                                </div>
                                <h4 className="text-4xl font-black text-slate-950 mb-6 tracking-tighter uppercase">{scheme.title}</h4>
                                <p className="text-slate-500 text-xl leading-relaxed font-bold mb-14 italic">
                                    {scheme.description}
                                </p>
                                <button className="inline-flex items-center gap-4 px-10 py-5 text-sm font-black text-white bg-emerald-500 rounded-3xl hover:bg-slate-950 transition-all uppercase tracking-widest group">
                                    Daftar Sekarang
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
        </PublicLayout>
    );
}
