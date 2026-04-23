import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import Pagination, { PageInfo, type PaginationMeta } from '@/Components/ui/Pagination';
import { ArrowRight, BookOpenText, Clock3, FileDown, Newspaper } from 'lucide-react';

type AnnouncementRecord = {
    id: number;
    title: string;
    slug?: string | null;
    category?: string | null;
    excerpt?: string | null;
    image_url?: string | null;
    published_at?: string | null;
    reading_time?: number | null;
    word_count?: number | null;
    file_name?: string | null;
    attachment_url?: string | null;
};

interface Props {
    announcements: {
        data: AnnouncementRecord[];
        meta: PaginationMeta;
    };
}

const safeRoute = (name: string, params?: Record<string, unknown>) => {
    try {
        return (window as any).route ? (window as any).route(name, params) : '#';
    } catch {
        return '#';
    }
};

function formatDate(value?: string | null) {
    if (!value) return 'Informasi terbaru';

    try {
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        }).format(new Date(value));
    } catch {
        return 'Informasi terbaru';
    }
}

function articleHref(slug?: string | null) {
    return slug ? safeRoute('public.announcements.show', { slug }) : safeRoute('public.announcements');
}

export default function Announcements({ announcements }: Props) {
    const featuredArticle = announcements.data[0];
    const sidebarArticles = announcements.data.slice(1, 4);
    const archiveArticles = announcements.data.slice(4);
    const attachmentCount = announcements.data.filter((item) => item.attachment_url).length;

    return (
        <PublicLayout>
            <Head title="Berita | SIBERDAYA KKN UIN SAIZU" />

            <section className="border-b border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(180deg,#f8fcfa_0%,#ffffff_68%)] pb-10 pt-28 lg:pt-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
                        <div className="max-w-4xl">
                            <p className="home-kicker text-emerald-600">Warta Publik</p>
                            <h1 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl lg:text-5xl">
                                Berita dan pengumuman resmi program KKN UIN SAIZU.
                            </h1>
                            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                                Halaman ini merangkum informasi terbaru, agenda publik, dan pembaruan penting seputar pelaksanaan
                                KKN agar mudah dipantau oleh mahasiswa, dosen pembimbing, mitra desa, dan masyarakat umum.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            <SummaryCard label="Total Artikel" value={String(announcements.meta.total ?? 0)} />
                            <SummaryCard
                                label="Halaman Aktif"
                                value={`${announcements.meta.current_page || 1}/${announcements.meta.last_page || 1}`}
                            />
                            <SummaryCard label="Lampiran Tersedia" value={String(attachmentCount)} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-10 sm:py-12">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    {featuredArticle ? (
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_21rem]">
                            <article className="overflow-hidden rounded-[1.6rem] border border-emerald-100 bg-white shadow-[0_20px_60px_rgba(6,78,59,0.07)]">
                                <div className="grid xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                                    <div className="aspect-[16/10] overflow-hidden bg-emerald-50 xl:aspect-auto xl:min-h-[22rem]">
                                        <img
                                            src={featuredArticle.image_url || '/images/home-gallery/hero-2.svg'}
                                            alt={featuredArticle.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-between gap-6 p-5 sm:p-6">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                                <span className="rounded-full bg-emerald-50 px-3 py-1.5">
                                                    {featuredArticle.category || 'Berita'}
                                                </span>
                                                <span>{formatDate(featuredArticle.published_at)}</span>
                                            </div>

                                            <div className="space-y-3">
                                                <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                                                    Headline Utama
                                                </p>
                                                <h2 className="text-2xl font-display font-bold leading-tight text-emerald-950 sm:text-3xl">
                                                    {featuredArticle.title}
                                                </h2>
                                                <p className="text-sm leading-7 text-slate-600 sm:text-base">
                                                    {featuredArticle.excerpt ||
                                                        'Buka artikel ini untuk membaca informasi resmi secara lengkap dan terstruktur.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                                <span className="inline-flex items-center gap-2">
                                                    <Clock3 size={16} className="text-emerald-600" />
                                                    {featuredArticle.reading_time || 1} menit baca
                                                </span>
                                                {featuredArticle.attachment_url && (
                                                    <span className="inline-flex items-center gap-2">
                                                        <FileDown size={16} className="text-emerald-600" />
                                                        Lampiran tersedia
                                                    </span>
                                                )}
                                            </div>

                                            <Link
                                                href={articleHref(featuredArticle.slug)}
                                                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.16em] text-white no-underline transition-colors hover:bg-emerald-800"
                                            >
                                                Baca artikel
                                                <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </article>

                            <aside className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/55 p-5 sm:p-5.5">
                                <div className="flex items-center gap-3">
                                    <Newspaper size={18} className="text-emerald-600" />
                                    <h2 className="font-display text-lg font-bold text-emerald-950">Berita Terbaru</h2>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {sidebarArticles.length > 0 ? (
                                        sidebarArticles.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={articleHref(item.slug)}
                                                className="block rounded-[1.15rem] border border-emerald-100 bg-white p-4 no-underline transition-colors hover:border-emerald-300"
                                            >
                                                <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                                    <span>{item.category || 'Berita'}</span>
                                                    <span>{formatDate(item.published_at)}</span>
                                                </div>
                                                <h3 className="mt-2.5 text-base font-display font-bold leading-snug text-emerald-950">
                                                    {item.title}
                                                </h3>
                                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                                    {item.excerpt || 'Buka artikel untuk membaca informasi lengkap.'}
                                                </p>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="rounded-[1.15rem] border border-dashed border-emerald-200 bg-white p-4 text-sm leading-6 text-slate-600">
                                            Belum ada artikel lain pada halaman ini.
                                        </div>
                                    )}
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/60 px-8 py-12 text-center sm:px-10">
                            <BookOpenText size={48} className="mx-auto text-emerald-400" />
                            <h2 className="mt-5 text-xl font-display font-bold text-emerald-950 sm:text-2xl">
                                Belum ada berita yang dipublikasikan.
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                                Begitu warta resmi tersedia, daftar artikel akan tampil di halaman ini secara otomatis.
                            </p>
                        </div>
                    )}

                    {archiveArticles.length > 0 && (
                        <div className="mt-10">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="home-kicker text-emerald-600">Arsip Halaman Ini</p>
                                    <h2 className="mt-2 text-2xl font-display font-bold tracking-tight text-emerald-950 sm:text-3xl">
                                        Artikel lainnya yang bisa Anda baca.
                                    </h2>
                                </div>
                                <p className="max-w-xl text-sm leading-6 text-slate-600">
                                    Seluruh artikel di bawah ini tetap memakai jalur publik `/berita` dan dapat dibuka langsung tanpa
                                    masuk ke dashboard internal.
                                </p>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {archiveArticles.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={articleHref(item.slug)}
                                        className="group overflow-hidden rounded-[1.35rem] border border-emerald-100 bg-white no-underline shadow-[0_14px_40px_rgba(6,78,59,0.05)] transition-transform hover:-translate-y-1"
                                    >
                                        <div className="aspect-[16/10] overflow-hidden bg-emerald-50">
                                            <img
                                                src={item.image_url || '/images/home-gallery/hero-3.svg'}
                                                alt={item.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                            />
                                        </div>
                                        <div className="space-y-3 p-5">
                                            <div className="flex flex-wrap items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                                <span>{item.category || 'Berita'}</span>
                                                <span>{formatDate(item.published_at)}</span>
                                            </div>
                                            <h3 className="text-lg font-display font-bold leading-snug text-emerald-950">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm leading-6 text-slate-600">
                                                {item.excerpt || 'Buka artikel untuk melihat informasi lengkap dan lampiran terkait.'}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                <span>{item.reading_time || 1} menit baca</span>
                                                {item.attachment_url ? <span>Lampiran tersedia</span> : null}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {announcements.meta && (announcements.meta.last_page ?? 1) > 1 && (
                        <div className="mt-10 border-t border-emerald-100 pt-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <PageInfo meta={announcements.meta} />
                                <Pagination meta={announcements.meta} />
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[1.1rem] border border-emerald-100 bg-white p-4 shadow-[0_12px_35px_rgba(6,78,59,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">{label}</p>
            <p className="mt-2 text-2xl font-display font-bold text-emerald-950">{value}</p>
        </div>
    );
}
