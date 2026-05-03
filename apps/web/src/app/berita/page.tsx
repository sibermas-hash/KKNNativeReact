import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi } from '@/lib/server-api';

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Berita & Pengumuman — SIBERMAS UIN SAIZU',
    description: 'Berita dan pengumuman terbaru seputar KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
  };
}

interface Announcement {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  published_at?: string;
  image_url?: string;
}

export default async function AnnouncementsPage() {
  const data = await fetchApi<{ success: boolean; data: Announcement[] }>('/public/announcements');
  const announcements = data?.data || [];

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

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-bold text-slate-800">Berita & Pengumuman</h1>

        {announcements.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-4xl">📰</p>
            <p className="mt-4 text-lg font-semibold text-slate-700">Belum Ada Berita</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {announcements.map((item) => (
              <Link
                key={item.id}
                href={`/berita/${item.slug || ''}`}
                className="group rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {item.image_url ? (
                  <div className="mb-4 h-40 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <p className="text-xs text-slate-500">{item.published_at || ''}</p>
                <p className="mt-2 font-semibold text-slate-800 group-hover:text-teal-600">
                  {item.title}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.excerpt || ''}</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
      </footer>
    </div>
  );
}
