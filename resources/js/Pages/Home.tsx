import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import {
    Award,
    BookOpen,
    Download,
    MapPin,
    Newspaper,
    Users,
    Activity,
    Zap,
    Target,
    Layers,
    FileText,
    ChevronRight,
    Calendar,
} from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';

/** Safe route helper to avoid ReferenceErrors during hydration */
const safeRoute = (name: string, params?: any) => {
    try {
        return (window as any).route ? (window as any).route(name, params) : '#';
    } catch (e) {
        return '#';
    }
};

type AnnouncementItem = {
    id: number;
    title: string;
    category?: string | null;
    published_at?: string | null;
};

type DownloadItem = {
    id: number;
    title: string;
    file_type?: string | null;
    external_url?: string | null;
    file_path?: string | null;
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
    const portalHref = auth.user ? safeRoute('dashboard') : safeRoute('login');

    return (
        <PublicLayout>
            <Head title="Pusat Informasi KKN | UIN SAIZU" />

            {/* HERO SECTION - TINGKAT KETERBACAAN TINGGI */}
            <section className="bg-white pt-24 pb-32 border-b-2 border-emerald-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="max-w-4xl space-y-10">
                        <div className="flex items-center gap-3 text-emerald-700 font-bold text-sm uppercase tracking-[0.3em]">
                            <Activity size={20} />
                            Portal Layanan KKN Terpadu
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold text-black leading-[1.1] tracking-tight uppercase italic">
                            Manajemen Praktik Pengabdian <span className="text-emerald-600 block sm:inline">UIN SAIZU.</span>
                        </h1>
                        <p className="text-xl lg:text-2xl font-bold text-black leading-relaxed uppercase tracking-tight max-w-2xl italic">
                            Otoritas Sistem Informasi Terpusat untuk Koordinasi & Pelaporan KKN secara Transparan.
                        </p>
                        <div className="flex flex-wrap items-center gap-6 pt-6">
                            <Link
                                href={portalHref}
                                className="px-10 py-5 bg-emerald-950 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-emerald-900 transition-all shadow-2xl shadow-emerald-950/20 text-sm uppercase tracking-widest italic"
                            >
                                {auth.user ? 'MENU DASHBOARD' : 'AKSES PUSAT KENDALI'}
                                <Zap size={18} className="text-emerald-400" />
                            </Link>
                            <Link
                                href={safeRoute('public.schemes')}
                                className="px-10 py-5 bg-white border-2 border-emerald-100 text-black rounded-2xl font-bold hover:border-emerald-600 transition-all text-sm uppercase tracking-widest italic"
                            >
                                LIHAT SKEMA KKN
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS - Kontras Tajam */}
            <section className="py-20 bg-emerald-50/40">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        <StatItem label="Mahasiswa" value={stats.students} icon={Users} />
                        <StatItem label="Unit Kelompok" value={stats.groups} icon={Layers} />
                        <StatItem label="Zonasi Lokasi" value={stats.locations} icon={MapPin} />
                        <StatItem label="Siklus Periode" value={stats.academic_years} icon={Calendar} />
                    </div>
                </div>
            </section>

            {/* FEATURES - Keterbukaan Informasi */}
            <section className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-24">
                    <div className="text-center space-y-6">
                        <h2 className="text-4xl font-bold text-black uppercase tracking-tight italic">Pilar Operasional</h2>
                        <div className="h-1.5 w-24 bg-emerald-500 mx-auto rounded-full" />
                        <p className="text-black max-w-2xl mx-auto text-lg font-bold uppercase tracking-tight italic">Standarisasi layanan pengabdian masyarakat berbasis integritas data.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        <FeatureBox icon={BookOpen} title="Pedagogi Terpadu" desc="Kurikulum KKN yang adaptif sesuai kebutuhan riil masyarakat." />
                        <FeatureBox icon={Target} title="Zonasi Strategis" desc="Penempatan unit mahasiswa berbasis pemetaan wilayah strategis." />
                        <FeatureBox icon={Activity} title="Audit Realtime" desc="Pelaporan kegiatan harian melalui dashboard yang terverifikasi." />
                        <FeatureBox icon={Award} title="Validasi Hasil" desc="Akuntabilitas nilai yang diterbitkan oleh DPL secara profesional." />
                    </div>
                </div>
            </section>

            {/* NEWS & DOWNLOADS - Teks Sangat Gelap */}
            <section className="py-32 bg-emerald-50/20 border-t-2 border-emerald-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 grid md:grid-cols-2 gap-20">
                    {/* WARTA */}
                    <div className="space-y-12">
                        <div className="flex items-center justify-between border-b-2 border-emerald-100 pb-6">
                            <h3 className="text-2xl font-bold text-black uppercase tracking-tight inline-flex items-center gap-4 italic">
                                <Newspaper size={28} className="text-emerald-500" />
                                Informasi Terkini
                            </h3>
                            <Link href={safeRoute('public.announcements')} className="text-xs font-bold text-emerald-700 hover:text-black uppercase tracking-widest italic underline decoration-2 underline-offset-8">Lihat Semua</Link>
                        </div>
                        <div className="space-y-6">
                            {featuredAnnouncements.map((item) => (
                                <Link key={item.id} href="#" className="flex flex-col gap-3 p-6 bg-white border-2 border-emerald-50 rounded-2xl hover:border-emerald-600 hover:shadow-xl transition-all group no-underline">
                                    <span className="text-[12px] text-emerald-500 font-bold uppercase tracking-[0.3em] italic">{formatDate(item.published_at)}</span>
                                    <h4 className="text-lg font-bold text-black group-hover:text-emerald-600 transition-colors uppercase tracking-tight italic leading-tight">{item.title}</h4>
                                </Link>
                            ))}
                            {featuredAnnouncements.length === 0 && <p className="text-sm font-bold text-emerald-300 italic uppercase">Belum ada pengumuman resmi.</p>}
                        </div>
                    </div>

                    {/* UNDUHAN */}
                    <div className="space-y-12">
                        <div className="flex items-center justify-between border-b-2 border-emerald-100 pb-6">
                            <h3 className="text-2xl font-bold text-black uppercase tracking-tight inline-flex items-center gap-4 italic">
                                <FileText size={28} className="text-emerald-500" />
                                Dokumen Resmi
                            </h3>
                            <Link href={safeRoute('public.downloads')} className="text-xs font-bold text-emerald-700 hover:text-black uppercase tracking-widest italic underline decoration-2 underline-offset-8">Lihat Semua</Link>
                        </div>
                        <div className="space-y-6">
                            {featuredDownloads.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-6 bg-white border-2 border-emerald-50 rounded-2xl hover:border-emerald-600 transition-all cursor-pointer group shadow-sm">
                                    <div className="flex items-center gap-6">
                                        <div className="h-10 w-10 bg-emerald-50 border-2 border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-950 group-hover:text-white transition-all">
                                            <Download size={20} />
                                        </div>
                                        <span className="text-base font-bold text-black uppercase tracking-tight italic leading-none">{item.title}</span>
                                    </div>
                                    <ChevronRight size={20} className="text-emerald-100 group-hover:text-black transition-colors" />
                                </div>
                            ))}
                            {featuredDownloads.length === 0 && <p className="text-sm font-bold text-emerald-300 italic uppercase">Belum ada dokumen publikasi berkas.</p>}
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

