import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { ArrowRight, Download, FileText, MapPinned, Newspaper } from 'lucide-react';
import { useEffect, useState } from 'react';

type AnnouncementItem = {
    id: number;
    title: string;
    slug?: string | null;
    category?: string | null;
    excerpt?: string | null;
    image_url?: string | null;
    published_at?: string | null;
    reading_time?: number | null;
};

type DownloadItem = {
    id: number;
    title: string;
    file_type?: string | null;
    file_path?: string | null;
    external_url?: string | null;
};

type Stats = {
    students?: number;
    groups?: number;
    locations?: number;
};

type AboutContent = {
    visi?: string | null;
};

interface Props {
    featuredAnnouncements?: AnnouncementItem[];
    featuredDownloads?: DownloadItem[];
    stats?: Stats;
    aboutContent?: AboutContent;
}

const safeRoute = (name: string, params?: unknown) => {
    try {
        return (window as any).route ? (window as any).route(name, params) : '#';
    } catch {
        return '#';
    }
};

const formatDate = (date?: string | null) => {
    if (!date) return 'Informasi terbaru';

    try {
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        }).format(new Date(date));
    } catch {
        return 'Informasi terbaru';
    }
};

const buildAnnouncementHref = (slug?: string | null) =>
    slug ? safeRoute('public.announcements.show', { slug }) : safeRoute('public.announcements');

const buildDownloadHref = (download: DownloadItem) =>
    download.external_url || download.file_path || safeRoute('public.downloads');

