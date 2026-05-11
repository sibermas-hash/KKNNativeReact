'use client';

import nextDynamic from 'next/dynamic';
import type { MapLocation } from './locations-map';

/**
 * Client-only loader untuk LocationsMap.
 *
 * Next.js 15 melarang `ssr: false` pada `next/dynamic` yang dipanggil
 * langsung dari Server Component (`/lokasi/page.tsx`). Wrapper ini sendiri
 * adalah Client Component, jadi `ssr: false` sah di sini — server cuma
 * render placeholder skeleton, peta hanya hidup di browser (butuh WebGL).
 */
const LocationsMap = nextDynamic(() => import('./locations-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/40 text-sm font-semibold text-emerald-700">
      Menyiapkan peta sebaran…
    </div>
  ),
});

export default function LocationsMapLoader({
  initialLocations,
}: {
  initialLocations: MapLocation[];
}) {
  return <LocationsMap initialLocations={initialLocations} />;
}
