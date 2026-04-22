import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type MouseEvent } from 'react';
import type { PageProps } from '@/types';
import {
    ArrowRight,
    BookOpen,
    Building2,
    Calendar,
    FolderDown,
    GraduationCap,
    Layers,
    MapPin,
    Megaphone,
    Shield,
    Sparkles,
    UserCog,
    Users,
    PlayCircle,
    Star,
    Zap,
    TrendingUp,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Activity,
} from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';

const safeRoute = (name: string, params?: any) => {
    try {
        return (window as any).route ? (window as any).route(name, params) : '#';
    } catch {
        return '#';
    }
};

type AnnouncementItem = {
    id: number;
    title: string;
    category?: string | null;
    published_at?: string | null;
};

type Stats = {
    students?: number;
    groups?: number;
    locations?: number;
    academic_years?: number;
};

interface Props {
    featuredAnnouncements?: AnnouncementItem[];
    stats?: Stats;
}

// --- Modern Animations ---

const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export default function Home({
    featuredAnnouncements = [],
    stats = {},
}: Props) {
    const page = usePage<PageProps & { activePeriod?: any }>().props;
    const { auth, activePeriod } = page;
    const { scrollYProgress } = useScroll();
    
    const heroBgY = useTransform(scrollYProgress, [0, 0.5], [0, 150]);
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

    const latestNews = featuredAnnouncements.slice(0, 3);

    const getDashboardRoute = () => {
        if (!auth.user) return safeRoute('login');
        const roles = (auth.user.roles as any[])?.map((role) => (typeof role === 'string' ? role : role.name)) || [];
        if (roles.includes('admin')) return safeRoute('admin.dashboard');
        if (roles.includes('dosen')) return safeRoute('dosen.dashboard');
        return safeRoute('student.dashboard');
    };

    return (
        <PublicLayout>
            <Head title="Siberdaya | Portal KKN Modern UIN SAIZU" />

            {/* --- HERO SECTION: Premium & Functional --- */}
            <section className="relative min-h-[95vh] overflow-hidden bg-[#F8F9FB] pt-24 lg:pt-32">
                {/* Background Decor */}
                <div className="absolute inset-0 z-0">
                    <motion.div style={{ y: heroBgY }} className="absolute -top-40 -left-20 w-[700px] h-[700px] bg-emerald-100/40 blur-[150px] rounded-full" />
                    <motion.div style={{ y: -heroBgY }} className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-purple-100/40 blur-[140px] rounded-full" />
                </div>
                
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2 items-center">
                        {/* Text Content */}
                        <motion.div 
                            initial={{ opacity: 0, x: -60 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col space-y-10"
                        >
                            <div className="flex flex-wrap gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black text-emerald-700 shadow-sm border border-emerald-50">
                                    <Zap size={14} className="fill-emerald-600" />
                                    <span className="uppercase tracking-[0.2em]">SIBERDAYA V2.0</span>
                                </div>
                                {activePeriod && (
                                    <div className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-200">
                                        <Clock size={14} />
                                        <span className="uppercase tracking-[0.1em]">{activePeriod.name} Aktif</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-6xl font-black leading-[1.05] text-[#1D1D24] sm:text-7xl lg:text-8xl tracking-tight">
                                Transform <span className="text-emerald-600">Ideas</span> into Social <span className="text-purple-600">Impact.</span>
                            </h1>

                            <p className="max-w-xl text-xl leading-relaxed text-slate-600 font-medium">
                                Melangkah bersama masyarakat, membangun desa dengan kecerdasan digital dan kolaborasi nyata melalui sistem pengabdian UIN SAIZU yang terintegrasi.
                            </p>

                            <div className="flex flex-wrap gap-5">
                                <Link
                                    href={getDashboardRoute()}
                                    className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-emerald-950 px-10 py-6 text-lg font-black text-white no-underline shadow-2xl transition-all hover:scale-105 active:scale-95"
                                >
                                    Pendaftaran KKN
                                    <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                                <button className="inline-flex items-center gap-4 rounded-2xl bg-white px-10 py-6 text-lg font-bold text-[#1D1D24] no-underline shadow-sm border border-slate-100 transition-all hover:bg-slate-50">
                                    <PlayCircle size={24} className="text-emerald-600" />
                                    Alur Program
                                </button>
                            </div>

                            {/* Trust Badge / Stats Hero */}
                            <div className="flex items-center gap-8 pt-4">
                                <div className="flex -space-x-4">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-slate-200" />
                                    ))}
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-xs font-bold text-white">+2K</div>
                                </div>
                                <div className="h-10 w-px bg-slate-200" />
                                <div>
                                    <p className="text-2xl font-black text-emerald-950 tabular-nums tracking-tighter"><AnimatedCounter value={stats.locations || 150} />+</p>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Desa Terjangkau</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Visual Side (UIN Suka Inspired Info Panel) */}
                        <div className="relative">
                            <motion.div 
                                style={{ scale: heroScale }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className="relative z-10 p-4"
                            >
                                <div className="rounded-[3rem] bg-white p-8 shadow-2xl shadow-emerald-200/20 border border-emerald-50">
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                                            <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Status Periode</h3>
                                            <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 animate-pulse">Running</span>
                                        </div>
                                        
                                        <div className="grid gap-6">
                                            <StatusRow icon={CheckCircle2} label="Pendaftaran" value="DIBUKA" color="text-emerald-600" />
                                            <StatusRow icon={Activity} label="Tahapan" value={activePeriod?.current_phase || 'Pelaksanaan'} color="text-purple-600" />
                                            <StatusRow icon={MapPin} label="Sebaran" value="34 Provinsi" color="text-blue-600" />
                                        </div>

                                        <div className="rounded-3xl bg-emerald-950 p-6 text-white shadow-xl">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Aktivitas Terbaru</p>
                                                <Activity size={16} className="text-emerald-400" />
                                            </div>
                                            <div className="space-y-3">
                                                <ActivityItem text="Kelompok 42 mengirim Logbook Desa A" time="2 menit lalu" />
                                                <ActivityItem text="Pendaftaran Skema Reguler bertambah" time="15 menit lalu" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            {/* Decorative Orbs */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-400/20 blur-3xl rounded-full" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ALUR KKN: Visual Timeline Stepper --- */}
            <section className="bg-white py-32 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center mb-20 space-y-4">
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-emerald-600">The Journey</span>
                        <h2 className="text-4xl font-black text-emerald-950 sm:text-6xl tracking-tight">Alur Pelaksanaan KKN</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 hidden md:block z-0" />
                        
                        <TimelineStep number="01" title="Pendaftaran" desc="Registrasi online dan pemilihan skema pengabdian." icon={GraduationCap} />
                        <TimelineStep number="02" title="Pembekalan" desc="Persiapan materi dan koordinasi bersama DPL." icon={BookOpen} />
                        <TimelineStep number="03" title="Pelaksanaan" desc="Penerjunan ke lokasi dan aksi nyata di masyarakat." icon={MapPin} />
                        <TimelineStep number="04" title="Pelaporan" desc="Penyusunan laporan akhir dan penilaian program." icon={CheckCircle2} />
                    </div>
                </div>
            </section>

            {/* --- TRIPLE-COLUMN BENTO: Newsroom & Links --- */}
            <section className="bg-[#F8F9FB] py-36">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-10 lg:grid-cols-3">
                        {/* Column 1: Warta Utama */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <Megaphone className="text-emerald-600" size={24} />
                                <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">Warta Kemitraan</h3>
                            </div>
                            <div className="space-y-4">
                                {latestNews.map((news) => (
                                    <NewsCard key={news.id} title={news.title} category={news.category} date={news.published_at} />
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Skema & Program */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <Layers className="text-purple-600" size={24} />
                                <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">Skema KKN</h3>
                            </div>
                            <div className="grid gap-4">
                                <CategoryCard title="Reguler" icon={CheckCircle2} color="bg-emerald-50 text-emerald-700" />
                                <CategoryCard title="Tematik" icon={Sparkles} color="bg-purple-50 text-purple-700" />
                                <CategoryCard title="Masa Bakti" icon={Shield} color="bg-blue-50 text-blue-700" />
                                <CategoryCard title="Internasional" icon={Zap} color="bg-orange-50 text-orange-700" />
                            </div>
                        </div>

                        {/* Column 3: Unduhan & Panduan */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <FolderDown className="text-blue-600" size={24} />
                                <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">Unduhan Cepat</h3>
                            </div>
                            <div className="space-y-4">
                                <DownloadLink title="Panduan KKN 2026" type="PDF" />
                                <DownloadLink title="Template Laporan" type="DOCX" />
                                <DownloadLink title="Format Logbook" type="XLSX" />
                                <Link href={safeRoute('public.downloads')} className="block text-center p-4 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-black text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all">
                                    Lihat Semua Dokumen
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- STATS FOOTER: Realtime Dashboard --- */}
            <section className="bg-emerald-950 py-24 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10"><TrendingUp size={300} strokeWidth={1} /></div>
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-4">
                        <StatBlock label="Mahasiswa Terdaftar" value={stats.students || 2450} suffix="+" />
                        <StatBlock label="Kelompok Aktif" value={stats.groups || 312} suffix="" />
                        <StatBlock label="Desa Mitra" value={stats.locations || 156} suffix="" />
                        <StatBlock label="Siklus Akademik" value={stats.academic_years || 56} suffix="" />
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

// --- Sub-Components ---

function StatusRow({ icon: Icon, label, value, color }: { icon: ElementType, label: string, value: string, color: string }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform ${color}`}><Icon size={18} /></div>
                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <span className={`text-sm font-black uppercase tracking-tight ${color}`}>{value}</span>
        </div>
    );
}

function ActivityItem({ text, time }: { text: string, time: string }) {
    return (
        <div className="flex flex-col border-l-2 border-emerald-500/20 pl-4 py-1">
            <p className="text-xs font-bold text-white/90">{text}</p>
            <p className="text-[10px] font-medium text-white/40">{time}</p>
        </div>
    );
}

function TimelineStep({ number, title, desc, icon: Icon }: { number: string, title: string, desc: string, icon: ElementType }) {
    return (
        <motion.div {...fadeInUp} className="relative z-10 group">
            <div className="mb-6 flex flex-col items-center md:items-start">
                <div className="h-16 w-16 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-emerald-200/20">
                    <Icon size={28} />
                </div>
                <div className="space-y-2 text-center md:text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">{number}</span>
                    <h3 className="text-xl font-black text-emerald-950">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
            </div>
        </motion.div>
    );
}

function NewsCard({ title, category, date }: { title: string, category?: string | null, date?: string | null }) {
    return (
        <div className="group p-6 rounded-3xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-200/10 transition-all duration-500">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 block">{category || 'Pengumuman'}</span>
            <h4 className="text-base font-black text-emerald-950 leading-tight mb-4 group-hover:text-emerald-700">{title}</h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date || '22 April 2026'}</span>
        </div>
    );
}

function CategoryCard({ title, icon: Icon, color }: { title: string, icon: ElementType, color: string }) {
    return (
        <div className={`flex items-center justify-between p-5 rounded-[2rem] ${color} group cursor-pointer hover:scale-105 transition-all duration-500`}>
            <div className="flex items-center gap-4">
                <Icon size={20} />
                <span className="text-base font-black uppercase tracking-tight">{title}</span>
            </div>
            <ArrowUpRight size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

function DownloadLink({ title, type }: { title: string, type: string }) {
    return (
        <div className="flex items-center justify-between p-5 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group cursor-pointer">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{type}</span>
                <span className="text-sm font-black text-emerald-950">{title}</span>
            </div>
            <FolderDown size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
        </div>
    );
}

function StatBlock({ label, value, suffix }: { label: string, value: number, suffix: string }) {
    return (
        <div className="flex flex-col items-center lg:items-start">
            <h4 className="text-5xl font-black mb-2 tabular-nums tracking-tighter"><AnimatedCounter value={value} />{suffix}</h4>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40">{label}</p>
        </div>
    );
}

function AnimatedCounter({ value }: { value: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    useEffect(() => {
        if (isInView) {
            let start = 0;
            const end = value;
            const timer = setInterval(() => {
                start += Math.ceil(end / 50);
                if (start >= end) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(start);
                }
            }, 30);
            return () => clearInterval(timer);
        }
    }, [isInView, value]);
    return <span ref={ref}>{count.toLocaleString('id-ID')}</span>;
}
