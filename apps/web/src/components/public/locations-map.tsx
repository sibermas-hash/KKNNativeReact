'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map, type Marker, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, MapPin as MapPinIcon, Users, Navigation } from 'lucide-react';

// ─── Types (mirror apps/api LokasiResource shape) ─────────────────────────
export type LocationGroup = {
  id: number;
  nama_kelompok: string;
  code: string | null;
  peserta_count: number;
};

export type MapLocation = {
  id: number;
  village_name: string | null;
  district_name: string | null;
  regency_name: string | null;
  full_name: string | null;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  capacity: number | null;
  group_count?: number;
  students_count?: number;
  groups?: LocationGroup[];
};

type MapStyleKey = 'street' | 'satellite' | 'dark';

const DEFAULT_CENTER: [number, number] = [109.2342, -7.4246]; // Purwokerto
const DEFAULT_ZOOM = 10;
const POLL_INTERVAL_MS = 60_000; // auto-refresh tiap 60 detik

// Same tile providers as address-map-picker — free tier, no API key.
const STYLES: Record<MapStyleKey, StyleSpecification> = {
  street: {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [{ id: 'carto-voyager', type: 'raster', source: 'carto' }],
  },
  satellite: {
    version: 8,
    sources: {
      imagery: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics',
      },
      reference: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
      },
    },
    layers: [
      { id: 'imagery-layer', type: 'raster', source: 'imagery' },
      { id: 'labels-layer', type: 'raster', source: 'reference' },
    ],
  },
  dark: {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [{ id: 'carto-dark', type: 'raster', source: 'carto' }],
  },
};