function StatItem({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
    return (
        <div className="text-center space-y-4 group">
            <div className="inline-flex h-16 w-16 items-center justify-center bg-white rounded-3xl text-emerald-600 shadow-sm border-2 border-emerald-50 group-hover:border-emerald-500 transition-all group-hover:rotate-12">
                <Icon size={32} />
            </div>
            <div className="space-y-1">
                <p className="text-4xl font-bold text-black tracking-tighter tabular-nums italic">{value ?? 0}</p>
                <p className="text-[12px] font-bold text-emerald-500 uppercase tracking-[0.4em] italic leading-none">{label}</p>
            </div>
        </div>
    );
}

function FeatureBox({ icon: Icon, title, desc }: { icon: any; title: string, desc: string }) {
    return (
        <div className="p-8 bg-white border-2 border-emerald-50 rounded-3xl hover:bg-white hover:border-emerald-600 hover:shadow-2xl transition-all group">
            <div className="h-12 w-12 bg-emerald-50 border-2 border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-950 group-hover:text-white transition-all shadow-sm">
                <Icon size={24} />
            </div>
            <h4 className="text-base font-bold text-black uppercase tracking-tight italic">{title}</h4>
            <p className="text-sm font-bold text-emerald-700/60 mt-4 leading-relaxed italic uppercase tracking-tight">{desc}</p>
        </div>
    );
}
