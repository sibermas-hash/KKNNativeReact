import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { route } from 'ziggy-js';
import {
    ArrowRight,
    Award,
    BookOpen,
    Download,
    MapPin,
    Newspaper,
    Users,
    ChevronRight,
    ArrowUpRight,
    Sparkles,
    ShieldCheck,
    Calendar,
    MousePointer2,
    Zap,
    Activity,
    Lock,
    Binary,
    Cpu,
    Globe
} from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';

type AnnouncementItem = {
    id: number;
    title: string;
    category?: string | null;
    published_at?: string | null;
    is_demo?: boolean;
};

type DownloadItem = {
    id: number;
    title: string;
    file_type?: string | null;
    external_url?: string | null;
    file_path?: string | null;
    is_demo?: boolean;
};

type Stats = {
    students?: number;
    groups?: number;
    locations?: number;
    academic_years?: number;
};

interface Props {
    featuredAnnouncements?: AnnouncementItem[];
    featuredDownloads?: DownloadItem[];
    stats?: Stats;
}

const valueCards = [
    {
        title: 'Pembelajaran Terstruktur',
        description: 'Kurikulum KKN dibangun agar mahasiswa siap bekerja nyata di lapangan dengan bimbingan berkualitas.',
        icon: BookOpen,
        color: 'emerald',
    },
    {
        title: 'Kolaborasi Masyarakat',
        description: 'Program dirancang untuk mempertemukan mahasiswa dengan kebutuhan riil warga secara simbiotik.',
        icon: Users,
        color: 'blue',
    },
    {
        title: 'Penempatan Terarah',
        description: 'Lokasi KKN dikelola melalui sistem zonasi terpusat untuk distribusi yang proporsional.',
        icon: MapPin,
        color: 'rose',
    },
    {
        title: 'Sertifikasi Resmi',
        description: 'Luaran kegiatan dan evaluasi tervalidasi secara formal melalui dashboard akademik terpadu.',
        icon: Award,
        color: 'amber',
    },
];