export default function Home({
    featuredAnnouncements = [],
    featuredDownloads = [],
    stats = {},
    aboutContent,
}: Props) {
    const heroTitle = 'LPPM UIN SAIZU Purwokerto';
    const featuredAnnouncement = featuredAnnouncements[0];
    const latestAnnouncements = featuredAnnouncements.slice(1, 5);
    const [typedTitle, setTypedTitle] = useState('');

    const visi =
        aboutContent?.visi ||
        'Menjadi Lembaga Penelitian dan Pengabdian kepada Masyarakat yang unggul dan kompetitif dalam pengembangan ilmu pengetahuan, teknologi, dan seni yang berbasis pada nilai-nilai moderasi Islam dan kearifan lokal.';

    useEffect(() => {
        if (typedTitle.length >= heroTitle.length) return;

        const timeoutId = window.setTimeout(() => {
            setTypedTitle(heroTitle.slice(0, typedTitle.length + 1));
        }, 185);

        return () => window.clearTimeout(timeoutId);
    }, [heroTitle, typedTitle]);

    return (
        <PublicLayout overlayNav>
            <Head title="Beranda | SIBERDAYA KKN UIN SAIZU" />

            <section className="relative h-screen min-h-[100svh] overflow-hidden bg-emerald-950">
                <video
                    className="absolute inset-0 h-full w-full object-cover brightness-[0.58] saturate-[0.9]"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/images/home-gallery/hero-1.svg"
                >
                    <source src="/videos/Video.mp4" type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.54)_0%,rgba(0,0,0,0.62)_36%,rgba(0,0,0,0.68)_100%)]" />

                <div className="relative z-10 flex h-screen min-h-[100svh] items-center justify-center px-6 pb-16 pt-24 sm:pt-28 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="font-display text-[1.85rem] font-semibold uppercase tracking-[0.06em] text-white sm:text-3xl lg:text-[2.7rem]">
                            {typedTitle}
                            <span className="typing-cursor ml-1 inline-block text-white/90">|</span>
                        </h1>
                        <p className="mx-auto mt-5 max-w-3xl text-[0.98rem] font-medium leading-7 text-white/92 sm:text-base sm:leading-8">
                            {visi}
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-white py-14 sm:py-16">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="home-kicker text-emerald-600">Informasi Terkini</p>
                        <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
                            Berita, pembaruan program, dan dokumen publik KKN.
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                            Semua informasi terbaru ditempatkan di beranda agar mudah dipantau oleh mahasiswa, dosen, mitra
                            desa, dan masyarakat umum.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                        <div className="space-y-5">
                            {featuredAnnouncement ? (
                                <article className="overflow-hidden rounded-[1.6rem] border border-emerald-100 bg-white shadow-[0_20px_55px_rgba(6,78,59,0.07)]">
                                    <div className="aspect-[16/9] overflow-hidden bg-emerald-50">
                                        <img
                                            src={featuredAnnouncement.image_url || '/images/home-gallery/hero-1.svg'}
                                            alt={featuredAnnouncement.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="space-y-4 p-5 sm:p-6">
                                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1.5">
                                                {featuredAnnouncement.category || 'Berita'}
                                            </span>
                                            <span>{formatDate(featuredAnnouncement.published_at)}</span>
                                            {featuredAnnouncement.reading_time ? (
                                                <span>{featuredAnnouncement.reading_time} menit baca</span>
                                            ) : null}
                                        </div>
                                        <h3 className="text-xl font-display font-bold leading-tight text-emerald-950 sm:text-[1.7rem]">
                                            {featuredAnnouncement.title}
                                        </h3>
                                        <p className="text-sm leading-7 text-slate-600 sm:text-base">
                                            {featuredAnnouncement.excerpt || 'Baca pengumuman lengkap untuk mengetahui rincian informasi terbaru dari LPPM UIN SAIZU.'}
                                        </p>
                                        <Link
                                            href={buildAnnouncementHref(featuredAnnouncement.slug)}
                                            className="inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 no-underline"
                                        >
                                            Baca selengkapnya
                                            <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </article>
                            ) : (
                                <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 sm:p-7">
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Belum ada berita utama</p>
                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                                        Saat ini belum ada warta yang dipublikasikan. Begitu berita terbaru tersedia, tampilannya akan
                                        muncul di bagian ini.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div className="rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_45px_rgba(6,78,59,0.05)]">
                                <div className="flex items-center gap-3">
                                    <Newspaper size={18} className="text-emerald-600" />
                                    <h3 className="font-display text-lg font-bold text-emerald-950">Berita Terbaru</h3>
                                </div>
                                <div className="mt-5 space-y-4">
                                    {latestAnnouncements.length > 0 ? (
                                        latestAnnouncements.map((announcement) => (
                                            <Link
                                                key={announcement.id}
                                                href={buildAnnouncementHref(announcement.slug)}
                                                className="block rounded-[1.15rem] border border-emerald-100 p-4 no-underline transition-colors hover:border-emerald-300"
                                            >
                                                <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                                    <span>{announcement.category || 'Berita'}</span>
                                                    <span>{formatDate(announcement.published_at)}</span>
                                                </div>
                                                <h4 className="mt-2.5 text-base font-display font-bold leading-snug text-emerald-950">
                                                    {announcement.title}
                                                </h4>
                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    {announcement.excerpt || 'Ringkasan berita akan tampil di bagian ini saat konten dipublikasikan.'}
                                                </p>
                                            </Link>
                                        ))
                                    ) : (
                                        <p className="text-sm leading-7 text-slate-600">Belum ada berita tambahan yang dipublikasikan.</p>
                                    )}
                                </div>
                                <Link
                                    href={safeRoute('public.announcements')}
                                    className="mt-5 inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 no-underline"
                                >
                                    Lihat semua berita
                                    <ArrowRight size={16} />
                                </Link>
                            </div>

                            <div className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/55 p-5">
                                <div className="flex items-center gap-3">
                                    <Download size={18} className="text-emerald-600" />
                                    <h3 className="font-display text-lg font-bold text-emerald-950">Unduhan Terbaru</h3>
                                </div>
                                <div className="mt-5 space-y-3">
                                    {featuredDownloads.length > 0 ? (
                                        featuredDownloads.map((download) => (
                                            <a
                                                key={download.id}
                                                href={buildDownloadHref(download)}
                                                className="flex items-start gap-3 rounded-[1.15rem] border border-emerald-100 bg-white p-4 no-underline transition-colors hover:border-emerald-300"
                                            >
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold leading-6 text-emerald-950 sm:text-base">{download.title}</p>
                                                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                                        {download.file_type || 'Dokumen publik'}
                                                    </p>
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <p className="text-sm leading-7 text-slate-600">Belum ada dokumen publik yang ditampilkan.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-t border-emerald-100 bg-emerald-50/70 py-12">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Mahasiswa</p>
                            <p className="mt-2 font-display text-3xl font-bold text-emerald-950">{stats.students || 0}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Peserta yang tercatat dalam pelaksanaan program KKN.</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Kelompok</p>
                            <p className="mt-2 font-display text-3xl font-bold text-emerald-950">{stats.groups || 0}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Kelompok yang bergerak di berbagai wilayah pengabdian.</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Desa Mitra</p>
                            <p className="mt-2 font-display text-3xl font-bold text-emerald-950">{stats.locations || 0}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Lokasi pengabdian yang menjadi bagian dari jejaring KKN UIN SAIZU.</p>
                        </div>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                            href={safeRoute('public.locations')}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-950 no-underline transition-colors hover:border-emerald-300"
                        >
                            <MapPinned size={16} className="text-emerald-600" />
                            Lihat sebaran lokasi
                        </Link>
                        <Link
                            href={safeRoute('public.downloads')}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-950 no-underline transition-colors hover:border-emerald-300"
                        >
                            <Download size={16} className="text-emerald-600" />
                            Buka unduhan publik
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
