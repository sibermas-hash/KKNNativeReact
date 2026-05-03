import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import PublicLayout from '@/Layouts/PublicLayout';
import { Clock3, Download, Eye } from 'lucide-react';

dayjs.locale('id');

type AnnouncementDetail = {
    id: number;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    content: string;
    published_at: string;
    image_url?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    file_name?: string | null;
    attachment_url?: string | null;
    reading_time?: number;
    word_count?: number;
};

type RelatedAnnouncement = {
    id: number;
    title: string;
    slug?: string | null;
    category: string;
    excerpt?: string | null;
    published_at: string;
};

interface Props {
    announcement: AnnouncementDetail;
    relatedAnnouncements: RelatedAnnouncement[];
    previewMode?: boolean;
    previewBackUrl?: string | null;
}

const fadeInUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const safeRoute = (name: string, params?: Record<string, unknown>) => {
    try {
        return (window as any).route ? (window as any).route(name, params) : '#';
    } catch {
        return '#';
    }
};

function formatDate(value: string) {
    return dayjs(value).format('DD MMMM YYYY');
}

function relatedHref(slug?: string | null) {
    return slug ? safeRoute('public.announcements.show', { slug }) : safeRoute('public.announcements');
}

export default function AnnouncementShow({
    announcement,
    relatedAnnouncements,
    previewMode = false,
    previewBackUrl = null,
}: Props) {
    return (
        <PublicLayout>
            <Head title={announcement.meta_title || announcement.title}>
                <meta
                    name="description"
                    content={
                        announcement.meta_description ||
                        'Artikel berita dan pengumuman resmi KKN UIN SAIZU untuk publik.'
                    }
                />
                {announcement.meta_keywords && (
                    <meta name="keywords" content={announcement.meta_keywords} />
                )}
            </Head>

            <section className="bg-white pb-24 pt-36 sm:pb-28 lg:pt-40">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    {previewMode && (
                        <motion.div
                            {...fadeInUp}
                            className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4"
                        >
                            <div>
                                <p className="home-kicker text-emerald-600">Preview Admin</p>
                                <p className="mt-2 text-sm leading-7 text-emerald-900">
                                    Anda sedang melihat preview editorial artikel ini sebelum mengikuti alur publik live.
                                </p>
                            </div>
                            {previewBackUrl && (
                                <a
                                    href={previewBackUrl}
                                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-950 no-underline transition hover:bg-emerald-100"
                                >
                                    Kembali ke editor
                                </a>
                            )}
                        </motion.div>
                    )}

                    <div className="grid gap-10 xl:grid-cols-[minmax(0,1.06fr)_22rem] xl:items-start">
                        <motion.article {...fadeInUp} className="space-y-8">
                            <div className="space-y-6">
                                <Link
                                    href={safeRoute('public.announcements')}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 no-underline hover:text-emerald-950 transition-colors"
                                >
                                    &larr; Kembali ke daftar warta
                                </Link>

                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                            {announcement.category || 'WARTA RESMI'}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest tabular-nums">
                                            {formatDate(announcement.published_at)}
                                        </span>
                                    </div>

                                    <h1 className="text-[2.8rem] font-black tracking-tighter text-emerald-950 leading-[1.05] uppercase">
                                        {announcement.title}
                                    </h1>
                                </div>

                                {announcement.excerpt && (
                                    <p className="text-[1.1rem] font-medium leading-relaxed text-slate-600">
                                        {announcement.excerpt}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-4">
                                    {announcement.reading_time && (
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                            <Clock3 size={14} />
                                            {announcement.reading_time} Menit
                                        </div>
                                    )}
                                    {announcement.file_name && (
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-700">
                                            <Download size={14} />
                                            Lampiran Tersedia
                                        </div>
                                    )}
                                </div>
                            </div>

                            {announcement.image_url && (
                                <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-emerald-100/40">
                                    <img
                                        src={announcement.image_url}
                                        alt={announcement.title}
                                        className="aspect-[16/9] h-full w-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-7 shadow-sm sm:p-10">
                                <div
                                    className="announcement-prose text-[1.1rem] leading-9 text-slate-700"
                                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                                />
                            </div>
                        </motion.article>

                        <motion.aside
                            {...fadeInUp}
                            className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8"
                        >
                            <div className="rounded-2xl border border-emerald-50 bg-emerald-50/20 p-5">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950 mb-4 border-b border-emerald-100 pb-2">
                                    Informasi Metadata.
                                </h2>
                                <div className="space-y-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-start justify-between gap-4">
                                        <span>Kategori</span>
                                        <span className="text-emerald-900">{announcement.category || 'Warta Resmi'}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <span>Tayang</span>
                                        <span className="text-emerald-900">{formatDate(announcement.published_at)}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <span>Durasi</span>
                                        <span className="text-emerald-900">{announcement.reading_time || 1} menit</span>
                                    </div>
                                </div>

                                {announcement.attachment_url && (
                                    <a
                                        href={announcement.attachment_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-900 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white no-underline transition hover:bg-emerald-950 shadow-md"
                                    >
                                        <Download size={14} />
                                        Unduh Berkas
                                    </a>
                                )}
                            </div>

                            <div className="mt-10 space-y-2 border-t border-emerald-50 pt-8">
                                <h2 className="text-[1.4rem] font-black tracking-tighter text-emerald-950 uppercase leading-none">
                                    Warta Lain.
                                </h2>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                                    Artikel Relevan
                                </p>
                            </div>

                            <div className="mt-6 space-y-4">
                                {relatedAnnouncements.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={relatedHref(item.slug)}
                                        className="block rounded-2xl border border-emerald-100 bg-white px-5 py-5 text-emerald-950 no-underline transition-all hover:border-emerald-300 hover:bg-emerald-50/20"
                                    >
                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">
                                            {item.category || 'WARTA RESMI'}
                                        </div>
                                        <h3 className="text-[1.05rem] font-black tracking-tight text-emerald-950 uppercase leading-snug">
                                            {item.title}
                                        </h3>
                                        <p className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">
                                            {formatDate(item.published_at)}
                                        </p>
                                    </Link>
                                ))}

                                {relatedAnnouncements.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/10 px-5 py-8 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Belum ada artikel relevan lainnya.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.aside>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
