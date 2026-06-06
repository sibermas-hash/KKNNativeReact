'use client';

import dynamic from 'next/dynamic';
import type { Announcement, DownloadItem } from './home-content';

/**
 * Audit fix (2026-05-13): Showcase3D butuh WebGL → ssr:false OK.
 * Loading fallback minimal supaya CLS tidak liar.
 */
export const Showcase3D = dynamic(
  () => import('./showcase-3d').then((m) => ({ default: m.Showcase3D })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full animate-pulse rounded-2xl bg-slate-100" aria-hidden="true" />
    ),
  }
);

/**
 * HomeContent tetap client-side (butuh framer-motion + client hooks),
 * tapi loading fallback sekarang render konten statis skeleton supaya
 * LCP tidak blank dan SEO crawler melihat struktur dasar (bukan halaman
 * kosong). Konten dinamis (berita, stats) di-skeleton loader.
 */
export const HomeContent = dynamic<{
  featuredAnnouncement?: Announcement;
  latestAnnouncements: Announcement[];
  featuredDownloads: DownloadItem[];
  stats: { students: number; groups: number; locations: number };
  visi?: string;
  schemesContent?: {
    title: string;
    intro: string;
    items: Array<{ title: string; description: string; color?: 'emerald' | 'blue' | 'amber' | 'slate' }>;
  };
}>(
  () => import('./home-content').then((m) => ({ default: m.HomeContent })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-12 py-12" aria-label="Memuat konten">
        <div className="mx-auto max-w-7xl px-4 space-y-6">
          <div className="h-10 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

