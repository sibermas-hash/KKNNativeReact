'use client';

import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { Magnetic } from '@/components/ui/motion-effects';
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
        // Audit fix (2026-05-13): hapus localhost fallback. Kalau env tidak
        // set di build prod, fail eksplisit dengan error visible — bukan
        // diam-diam hit localhost:8000 yang akan timeout di browser user.
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) {
          if (!cancelled) setError('API URL belum dikonfigurasi.');
          return;
        }
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
    <section className="relative py-24 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[#065F46] font-bold uppercase tracking-[0.25em] text-xs">
              Sebaran Wilayah Pengabdian
            </p>
            <h2 className="mt-4 text-3xl font-serif font-bold tracking-tight text-emerald-950 sm:text-4xl">
              Peta Geografis & Lokasi KKN
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Mahasiswa UIN SAIZU tersebar aktif mengabdi di berbagai desa mitra. Jelajahi titik-titik pada peta interaktif di bawah untuk melihat kelompok pengabdian.
            </p>
          </div>

          <Magnetic>
            <Link
              href="/lokasi"
              className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 group lg:self-end"
            >
              Lihat Peta Lengkap
              <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#065F46]" />
            </Link>
          </Magnetic>
        </div>

        {/* Quick stats row */}
        {loaded && geoLocations.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatPill
              icon={MapPin}
              label="Titik Lokasi Aktif"
              value={geoLocations.length.toLocaleString('id-ID')}
            />
            <StatPill
              icon={Layers}
              label="Total Kelompok KKN"
              value={totalGroups.toLocaleString('id-ID')}
            />
            <StatPill
              icon={Users}
              label="Mahasiswa Terjun"
              value={totalStudents.toLocaleString('id-ID')}
            />
          </div>
        )}

        <div className="mt-10">
          {error && !loaded ? (
            <div className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 text-center text-sm text-slate-500">
              Peta belum tersedia saat ini. Silakan coba lagi nanti.
            </div>
          ) : loaded && geoLocations.length === 0 ? (
            <div className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 text-center text-sm text-slate-500">
              Data lokasi akan ditampilkan setelah periode aktif dimulai.
            </div>
          ) : loaded ? (
            /* Clean Minimalist Frameless Bezel for WebGL Map */
            <div className="p-2.5 rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="overflow-hidden rounded-xl bg-slate-50">
                <LocationsMap initialLocations={geoLocations} />
              </div>
            </div>
          ) : (
            <div className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 text-sm font-semibold text-slate-400">
              Memuat data lokasi sebaran…
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
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-[#F4F8F6]/40 shadow-sm text-slate-900 hover:border-slate-200 hover:shadow-md transition-all duration-300 group cursor-default px-5 py-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 border border-slate-100 transition-transform duration-500 group-hover:scale-105 shadow-inner">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-serif font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
