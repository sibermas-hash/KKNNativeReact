'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl, { type Map, type Marker, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Navigation2, Locate } from 'lucide-react';

type LatLng = { lat: number; lng: number };

type MapStyleKey = 'street' | 'satellite' | 'dark';

const DEFAULT_CENTER: LatLng = { lat: -7.4246, lng: 109.2342 }; // Purwokerto

/**
 * Tile providers:
 *
 *   - `street`     → CARTO Voyager. Lebih bersih & modern dibanding OSM raw
 *                    (label readable, contrast enak di desktop+mobile).
 *   - `satellite`  → Esri World Imagery. Foto satelit resolusi tinggi + label
 *                    reference overlay.
 *   - `dark`       → CARTO Dark Matter. Minimal dark mode — enak untuk
 *                    malam / visual presentasi.
 *
 * Semua free-tier tanpa API key (CARTO basemaps terms of use mengizinkan
 * non-commercial/commercial dengan attribution; Esri free for non-commercial).
 * Kalau mau vector-tile dengan 3D buildings nanti, swap ke MapTiler basic
 * via `NEXT_PUBLIC_MAPTILER_KEY` env.
 */
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
          'Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
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

const STYLE_OPTIONS: Array<{ key: MapStyleKey; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: 'street', label: 'Peta', icon: Layers },
  { key: 'satellite', label: 'Satelit', icon: Navigation2 },
  { key: 'dark', label: 'Gelap', icon: Layers },
];

/**
 * Address picker with an interactive MapLibre map.
 *
 * UX additions vs. prior minimal version:
 *   - 3 basemap styles (CARTO Voyager / Esri satellite / CARTO dark).
 *   - Animated pulse marker so the chosen point is always visible.
 *   - NavigationControl (zoom + compass) + ScaleControl + FullscreenControl +
 *     GeolocateControl (browser GPS; when granted, centers + places pin).
 *   - Loading overlay that hides once tiles paint.
 *   - Hints directly below the map for both empty & selected states.
 *   - Map remains keyboard-accessible (MapLibre arrow-key pan built-in).
 */
