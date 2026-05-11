'use client';

import dynamic from 'next/dynamic';
import type { Announcement, DownloadItem } from './home-content';

export const Showcase3D = dynamic(
  () => import('./showcase-3d').then(m => ({ default: m.Showcase3D })),
  { ssr: false }
);

export const HomeContent = dynamic<{
  featuredAnnouncement?: Announcement;
  latestAnnouncements: Announcement[];
  featuredDownloads: DownloadItem[];
  stats: { students: number; groups: number; locations: number };
  visi?: string;
}>(
  () => import('./home-content').then(m => ({ default: m.HomeContent })),
  { ssr: false }
);
