'use client';

import { useQuery } from '@tanstack/react-query';
import { publicEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AnnouncementDetailPage() {
  const { slug } = useParams();
  const endpoints = publicEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'announcement', String(slug)],
    queryFn: async () => {
      const res = await endpoints.announcement(String(slug));
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen bg-slate-50"><div className="mx-auto max-w-3xl px-6 py-12"><div className="h-64 animate-pulse rounded-2xl bg-slate-200" /></div></div>;
  if (!data) return <div className="min-h-screen bg-slate-50"><div className="mx-auto max-w-3xl px-6 py-12 text-center"><p className="text-slate-500">Berita tidak ditemukan</p></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">SIBERMAS</Link>
          <nav className="flex items-center gap-6">
            <Link href="/berita" className="text-sm font-semibold text-white">Berita</Link>
            <Link href="/lokasi" className="text-sm text-teal-100 hover:text-white">Lokasi</Link>
            <Link href="/unduhan" className="text-sm text-teal-100 hover:text-white">Unduhan</Link>
            <Link href="/login" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-700">Masuk</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/berita" className="mb-6 inline-block text-sm text-teal-600 hover:underline">&larr; Kembali ke Berita</Link>
        <article className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">{String(data.published_at || '')}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">{String(data.title || '')}</h1>
          {data.image_url ? <img src={String(data.image_url)} alt={String(data.title || '')} className="mt-6 w-full rounded-xl" /> : null}
          <div className="prose prose-slate mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: String(data.content || '') }} />
        </article>
      </main>

      <footer className="bg-slate-900 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
      </footer>
    </div>
  );
}