export default function AddressMapPicker({
  value,
  disabled,
  onChange,
}: {
  value: LatLng | null;
  disabled?: boolean;
  onChange: (value: LatLng) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const geolocateRef = useRef<maplibregl.GeolocateControl | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [activeStyle, setActiveStyle] = useState<MapStyleKey>('street');
  const [loading, setLoading] = useState(true);

  // Initialize map exactly once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = value ?? DEFAULT_CENTER;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[activeStyle],
      center: [center.lng, center.lat],
      zoom: value ? 15 : 12,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      cooperativeGestures: false,
      maxZoom: 20,
      minZoom: 5,
      transformRequest: (url) => {
        if (url.startsWith('https://server.arcgisonline.com/')) {
          return { url, headers: { 'Referer': 'https://sibermas.uinsaizu.ac.id/' } };
        }
      },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true, timeout: 10_000 },
      trackUserLocation: false,
      showAccuracyCircle: true,
    });
    map.addControl(geolocate, 'top-right');
    geolocateRef.current = geolocate;

    geolocate.on('geolocate', (e) => {
      const anyEvent = e as unknown as { coords?: { latitude: number; longitude: number } };
      if (!disabled && anyEvent.coords) {
        onChangeRef.current({ lat: anyEvent.coords.latitude, lng: anyEvent.coords.longitude });
      }
    });

    map.on('click', (event) => {
      if (disabled) return;
      onChangeRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    map.on('load', () => setLoading(false));
    map.on('idle', () => setLoading(false));
    map.on('error', (e) => {
      if (e.error?.status === 403 || e.error?.status === 404) return;
      console.warn('[MapLibre]', e.error?.message ?? e.error);
    });

    const loadingTimeout = window.setTimeout(() => setLoading(false), 15_000);

    mapRef.current = map;

    return () => {
      window.clearTimeout(loadingTimeout);
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch basemap style without destroying the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setLoading(true);

    let cancelled = false;
    const timeout = window.setTimeout(() => { if (!cancelled) setLoading(false); }, 15_000);

    map.setStyle(STYLES[activeStyle]);
    map.once('idle', () => { if (!cancelled) { window.clearTimeout(timeout); setLoading(false); } });

    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [activeStyle]);

  // Sync marker position + draggable state with `value` prop.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const lngLat: [number, number] = [value.lng, value.lat];
    if (!markerRef.current) {
      const wrapper = document.createElement('div');
      wrapper.className = 'pointer-events-auto relative flex h-16 w-16 -translate-x-1/2 -translate-y-full items-center justify-center';
      wrapper.innerHTML = `
        <span class="absolute inset-x-0 bottom-1 mx-auto h-3 w-3 rounded-full bg-rose-500/30 blur-sm"></span>
        <span class="absolute bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-rose-500/40 animate-ping"></span>
        <svg viewBox="0 0 40 48" class="relative h-14 w-12 drop-shadow-[0_14px_20px_rgba(0,0,0,0.35)]" aria-hidden="true">
          <path d="M20 46C20 46 35 27.8 35 15.8C35 7.1 28.3 2 20 2S5 7.1 5 15.8C5 27.8 20 46 20 46Z"
                fill="url(#pinGrad)" stroke="white" stroke-width="2.5"/>
          <circle cx="20" cy="16" r="6" fill="white"/>
          <defs>
            <linearGradient id="pinGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#F43F5E"/>
              <stop offset="100%" stop-color="#E11D48"/>
            </linearGradient>
          </defs>
        </svg>
      `;
      markerRef.current = new maplibregl.Marker({ element: wrapper, draggable: !disabled, anchor: 'bottom' })
        .setLngLat(lngLat)
        .addTo(map);
      markerRef.current.on('dragend', () => {
        const next = markerRef.current?.getLngLat();
        if (next) onChangeRef.current({ lat: next.lat, lng: next.lng });
      });
    } else {
      markerRef.current.setLngLat(lngLat);
      markerRef.current.setDraggable(!disabled);
    }

    map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), 16), duration: 700 });
  }, [value, disabled]);

  const handleLocate = useCallback(() => {
    geolocateRef.current?.trigger();
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--profile-border)] bg-[color:var(--profile-input)] shadow-sm">
        <div ref={containerRef} className="h-80 w-full md:h-96" aria-label="Peta pemilih alamat" />

        {/* Style switcher — overlay kiri-atas */}
        <div className="absolute left-3 top-3 z-10 flex overflow-hidden rounded-xl bg-white/95 shadow-md ring-1 ring-slate-200 backdrop-blur-sm">
          {STYLE_OPTIONS.map(({ key, label, icon: Icon }) => {
            const active = activeStyle === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveStyle(key)}
                aria-pressed={active}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Locate-me shortcut — overlay kanan-bawah (di atas attribution) */}
        <button
          type="button"
          onClick={handleLocate}
          disabled={disabled}
          className="absolute bottom-14 right-3 z-10 inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 backdrop-blur-sm"
        >
          <Locate size={12} />
          Lokasi Saya
        </button>

        {/* Loading overlay */}
        {loading && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-md ring-1 ring-slate-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
              Memuat peta...
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[color:var(--profile-muted)]">
        <span>
          {value
            ? 'Titik alamat KTP sudah dipilih. Klik peta, geser pin, atau tekan "Lokasi Saya" untuk koreksi.'
            : 'Klik peta, tekan "Lokasi Saya", atau ketik alamat di bawah untuk menentukan titik KTP.'}
        </span>
        {value && (
          <span className="rounded-lg bg-[color:var(--profile-soft)] px-3 py-1.5 font-mono tabular-nums text-[color:var(--profile-soft-text)]">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
}
