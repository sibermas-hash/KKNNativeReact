'use client';

import { useQuery } from '@tanstack/react-query';
import { publicEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function HomePage() {
  const endpoints = publicEndpoints(api);

  const { data: homeData } = useQuery({
    queryKey: QUERY_KEYS.public.home,
    queryFn: async () => {
      const res = await endpoints.home();
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: announcements } = useQuery({
    queryKey: QUERY_KEYS.public.announcements(1),
    queryFn: async () => {
      const res = await endpoints.announcements(1);
      return (res.data as { success: boolean; data: unknown[] }).data;
    },
    staleTime: 30 * 60 * 1000,
  });

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-bold text-white">SIBERMAS</h1>
          <nav className="flex items-center gap-6">
            <Link href="/berita" className="text-sm text-teal-100 hover:text-white">Berita</Link>
            <Link href="/lokasi" className="text-sm text-teal-100 hover:text-white">Lokasi</Link>
            <Link href="/unduhan" className="text-sm text-teal-100 hover:text-white">Unduhan</Link>
            <Link href="/login" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">Masuk</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-20 text-center text-white">
        <h2 className="text-4xl font-bold">Kuliah Kerja Nyata</h2>
        <p className="mt-4 text-xl text-teal-100">UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/login" className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50">Masuk Portal</Link>
          <Link href="/lokasi" className="rounded-xl border border-white px-8 py-3 text-sm font-semibold text-white hover:bg-white/10">Lihat Lokasi KKN</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h3 className="mb-8 text-2xl font-bold text-slate-800">Berita Terbaru</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {((announcements as Record<string, unknown>[]) || []).slice(0, 3).map((item) => (
            <Link key={item.id as number} href={`/berita/${item.slug as string}`} className="group rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
              <p className="text-xs text-slate-500">{item.published_at as string}</p>
              <p className="mt-2 font-semibold text-slate-800 group-hover:text-teal-600">{item.title as string}</p>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{(item.excerpt as string) || ''}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
      </footer>
    </div>
  );
}
