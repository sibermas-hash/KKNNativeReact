import { Head, Link, Deferred } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Download,
    Users2, 
    MapPin, 
    Layers, 
    ChevronRight,
    FileText,
    ShieldCheck,
    ArrowRight,
    GraduationCap,
    Globe,
    Star,
    Sparkles,
    Landmark
} from 'lucide-react';
import { route } from 'ziggy-js';
import PublicLayout from '@/Layouts/PublicLayout';
import dayjs from 'dayjs';

interface Props {
    stats: {
        students: number;
        groups: number;
        locations: number;
    } | null;
    featuredAnnouncements: Array<{
        id: number;
        title: string;
        category: string;
        content: string;
        published_at: string;
        is_demo: boolean;
    }> | null;
    featuredDownloads: Array<{
        id: number;
        title: string;
        file_type: string | null;
        external_url: string | null;
        file_path: string | null;
        is_demo: boolean;
    }> | null;
}

export default function Home({ stats, featuredAnnouncements, featuredDownloads }: Props) {
    return (
        <PublicLayout>
            <Head title="Beranda | SIM-KKN UIN Prof. K.H. Saifuddin Zuhri" />

            {/* HERO - EDUCATEX INSPIRED (SPLIT & FLOATING) */}
            <section className="relative pt-44 lg:pt-60 pb-32 lg:pb-52 overflow-hidden bg-white">
                <div className="container mx-auto px-6 lg:px-12 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_550px] items-center gap-20">
                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-12"
                        >
                            <div className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
                                <Sparkles size={16} className="text-emerald-500 fill-emerald-500" />
                                <span className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.3em]">PENDAFTARAN KKN 2026</span>
                            </div>
                            
                            <h1 className="text-6xl lg:text-[100px] font-black tracking-tighter text-slate-900 leading-[0.85] uppercase">
                                Masa Depan <br />
                                Berawal Dari <span className="text-emerald-500 italic lowercase font-medium">pengabdian.</span>
                            </h1>

                            <p className="text-xl lg:text-2xl text-slate-500 font-bold max-w-2xl leading-relaxed italic border-l-8 border-emerald-500 pl-10">
                                Integrasi digital untuk orkestrasi pengabdian masyarakat yang terukur, transparan, dan berdampak global bagi kemajuan bangsa.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-8 pt-8">
                                <Link 
                                    href="/login"
                                    className="group w-full sm:w-auto bg-slate-900 text-white px-16 py-8 rounded-[3rem] font-bold text-[13px] tracking-[0.4em] transition-all hover:bg-emerald-600 shadow-[0_40px_80px_rgba(0,0,0,0.1)] hover:-translate-y-2 uppercase flex items-center justify-center gap-4"
                                >
                                    Masuk Portal
                                    <ArrowRight size={18} className="group-hover:translate-x-3 transition-transform" />
                                </Link>
                                
                                <Link 
                                    href={route('public.about')}
                                    className="w-full sm:w-auto bg-emerald-50 text-emerald-600 px-12 py-8 rounded-[3rem] font-bold text-[11px] tracking-[0.4em] hover:bg-emerald-100 transition-all uppercase flex items-center justify-center gap-4"
                                >
                                    Profil KKN
                                </Link>
                            </div>
                        </motion.div>

                        {/* Image & Floating Cards */}
                        <div className="relative order-first lg:order-last">
                           {/* Main Image Container with Extreme Radius */}
                           <motion.div 
                              initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              transition={{ duration: 1 }}
                              className="relative h-[500px] lg:h-[650px] w-full rounded-[4rem] overflow-hidden lg:rotate-3 shadow-[0_80px_160px_rgba(0,0,0,0.1)]"
                           >
                                <img 
                                    src="/images/landing/hero_premium.png" 
                                    alt="KKN Students EducateX" 
                                    className="w-full h-full object-cover saturate-[1.2]"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-950/40 via-transparent to-transparent" />
                           </motion.div>

                           {/* Floating Badge 1 - Top Left */}
                           <motion.div 
                              initial={{ y: 0 }}
                              animate={{ y: -20 }}
                              transition={{ repeat: Infinity, duration: 4, repeatType: 'reverse', ease: 'easeInOut' }}
                              className="absolute -top-10 -left-10 bg-white p-8 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] hidden lg:flex items-center gap-6 border border-slate-50 z-20"
                           >
                                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl">
                                    <Users2 size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter italic">5k+</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">MAHASISWA AKTIF</p>
                                </div>
                           </motion.div>

                           {/* Floating Badge 2 - Bottom Right */}
                           <motion.div 
                              initial={{ y: 0 }}
                              animate={{ y: 20 }}
                              transition={{ repeat: Infinity, duration: 5, repeatType: 'reverse', ease: 'easeInOut' }}
                              className="absolute -bottom-10 -right-10 bg-white p-8 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] hidden lg:flex items-center gap-6 border border-slate-50 z-20"
                           >
                                <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
                                    <MapPin size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter italic">24+</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">LOKASI DAERAH</p>
                                </div>
                           </motion.div>

                           {/* Decorative Circles */}
                           <div className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-100 rounded-full blur-[120px] -z-10 animate-pulse" />
                        </div>
                    </div>
                </div>
            </section>

            {/* QUICK STATS - DISCRETE CARDS */}
            <section className="pb-40 bg-white">
                <div className="container mx-auto px-6 lg:px-12">
                   <Deferred data="stats" fallback={
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 bg-slate-50 rounded-[4rem]" />
                            ))}
                        </div>
                   }>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                          {[
                              { label: 'Kelompok KKN', value: stats?.groups || 0, icon: Layers, color: 'emerald' },
                              { label: 'Total Peserta', value: stats?.students || 0, icon: GraduationCap, color: 'emerald' },
                              { label: 'Kabupaten/Kota', value: stats?.locations || 0, icon: Globe, color: 'emerald' }
                          ].map((stat, i) => (
                              <motion.div
                                   key={i}
                                   whileHover={{ y: -10 }}
                                   className="flex flex-col items-center text-center gap-8 p-12 bg-slate-50/50 rounded-[4rem] hover:bg-white border border-transparent hover:border-slate-100 transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.03)] cursor-default group"
                              >
                                   <div className="p-6 bg-white text-slate-300 rounded-[2rem] group-hover:bg-emerald-500 group-hover:text-white transition-all duration-700 shadow-sm">
                                       <stat.icon size={36} />
                                   </div>
                                   <div className="space-y-2">
                                        <h3 className="text-5xl font-black text-slate-950 tracking-tighter italic leading-none">{stat.value.toLocaleString()}+</h3>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] pt-2">{stat.label}</p>
                                   </div>
                               </motion.div>
                          ))}
                      </div>
                   </Deferred>
                </div>
            </section>

            {/* FEATURES - IMPACT DRIVEN */}
            <section className="py-40 bg-slate-50/30">
                 <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-12">
                            <h2 className="text-5xl lg:text-[80px] font-black tracking-tighter leading-[0.8] text-slate-900 uppercase italic">Kenali Eksplorasi <br/> <span className="text-emerald-500 font-medium lowercase italic">pengabdian.</span></h2>
                            <p className="text-slate-500 text-xl font-bold leading-relaxed max-w-lg">Temukan beragam skema pengabdian yang dirancang untuk tantangan masyarakat di era digital.</p>
                            
                            <div className="grid grid-cols-1 gap-8 pt-8">
                                {[
                                    { title: 'Skema Reguler', desc: 'Pengabdian umum berkelanjutan', icon: Landmark },
                                    { title: 'Skema Internasional', desc: 'Kolaborasi pengabdian antar negara', icon: Globe },
                                    { title: 'Skema Tematik', desc: 'Solusi spesifik untuk isu lokal', icon: Star }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-8 group">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 h-fit">
                                            <feature.icon size={28} />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{feature.title}</h4>
                                            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="bg-white p-12 lg:p-20 rounded-[5rem] border border-slate-100 shadow-[0_80px_160px_rgba(0,0,0,0.06)] relative z-10 space-y-12 overflow-hidden">
                                 {/* Decorative text bg */}
                                 <div className="absolute top-0 right-0 p-12 opacity-[0.03] select-none pointer-events-none group-hover:opacity-10 transition-opacity">
                                    <GraduationCap size={260} />
                                 </div>

                                 <h3 className="text-4xl font-black text-slate-950 uppercase tracking-tighter leading-none italic">Repositori <br/> <span className="text-slate-300 font-medium">dokumen.</span></h3>
                                 <Deferred data="featuredDownloads" fallback={
                                    <div className="space-y-6 animate-pulse">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-14 bg-slate-50 rounded-2xl" />
                                        ))}
                                    </div>
                                 }>
                                    <div className="space-y-8 relative z-10">
                                        {featuredDownloads?.map((item) => (
                                            <div key={item.id} className="flex items-center gap-8 group cursor-pointer">
                                                <div className="p-4 bg-slate-50 text-slate-300 rounded-[2rem] border border-slate-50 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-all">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors truncate">{item.title}</h4>
                                                    <div className="mt-2 flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.file_type || 'PDF'}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <Download size={10} className="text-slate-300 group-hover:text-emerald-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                 </Deferred>
                                 <Link 
                                    href={route('public.downloads')}
                                    className="block p-8 border-t-2 border-slate-50 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] hover:text-emerald-500 transition-colors pt-20"
                                >
                                    Seluruh Repositori
                                </Link>
                            </div>
                        </div>
                    </div>
                 </div>
            </section>

            {/* WARTA - GRID HIGHLIGHT */}
            <section className="py-40 bg-white">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="flex flex-col lg:flex-row items-end justify-between mb-24 gap-10">
                        <div className="space-y-8 text-center lg:text-left">
                            <h2 className="text-5xl lg:text-[100px] font-black tracking-tighter leading-[0.8] text-slate-900 uppercase">Warta Utama <br/> <span className="text-emerald-500 font-medium italic lowercase">pilihan.</span></h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[11px]">Informasi Pelaksanaan KKN UIN SAIZU Terkini</p>
                        </div>
                        <Link 
                            href={route('public.announcements')}
                            className="px-10 py-5 border-2 border-slate-900 text-slate-900 rounded-full font-bold text-[11px] tracking-[0.4em] uppercase hover:bg-slate-950 hover:text-white transition-all shadow-xl shadow-slate-900/5 mb-4"
                        >
                            Lihat Semua Berita
                        </Link>
                    </div>

                    <Deferred data="featuredAnnouncements" fallback={
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
                            {[1, 2].map(i => (
                                <div key={i} className="h-64 bg-slate-50 rounded-[4rem]" />
                            ))}
                        </div>
                    }>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {featuredAnnouncements?.map((item) => (
                                <motion.div 
                                    key={item.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="group bg-white p-16 rounded-[4rem] border border-slate-100 hover:border-emerald-500 transition-all hover:shadow-[0_80px_160px_rgba(0,0,0,0.06)] cursor-pointer"
                                >
                                    <div className="flex items-center gap-8 mb-12">
                                        <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full border border-emerald-100">
                                            {item.category}
                                        </span>
                                        <div className="flex-1 h-[1px] bg-slate-100" />
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                                            {dayjs(item.published_at).format('DD.MM.YY')}
                                        </span>
                                    </div>
                                    <h4 className="text-3xl font-black text-slate-900 mb-8 group-hover:text-emerald-600 transition-colors uppercase leading-tight italic">
                                        {item.title}
                                    </h4>
                                    <p className="text-slate-400 font-bold italic line-clamp-3 text-lg leading-relaxed mb-12">
                                        {item.content}
                                    </p>
                                    <div className="inline-flex items-center gap-4 text-[10px] font-black text-emerald-600 uppercase tracking-[0.5em]">
                                        BACA SELENGKAPNYA
                                        <ArrowRight size={16} className="group-hover:translate-x-4 transition-transform" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Deferred>
                </div>
            </section>

            {/* CALL TO ACTION - ELIGIBILITY */}
            <section className="pb-60 bg-white">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="bg-emerald-500 rounded-[5rem] p-20 lg:p-32 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-500/30">
                        {/* Decorative floating cap */}
                        <div className="absolute top-1/2 left-0 p-20 opacity-5 -translate-y-1/2 -rotate-12 select-none pointer-events-none">
                            <GraduationCap size={400} />
                        </div>
                        
                        <div className="relative z-10 space-y-16">
                            <h2 className="text-5xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.8] italic">
                                Cek Eligibility <br /> Sekarang juga
                            </h2>
                            <p className="text-emerald-50 text-xl lg:text-3xl font-bold italic max-w-3xl mx-auto leading-relaxed opacity-80">
                                Pastikan status akademik Anda telah memenuhi persyaratan sebelum melakukan pendaftaran pengabdian.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-10">
                                <Link 
                                    href="/login"
                                    className="group px-24 py-10 bg-white text-emerald-600 rounded-full font-black text-[13px] tracking-[0.5em] uppercase hover:bg-slate-900 hover:text-white transition-all shadow-2xl hover:-translate-y-2 flex items-center gap-6"
                                >
                                    Portal Mahasiswa 
                                    <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform" />
                                </Link>
                                <Link 
                                    href={route('public.schemes')}
                                    className="px-16 py-10 border-2 border-emerald-400 text-white rounded-full font-bold text-[11px] tracking-[0.4em] uppercase hover:bg-emerald-600 transition-all"
                                >
                                    Eksplorasi Skema
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
