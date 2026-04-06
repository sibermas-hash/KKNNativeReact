import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Award,
    BookOpen,
    Download,
    Globe2,
    Heart,
    MapPin,
    Newspaper,
    Users,
    ChevronRight,
    ArrowUpRight,
    Sparkles,
    ShieldCheck,
    Calendar,
    MousePointer2,
} from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { clsx } from 'clsx';

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
        tag: 'MAIN_TRACK',
        description: 'Skema utama penempatan mahasiswa pada desa mitra dengan program kerja kolektif yang terukur.',
    },
    {
        title: 'KKN Tematik',
        tag: 'ISSUE_BASED',
        description: 'Intervensi strategis berbasis isu prioritas seperti kesehatan, ekonomi kreatif, dan lingkungan hidup.',
    },
    {
        title: 'Kolaborasi Nusantara',
        tag: 'CROSS_BORDER',
        description: 'Pengabdian lintas wilayah untuk pertukaran nilai budaya dan akselerasi pembangunan nasional.',
    },
    {
        title: 'KKN Maslahat',
        tag: 'SPECIALIZED',
        description: 'Skema pengabdian spesifik dengan orientasi kemaslahatan umat sesuai mandat institusi.',
    },
];

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
    return (
        <PublicLayout>
            <Head title="Pusat Portal KKN | UIN Prof. K.H. Saifuddin Zuhri" />

            <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-500/10 selection:text-emerald-700">
                {/* --- ELITE HERO SECTION --- */}
                <section className="relative pt-32 pb-40 lg:pt-48 lg:pb-60 bg-[#FBFBFA] border-b border-slate-50">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                        <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] rounded-full border-[60px] border-emerald-950 animate-pulse duration-[10s]" />
                        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full border-[40px] border-emerald-950/50" />
                    </div>

                    <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
                        <div className="flex flex-col lg:items-center text-left lg:text-center space-y-12">
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center lg:justify-center gap-4"
                            >
                                <span className="h-px w-10 bg-emerald-500/30 hidden sm:block" />
                                <span className="px-6 py-2 bg-emerald-50 text-[10px] font-black text-emerald-700 rounded-full border border-emerald-100 uppercase tracking-[0.5em] inline-block shadow-sm">
                                    THE_ACADEMIC_PORTAL_v4.0
                                </span>
                                <span className="h-px w-10 bg-emerald-500/30 hidden sm:block" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="space-y-10"
                            >
                                <h1 className="text-[12vw] sm:text-7xl lg:text-9xl font-black text-slate-950 tracking-[-0.04em] leading-[0.85] uppercase italic font-sans italic selection:bg-emerald-500">
                                    <span className="font-serif italic font-normal text-emerald-600 capitalize lowercase block lg:inline">Aksi_</span> <br className="lg:hidden" />
                                    Nyata <span className="text-slate-200">/</span> <br className="lg:hidden" />
                                    Terukur.
                                </h1>
                                <p className="mx-auto max-w-3xl text-lg lg:text-2xl font-bold text-slate-400 italic leading-relaxed">
                                    Simpul utama manajemen pengabdian masyarakat Universitas Islam Negeri <br className="hidden lg:block" /> 
                                    Prof. K.H. Saifuddin Zuhri dalam satu ekosistem digital yang otoritatif.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row gap-6 lg:justify-center w-full"
                            >
                                <Link
                                     href="/login"
                                     className="group h-20 px-10 bg-emerald-600 text-white rounded-[2rem] text-sm font-black flex items-center justify-center gap-5 hover:bg-emerald-700 hover:-translate-y-1 transition-all shadow-2xl active:scale-95 uppercase italic tracking-[0.2em]"
                                 >
                                     <span>LOGIN_PORTAL</span>
                                     <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                 </Link>
                                <Link
                                    href="/skema-kkn"
                                    className="h-20 px-10 bg-white border border-slate-100 text-slate-900 rounded-[2rem] text-sm font-black flex items-center justify-center gap-4 hover:bg-slate-50 transition-all shadow-sm active:scale-95 uppercase italic tracking-[0.2em]"
                                >
                                    Eksplorasi Skema
                                </Link>
                            </motion.div>
                        </div>

                        {/* --- BENTO PERFORMANCE STATS --- */}
                        <div className="mt-40 grid grid-cols-2 lg:grid-cols-4 gap-10">
                            {[
                                { label: 'Personnel_Active', value: stats.students || '12K+', icon: Users, color: 'emerald' },
                                { label: 'Operational_Group', value: stats.groups || '850+', icon: Sparkles, color: 'blue' },
                                { label: 'Sector_Location', value: stats.locations || '45+', icon: MapPin, color: 'rose' },
                                { label: 'Governance_Year', value: stats.academic_years || '2026', icon: Calendar, color: 'amber' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.05)] group hover:shadow-2xl transition-all"
                                >
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 italic leading-none">{stat.label}</p>
                                    <div className="space-y-2">
                                        <h4 className="text-5xl font-black text-slate-950 italic tracking-tighter leading-none group-hover:text-emerald-600 transition-colors">{stat.value}</h4>
                                        <div className="h-1 w-8 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- VALUE PROPOSITION --- */}
                <section className="py-40 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-12">
                        <div className="grid lg:grid-cols-2 gap-20 lg:items-center">
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                                        Pilar Utama <span className="font-serif italic font-normal text-emerald-600 capitalize">Pengabdian.</span>
                                    </h2>
                                    <p className="text-xl font-bold text-slate-400 italic leading-relaxed">
                                        Membangun jembatan teoretis ke ranah praktis melalui pengawasan digital yang presisi dan transparan.
                                    </p>
                                </div>
                                
                                <div className="grid gap-6">
                                    {valueCards.map((item) => (
                                        <div key={item.title} className="flex gap-8 group">
                                            <div className="h-16 w-16 rounded-[1.2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm shrink-0">
                                                <item.icon size={24} />
                                            </div>
                                            <div className="space-y-2 pt-2">
                                                <h3 className="text-xl font-black text-slate-900 italic tracking-tight">{item.title}</h3>
                                                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-md">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="aspect-[4/5] rounded-[3.5rem] bg-slate-100 overflow-hidden relative shadow-2xl border border-slate-200">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                                    <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10 group-hover:scale-110 transition-transform duration-[4s]">
                                         <ShieldCheck size={400} className="text-slate-950" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-16 z-20 space-y-4">
                                        <div className="px-5 py-2 bg-emerald-600 text-[10px] font-black text-white rounded-full inline-block shadow-lg uppercase tracking-widest italic">Integritas Terjamin</div>
                                        <p className="text-3xl font-black text-white italic tracking-tighter leading-tight uppercase font-serif">Amanah <br /> Untuk Bangsa.</p>
                                    </div>
                                </div>
                                <div className="absolute -top-10 -right-10 h-40 w-40 bg-emerald-600 rounded-full flex flex-col items-center justify-center text-white p-8 animate-spin-slow shadow-2xl hover:scale-110 transition-transform cursor-crosshair">
                                    <MousePointer2 size={32} className="mb-2" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">Interaction_State Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- SKEMA SECTION --- */}
                <section className="py-40 bg-slate-50 overflow-hidden group">
                    <div className="mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24">
                            <div className="space-y-6">
                                <span className="px-5 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-[9px] font-black text-emerald-700 tracking-[0.4em] uppercase italic inline-block">SKEMA_MODULAR_KKN</span>
                                <h2 className="text-5xl lg:text-8xl font-black text-slate-950 italic tracking-tighter leading-[0.85] uppercase font-serif">Inovasi <br /> Tanpa Batas.</h2>
                            </div>
                            <p className="max-w-md text-lg font-bold text-slate-500 italic leading-relaxed">Penyediaan kanal pengabdian masyarakat yang terspesialisasi sesuai disiplin ilmu dan kompetensi strategis.</p>
                        </div>

                        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
                            {schemeCards.map((scheme, i) => (
                                <div key={scheme.title} className="group/scheme h-[400px] p-12 bg-white border border-slate-100 rounded-[3rem] hover:bg-emerald-600 transition-all duration-500 flex flex-col justify-between hover:shadow-2xl hover:shadow-emerald-900/20">
                                    <div className="space-y-6">
                                        <span className="text-[9px] font-black text-emerald-600 group-hover/scheme:text-white uppercase tracking-widest italic leading-none">{scheme.tag}</span>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl font-black text-slate-950 group-hover/scheme:text-white italic tracking-tighter leading-none uppercase">{scheme.title}</h3>
                                            <p className="text-sm font-medium text-slate-500 group-hover/scheme:text-emerald-50 leading-relaxed font-sans">{scheme.description}</p>
                                        </div>
                                    </div>
                                    <Link href="/skema-kkn" className="h-12 w-12 rounded-full border border-slate-200 group-hover/scheme:border-white/50 flex items-center justify-center text-slate-400 group-hover/scheme:text-white group-hover/scheme:bg-white/10 transition-all">
                                        <ArrowUpRight size={20} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- FEED & RESOURCES --- */}
                <section className="py-40 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-12 grid lg:grid-cols-2 gap-20">
                        {/* Warta Feed */}
                        <div className="space-y-12">
                            <div className="flex items-end justify-between border-b border-slate-100 pb-10">
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none uppercase font-serif">Warta <span className="font-sans italic text-emerald-600">Utama.</span></h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Bulletin_Feed_v4</p>
                                </div>
                                <Link href="/warta" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic hover:text-slate-900 transition-colors">Semua Berita</Link>
                            </div>

                            <div className="space-y-6">
                                {featuredAnnouncements.length > 0 ? featuredAnnouncements.slice(0, 3).map((item) => (
                                    <article key={item.id} className="group cursor-pointer">
                                        <div className="p-8 rounded-[2rem] border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all space-y-4 relative overflow-hidden">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest italic text-slate-400 group-hover:text-emerald-600 transition-colors">
                                                <span>{item.category || 'ACADEMIC_NEWS'}</span>
                                                <span>{formatDate(item.published_at)}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 italic tracking-tight group-hover:translate-x-2 transition-transform">{item.title}</h3>
                                            <div className="absolute right-8 bottom-8 text-slate-100 group-hover:text-emerald-50 transition-colors">
                                                <Newspaper size={40} />
                                            </div>
                                        </div>
                                    </article>
                                )) : (
                                    <div className="py-20 text-center opacity-20 italic space-y-4">
                                        <Newspaper size={60} className="mx-auto" />
                                        <p className="text-[11px] font-black uppercase tracking-[0.5em]">BUFFER_EMPTY</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Repository Feed */}
                        <div className="space-y-12">
                            <div className="flex items-end justify-between border-b border-slate-100 pb-10">
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none uppercase font-serif">Repositori <span className="font-sans italic text-emerald-600">Pusat.</span></h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Document_Distribution</p>
                                </div>
                                <Link href="/repositori" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic hover:text-slate-900 transition-colors">Semua Berkas</Link>
                            </div>

                            <div className="space-y-6">
                                {featuredDownloads.length > 0 ? featuredDownloads.slice(0, 3).map((item) => (
                                    <article key={item.id} className="group cursor-pointer">
                                        <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-between border-l-8 border-l-slate-200 hover:border-l-emerald-600">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{item.file_type || 'DOC'}</span>
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic opacity-0 group-hover:opacity-100 transition-opacity">Ready For Download</span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 italic tracking-tight uppercase leading-none">{item.title}</h3>
                                            </div>
                                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-700 transition-all shadow-sm">
                                                <Download size={24} />
                                            </div>
                                        </div>
                                    </article>
                                )) : (
                                    <div className="py-20 text-center opacity-20 italic space-y-4">
                                        <Download size={60} className="mx-auto" />
                                        <p className="text-[11px] font-black uppercase tracking-[0.5em]">NULL_RESOURCES</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- CLOSING CTA --- */}
                <section className="bg-white py-40">
                    <div className="mx-auto max-w-7xl px-6 lg:px-12">
                        <div className="bg-emerald-600 rounded-[4rem] p-20 lg:p-32 relative overflow-hidden group shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative z-10 flex flex-col items-center text-center space-y-12">
                                <h2 className="text-5xl lg:text-8xl font-black text-white italic tracking-tighter leading-none uppercase font-serif">Mulai <br /> Langkahmu.</h2>
                                <p className="max-w-2xl text-xl font-bold text-emerald-50 italic leading-relaxed">Bergabunglah dalam jajaran agen perubahan Universitas Islam Negeri Prof. K.H. Saifuddin Zuhri melalui platform manajemen pengabdian terbaik.</p>
                                <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
                                    <Link
                                        href="/login"
                                        className="h-20 px-12 bg-white text-emerald-600 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-emerald-50 transition-all shadow-2xl italic"
                                    >
                                        MASUK_KE_PORTAL <ChevronRight size={16} />
                                    </Link>
                                    <Link
                                        href="/profil"
                                        className="h-20 px-12 border border-white/30 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center hover:bg-white/10 transition-all italic"
                                    >
                                        PROFIL_LPPM
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
