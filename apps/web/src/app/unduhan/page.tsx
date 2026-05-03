'use client';

import { useQuery } from '@tanstack/react-query';
import { publicEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DownloadsPage() {
  const endpoints = publicEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.public.downloads,
    queryFn: async () => {
      const res = await endpoints.downloads();
      return (res.data as { success: boolean; data: unknown[] }).data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const downloads = (data as Record<string, unknown>[]) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">SIBERMAS</Link>
          <nav className="flex items-center gap-6">
            <Link href="/berita" className="text-sm text-teal-100 hover:text-white">Berita</Link>
            <Link href="/lokasi" className="text-sm text-teal-100 hover:text-white">Lokasi</Link>
            <Link href="/unduhan" className="text-sm font-semibold text-white">Unduhan</Link>
            <Link href="/login" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-700">Masuk</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-bold text-slate-800">Unduhan</h1>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div>
        ) : downloads.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><p className="text-slate-500">Belum ada file unduhan</p></div>
        ) : (
          <div className="space-y-3">
            {downloads.map((d) => (
              <div key={String(d.id)} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
                <div>
                  <p className="font-semibold text-slate-800">{String(d.title || '-')}</p>
                  <p className="text-sm text-slate-500">{String(d.file_name || '-')} | {String(d.file_type || '-')}</p>
                </div>
                <a href={String(d.file_url || d.external_url || '#')} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Unduh</a>
              </div>
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
