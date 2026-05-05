import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi } from '@/lib/server-api';
import { sanitizeHtml } from '@/lib/sanitize';
import { notFound } from 'next/navigation';

export const revalidate = 1800;

interface Announcement {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  published_at?: string;
  image_url?: string;
}

async function getAnnouncement(slug: string): Promise<Announcement | null> {
  const data = await fetchApi<{ success: boolean; data: Announcement }>(
    `/public/announcements/${slug}`,
  );
  return data?.data || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const announcement = await getAnnouncement(slug);
  if (!announcement) return { title: 'Berita Tidak Ditemukan — SIBERMAS' };
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
        `/public/announcements?page=${page}`,
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
  const announcement = await getAnnouncement(slug);

  if (!announcement) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            SIBERMAS
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/berita" className="text-sm font-semibold text-white">
              Berita
            </Link>
            <Link href="/lokasi" className="text-sm text-teal-100 hover:text-white">
              Lokasi
            </Link>
            <Link href="/unduhan" className="text-sm text-teal-100 hover:text-white">
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
        <Link href="/berita" className="mb-6 inline-block text-sm text-teal-600 hover:underline">
          &larr; Kembali ke Berita
        </Link>
        <article className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">{announcement.published_at || ''}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">{announcement.title}</h1>
          {announcement.image_url ? (
            <img
              src={announcement.image_url}
              alt={announcement.title}
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
