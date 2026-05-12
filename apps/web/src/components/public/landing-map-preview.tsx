'use client';

import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MapPin, ArrowUpRight, Layers, Users } from 'lucide-react';
import type { MapLocation } from './locations-map';

/**
 * Preview peta di landing page.
 *
 * Berbeda dengan /lokasi (full-featured dengan polling 60s, style switcher,
 * fit-bounds manual), versi landing:
 *   - Lebih pendek (h-[380px]) supaya tidak dominasi halaman
 *   - Hanya basemap Voyager (tanpa switcher)
 *   - Fit-bounds otomatis, tidak perlu interaksi
 *   - Polling interval lebih lambat (3 menit) — bukan primary view
 *   - CTA besar ke /lokasi untuk drill-down
 *
 * SSR-safe via nextDynamic (WebGL browser-only). Data initial di-fetch
 * client-side supaya tidak menambah latency TTFB landing page.
 */
const LocationsMap = nextDynamic(() => import('./locations-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] w-full items-center justify-center rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/40 text-sm font-semibold text-emerald-700">
      Menyiapkan peta…
    </div>
  ),
});

export function LandingMapPreview(): React.JSX.Element | null {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const apiBase =
          (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
          'http://localhost:8000/api/v1';
        const res = await fetch(`${apiBase}/public/locations?per_page=500`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        // Defensive: guard content-type sebelum JSON.parse (kasus nginx leak).
        if (!res.ok) {
          if (!cancelled) setError(`HTTP ${res.status}`);
          return;
        }
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.toLowerCase().includes('application/json')) {
          if (!cancelled) setError('Non-JSON response');
          return;
        }

        const payload = (await res.json()) as { data?: MapLocation[] };
        if (cancelled) return;
        setLocations(Array.isArray(payload?.data) ? payload.data : []);
        setLoaded(true);
      } catch (err) {
        // AbortError saat unmount — silent.
        if (!cancelled && (err as Error)?.name !== 'AbortError') {
          setError((err as Error)?.message ?? 'Unknown error');
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Hitung quick stats (hanya lokasi dengan koordinat → yang bisa dipetakan)
  const geoLocations = locations.filter(
    (l) => l.latitude != null && l.longitude != null,
  );
  const totalGroups = geoLocations.reduce(
    (sum, l) => sum + (l.group_count ?? l.groups?.length ?? 0),
    0,
  );
  const totalStudents = geoLocations.reduce(
    (sum, l) =>
      sum +
      (l.students_count ??
        l.groups?.reduce((s, g) => s + (g.peserta_count ?? 0), 0) ??
        0),
    0,
  );

  return (
    <section className="relative py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Sebaran Wilayah Pengabdian
            </p>
            <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
              Peta Lokasi & Kelompok KKN
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Mahasiswa UIN SAIZU tersebar di berbagai desa mitra. Jelajahi titik
              pada peta untuk melihat komposisi kelompok di setiap lokasi.
            </p>
          </div>

          <Link
            href="/lokasi"
            className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-600 bg-emerald-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md lg:self-end"
          >
            Lihat Peta Lengkap
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* Quick stats row */}
        {loaded && geoLocations.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatPill
              icon={MapPin}
              label="Lokasi Aktif"
              value={geoLocations.length.toLocaleString('id-ID')}
              tone="emerald"
            />
            <StatPill
              icon={Layers}
              label="Kelompok"
              value={totalGroups.toLocaleString('id-ID')}
              tone="sky"
            />
            <StatPill
              icon={Users}
              label="Mahasiswa KKN"
              value={totalStudents.toLocaleString('id-ID')}
              tone="orange"
            />
          </div>
        )}

        <div className="mt-10">
          {error && !loaded ? (
            <div className="flex h-[380px] w-full items-center justify-center rounded-[1.6rem] border border-dashed border-rose-200 bg-rose-50/40 px-6 text-center text-sm font-semibold text-rose-700">
              Peta belum tersedia saat ini. Silakan coba lagi nanti.
            </div>
          ) : loaded && geoLocations.length === 0 ? (
            <div className="flex h-[380px] w-full items-center justify-center rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/40 px-6 text-center text-sm font-semibold text-emerald-700">
              Data lokasi akan ditampilkan setelah periode aktif dimulai.
            </div>
          ) : loaded ? (
            // Pakai container terbatas supaya tidak setinggi /lokasi full page
            <div className="overflow-hidden rounded-[1.6rem]">
              <LocationsMap initialLocations={geoLocations} />
            </div>
          ) : (
            <div className="flex h-[380px] w-full items-center justify-center rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/40 text-sm font-semibold text-emerald-700">
              Memuat data lokasi…
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  tone: 'sky' | 'emerald' | 'orange';
}) {
  const palette = {
    sky: 'border-sky-100 bg-sky-50 text-sky-900 [&_svg]:text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900 [&_svg]:text-emerald-700',
    orange: 'border-orange-100 bg-orange-50 text-orange-900 [&_svg]:text-orange-700',
  }[tone];

  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${palette}`}>
      <Icon size={18} />
      <div>
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] opacity-75">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
