import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi } from '@/lib/server-api';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Berita — SIBERMAS UIN SAIZU',
    description: 'Berita dan artikel seputar KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
  };
}

interface Announcement {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  published_at?: string;
  image_url?: string;
  category?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '';
  }
};

export default async function AnnouncementsPage() {
  let announcements: Announcement[] = [];
  try {
    // Hanya berita — pengumuman (category=PENGUMUMAN) dipisah karena hanya
    // tampil sebagai popup di home, tidak di halaman list ini.
    const data = await fetchApi<{ success: boolean; data: Announcement[] }>('/public/berita');
    announcements = data?.data || [];
  } catch (error) {
    console.error('Failed to fetch berita:', error);
  }

  return (
    <div className="min-h-screen bg-white text-emerald-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Warta Publik</p>
          <h1 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
            Berita Terbaru
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Artikel, agenda, press release, dan cerita seputar pelaksanaan program Kuliah Kerja
            Nyata UIN SAIZU Purwokerto.
          </p>
        </div>

        <div className="mt-10">
          {announcements.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Belum ada berita yang dipublikasikan
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Saat ini belum ada warta yang tersedia. Berita terbaru akan muncul di halaman ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((item) => (
                <Link
                  key={item.id}
                  href={`/berita/${item.slug || ''}`}
                  className="group overflow-hidden rounded-[1.6rem] border border-emerald-100 bg-white shadow-[0_18px_45px_rgba(6,78,59,0.05)] transition-all hover:shadow-[0_24px_60px_rgba(6,78,59,0.1)] no-underline"
                >
                  {item.image_url ? (
                    <div className="aspect-[16/10] overflow-hidden bg-emerald-50">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                      <span className="text-4xl">📰</span>
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1">{item.category || 'Berita'}</span>
                      <span>{formatDate(item.published_at)}</span>
                    </div>
                    <h3 className="text-base font-display font-bold leading-snug text-emerald-950 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                      {item.excerpt || 'Baca selengkapnya untuk mengetahui rincian informasi.'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
