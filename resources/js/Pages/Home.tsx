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
        description: 'Kurikulum KKN dibangun agar mahasiswa siap bekerja nyata di lapangan.',
        icon: BookOpen,
    },
    {
        title: 'Kolaborasi Masyarakat',
        description: 'Program dirancang untuk mempertemukan mahasiswa dengan kebutuhan riil warga.',
        icon: Users,
    },
    {
        title: 'Penempatan Terarah',
        description: 'Lokasi KKN dikelola terpusat agar distribusi mahasiswa tetap seimbang.',
        icon: MapPin,
    },
    {
        title: 'Sertifikasi Resmi',
        description: 'Luaran kegiatan dan evaluasi mahasiswa terdokumentasi secara formal.',
        icon: Award,
    },
];

const schemeCards = [
    {
        title: 'KKN Reguler',
        description: 'Skema utama penempatan mahasiswa pada desa mitra dengan program kerja terukur.',
    },
    {
        title: 'KKN Tematik',
        description: 'Skema berbasis isu prioritas seperti pendidikan, kesehatan, ekonomi, dan lingkungan.',
    },
    {
        title: 'Kolaborasi Nusantara',
        description: 'Pengabdian kolaboratif lintas kampus atau lintas wilayah untuk dampak yang lebih luas.',
    },
    {
        title: 'KKN Khusus',
        description: 'Skema fleksibel untuk kebutuhan pengabdian tertentu yang ditetapkan lembaga.',
    },
];

function formatDate(value?: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

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
    const metrics = [
        { label: 'Mahasiswa Aktif', value: stats.students ?? 0 },
        { label: 'Kelompok KKN', value: stats.groups ?? 0 },
        { label: 'Lokasi Mitra', value: stats.locations ?? 0 },
    ];

    return (
        <PublicLayout>
            <Head title="Portal KKN UIN Prof. K.H. Saifuddin Zuhri" />

            <div className="min-h-screen bg-slate-50">
                <section className="bg-white">
                    <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12 lg:py-28">
                        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                            <div className="space-y-8">
                                <motion.span
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700"
                                >
                                    Portal Resmi KKN UIN Saizu
                                </motion.span>

                                <motion.div
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="space-y-5"
                                >
                                    <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-900 lg:text-7xl">
                                        Pengabdian yang tertata, terukur, dan siap dipantau.
                                    </h1>
                                    <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                                        Portal ini membantu pengelolaan pendaftaran, plotting, laporan harian,
                                        laporan akhir, evaluasi, dan rekap KKN dalam satu alur kerja yang lebih rapi.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex flex-col gap-4 sm:flex-row"
                                >
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-7 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        Masuk ke Portal
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href="/skema-kkn"
                                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                    >
                                        Lihat Skema KKN
                                    </Link>
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 }}
                                className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl"
                            >
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                                            Statistik Ringkas
                                        </p>
                                        <h2 className="mt-3 text-2xl font-bold">Gambaran aktivitas portal KKN</h2>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 pt-24 max-w-6xl mx-auto opacity-60">
                                            <div className="space-y-2 border-l border-white/10 pl-8 text-left">
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">Mahasiswa_Aktif</p>
                                                <p className="text-3xl font-black text-white italic tracking-tighter">{stats.students || '12K+'}</p>
                                            </div>
                                            <div className="space-y-2 border-l border-white/10 pl-8 text-left">
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">Unit_Kelompok</p>
                                                <p className="text-3xl font-black text-white italic tracking-tighter">{stats.groups || '850+'}</p>
                                            </div>
                                            <div className="space-y-2 border-l border-white/10 pl-8 text-left">
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">Zona_Lokasi</p>
                                                <p className="text-3xl font-black text-white italic tracking-tighter">{stats.locations || '45+'}</p>
                                            </div>
                                            <div className="space-y-2 border-l border-white/10 pl-8 text-left">
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">Tahun_Bakti</p>
                                                <p className="text-3xl font-black text-white italic tracking-tighter">{stats.academic_years || '2026'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-100">
                                        Sistem ini mendukung alur mahasiswa, DPL, admin fakultas, dan superadmin
                                        dalam satu dashboard terintegrasi.
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {valueCards.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
                                    <div className="inline-flex rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-6 text-xl font-bold text-slate-900">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white">
                    <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
                        <div className="max-w-3xl space-y-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
                                Skema KKN
                            </p>
                            <h2 className="text-4xl font-black tracking-tight text-slate-900">
                                Pilihan skema yang bisa disesuaikan dengan kebutuhan pengabdian.
                            </h2>
                            <p className="text-slate-600">
                                Setiap skema dirancang agar pelaksanaan, monitoring, dan evaluasi tetap konsisten.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                            {schemeCards.map((scheme) => (
                                <div key={scheme.title} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8">
                                    <div className="inline-flex rounded-2xl bg-white p-4 text-emerald-600 shadow-sm">
                                        <Globe2 className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-6 text-2xl font-bold text-slate-900">{scheme.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">{scheme.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2 lg:px-12">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
                                    Warta
                                </p>
                                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                                    Informasi terbaru
                                </h2>
                            </div>
                            <Newspaper className="h-8 w-8 text-emerald-600" />
                        </div>

                        <div className="mt-8 space-y-4">
                            {featuredAnnouncements.slice(0, 3).map((item) => (
                                <article key={item.id} className="rounded-2xl border border-slate-200 p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            {item.category || 'Warta'}
                                        </span>
                                        <span className="text-xs text-slate-400">{formatDate(item.published_at)}</span>
                                    </div>
                                    <h3 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h3>
                                </article>
                            ))}
                        </div>

                        <Link
                            href="/warta"
                            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                            Lihat semua warta
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
                                    Repositori
                                </p>
                                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                                    Dokumen dan unduhan
                                </h2>
                            </div>
                            <Download className="h-8 w-8 text-emerald-600" />
                        </div>

                        <div className="mt-8 space-y-4">
                            {featuredDownloads.slice(0, 3).map((item) => (
                                <article key={item.id} className="rounded-2xl border border-slate-200 p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            {item.file_type || 'Dokumen'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {item.is_demo ? 'Contoh tampilan' : 'Aktif'}
                                        </span>
                                    </div>
                                    <h3 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h3>
                                </article>
                            ))}
                        </div>

                        <Link
                            href="/repositori"
                            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                            Lihat semua dokumen
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>

                <section className="bg-slate-900">
                    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-16 text-white lg:flex-row lg:items-center lg:justify-between lg:px-12">
                        <div className="space-y-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                                KKN UIN Saizu
                            </p>
                            <h2 className="text-3xl font-black tracking-tight">
                                Portal untuk pengelolaan KKN yang lebih tertib dan mudah dipantau.
                            </h2>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/profil"
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                                <Heart className="h-4 w-4" />
                                Profil LPPM
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                Masuk
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
