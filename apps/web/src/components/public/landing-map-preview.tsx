'use client';

import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MapPin, ArrowUpRight, Layers, Users } from 'lucide-react';
import type { MapLocation } from './locations-map';

const LocationsMap = nextDynamic(() => import('./locations-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/40 text-sm font-semibold text-emerald-700">
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
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) {
          if (!cancelled) setError('API URL belum dikonfigurasi.');
          return;
        }
        const res = await fetch(`${apiBase}/public/locations?per_page=500`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

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
    <section className="relative py-28 sm:py-36 bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-100/30 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Sebaran Wilayah Pengabdian
            </p>
            <h2 className="mt-3 text-4xl font-display font-black tracking-tight text-emerald-950 sm:text-5xl leading-tight">
              Peta Sebaran &<br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Lokasi Aktif KKN.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Mahasiswa UIN SAIZU tersebar di berbagai desa mitra. Jelajahi titik
              pada peta untuk melihat komposisi kelompok di setiap lokasi secara real-time.
            </p>
          </div>

          <Link
            href="/lokasi"
            className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-600 bg-emerald-600 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-emerald-200 hover:scale-[1.03] lg:self-end"
          >
            Lihat Peta Lengkap
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* Flat Modern Map Area with Floating Stats */}
        <div className="relative mt-20">
          
          <div className="overflow-hidden rounded-[2.5rem] border border-emerald-100/60 bg-white shadow-[0_20px_50px_rgba(6,78,59,0.06)] transition-all duration-300 hover:shadow-[0_30px_70px_rgba(6,78,59,0.12)]">
            {error && !loaded ? (
              <div className="flex h-[420px] w-full items-center justify-center border-2 border-dashed border-rose-200 bg-rose-50/40 px-6 text-center text-sm font-semibold text-rose-700">
                Peta belum tersedia saat ini. Silakan coba lagi nanti.
              </div>
            ) : loaded && geoLocations.length === 0 ? (
              <div className="flex h-[420px] w-full items-center justify-center border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-6 text-center text-sm font-semibold text-emerald-700">
                Data lokasi akan ditampilkan setelah periode aktif dimulai.
              </div>
            ) : loaded ? (
              <div className="h-[420px] w-full relative">
                <LocationsMap initialLocations={geoLocations} />
              </div>
            ) : (
              <div className="flex h-[420px] w-full items-center justify-center border-2 border-dashed border-emerald-200 bg-emerald-50/40 text-sm font-semibold text-emerald-700">
                Memuat data lokasi…
              </div>
            )}
          </div>

          {/* Floating Glassmorphic Stat Pills - using CPU-friendly CSS transforms */}
          {loaded && geoLocations.length > 0 && (
            <div className="md:contents grid grid-cols-1 gap-4 mt-8 md:mt-0">
              
              {/* Stat Pill 1: Lokasi Aktif (Top Left) */}
              <div className="md:absolute md:-left-8 md:top-[8%] md:z-30 md:w-64 transition-all duration-300 md:hover:-translate-y-1.5 md:-translate-y-1">
                <StatPill
                  icon={MapPin}
                  label="Lokasi Aktif"
                  value={geoLocations.length.toLocaleString('id-ID')}
                  tone="emerald"
                />
              </div>

              {/* Stat Pill 2: Kelompok (Middle Right) */}
              <div className="md:absolute md:-right-8 md:top-[28%] md:z-30 md:w-64 transition-all duration-300 md:hover:-translate-y-1.5 md:translate-y-1">
                <StatPill
                  icon={Layers}
                  label="Kelompok"
                  value={totalGroups.toLocaleString('id-ID')}
                  tone="sky"
                />
              </div>

              {/* Stat Pill 3: Mahasiswa KKN (Bottom Left) */}
              <div className="md:absolute md:left-[12%] md:bottom-[-2.5rem] md:z-30 md:w-[17.5rem] transition-all duration-300 md:hover:-translate-y-1.5 md:translate-y-2">
                <StatPill
                  icon={Users}
                  label="Mahasiswa KKN"
                  value={totalStudents.toLocaleString('id-ID')}
                  tone="orange"
                />
              </div>

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
    sky: 'border-sky-100/80 bg-white/90 shadow-[0_15px_35px_rgba(14,165,233,0.1)] text-sky-950 [&_svg]:text-sky-600',
    emerald: 'border-emerald-100/80 bg-white/90 shadow-[0_15px_35px_rgba(16,185,129,0.1)] text-emerald-950 [&_svg]:text-emerald-600',
    orange: 'border-orange-100/80 bg-white/90 shadow-[0_15px_35px_rgba(249,115,22,0.1)] text-orange-950 [&_svg]:text-orange-600',
  }[tone];

  return (
    <div className={`flex items-center gap-4 rounded-2.5xl border p-5 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-emerald-300 ${palette}`}>
      <div className="p-3 rounded-2xl bg-slate-50">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-black tabular-nums tracking-tight">{value}</p>
      </div>
    </div>
  );
}
