import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi, fetchApiStrict } from '@/lib/server-api';
import { sanitizeHtml } from '@/lib/sanitize';
import { notFound } from 'next/navigation';

export const revalidate = 1800;
// Audit fix (2026-06-13): pakai `dynamicParams = false` agar slug yang
// tidak ada di `generateStaticParams` (mis. 'foo-bar-baz') mengembalikan
// 404 beneran. Tanpa flag ini, App Router fall through ke SSR untuk
// unknown params → `notFound()` dipanggil, tapi response tetap HTTP 200
// dengan x-nextjs-prerender: 1 (lihat issue Next.js #60005). SEO dan
// monitoring 404 jadi kacau.
export const dynamicParams = false;

interface Announcement {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  published_at?: string;
  image_url?: string;
}

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchApi<{ success: boolean; data: Announcement }>(
    `/public/pengumuman/${slug}`,
  );
  const announcement = data?.data;
  if (!announcement) return { title: 'Pengumuman Tidak Ditemukan — SIBERMAS' };
  return {
    title: `${announcement.title} — SIBERMAS`,
    description: announcement.excerpt || announcement.title,
    openGraph: {
      title: announcement.title,
      description: announcement.excerpt || announcement.title,
      images: announcement.image_url ? [announcement.image_url] : undefined,
    },
  };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Fetch all pages of announcements for static generation
  const allSlugs: string[] = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore && page <= 10) {
      const data = await fetchApi<{ success: boolean; data: unknown[]; meta?: { last_page?: number } }>(
        `/public/pengumuman?page=${page}`,
      );
      const items = data?.data || [];
      items.forEach((a: unknown) => {
        const slug = (a as Record<string, unknown>)?.slug;
        if (slug) allSlugs.push(String(slug));
      });
      hasMore = items.length > 0 && page < (data?.meta?.last_page || 1);
      page++;
    }
  } catch {
    // Backend unavailable at build time — pages will be rendered on-demand (SSR)
  }

  return allSlugs.map((slug) => ({ slug }));
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Audit fix (2026-05-13): bedakan backend-down dari artikel-tidak-ada.
  // Sebelumnya semua failure treated sebagai 404 → saat backend overload
  // di 17 Mei, user dapat 404 padahal artikel valid.
  const result = await fetchApiStrict<{ success: boolean; data: Announcement }>(
    `/public/pengumuman/${slug}`,
  );

  if (result.kind === 'not_found') {
    notFound();
  }

  if (result.kind === 'service_unavailable') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-sm space-y-4">
          <p className="text-sm font-bold text-amber-700 uppercase tracking-wider">Gagal Memuat Pengumuman</p>
          <p className="text-sm text-slate-600">
            Sistem pengumuman sedang mengalami gangguan. Silakan coba muat ulang halaman beberapa saat kemudian.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/pengumuman/${slug}`}
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Muat Ulang
            </Link>
            <Link
              href="/pengumuman"
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Kembali ke Daftar Pengumuman
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const announcement = result.data?.data;
  if (!announcement) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            SIBERMAS
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href="/pengumuman" className="text-sm font-semibold text-white">
              Berita
            </Link>
            <Link href="/lokasi" className="hidden sm:inline text-sm text-teal-100 hover:text-white">
              Lokasi
            </Link>
            <Link href="/unduhan" className="hidden sm:inline text-sm text-teal-100 hover:text-white">
              Unduhan
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-700"
            >
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/pengumuman" className="mb-6 inline-block text-sm text-teal-600 hover:underline">
          &larr; Kembali ke Pengumuman
        </Link>
        <article className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">{formatDate(announcement.published_at)}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">{announcement.title}</h1>
          {announcement.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={announcement.image_url}
              alt={announcement.title}
              loading="lazy"
              className="mt-6 w-full rounded-xl"
            />
          ) : null}
          <div
            className="prose prose-slate mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.content || '') }}
          />
        </article>
      </main>

      <footer className="bg-slate-900 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
      </footer>
    </div>
  );
}
