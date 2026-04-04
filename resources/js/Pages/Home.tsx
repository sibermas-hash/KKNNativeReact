import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Users, 
    MapPin, 
    Layers, 
    ChevronRight,
    Star,
    ArrowRight
} from 'lucide-react';
import { route } from 'ziggy-js';
import PublicLayout from '@/Layouts/PublicLayout';
import type { User } from '@/types';

interface Props {
    stats: {
        students: number;
        groups: number;
        locations: number;
    };
    auth: {
        user: User | null;
    };
}

export default function Home({ stats, auth }: Props) {
    return (
        <PublicLayout>
            <Head title="SIM-KKN | Portal Kuliah Kerja Nyata UIN Prof. K.H. Saifuddin Zuhri" />

            {/* HERO SECTION */}
            <section className="relative -mt-24 pt-32 pb-20 lg:pt-52 lg:pb-44 overflow-hidden bg-emerald-600 min-h-screen flex items-center">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/images/landing/hero.png" 
                        alt="KKN Students" 
                        className="w-full h-full object-cover brightness-[0.7] saturate-[1.4]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/90 via-emerald-800/40 to-amber-500/10" />
                    
                    <div className="absolute top-1/4 right-1/4 opacity-20 hidden lg:block text-white font-black text-9xl tracking-tighter">
                        UINSAIZU
                    </div>
                </div>

                <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center lg:text-left">
                    <div className="max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-4 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-10"
                        >
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-[12px] font-black text-white uppercase tracking-[0.3em]">PENDAFTARAN KKN 2026 AKTIF</span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-6xl lg:text-[100px] font-black text-white mb-10 leading-[0.9] tracking-tighter"
                        >
                            ARSITEKTUR <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">PENGABDIAN.</span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-xl lg:text-2xl text-emerald-50 mb-14 max-w-2xl leading-relaxed font-bold italic"
                        >
                            Ekselen dalam pengabdian, presisi dalam orkestrasi data. SIM-KKN menghadirkan solusi digital integratif untuk pelaksanaan KKN yang berdampak nyata.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="flex flex-col sm:flex-row items-center gap-6"
                        >
                            <Link 
                                href={route('login')}
                                className="w-full sm:w-auto bg-amber-400 text-slate-950 px-14 py-6 rounded-2xl font-black text-lg tracking-[0.1em] hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-amber-500/40"
                            >
                                MASUK SEKARANG
                                <ChevronRight className="w-6 h-6" />
                            </Link>
                            <Link 
                                href={route('public.about')}
                                className="w-full sm:w-auto bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white px-10 py-6 rounded-2xl font-black text-sm tracking-[0.1em] hover:bg-white/30 transition-all flex items-center justify-center gap-4"
                            >
                                PROFIL LPPM
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* LIVE DATA SECTION */}
            <section className="relative -mt-20 z-20 container mx-auto px-6 lg:px-12 mb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border-b-8 border-emerald-500 flex flex-col gap-8 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Users className="w-24 h-24" />
                        </div>
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">TOTAL PESERTA</span>
                            <span className="text-4xl font-black text-slate-950 tracking-tighter">{stats.students.toLocaleString()}+</span>
                            <p className="text-xs font-bold text-emerald-600 mt-2 lowercase">peserta terverifikasi aktif</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -10 }}
                        className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border-b-8 border-amber-400 flex flex-col gap-8 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-500">
                            <Layers className="w-24 h-24" />
                        </div>
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:bg-amber-400 group-hover:text-white transition-all duration-500">
                            <Layers className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">UNIT DISTRIBUSI</span>
                            <span className="text-4xl font-black text-slate-950 tracking-tighter">{stats.groups.toLocaleString()}</span>
                            <p className="text-xs font-bold text-amber-600 mt-2 lowercase">kelompok pengabdian mandiri</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -10 }}
                        className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border-b-8 border-emerald-500 flex flex-col gap-8 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <MapPin className="w-24 h-24" />
                        </div>
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                            <MapPin className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">RADIUS LOKASI</span>
                            <span className="text-4xl font-black text-slate-950 tracking-tighter">{stats.locations.toLocaleString()}</span>
                            <p className="text-xs font-bold text-emerald-600 mt-2 lowercase">wilayah jangkauan operasional</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* QUICK ACTIONS SECTION */}
            <section className="py-24 bg-white mb-20">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                        <div className="bg-slate-50 p-16 rounded-[4rem] border-2 border-slate-100 group hover:border-emerald-500 transition-all">
                             <h4 className="text-4xl font-black text-slate-950 mb-8 uppercase tracking-tighter">Skema KKN Terkini</h4>
                             <p className="text-slate-500 font-bold italic mb-10 text-lg">Pelajari beragam skema pengabdian mulai dari Reguler, Internasional, hingga Nusantara.</p>
                             <Link 
                                href={route('public.schemes')}
                                className="inline-flex items-center gap-3 text-xs font-black text-emerald-600 border-2 border-emerald-500 px-8 py-4 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest"
                             >
                                 Lihat Semua Skema
                                 <ArrowRight className="w-5 h-5" />
                             </Link>
                        </div>
                        <div className="bg-slate-950 p-16 rounded-[4rem] group border-4 border-slate-950 hover:border-amber-400 transition-all text-white">
                             <h4 className="text-4xl font-black mb-8 uppercase tracking-tighter">Informasi LPPM</h4>
                             <p className="text-slate-400 font-bold italic mb-10 text-lg uppercase leading-tight italic">Kenali lebih dekat profil, visi, dan misi LPPM UIN Prof. K.H. Saifuddin Zuhri.</p>
                             <Link 
                                href={route('public.about')}
                                className="inline-flex items-center gap-3 text-xs font-black text-amber-400 border-2 border-amber-400 px-8 py-4 rounded-2xl hover:bg-amber-400 hover:text-slate-950 transition-all uppercase tracking-widest"
                             >
                                 Baca Profil Kami
                                 <ArrowRight className="w-5 h-5" />
                             </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
