import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { route } from 'ziggy-js';
import { 
    Globe, 
    ArrowRight, 
    Users, 
    MapPin, 
    ShieldCheck, 
    Zap, 
    Layers, 
    Globe2, 
    Navigation,
    BookOpen,
    Download as DownloadIcon,
    ChevronRight,
    Info,
    ExternalLink,
    Star
} from 'lucide-react';
import type { PageProps, Announcement, Download } from '@/types';
import dayjs from 'dayjs';

interface Props extends PageProps {
    stats: {
        students: number;
        groups: number;
        locations: number;
    };
    announcements: Announcement[];
    downloads: Download[];
    aboutContent: {
        about: string;
        visi: string;
        misi: string;
    };
}

export default function Home({ stats, auth, announcements, aboutContent, downloads }: Props) {
    const defaultAnnouncements = [
        {
            date: '04 APR 2026',
            category: 'PENDAFTARAN',
            title: 'Pendaftaran KKN Reguler Angkatan 86 Periode I Tahun 2026 Telah Dibuka',
            description: 'Mahasiswa semester 6 ke atas dapat mulai melakukan pendaftaran melalui portal pendaftaran mulai hari ini.',
            isNew: true
        }
    ];

    const displayAnnouncements = announcements.length > 0 
        ? announcements.map(a => ({
            date: dayjs(a.published_at).format('DD MMM YYYY').toUpperCase(),
            category: a.category,
            title: a.title,
            description: a.content.substring(0, 150) + (a.content.length > 150 ? '...' : ''),
            isNew: dayjs().diff(dayjs(a.published_at), 'day') < 7
          }))
        : defaultAnnouncements;

    const schemes = [
        {
            icon: <Layers className="w-6 h-6" />,
            title: 'KKN REGULER',
            description: 'Penempatan wilayah regional dengan fokus pemberdayaan masyarakat lokal berbasis kearifan setempat.',
            color: 'emerald'
        },
        {
            icon: <Globe2 className="w-6 h-6" />,
            title: 'KKN INTERNASIONAL',
            description: 'Kolaborasi global melalui kemitraan universitas luar negeri untuk peningkatan kapasitas lintas budaya.',
            color: 'blue'
        },
        {
            icon: <Navigation className="w-6 h-6" />,
            title: 'KKN NUSANTARA',
            description: 'Pengabdian di wilayah 3T (Terdepan, Terluar, Tertinggal) untuk mendukung pemerataan pembangunan nasional.',
            color: 'yellow'
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: 'KKN MANDIRI',
            description: 'Inisiatif kelompok dengan program kerja spesifik dan kemitraan strategis dengan lembaga eksternal.',
            color: 'purple'
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-950 selection:bg-emerald-500/20 selection:text-emerald-900">
            <Head title="SIM-KKN | Portal Kuliah Kerja Nyata UIN Prof. K.H. Saifuddin Zuhri" />

            {/* SINAR DUNIA NAVBAR */}
            <nav className="fixed top-0 left-0 right-0 z-[100] h-24 bg-white/95 backdrop-blur-md border-b-4 border-emerald-500 px-6 lg:px-12 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/30">
                        <Globe className="w-8 h-8" />
                    </div>
                    <div>
                        <Link href="/">
                            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none group">
                                UIN <span className="text-emerald-500 group-hover:text-amber-500 transition-colors uppercase">Prof. K.H. Saifuddin Zuhri</span>
                            </h1>
                        </Link>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.3em] flex items-center gap-2">
                            <span>OPERATIONAL_PORTAL</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>V3.5_VIBRANT</span>
                        </p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-10">
                    <a href="#about" className="text-[13px] font-black text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">Profil</a>
                    <a href="#schemes" className="text-[13px] font-black text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">Skema_KKN</a>
                    <a href="#announcements" className="text-[13px] font-black text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">Warta_Utama</a>
                    <a href="#downloads" className="text-[13px] font-black text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest">Repositori</a>
                </div>

                <div className="flex items-center gap-4">
                    {auth.user ? (
                        <Link 
                            href={route('dashboard')}
                            className="bg-slate-950 text-white px-8 py-3 rounded-xl text-xs font-black hover:bg-emerald-600 transition-all flex items-center gap-3 group shadow-xl"
                        >
                            <span>DASHBOARD_PANEL</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <>
                            <Link 
                                href={route('login')}
                                className="text-slate-900 hover:text-emerald-500 px-4 py-2 text-xs font-black transition-all uppercase tracking-[0.2em]"
                            >
                                LOGIN
                            </Link>
                            <Link 
                                href={route('login')}
                                className="bg-amber-400 text-slate-950 px-8 py-3 rounded-xl text-xs font-black hover:bg-amber-500 transition-all shadow-xl shadow-amber-500/20 uppercase tracking-[0.2em]"
                            >
                                DAFTAR_BARU
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 lg:pt-52 lg:pb-44 overflow-hidden bg-emerald-600">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/images/landing/hero.png" 
                        alt="KKN Students" 
                        className="w-full h-full object-cover brightness-[0.7] saturate-[1.4]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/90 via-emerald-800/40 to-amber-500/10" />
                    
                    <div className="absolute top-1/4 right-1/4 opacity-20 hidden lg:block">
                         <div className="flex flex-col gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-4 ml-[-40px]" style={{ transform: `translateX(${i * 20}px)` }}>
                                    {[...Array(8)].map((_, j) => (
                                        <div key={j} className="w-3 h-3 rounded-full bg-white" />
                                    ))}
                                </div>
                            ))}
                         </div>
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
                            <span className="text-[12px] font-black text-white uppercase tracking-[0.3em]">PENDAFTARAN_KKN_2026_AKTIF</span>
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
                            Ekselen dalam pengabdian, presisi dalam orkestrasi data. SIM-KKN UIN Prof. K.H. Saifuddin Zuhri menghadirkan solusi digital integratif untuk pelaksanaan KKN yang berdampak nyata.
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
                                MULAI PENGABDIAN
                                <ChevronRight className="w-6 h-6" />
                            </Link>
                            <a 
                                href="#about"
                                className="w-full sm:w-auto bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white px-10 py-6 rounded-2xl font-black text-sm tracking-[0.1em] hover:bg-white/30 transition-all flex items-center justify-center gap-4"
                            >
                                INFORMASI_LPPM
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* LIVE DATA SECTION */}
            <section className="relative -mt-20 z-20 container mx-auto px-6 lg:px-12">
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
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">TOTAL_PESERTA</span>
                            <span className="text-4xl font-black text-slate-950 tracking-tighter">{stats.students.toLocaleString()}+</span>
                            <p className="text-xs font-bold text-emerald-600 mt-2">MAHASISWA_TERDAFTAR</p>
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
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">UNIT_DISTRIBUSI</span>
                            <span className="text-4xl font-black text-slate-950 tracking-tighter">{stats.groups.toLocaleString()}</span>
                            <p className="text-xs font-bold text-amber-600 mt-2">KELOMPOK_PENEMPATAN</p>
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
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">RADIUS_LOKASI</span>
                            <span className="text-4xl font-black text-slate-950 tracking-tighter">{stats.locations.toLocaleString()}</span>
                            <p className="text-xs font-bold text-emerald-600 mt-2">DESA_TERJANGKAU</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ABOUT SECTION */}
            <section id="about" className="py-24 lg:py-48 bg-white">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
                        <div className="space-y-14">
                            <div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-1.5 w-16 bg-amber-400 rounded-full" />
                                    <span className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.4em]">INSTITUTIONAL_PROFILE</span>
                                </div>
                                <h3 className="text-5xl lg:text-7xl font-black text-slate-950 mb-10 tracking-tighter leading-tight">Sekilas LPPM <br /> <span className="text-emerald-500 italic">UIN Prof. K.H. Saifuddin Zuhri.</span></h3>
                                <div className="p-10 bg-emerald-50 rounded-[2rem] border-r-8 border-emerald-500 relative">
                                    <p className="text-slate-800 text-xl leading-relaxed font-bold italic">
                                        "{aboutContent.about}"
                                    </p>
                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Info className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-amber-400 rounded-3xl translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
                                    <div className="relative p-10 bg-white rounded-3xl border-2 border-slate-900">
                                        <ShieldCheck className="w-8 h-8 text-emerald-600 mb-6" />
                                        <h5 className="text-[12px] font-black text-slate-400 mb-4 uppercase tracking-[0.3em]">VISI_PUSAT</h5>
                                        <p className="text-sm font-black text-slate-900 leading-relaxed italic uppercase">
                                            "{aboutContent.visi}"
                                        </p>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-emerald-500 rounded-3xl translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
                                    <div className="relative p-10 bg-white rounded-3xl border-2 border-slate-900">
                                        <Zap className="w-8 h-8 text-amber-500 mb-6" />
                                        <h5 className="text-[12px] font-black text-slate-400 mb-4 uppercase tracking-[0.3em]">MISI_OPERASI</h5>
                                        <p className="text-sm font-black text-slate-900 leading-relaxed italic uppercase">
                                            "{aboutContent.misi}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex justify-center">
                            <div className="w-full max-w-lg aspect-square bg-emerald-500 rounded-[3rem] p-4 rotate-3 relative overflow-hidden group hover:rotate-0 transition-all duration-700 shadow-[0_50px_100px_-20px_rgba(16,168,83,0.3)]">
                                <div className="absolute inset-0 bg-white/10 opacity-20 flex flex-col gap-8 p-12">
                                     {[...Array(10)].map((_, i) => (
                                         <div key={i} className="flex gap-10">
                                            {[...Array(5)].map((_, j) => (
                                                <div key={j} className="w-2 h-2 rounded-full bg-white" />
                                            ))}
                                         </div>
                                     ))}
                                </div>
                                <div className="w-full h-full rounded-[2.5rem] bg-white border-8 border-emerald-600 overflow-hidden relative">
                                     <img 
                                        src="https://images.unsplash.com/photo-1541339907198-e08756eaa443?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                                        className="w-full h-full object-cover grayscale saturate-150 contrast-125" 
                                        alt="Campus Life" 
                                     />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SCHEMES SECTION */}
            <section id="schemes" className="py-24 lg:py-48 bg-slate-50">
                <div className="container mx-auto px-6 lg:px-12 relative z-10">
                    <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-24">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-1.5 w-16 bg-emerald-600 rounded-full" />
                                <span className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.4em]">DISTRIBUTION_SCHEMES</span>
                            </div>
                            <h3 className="text-5xl lg:text-7xl font-black text-slate-950 mb-8 tracking-tighter">
                                Skema Operasional <br /> <span className="text-emerald-500 italic">Terintegrasi.</span>
                            </h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {schemes.map((scheme, i) => (
                            <motion.div
                                key={scheme.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white p-12 rounded-[2.5rem] border-2 border-slate-100 hover:border-emerald-500 hover:shadow-[0_40px_80px_-20px_rgba(16,168,83,0.15)] transition-all group"
                            >
                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6
                                    ${scheme.color === 'emerald' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30' : ''}
                                    ${scheme.color === 'blue' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : ''}
                                    ${scheme.color === 'yellow' ? 'bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/30' : ''}
                                    ${scheme.color === 'purple' ? 'bg-slate-950 text-white shadow-xl shadow-slate-900/30' : ''}
                                `}>
                                    {scheme.icon}
                                </div>
                                <h4 className="text-2xl font-black text-slate-950 mb-4 tracking-tighter uppercase">{scheme.title}</h4>
                                <p className="text-slate-500 text-sm leading-relaxed font-bold mb-10 h-24 italic">
                                    {scheme.description}
                                </p>
                                <button className="w-full py-4 text-xs font-black text-emerald-600 border-2 border-emerald-500 rounded-xl flex items-center justify-center gap-3 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest">
                                    PELAJARI
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ANNOUNCEMENTS & DOWNLOADS SECTION */}
            <section id="announcements" className="py-24 lg:py-48 bg-white">
                <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-24">
                    <div className="lg:col-span-12 mb-12">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-1.5 w-16 bg-amber-400 rounded-full" />
                            <span className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.5em]">COMMUNICATION_HUB</span>
                        </div>
                        <h3 className="text-5xl lg:text-7xl font-black text-slate-950 tracking-tighter leading-[0.9]">Pusat Informasi.</h3>
                    </div>

                    <div className="lg:col-span-7 space-y-12">
                        <h5 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                            <BookOpen className="w-6 h-6 text-emerald-500" />
                            WARTA_TERBARU
                        </h5>
                        {displayAnnouncements.map((news, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                className="group relative bg-white p-12 rounded-[2.5rem] border-2 border-slate-100 hover:border-emerald-500 transition-all shadow-xl shadow-emerald-900/5"
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-12">
                                    <div className="flex flex-col items-center justify-center p-6 bg-emerald-500 rounded-3xl min-w-[120px] text-white shadow-xl shadow-emerald-500/20">
                                        <span className="text-4xl font-black tracking-tighter my-2">{news.date.split(' ')[0]}</span>
                                        <span className="text-[11px] font-black text-emerald-100 uppercase">{news.date.split(' ')[1]} {news.date.split(' ')[2]}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-3xl font-black text-slate-950 mb-5 group-hover:text-emerald-500 transition-colors leading-tight italic">
                                            {news.title}
                                        </h4>
                                        <p className="text-slate-500 text-lg leading-relaxed font-bold mb-8 italic">
                                            {news.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div id="downloads" className="lg:col-span-5 space-y-12">
                        <h5 className="text-[14px] font-black text-slate-950 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                            <DownloadIcon className="w-6 h-6 text-amber-500" />
                            REPOSITORI_FILE
                        </h5>
                        <div className="grid grid-cols-1 gap-6">
                            {downloads.map((d) => (
                                <a 
                                    key={d.id}
                                    href={d.external_url || d.file_path || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between p-10 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] hover:bg-emerald-600 hover:border-emerald-700 transition-all shadow-lg"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="p-4 bg-white rounded-2xl text-emerald-500 group-hover:text-emerald-600 shadow-xl group-hover:shadow-none transition-all">
                                            <DownloadIcon className="w-8 h-8" />
                                        </div>
                                        <span className="text-xl font-black text-slate-950 group-hover:text-white transition-colors uppercase tracking-tight italic">{d.title}</span>
                                    </div>
                                    <ArrowRight className="w-8 h-8 text-slate-300 group-hover:text-white transition-all transform group-hover:translate-x-2" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-24 lg:py-48 bg-slate-950 relative overflow-hidden">
                <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-500 p-16 lg:p-32 rounded-[4rem] text-white flex flex-col items-center gap-12"
                    >
                         <h3 className="text-5xl lg:text-8xl font-black tracking-tighter leading-[0.8] uppercase flex flex-col items-center">
                            READY FOR <br /> <span className="text-amber-400 italic mt-4 underline decoration-8">IMPACT.</span>
                        </h3>
                        <div className="flex flex-col sm:flex-row items-center gap-10">
                            <Link 
                                href={route('login')}
                                className="w-full sm:w-auto bg-slate-950 text-white px-16 py-8 rounded-3xl font-black text-xl tracking-[0.2em] shadow-2xl hover:bg-white hover:text-emerald-600 transition-all"
                            >
                                DAFTAR SEKARANG
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-24 bg-white border-t-8 border-emerald-500">
                <div className="container mx-auto px-6 lg:px-12 text-center space-y-12">
                    <h1 className="text-4xl font-black text-slate-950 uppercase tracking-tighter">
                        UIN <span className="text-emerald-500">Prof. K.H. Saifuddin Zuhri</span>
                    </h1>
                    <p className="text-slate-400 font-bold max-w-2xl mx-auto italic">
                        Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM). <br /> Purwokerto, Jawa Tengah, Indonesia.
                    </p>
                    <div className="pt-12 flex justify-center gap-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.8em]">
                        <span>&copy; 2026 ARCHITECTURE_OF_IMPACT</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