const schemeCards = [
    {
        title: 'KKN Reguler',
        tag: 'Skema utama',
        description: 'Skema utama penempatan mahasiswa pada desa mitra dengan program kerja kolektif yang terukur.',
        icon: Globe
    },
    {
        title: 'KKN Tematik',
        tag: 'Berbasis isu',
        description: 'Intervensi strategis berbasis isu prioritas seperti kesehatan, ekonomi kreatif, dan lingkungan.',
        icon: Lock
    },
    {
        title: 'KKN Nusantara',
        tag: 'Lintas wilayah',
        description: 'Program khusus lintas wilayah yang mengikuti seleksi dan tata kelola nasional/mitra kompetensi.',
        icon: MapPin
    },
    {
        title: 'KKN Kolaborasi PTKIN',
        tag: 'Kemitraan PTKIN',
        description: 'Program kolaborasi antar-PTKIN dengan penempatan dan tata kelola yang mengikuti host program.',
        icon: Users
    },
    {
        title: 'KKN Internasional',
        tag: 'Kemitraan global',
        description: 'Program luar negeri berbasis mitra yang dikelola melalui seleksi khusus dan penempatan host.',
        icon: Zap
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

function formatDate(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export default function Home({
    featuredAnnouncements = [],
    featuredDownloads = [],
    stats = {},
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const portalHref = auth.user ? route('dashboard') : route('login');

    return (
        <PublicLayout>
            <Head title="Pusat Portal KKN | UIN Prof. K.H. Saifuddin Zuhri" />

            <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-white">
                {/* --- TACTICAL HERO: DARK INDUSTRIAL --- */}
                <section className="relative pt-40 pb-48 lg:pt-64 lg:pb-80 bg-slate-950 text-white overflow-hidden">
                    {/* Background Intelligence */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square border-[1px] border-emerald-500/20 rounded-full animate-[spin_60s_linear_infinite]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square border-[1px] border-emerald-500/10 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-950 to-transparent z-10" />
                    <div className="absolute -top-40 -right-40 h-[600px] w-[600px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />

                    <div className="mx-auto max-w-7xl px-8 lg:px-12 relative z-20">
                        <div className="flex flex-col items-center text-center space-y-16">
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-6"
                            >
                                <div className="h-px w-12 bg-emerald-500 hidden sm:block" />
                                <span className="px-8 py-3 bg-emerald-600/10 text-[10px] font-black text-emerald-400 rounded-2xl border border-emerald-500/20 uppercase tracking-[0.4em] inline-block shadow-2xl">
                                    Operational Command Center
                                </span>
                                <div className="h-px w-12 bg-emerald-500 hidden sm:block" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="space-y-4"
                            >
                                <h1 className="text-[14vw] sm:text-7xl lg:text-9xl font-black tracking-[-0.05em] leading-[0.8] uppercase">
                                    Aksi <span className="text-emerald-500">Nyata.</span> <br />
                                    Terukur <span className="text-slate-700">/</span> <br className="lg:hidden" />
                                    Digital.
                                </h1>
                                <p className="mx-auto max-w-2xl text-lg lg:text-2xl font-bold text-slate-400 leading-relaxed uppercase tracking-tight opacity-70">
                                    Simpul pusat tata kelola pengabdian masyarakat Universitas Islam Negeri <br className="hidden lg:block" /> 
                                    Prof. K.H. Saifuddin Zuhri. Berbasis data, berdampak nyata.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto"
                            >
                                 <Link
                                     href={portalHref}
                                     className="group h-24 px-12 bg-emerald-600 text-slate-950 rounded-[2.5rem] text-sm font-black flex items-center justify-center gap-6 hover:bg-emerald-400 hover:-translate-y-2 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 uppercase tracking-[0.3em]"
                                 >
                                     <Zap size={20} strokeWidth={3} />
                                     <span>{auth.user ? 'Enter Console' : 'Initialize Portal'}</span>
                                     <ArrowRight className="h-5 w-5 group-hover:translate-x-3 transition-transform" />
                                 </Link>
                                 <Link
                                     href={route('public.schemes')}
                                    className="h-24 px-12 bg-white/5 border-2 border-white/10 text-white rounded-[2.5rem] text-sm font-black flex items-center justify-center gap-4 hover:bg-white/10 transition-all active:scale-95 uppercase tracking-[0.3em]"
                                >
                                    Eksplorasi Skema
                                </Link>
                            </motion.div>
                        </div>

                        {/* --- TACTICAL BENTO STATS --- */}
                        <div className="mt-48 grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { label: 'Mahasiswa Aktif', value: stats.students || '12K+', icon: Users, color: 'emerald' },
                                { label: 'Unit Operasional', value: stats.groups || '850+', icon: Activity, color: 'emerald' },
                                { label: 'Zonasi Lokal', value: stats.locations || '45+', icon: MapPin, color: 'emerald' },
                                { label: 'Tahun Deployment', value: stats.academic_years || '2026', icon: Calendar, color: 'emerald' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-12 bg-slate-900 border border-white/5 rounded-[3.5rem] shadow-2xl group hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                                        <stat.icon size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-5xl font-black text-white tracking-tighter leading-none group-hover:text-emerald-400 transition-colors uppercase">{stat.value}</h4>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-emerald-500 transition-colors">{stat.label}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- STRATEGIC PILLARS --- */}
                <section className="py-48 bg-white overflow-hidden">
                    <div className="mx-auto max-w-7xl px-8 lg:px-12 relative">
                        <div className="absolute top-0 right-0 p-32 opacity-[0.02] text-slate-900 pointer-events-none">
                            <Cpu size={500} />
                        </div>
                        <div className="grid lg:grid-cols-2 gap-32 lg:items-center">
                            <div className="space-y-16">
                                <div className="space-y-8">
                                    <div className="h-1.5 w-24 bg-emerald-600 rounded-full" />
                                    <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase">
                                        Pilar Utama <br /> <span className="text-emerald-600">Governance KKN.</span>
                                    </h2>
                                    <p className="text-xl font-bold text-slate-400 leading-relaxed uppercase tracking-tight opacity-80">
                                        Membangun jembatan teoretis ke ranah praktis melalui pengawasan digital yang presisi, transparan, dan otoritatif.
                                    </p>
                                </div>
                                
                                <div className="grid gap-10">
                                    {valueCards.map((item) => (
                                        <div key={item.title} className="flex gap-10 group">
                                            <div className="h-20 w-20 rounded-[1.8rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-emerald-500 transition-all shadow-sm shrink-0">
                                                <item.icon size={28} strokeWidth={2.5} />
                                            </div>
                                            <div className="space-y-3 pt-2">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{item.title}</h3>
                                                <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-md uppercase tracking-wide opacity-70">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="aspect-[4/5] rounded-[4rem] bg-slate-950 overflow-hidden relative shadow-2xl border-8 border-slate-900">
                                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 to-transparent z-10" />
                                    <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10 group-hover:scale-110 transition-transform duration-[5s]">
                                         <ShieldCheck size={500} className="text-emerald-500" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-16 z-20 space-y-8">
                                        <div className="px-8 py-3 bg-emerald-600 text-[10px] font-black text-slate-950 rounded-2xl inline-block shadow-2xl uppercase tracking-[0.3em]">INTEGRITY_PROTOCOL_READY</div>
                                        <p className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none uppercase">Amanah <br /> Untuk <span className="text-emerald-500">Bangsa.</span></p>
                                    </div>
                                </div>
                                <div className="absolute -top-12 -right-12 h-44 w-44 bg-emerald-600 rounded-full flex flex-col items-center justify-center text-slate-950 p-8 animate-spin-slow shadow-2xl hover:scale-110 transition-transform cursor-pointer border-8 border-white">
                                    <MousePointer2 size={32} className="mb-2" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center leading-tight">Interaction Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- SCHEMA MATRIX --- */}
                <section className="py-48 bg-slate-50 overflow-hidden relative">
                    <div className="mx-auto max-w-7xl px-8 lg:px-12 relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16 mb-32">
                            <div className="space-y-8">
                                <div className="h-1.5 w-24 bg-emerald-600 rounded-full" />
                                <h2 className="text-5xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.8] uppercase">
                                    Inovasi <br /> <span className="text-emerald-600">Schema Matrix.</span>
                                </h2>
                            </div>
                            <p className="max-w-md text-lg font-bold text-slate-400 leading-relaxed uppercase tracking-tight">Kanal pengabdian masyarakat yang terspesialisasi sesuai disiplin ilmu dan kompetensi strategis institusi.</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {schemeCards.map((scheme) => (
                                <div key={scheme.title} className="group/scheme h-[480px] p-12 bg-white border border-slate-100 rounded-[3.5rem] hover:bg-slate-900 transition-all duration-700 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-4">
                                    <div className="space-y-8">
                                        <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover/scheme:bg-emerald-600 group-hover/scheme:text-slate-950 transition-all">
                                            <scheme.icon size={28} strokeWidth={2.5} />
                                        </div>
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-black text-emerald-600 group-hover/scheme:text-emerald-400 uppercase tracking-widest">{scheme.tag}</span>
                                            <h3 className="text-3xl font-black text-slate-900 group-hover/scheme:text-white tracking-tighter leading-none uppercase">{scheme.title}</h3>
                                            <p className="text-xs font-bold text-slate-400 group-hover/scheme:text-slate-500 leading-relaxed uppercase tracking-tight">{scheme.description}</p>
                                        </div>
                                    </div>
                                    <Link href={route('public.schemes')} className="h-14 w-14 rounded-2xl border-2 border-slate-50 group-hover/scheme:border-emerald-600/50 flex items-center justify-center text-slate-300 group-hover/scheme:text-emerald-500 transition-all">
                                        <ArrowUpRight size={24} strokeWidth={3} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- FEED & INTELLIGENCE --- */}
                <section className="py-48 bg-white">
                    <div className="mx-auto max-w-7xl px-8 lg:px-12 grid lg:grid-cols-2 gap-32">
                        {/* Warta Feed */}
                        <div className="space-y-16">
                            <div className="flex items-end justify-between border-b border-slate-50 pb-12">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Warta <span className="text-emerald-600">Utama.</span></h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Live Dispatch Feed</p>
                                </div>
                                <Link href={route('public.announcements')} className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:text-emerald-900 transition-colors">View All Archive</Link>
                            </div>

                            <div className="space-y-8">
                                {featuredAnnouncements.length > 0 ? featuredAnnouncements.slice(0, 3).map((item) => (
                                    <article key={item.id} className="group cursor-pointer">
                                        <div className="p-10 rounded-[3rem] border border-slate-50 hover:border-emerald-500/30 hover:bg-slate-50/50 transition-all space-y-6 relative overflow-hidden">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600 transition-colors">
                                                <span>{item.category || 'ACADEMIC DISPATCH'}</span>
                                                <span className="mono">{formatDate(item.published_at)}</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:translate-x-4 transition-transform uppercase">{item.title}</h3>
                                            <div className="absolute right-10 bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Newspaper size={80} />
                                            </div>
                                        </div>
                                    </article>
                                )) : (
                                    <div className="py-24 text-center opacity-10 space-y-4">
                                        <Newspaper size={80} className="mx-auto" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Feed Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Repository Feed */}
                        <div className="space-y-16">
                            <div className="flex items-end justify-between border-b border-slate-50 pb-12">
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Pusat <span className="text-emerald-600">Repositori.</span></h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Global Assets</p>
                                </div>
                                <Link href={route('public.downloads')} className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:text-emerald-900 transition-colors">View All Assets</Link>
                            </div>

                            <div className="space-y-8">
                                {featuredDownloads.length > 0 ? featuredDownloads.slice(0, 3).map((item) => (
                                    <article key={item.id} className="group cursor-pointer">
                                        <div className="p-10 rounded-[3rem] bg-slate-900 text-white hover:bg-emerald-600 transition-all flex items-center justify-between shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 h-full w-24 bg-white/5 skew-x-12 translate-x-12" />
                                            <div className="space-y-3 relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <span className="px-4 py-1.5 bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest">{item.file_type || 'DATA'}</span>
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Ingestion Ready</span>
                                                </div>
                                                <h3 className="text-2xl font-black tracking-tight uppercase leading-none group-hover:text-slate-950 transition-colors">{item.title}</h3>
                                            </div>
                                            <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-slate-950 group-hover:bg-white transition-all transition-all shadow-sm shrink-0">
                                                <Download size={28} strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    </article>
                                )) : (
                                    <div className="py-24 text-center opacity-10 space-y-4">
                                        <Download size={80} className="mx-auto" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Assets</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- DEPLOYMENT CTA --- */}
                <section className="bg-white py-48">
                    <div className="mx-auto max-w-7xl px-8 lg:px-12">
                        <div className="bg-slate-950 rounded-[5rem] p-24 lg:p-40 relative overflow-hidden group shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] bg-emerald-600/5 blur-[120px] rounded-full" />
                            
                            <div className="relative z-10 flex flex-col items-center text-center space-y-16">
                                <div className="h-1.5 w-24 bg-emerald-600 rounded-full" />
                                <h2 className="text-6xl lg:text-[10rem] font-black text-white tracking-tighter leading-[0.8] uppercase">Mulai <br /> <span className="text-emerald-500">Langkah.</span></h2>
                                <p className="max-w-xl text-xl font-bold text-slate-400 leading-relaxed uppercase tracking-tight opacity-80">Bergabunglah dalam ekosistem digital pengabdian masyarakat Universitas Islam Negeri Prof. K.H. Saifuddin Zuhri.</p>
                                <div className="flex flex-col sm:flex-row gap-8 w-full lg:w-auto">
                                    <Link
                                        href={auth.user ? route('dashboard') : route('login')}
                                        className="h-28 px-16 bg-emerald-600 text-slate-950 rounded-[3rem] text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-6 hover:bg-white hover:-translate-y-2 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 group/cta"
                                    >
                                        <Zap size={20} className="group-hover:scale-125 transition-transform" />
                                        {auth.user ? 'Enter Console' : 'Portal Login'}
                                    </Link>
                                    <Link
                                        href={route('public.about')}
                                        className="h-28 px-16 border-2 border-white/10 text-white rounded-[3rem] text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all active:scale-95"
                                    >
                                        Profil LPPM
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
