import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi } from '@/lib/server-api';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'SIBERMAS — KKN UIN Saizu',
    description:
      'Sistem Informasi Kuliah Kerja Nyata (KKN) UIN Prof. K.H. Saifuddin Zuhri Purwokerto. Pendaftaran, pelaporan, dan penilaian KKN.',
    openGraph: {
      title: 'SIBERMAS — KKN UIN Saizu',
      description: 'Sistem Informasi KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
      url: 'https://sibermas.uinsaizu.ac.id',
    },
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

interface HomeData {
  announcements?: Announcement[];
  stats?: { locations?: number; announcements?: number };
}

export default async function HomePage() {
  const data = await fetchApi<{ success: boolean; data: HomeData }>('/public/home');
  const announcements = data?.data?.announcements || [];

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-bold text-white">SIBERMAS</h1>
          <nav className="flex items-center gap-6">
            <Link href="/berita" className="text-sm text-teal-100 hover:text-white">
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
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
            >
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-20 text-center text-white">
        <h2 className="text-4xl font-bold">Kuliah Kerja Nyata</h2>
        <p className="mt-4 text-xl text-teal-100">UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50"
          >
            Masuk Portal
          </Link>
          <Link
            href="/lokasi"
            className="rounded-xl border border-white px-8 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Lihat Lokasi KKN
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h3 className="mb-8 text-2xl font-bold text-slate-800">Berita Terbaru</h3>
        {announcements.length === 0 ? (
          <p className="text-slate-500">Belum ada berita.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {announcements.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/berita/${item.slug || ''}`}
                className="group rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <p className="text-xs text-slate-500">{item.published_at || ''}</p>
                <p className="mt-2 font-semibold text-slate-800 group-hover:text-teal-600">
                  {item.title}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.excerpt || ''}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-slate-900 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
      </footer>
    </div>
  );
}