const STYLE_OPTIONS: Array<{ key: MapStyleKey; label: string }> = [
  { key: 'street', label: 'Peta' },
  { key: 'satellite', label: 'Satelit' },
  { key: 'dark', label: 'Gelap' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function getGroupCount(loc: MapLocation): number {
  return loc.group_count ?? (loc.groups?.length ?? 0);
}

function getStudentCount(loc: MapLocation): number {
  return (
    loc.students_count ??
    (loc.groups?.reduce((sum, g) => sum + (g.peserta_count ?? 0), 0) ?? 0)
  );
}

function isPlottedRealLocation(
  loc: MapLocation,
): loc is MapLocation & { latitude: number | string; longitude: number | string } {
  return toNumber(loc.latitude) !== null && toNumber(loc.longitude) !== null && getGroupCount(loc) > 0;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMarkerHtml(groupCount: number): string {
  const count = Math.max(0, groupCount);
  // Warna gradient disesuaikan dengan skema emerald halaman publik.
  // `data-count` dipakai di CSS ::after untuk pulse animation saat active.
  return `
    <div class="kkn-pin" data-count="${count}">
      <span class="kkn-pin__halo"></span>
      <span class="kkn-pin__body">
        <span class="kkn-pin__count">${count}</span>
      </span>
    </div>
  `;
}

function buildPopupHtml(loc: MapLocation): string {
  const village = escapeHtml(loc.village_name ?? '-');
  const district = loc.district_name ? escapeHtml(loc.district_name) : '';
  const regency = loc.regency_name ? escapeHtml(loc.regency_name) : '';
  const subtitle = [district ? `Kec. ${district}` : null, regency].filter(Boolean).join(', ');
  const groupCount = getGroupCount(loc);
  const studentCount = getStudentCount(loc);

  const groupsList = (loc.groups ?? [])
    .map(
      (g) => `
        <li class="kkn-popup__group">
          <span class="kkn-popup__group-name">${escapeHtml(g.nama_kelompok ?? 'Kelompok')}</span>
          <span class="kkn-popup__group-count">${g.peserta_count} mhs</span>
        </li>
      `,
    )
    .join('');

  const lat = toNumber(loc.latitude);
  const lng = toNumber(loc.longitude);
  const mapsHref =
    lat !== null && lng !== null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : null;

  return `
    <div class="kkn-popup">
      <div class="kkn-popup__header">
        <p class="kkn-popup__title">${village}</p>
        ${subtitle ? `<p class="kkn-popup__subtitle">${subtitle}</p>` : ''}
      </div>
      <div class="kkn-popup__stats">
        <span class="kkn-popup__stat kkn-popup__stat--sky">
          <strong>${groupCount}</strong> kelompok
        </span>
        <span class="kkn-popup__stat kkn-popup__stat--emerald">
          <strong>${studentCount}</strong> mahasiswa
        </span>
      </div>
      ${
        groupsList
          ? `<ul class="kkn-popup__groups">${groupsList}</ul>`
          : '<p class="kkn-popup__empty">Belum ada kelompok di lokasi ini.</p>'
      }
      ${
        mapsHref
          ? `<a class="kkn-popup__maps" href="${mapsHref}" target="_blank" rel="noopener noreferrer">
              Buka di Google Maps →
            </a>`
          : ''
      }
    </div>
  `;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function LocationsMap({
  initialLocations,
}: {
  initialLocations: MapLocation[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const [locations, setLocations] = useState<MapLocation[]>(initialLocations);
  const [activeStyle, setActiveStyle] = useState<MapStyleKey>('street');
  const [mapLoading, setMapLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Hanya tampilkan data real yang sudah terplotting:
  // punya koordinat valid + sudah ada kelompok. Desa master tanpa kelompok
  // disembunyikan supaya peta tidak penuh pin "0".
  const geoLocations = useMemo(() => locations.filter(isPlottedRealLocation), [locations]);

  const totals = useMemo(() => {
    const totalGroups = geoLocations.reduce((sum, loc) => sum + getGroupCount(loc), 0);
    const totalStudents = geoLocations.reduce((sum, loc) => sum + getStudentCount(loc), 0);
    return { totalLocations: geoLocations.length, totalGroups, totalStudents };
  }, [geoLocations]);

  // ── Initialize map once ──
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[activeStyle],
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 5,
      transformRequest: (url) => {
        if (url.startsWith('https://server.arcgisonline.com/')) {
          return { url, headers: { 'Referer': 'https://sibermas.uinsaizu.ac.id/' } };
        }
      },
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: false, showCompass: true }),
      'top-right',
    );
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }),
      'bottom-left',
    );
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    map.on('load', () => setMapLoading(false));
    map.on('idle', () => setMapLoading(false));
    map.on('error', (e) => {
      if (e.error?.status === 403 || e.error?.status === 404) return;
      console.warn('[MapLibre]', e.error?.message ?? e.error);
    });

    const loadingTimeout = window.setTimeout(() => setMapLoading(false), 15_000);

    mapRef.current = map;

    return () => {
      window.clearTimeout(loadingTimeout);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Swap basemap style without destroying map ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setMapLoading(true);

    let cancelled = false;
    const timeout = window.setTimeout(() => { if (!cancelled) setMapLoading(false); }, 15_000);

    map.setStyle(STYLES[activeStyle]);
    map.once('idle', () => { if (!cancelled) { window.clearTimeout(timeout); setMapLoading(false); } });

    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [activeStyle]);

  // ── Render markers whenever locations change ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (geoLocations.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    for (const loc of geoLocations) {
      const lat = toNumber(loc.latitude);
      const lng = toNumber(loc.longitude);
      if (lat === null || lng === null) continue;

      const el = document.createElement('div');
      el.className = 'kkn-pin-shell';
      el.innerHTML = buildMarkerHtml(getGroupCount(loc));

      const popup = new maplibregl.Popup({
        offset: 34,
        closeButton: true,
        maxWidth: '320px',
        className: 'kkn-popup-wrapper',
      }).setHTML(buildPopupHtml(loc));

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    }

    // Fit bounds dengan padding, kecuali hanya 1 lokasi → fly-to ke titik.
    if (geoLocations.length === 1) {
      const loc = geoLocations[0];
      const lng = toNumber(loc.longitude)!;
      const lat = toNumber(loc.latitude)!;
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 900 });
    } else if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 64, duration: 900, maxZoom: 13 });
    }
  }, [geoLocations]);

  // ── Polling realtime: refetch tiap 60 detik ──
  //
  // Audit fix (2026-05-13): polling sebelumnya jalan terus walaupun tab
  // user di background. Ratusan tab idle × polling = traffic parasit ke
  // endpoint `/public/locations` (query Eloquent berat) di hari paling
  // padat (17 Mei). Sekarang guard dengan `document.visibilityState`:
  // kalau tab hidden, skip fetch — restart saat tab visible lagi.
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      // Skip kalau tab di background — hemat bandwidth + backend load.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      try {
        const res = await fetch('/api/v1/public/locations?per_page=500', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        // Defensive: kalau nginx salah route /api → response bisa HTML dari
        // Next.js. Guard Response.ok + Content-Type sebelum .json() supaya
        // tidak crash saat parse.
        if (!res.ok) return;
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.toLowerCase().includes('application/json')) return;

        const payload = (await res.json()) as { data?: MapLocation[] };
        if (cancelled) return;
        if (Array.isArray(payload?.data)) {
          setLocations(payload.data);
          setLastRefreshed(new Date());
        }
      } catch {
        // silent — jangan ganggu UX kalau polling gagal (jaringan putus, dll)
      }
    }

    // Immediate refresh saat tab kembali visible (kalau sudah lama idle).
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const handleFitAll = useCallback(() => {
    const map = mapRef.current;
    if (!map || geoLocations.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    geoLocations.forEach((loc) => {
      const lat = toNumber(loc.latitude);
      const lng = toNumber(loc.longitude);
      if (lat !== null && lng !== null) bounds.extend([lng, lat]);
    });
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 64, duration: 700, maxZoom: 13 });
    }
  }, [geoLocations]);

  return (
    <div className="space-y-5">
      {/* Stats chips */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatChip
          label="Lokasi Terplot"
          value={totals.totalLocations.toLocaleString('id-ID')}
          icon={MapPinIcon}
          tone="sky"
        />
        <StatChip
          label="Kelompok"
          value={totals.totalGroups.toLocaleString('id-ID')}
          icon={Layers}
          tone="emerald"
        />
        <StatChip
          label="Mahasiswa"
          value={totals.totalStudents.toLocaleString('id-ID')}
          icon={Users}
          tone="orange"
        />
      </div>

      <div className="relative overflow-hidden rounded-[1.6rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(6,78,59,0.06)]">
        <div
          ref={containerRef}
          className="h-[480px] w-full md:h-[560px]"
          aria-label="Peta sebaran lokasi kelompok KKN"
        />

        {/* Style switcher */}
        <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-xl bg-white/95 shadow-md ring-1 ring-emerald-100 backdrop-blur-sm">
          {STYLE_OPTIONS.map(({ key, label }) => {
            const active = activeStyle === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveStyle(key)}
                aria-pressed={active}
                className={[
                  'px-3 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-900 hover:bg-emerald-50',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Fit-all shortcut */}
        {geoLocations.length > 1 && (
          <button
            type="button"
            onClick={handleFitAll}
            className="absolute bottom-14 right-3 z-10 inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-md ring-1 ring-emerald-100 hover:bg-emerald-50 backdrop-blur-sm"
          >
            <Navigation size={12} />
            Fit semua
          </button>
        )}

        {/* Loading overlay */}
        {mapLoading && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-md ring-1 ring-emerald-100">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Memuat peta…
            </span>
          </div>
        )}

        {!mapLoading && geoLocations.length === 0 && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-2xl bg-white/95 p-4 text-sm text-slate-600 shadow-md ring-1 ring-emerald-100 backdrop-blur-sm sm:left-4 sm:right-auto sm:max-w-sm">
            Belum ada lokasi KKN yang sudah terplot dengan kelompok aktif.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Data disegarkan otomatis setiap {POLL_INTERVAL_MS / 1000} detik.
          {lastRefreshed
            ? ` Pembaruan terakhir ${lastRefreshed.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}.`
            : ''}
        </span>
        <span>Klik titik pada peta untuk melihat daftar kelompok.</span>
      </div>

      {/* Inline marker + popup styles */}
      <style>{`
        .kkn-pin-shell { background: transparent; border: 0; }
        .kkn-pin {
          position: relative;
          display: block;
          width: 42px;
          height: 54px;
          cursor: pointer;
        }
        .kkn-pin__halo {
          position: absolute;
          top: 3px;
          left: 50%;
          width: 34px;
          height: 34px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.18);
          animation: kknPinPulse 2.6s ease-in-out infinite;
        }
        .kkn-pin__body {
          position: absolute;
          top: 0;
          left: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          transform: translateX(-50%);
          border-radius: 999px;
          border: 3px solid rgba(255, 255, 255, 0.96);
          background: linear-gradient(145deg, #10b981 0%, #059669 60%, #065f46 100%);
          box-shadow: 0 10px 22px rgba(4, 120, 87, 0.28);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
        }
        .kkn-pin__body::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -6px;
          width: 12px;
          height: 12px;
          background: #065f46;
          border-right: 3px solid rgba(255, 255, 255, 0.96);
          border-bottom: 3px solid rgba(255, 255, 255, 0.96);
          border-radius: 0 0 4px 0;
          transform: translateX(-50%) rotate(45deg);
          z-index: -1;
        }
        .kkn-pin[data-count="0"] .kkn-pin__body {
          background: linear-gradient(145deg, #94a3b8 0%, #64748b 60%, #475569 100%);
          box-shadow: 0 10px 22px rgba(71, 85, 105, 0.22);
        }
        .kkn-pin[data-count="0"] .kkn-pin__body::after {
          background: #475569;
        }
        .kkn-pin:hover .kkn-pin__body {
          transform: translateX(-50%) translateY(-2px) scale(1.06);
          filter: saturate(1.1);
        }
        @keyframes kknPinPulse {
          0%, 100% { transform: translateX(-50%) scale(0.9); opacity: 0.85; }
          50% { transform: translateX(-50%) scale(1.18); opacity: 0.35; }
        }

        /* Popup styling */
        .kkn-popup-wrapper .maplibregl-popup-content {
          padding: 0;
          border-radius: 16px;
          box-shadow: 0 18px 50px rgba(6, 78, 59, 0.14);
          overflow: hidden;
        }
        .kkn-popup { padding: 14px 16px; font-family: inherit; }
        .kkn-popup__header { margin-bottom: 10px; }
        .kkn-popup__title {
          font-weight: 700;
          font-size: 15px;
          color: #064e3b;
          line-height: 1.25;
          margin: 0;
        }
        .kkn-popup__subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 2px 0 0;
        }
        .kkn-popup__stats {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 10px 0;
        }
        .kkn-popup__stat {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }
        .kkn-popup__stat strong { font-weight: 800; }
        .kkn-popup__stat--sky   { background: #e0f2fe; color: #075985; }
        .kkn-popup__stat--emerald { background: #d1fae5; color: #065f46; }
        .kkn-popup__groups {
          list-style: none;
          margin: 0;
          padding: 8px 0 0;
          border-top: 1px solid #e2e8f0;
          max-height: 180px;
          overflow-y: auto;
        }
        .kkn-popup__group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          padding: 4px 0;
          color: #334155;
        }
        .kkn-popup__group-name {
          font-weight: 600;
          color: #064e3b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1 1 auto;
          min-width: 0;
        }
        .kkn-popup__group-count {
          font-weight: 700;
          color: #9a3412;
          background: #fff7ed;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
        }
        .kkn-popup__empty {
          margin: 8px 0 0;
          font-size: 12px;
          color: #94a3b8;
          font-style: italic;
        }
        .kkn-popup__maps {
          display: block;
          margin-top: 10px;
          padding: 6px 10px;
          background: #059669;
          color: #fff;
          border-radius: 8px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
        }
        .kkn-popup__maps:hover { background: #047857; }
      `}</style>
    </div>
  );
}

// ── Local sub-components ──

function StatChip({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  tone: 'sky' | 'emerald' | 'orange';
}) {
  const palette: Record<typeof tone, { wrap: string; label: string; value: string; iconWrap: string }> = {
    sky: {
      wrap: 'border-sky-100 bg-sky-50/70',
      label: 'text-sky-700',
      value: 'text-sky-900',
      iconWrap: 'bg-sky-100 text-sky-700',
    },
    emerald: {
      wrap: 'border-emerald-100 bg-emerald-50/70',
      label: 'text-emerald-700',
      value: 'text-emerald-900',
      iconWrap: 'bg-emerald-100 text-emerald-700',
    },
    orange: {
      wrap: 'border-orange-100 bg-orange-50/70',
      label: 'text-orange-700',
      value: 'text-orange-900',
      iconWrap: 'bg-orange-100 text-orange-700',
    },
  };
  const p = palette[tone];

  return (
    <div className={`flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 ${p.wrap}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.iconWrap}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className={`text-[0.66rem] font-semibold uppercase tracking-[0.14em] ${p.label}`}>{label}</p>
        <p className={`mt-0.5 text-xl font-bold tabular-nums ${p.value}`}>{value}</p>
      </div>
    </div>
  );
}
