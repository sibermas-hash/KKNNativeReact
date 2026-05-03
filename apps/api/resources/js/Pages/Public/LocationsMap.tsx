import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useLocationsExplorerStore } from '@/Stores/useLocationsExplorerStore';
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    ZoomControl,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import {
    ArrowUpRight,
    Building2,
    Check,
    Compass,
    Copy,
    ExternalLink,
    Filter,
    GraduationCap,
    History,
    Layers,
    Map as MapIcon,
    MapPin,
    Navigation,
    ScanSearch,
    Search,
    Users,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Group {
    id: number;
    nama: string;
    students_count: number;
}

interface Location {
    id: number;
    slug: string;
    path: string;
    name: string;
    district: string;
    regency: string;
    full_name?: string | null;
    latitude: number;
    longitude: number;
    address?: string | null;
    capacity?: number | null;
    maps_url?: string | null;
    students_count?: number;
    groups: Group[];
}

interface Filters {
    search?: string;
    district?: string;
    regency?: string;
}

interface Props {
    locations: Location[];
    config: {
        center: [number, number];
        zoom: number;
    };
    filters: Filters;
    activeLocationId?: number | null;
}

type Tone = 'sky' | 'emerald' | 'orange';

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo(center, zoom, {
            animate: true,
            duration: 1.2,
        });
    }, [center, map, zoom]);

    return null;
}

function FitBoundsOnRequest({
    locations,
    requestKey,
}: {
    locations: Location[];
    requestKey: number;
}) {
    const map = useMap();

    useEffect(() => {
        if (requestKey === 0 || locations.length === 0) {
            return;
        }

        if (locations.length === 1) {
            map.flyTo([locations[0].latitude, locations[0].longitude], 15, {
                animate: true,
                duration: 1.1,
            });

            return;
        }

        const bounds = L.latLngBounds(
            locations.map((location) => [location.latitude, location.longitude] as [number, number]),
        );

        map.fitBounds(bounds, {
            animate: true,
            duration: 1.1,
            padding: [44, 44],
        });
    }, [locations, map, requestKey]);

    return null;
}

function MapSurfaceReset({ onReset }: { onReset: () => void }) {
    useMapEvents({
        click: onReset,
    });

    return null;
}

function createLocationIcon(groupCount: number, isActive: boolean) {
    return L.divIcon({
        className: 'kkn-location-marker-shell',
        html: `
            <div class="kkn-location-marker ${isActive ? 'is-active' : ''}">
                <span class="kkn-location-marker__halo"></span>
                <span class="kkn-location-marker__pin">
                    <span class="kkn-location-marker__count">${groupCount}</span>
                </span>
            </div>
        `,
        iconSize: [48, 60],
        iconAnchor: [24, 54],
        popupAnchor: [0, -42],
    });
}

function totalStudents(location: Location | null | undefined) {
    if (!location) return 0;

    return location.groups.reduce((acc, group) => acc + group.students_count, 0);
}

function formatCoordinate(value: number) {
    return value.toFixed(4);
}

function extractLocationIdFromPathname(pathname: string) {
    const match = pathname.match(/\/lokasi\/(?<id>\d+)(?:-[^/?#]+)?$/);

    return match?.groups?.id ? Number(match.groups.id) : null;
}

export default function LocationsMap({ locations, config, filters, activeLocationId = null }: Props) {
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [activeLocation, setActiveLocation] = useState<Location | null>(null);
    const [detailLocation, setDetailLocation] = useState<Location | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [fitRequestKey, setFitRequestKey] = useState(0);
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [selectedRegency, setSelectedRegency] = useState(filters.regency ?? '');
    const [selectedDistrict, setSelectedDistrict] = useState(filters.district ?? '');
    const [mapCenter, setMapCenter] = useState<[number, number]>(config.center);
    const [mapZoom, setMapZoom] = useState(config.zoom);
    const recentViewedIds = useLocationsExplorerStore((state) => state.recentViewedIds);
    const addRecentViewed = useLocationsExplorerStore((state) => state.addRecentViewed);
    const clearRecentViewed = useLocationsExplorerStore((state) => state.clearRecentViewed);

    const deferredSearch = useDeferredValue(searchInput);
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    const regencyCounts = locations.reduce<Record<string, number>>((acc, location) => {
        acc[location.regency] = (acc[location.regency] ?? 0) + 1;

        return acc;
    }, {});

    const regencyOptions = Object.keys(regencyCounts).sort((a, b) => a.localeCompare(b, 'id'));
    const districtOptions = locations
        .filter((location) => !selectedRegency || location.regency === selectedRegency)
        .reduce<string[]>((acc, location) => {
            if (!acc.includes(location.district)) {
                acc.push(location.district);
            }

            return acc;
        }, [])
        .sort((a, b) => a.localeCompare(b, 'id'));

    const filteredLocations = locations.filter((location) => {
        const matchesSearch =
            normalizedSearch.length === 0 ||
            [location.name, location.district, location.regency, location.address ?? '']
                .join(' ')
                .toLowerCase()
                .includes(normalizedSearch);

        const matchesRegency = !selectedRegency || location.regency === selectedRegency;
        const matchesDistrict = !selectedDistrict || location.district === selectedDistrict;

        return matchesSearch && matchesRegency && matchesDistrict;
    });

    const filteredGroups = filteredLocations.reduce((acc, location) => acc + location.groups.length, 0);
    const filteredStudents = filteredLocations.reduce((acc, location) => acc + totalStudents(location), 0);
    const filteredRegencyCount = new Set(filteredLocations.map((location) => location.regency)).size;
    const quickJumpLocations = filteredLocations.slice(0, 6);
    const recentViewedLocations = recentViewedIds
        .map((id) => locations.find((location) => location.id === id) ?? null)
        .filter((location): location is Location => Boolean(location));
    const nearbyLocations = activeLocation
        ? filteredLocations
              .filter(
                  (location) =>
                      location.id !== activeLocation.id && location.district === activeLocation.district,
              )
              .slice(0, 4)
        : [];
    const detailNearbyLocations = detailLocation
        ? filteredLocations
              .filter(
                  (location) =>
                      location.id !== detailLocation.id && location.district === detailLocation.district,
              )
              .slice(0, 4)
        : [];
    const hasFilters = Boolean(normalizedSearch || selectedRegency || selectedDistrict);
    const currentQueryParams = {
        ...(normalizedSearch ? { search: deferredSearch.trim() } : {}),
        ...(selectedRegency ? { regency: selectedRegency } : {}),
        ...(selectedDistrict ? { district: selectedDistrict } : {}),
    };

    const handleFlyTo = (location: Location, nextZoom = 14) => {
        setActiveLocation(location);
        setMapCenter([location.latitude, location.longitude]);
        setMapZoom(nextZoom);
        setViewMode('map');
    };

    const openLocationDetail = (location: Location, mode: 'push' | 'replace' = 'push') => {
        handleFlyTo(location, 15);
        setDetailLocation(location);
        setCopiedLink(false);
        addRecentViewed(location.id);

        if (typeof window !== 'undefined') {
            const query = new URLSearchParams(currentQueryParams as Record<string, string>).toString();
            const nextUrl = `${location.path}${query ? `?${query}` : ''}`;
            const historyMethod = mode === 'replace' ? 'replaceState' : 'pushState';

            window.history[historyMethod]({}, '', nextUrl);
        }
    };

    const closeLocationDetail = () => {
        setDetailLocation(null);
        setCopiedLink(false);

        if (typeof window !== 'undefined') {
            const query = new URLSearchParams(currentQueryParams as Record<string, string>).toString();
            const nextUrl = `/lokasi${query ? `?${query}` : ''}`;
            window.history.replaceState({}, '', nextUrl);
        }
    };

    const resetFilters = () => {
        setSearchInput('');
        setSelectedRegency('');
        setSelectedDistrict('');
        setActiveLocation(null);
        setDetailLocation(null);
        setMapCenter(config.center);
        setMapZoom(config.zoom);
        setFitRequestKey((value) => value + 1);
    };

    const handleFitToResults = () => {
        if (filteredLocations.length === 0) {
            return;
        }

        setActiveLocation(filteredLocations[0] ?? null);
        setDetailLocation(null);
        setViewMode('map');
        setFitRequestKey((value) => value + 1);
    };

    const handleCopyLink = async () => {
        if (typeof window === 'undefined' || !detailLocation) {
            return;
        }

        const absoluteUrl = `${window.location.origin}${detailLocation.path}`;

        try {
            await navigator.clipboard.writeText(absoluteUrl);
            setCopiedLink(true);
            window.setTimeout(() => setCopiedLink(false), 1800);
        } catch {
            setCopiedLink(false);
        }
    };

    useEffect(() => {
        if (selectedDistrict && !districtOptions.includes(selectedDistrict)) {
            setSelectedDistrict('');
        }
    }, [districtOptions, selectedDistrict]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const params = new URLSearchParams();

        if (normalizedSearch) {
            params.set('search', deferredSearch.trim());
        }

        if (selectedRegency) {
            params.set('regency', selectedRegency);
        }

        if (selectedDistrict) {
            params.set('district', selectedDistrict);
        }

        const basePath = detailLocation?.path ?? '/lokasi';
        const nextUrl = `${basePath}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', nextUrl);
    }, [deferredSearch, detailLocation, normalizedSearch, selectedDistrict, selectedRegency]);

    useEffect(() => {
        if (activeLocation && !filteredLocations.some((location) => location.id === activeLocation.id)) {
            setActiveLocation(null);
        }

        if (detailLocation && !filteredLocations.some((location) => location.id === detailLocation.id)) {
            setDetailLocation(null);
            setCopiedLink(false);
        }

        if (!activeLocation && hasFilters && filteredLocations.length === 1) {
            handleFlyTo(filteredLocations[0], 15);
        }
    }, [activeLocation, detailLocation, filteredLocations, hasFilters]);

    useEffect(() => {
        if (!activeLocationId) {
            setDetailLocation(null);

            return;
        }

        const matchedLocation = locations.find((location) => location.id === activeLocationId) ?? null;

        if (matchedLocation) {
            setDetailLocation(matchedLocation);
            setActiveLocation(matchedLocation);
            setMapCenter([matchedLocation.latitude, matchedLocation.longitude]);
            setMapZoom(15);
            setViewMode('map');
            setCopiedLink(false);
            addRecentViewed(matchedLocation.id);
        }
    }, [activeLocationId, addRecentViewed, locations]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const syncFromPath = () => {
            const detailId = extractLocationIdFromPathname(window.location.pathname);

            if (!detailId) {
                setDetailLocation(null);
                setCopiedLink(false);

                return;
            }

            const matchedLocation = locations.find((location) => location.id === detailId) ?? null;

            if (matchedLocation) {
                handleFlyTo(matchedLocation, 15);
                setDetailLocation(matchedLocation);
                addRecentViewed(matchedLocation.id);
            }
        };

        const handlePopState = () => {
            syncFromPath();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [addRecentViewed, locations]);

    return (
        <PublicLayout>
            <Head title="Lokasi | SIBERMAS KKN UIN SAIZU" />

            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.10),_transparent_18%),radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.10),_transparent_34%),linear-gradient(180deg,#f7fbfb_0%,#ffffff_52%,#f8fcfa_100%)]">
                <section className="border-b border-slate-200/80 pb-8 pt-12 lg:pt-14">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="space-y-4">
                            <p className="atlas-kicker text-sky-600">Peta Publik</p>
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                                <div className="max-w-3xl">
                                    <h1 className="atlas-title text-emerald-950">Peta sebaran lokasi KKN.</h1>
                                    <p className="atlas-body mt-3 max-w-2xl text-slate-600">
                                        Cari desa, kecamatan, atau kabupaten, lalu klik titik pada peta untuk membuka
                                        detail lokasi penempatan.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[27rem]">
                                    <StatChip label="Lokasi" value={`${filteredLocations.length}`} tone="sky" />
                                    <StatChip label="Kelompok" value={`${filteredGroups}`} tone="emerald" />
                                    <StatChip label="Mahasiswa" value={`${filteredStudents}`} tone="orange" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="pb-12 pt-5">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <motion.section
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(14,165,233,0.04)_0%,rgba(255,255,255,1)_20%,rgba(255,255,255,1)_100%)] p-4 shadow-[0_18px_60px_rgba(6,78,59,0.06)]"
                        >
                            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_220px_220px_auto]">
                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-500"
                                    />
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            startTransition(() => setSearchInput(value));
                                        }}
                                        placeholder="Cari desa, kecamatan, kabupaten, atau alamat..."
                                        className="h-12 w-full rounded-[1rem] border border-sky-100 bg-white pl-11 pr-4 text-sm text-emerald-950 shadow-none outline-none transition-colors focus:border-sky-300"
                                    />

                                    {normalizedSearch.length > 0 && quickJumpLocations.length > 0 && (
                                        <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(6,78,59,0.08)]">
                                            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-sky-700">
                                                <ScanSearch size={13} />
                                                Quick Jump
                                            </div>
                                            <div className="max-h-72 overflow-y-auto py-1 custom-scrollbar">
                                                {quickJumpLocations.map((location) => (
                                                    <button
                                                        key={location.id}
                                                        type="button"
                                                        onClick={() => openLocationDetail(location)}
                                                        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-sky-50"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-emerald-950">
                                                                {location.name}
                                                            </p>
                                                            <p className="mt-1 text-[0.72rem] text-slate-600">
                                                                {location.district}, {location.regency}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full bg-orange-50 px-2 py-1 text-[0.65rem] font-semibold text-orange-700">
                                                            {location.groups.length}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <Building2
                                        size={16}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"
                                    />
                                    <select
                                        value={selectedRegency}
                                        onChange={(event) => setSelectedRegency(event.target.value)}
                                        className="h-12 w-full rounded-[1rem] border border-emerald-100 bg-white pl-11 pr-10 text-sm font-semibold text-emerald-950 shadow-none outline-none transition-colors focus:border-emerald-300"
                                    >
                                        <option value="">Semua kabupaten</option>
                                        {regencyOptions.map((regency) => (
                                            <option key={regency} value={regency}>
                                                {regency}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="relative">
                                    <Compass
                                        size={16}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"
                                    />
                                    <select
                                        value={selectedDistrict}
                                        onChange={(event) => setSelectedDistrict(event.target.value)}
                                        className="h-12 w-full rounded-[1rem] border border-orange-100 bg-white pl-11 pr-10 text-sm font-semibold text-emerald-950 shadow-none outline-none transition-colors focus:border-orange-300"
                                    >
                                        <option value="">Semua kecamatan</option>
                                        {districtOptions.map((district) => (
                                            <option key={district} value={district}>
                                                {district}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50/80 p-1">
                                        {[
                                            { id: 'map', label: 'Peta', icon: MapIcon },
                                            { id: 'list', label: 'Daftar', icon: Layers },
                                        ].map(({ id, label, icon: Icon }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setViewMode(id as 'map' | 'list')}
                                                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                                                    viewMode === id
                                                        ? id === 'map'
                                                            ? 'bg-sky-600 text-white'
                                                            : 'bg-orange-500 text-white'
                                                        : 'text-emerald-700 hover:bg-white'
                                                }`}
                                            >
                                                <Icon size={14} />
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {hasFilters && (
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 transition-colors hover:bg-slate-50"
                                        >
                                            <X size={14} />
                                            Reset
                                        </button>
                                    )}

                                    {filteredLocations.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleFitToResults}
                                            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 transition-colors hover:bg-sky-100"
                                        >
                                            <ScanSearch size={14} />
                                            Fit hasil
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sky-700">
                                    <Filter size={13} />
                                    {hasFilters ? 'Filter aktif' : 'Semua lokasi'}
                                </span>
                                {Object.entries(regencyCounts)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 4)
                                    .map(([regency, count]) => (
                                        <button
                                            key={regency}
                                            type="button"
                                            onClick={() =>
                                                setSelectedRegency(selectedRegency === regency ? '' : regency)
                                            }
                                            className={`rounded-full border px-3 py-2 text-[0.72rem] font-semibold transition-colors ${
                                                selectedRegency === regency
                                                    ? 'border-orange-500 bg-orange-500 text-white'
                                                    : 'border-slate-200 bg-white text-emerald-700 hover:border-sky-200 hover:bg-sky-50'
                                            }`}
                                        >
                                            {regency} · {count}
                                        </button>
                                    ))}
                            </div>

                            {recentViewedLocations.length > 0 && !detailLocation && (
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                        <History size={13} />
                                        Terakhir dibuka
                                    </span>
                                    {recentViewedLocations.slice(0, 4).map((location) => (
                                        <button
                                            key={location.id}
                                            type="button"
                                            onClick={() => openLocationDetail(location)}
                                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[0.72rem] font-semibold text-emerald-700 transition-colors hover:border-sky-200 hover:bg-sky-50"
                                        >
                                            {location.name}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={clearRecentViewed}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[0.72rem] font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                                    >
                                        Bersihkan
                                    </button>
                                </div>
                            )}
                        </motion.section>

                        {viewMode === 'map' ? (
                            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                                <motion.section
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-[1.6rem] border border-slate-200/80 bg-white p-3 shadow-[0_18px_60px_rgba(6,78,59,0.06)]"
                                >
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[1rem] bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,rgba(16,185,129,0.08)_50%,rgba(245,158,11,0.08)_100%)] px-3 py-2.5">
                                        <div className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-emerald-950">
                                            {filteredLocations.length} lokasi · {filteredGroups} kelompok · {filteredRegencyCount} kabupaten
                                        </div>
                                        <div className="text-sm text-slate-600">Klik pin untuk detail cepat</div>
                                    </div>

                                    <div className="overflow-hidden rounded-[1.2rem] border border-slate-200">
                                        <MapContainer
                                            center={mapCenter}
                                            zoom={mapZoom}
                                            scrollWheelZoom
                                            zoomControl={false}
                                            className="h-[31rem] w-full md:h-[37rem] xl:h-[41rem]"
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <ZoomControl position="bottomright" />
                                            <ChangeView center={mapCenter} zoom={mapZoom} />
                                            <FitBoundsOnRequest
                                                locations={filteredLocations}
                                                requestKey={fitRequestKey}
                                            />
                                            <MapSurfaceReset onReset={() => setActiveLocation(null)} />

                                            {filteredLocations.map((location) => (
                                                <Marker
                                                    key={location.id}
                                                    position={[location.latitude, location.longitude]}
                                                    icon={createLocationIcon(
                                                        location.groups.length,
                                                        activeLocation?.id === location.id,
                                                    )}
                                                    eventHandlers={{
                                                        click: () => setActiveLocation(location),
                                                    }}
                                                >
                                                    <Popup className="premium-popup">
                                                        <div className="min-w-[230px] p-1">
                                                            <div className="mb-3 rounded-[1rem] bg-sky-50/75 p-3">
                                                                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-sky-600">
                                                                    Titik Penempatan
                                                                </div>
                                                                <h3 className="atlas-card-title mt-1 text-emerald-950">
                                                                    {location.name}
                                                                </h3>
                                                                <p className="mt-1 text-xs leading-5 text-emerald-700">
                                                                    {location.address ||
                                                                        `${location.district}, ${location.regency}`}
                                                                </p>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {location.groups.map((group) => (
                                                                    <div
                                                                        key={group.id}
                                                                        className="flex items-center justify-between rounded-[0.95rem] border border-slate-200 bg-white px-3 py-2"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <div className="truncate text-xs font-semibold text-emerald-950">
                                                                                {group.nama}
                                                                            </div>
                                                                            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-sky-600">
                                                                                Kelompok aktif
                                                                            </div>
                                                                        </div>
                                                                        <span className="rounded-full bg-orange-50 px-2 py-1 text-[0.65rem] font-semibold text-orange-700">
                                                                            {group.students_count} mhs
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => openLocationDetail(location)}
                                                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
                                                            >
                                                                Buka detail
                                                                <ArrowUpRight size={14} />
                                                            </button>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            ))}
                                        </MapContainer>
                                    </div>
                                </motion.section>

                                <motion.aside
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.04)_0%,rgba(255,255,255,1)_20%,rgba(255,255,255,1)_100%)] p-4 shadow-[0_18px_60px_rgba(6,78,59,0.06)]"
                                >
                                    <AnimatePresence mode="wait">
                                        {activeLocation ? (
                                            <motion.div
                                                key={activeLocation.id}
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 14 }}
                                                className="space-y-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sky-600">
                                                            Detail Lokasi
                                                        </p>
                                                        <h2 className="atlas-title mt-2 text-[2rem] text-emerald-950">
                                                            {activeLocation.name}
                                                        </h2>
                                                        <p className="mt-2 text-sm leading-7 text-slate-600">
                                                            {activeLocation.address ||
                                                                `${activeLocation.district}, ${activeLocation.regency}`}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveLocation(null)}
                                                        className="rounded-full border border-slate-200 bg-white p-2 text-emerald-700 transition-colors hover:bg-slate-50"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <CompactInfo
                                                        label="Kelompok"
                                                        value={`${activeLocation.groups.length}`}
                                                        tone="emerald"
                                                    />
                                                    <CompactInfo
                                                        label="Mahasiswa"
                                                        value={`${totalStudents(activeLocation)}`}
                                                        tone="orange"
                                                    />
                                                </div>

                                                <div className="rounded-[1.2rem] border border-sky-100 bg-sky-50/45 p-4">
                                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sky-600">
                                                        Koordinat
                                                    </p>
                                                    <p className="mt-2 text-sm font-semibold text-emerald-950">
                                                        {formatCoordinate(activeLocation.latitude)} / {formatCoordinate(activeLocation.longitude)}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openLocationDetail(activeLocation)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-sky-700"
                                                    >
                                                        Buka detail penuh
                                                        <ArrowUpRight size={14} />
                                                    </button>
                                                    <a
                                                        href={activeLocation.maps_url ?? '#'}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 transition-colors hover:bg-orange-100"
                                                    >
                                                        Google Maps
                                                        <ExternalLink size={14} />
                                                    </a>
                                                </div>

                                                <div>
                                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-orange-600">
                                                        Susunan Kelompok
                                                    </p>
                                                    <div className="mt-3 max-h-[15rem] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                                                        {activeLocation.groups.map((group) => (
                                                            <div
                                                                key={group.id}
                                                                className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3"
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-semibold text-emerald-950">
                                                                            {group.nama}
                                                                        </p>
                                                                    </div>
                                                                    <span className="rounded-full bg-orange-50 px-2 py-1 text-[0.65rem] font-semibold text-orange-700">
                                                                        {group.students_count} mhs
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {nearbyLocations.length > 0 && (
                                                    <div>
                                                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sky-600">
                                                            Lokasi Sekitar
                                                        </p>
                                                        <div className="mt-3 space-y-2">
                                                            {nearbyLocations.map((location) => (
                                                                <button
                                                                    key={location.id}
                                                                    type="button"
                                                                    onClick={() => openLocationDetail(location)}
                                                                    className="flex w-full items-center justify-between rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-sky-50"
                                                                >
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-emerald-950">
                                                                            {location.name}
                                                                        </p>
                                                                        <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-orange-600">
                                                                            {location.groups.length} kelompok
                                                                        </p>
                                                                    </div>
                                                                    <ArrowUpRight size={15} className="text-sky-600" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="empty"
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 14 }}
                                                className="space-y-4"
                                            >
                                                <div className="rounded-[1.2rem] bg-emerald-50/60 p-4">
                                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sky-600">
                                                        Petunjuk
                                                    </p>
                                                    <h2 className="atlas-card-title mt-2 text-[1.35rem] text-emerald-950">
                                                        Klik satu titik pada peta.
                                                    </h2>
                                                    <p className="mt-2 text-sm leading-7 text-slate-600">
                                                        Detail lokasi, komposisi kelompok, dan daftar desa sekitar akan
                                                        muncul di panel ini.
                                                    </p>
                                                </div>

                                                <CompactInfo
                                                    label="Kabupaten aktif"
                                                    value={`${filteredRegencyCount}`}
                                                    tone="sky"
                                                />
                                                <CompactInfo
                                                    label="Lokasi tampil"
                                                    value={`${filteredLocations.length}`}
                                                    tone="emerald"
                                                />
                                                <CompactInfo
                                                    label="Mahasiswa"
                                                    value={`${filteredStudents}`}
                                                    tone="orange"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.aside>
                            </div>
                        ) : (
                            <motion.section
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-5"
                            >
                                {filteredLocations.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {filteredLocations.map((location) => (
                                            <button
                                                key={location.id}
                                                type="button"
                                                onClick={() => openLocationDetail(location)}
                                                className="rounded-[1.4rem] border border-slate-200 bg-white p-5 text-left shadow-[0_14px_45px_rgba(6,78,59,0.05)] transition-transform hover:-translate-y-1"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                                                            {location.district}
                                                        </p>
                                                        <h3 className="atlas-card-title mt-2 text-emerald-950">
                                                            {location.name}
                                                        </h3>
                                                    </div>
                                                    <div className="rounded-full bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(16,185,129,0.14),rgba(245,158,11,0.12))] p-3 text-emerald-700">
                                                        <MapPin size={16} />
                                                    </div>
                                                </div>

                                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                                    {location.address || `${location.district}, ${location.regency}`}
                                                </p>

                                                <div className="mt-4 grid grid-cols-3 gap-2">
                                                    <CompactInfo compact label="Kab." value={location.regency} tone="sky" />
                                                    <CompactInfo
                                                        compact
                                                        label="Kelompok"
                                                        value={`${location.groups.length}`}
                                                        tone="emerald"
                                                    />
                                                    <CompactInfo
                                                        compact
                                                        label="Mahasiswa"
                                                        value={`${totalStudents(location)}`}
                                                        tone="orange"
                                                    />
                                                </div>

                                                <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                                    Buka detail lokasi
                                                    <ArrowUpRight size={14} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-white p-10 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(16,185,129,0.10),rgba(245,158,11,0.10))] text-emerald-600">
                                            <Search size={22} />
                                        </div>
                                        <h2 className="atlas-card-title mt-4 text-[1.35rem] text-emerald-950">
                                            Tidak ada lokasi yang cocok.
                                        </h2>
                                        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                                            Hapus sebagian filter atau gunakan kata kunci yang lebih umum agar data
                                            lokasi kembali tampil.
                                        </p>
                                    </div>
                                )}
                            </motion.section>
                        )}
                    </div>
                </section>
            </div>

            <AnimatePresence>
                {detailLocation && (
                    <>
                        <motion.button
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeLocationDetail}
                            className="fixed inset-0 z-[70] bg-slate-950/28 backdrop-blur-[2px]"
                            aria-label="Tutup detail lokasi"
                        />

                        <motion.aside
                            initial={{ opacity: 0, y: 32 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 24 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="fixed inset-x-0 bottom-0 z-[80] max-h-[85vh] overflow-hidden rounded-t-[1.8rem] border border-slate-200 bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.16)] lg:inset-y-[5.25rem] lg:right-6 lg:left-auto lg:w-[31rem] lg:max-h-none lg:rounded-[1.8rem]"
                        >
                            <div className="flex h-full flex-col">
                                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 lg:px-6">
                                    <div className="min-w-0">
                                        <p className="atlas-kicker text-sky-600">Detail Lokasi</p>
                                        <h2 className="atlas-title mt-2 text-[2rem] text-emerald-950">
                                            {detailLocation.name}
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {detailLocation.full_name || detailLocation.address || `${detailLocation.district}, ${detailLocation.regency}`}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeLocationDetail}
                                        className="rounded-full border border-slate-200 bg-white p-2 text-emerald-700 transition-colors hover:bg-slate-50"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 lg:px-6">
                                    <div className="grid grid-cols-3 gap-3">
                                        <CompactInfo
                                            label="Kelompok"
                                            value={`${detailLocation.groups.length}`}
                                            tone="emerald"
                                        />
                                        <CompactInfo
                                            label="Mahasiswa"
                                            value={`${totalStudents(detailLocation)}`}
                                            tone="orange"
                                        />
                                        <CompactInfo
                                            label="Kabupaten"
                                            value={detailLocation.regency}
                                            tone="sky"
                                        />
                                    </div>

                                    <div className="rounded-[1.35rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(16,185,129,0.06),rgba(245,158,11,0.08))] p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="space-y-2">
                                                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sky-700">
                                                    Ringkasan Lokasi
                                                </p>
                                                <p className="text-sm leading-6 text-emerald-950">
                                                    {detailLocation.address || `${detailLocation.name}, ${detailLocation.district}, ${detailLocation.regency}`}
                                                </p>
                                            </div>
                                            <div className="rounded-full bg-white/85 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-orange-700">
                                                URL aktif
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-[1rem] border border-white/70 bg-white/85 p-3">
                                                <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-sky-700">
                                                    <Navigation size={13} />
                                                    Koordinat
                                                </div>
                                                <p className="mt-2 text-sm font-semibold text-emerald-950">
                                                    {formatCoordinate(detailLocation.latitude)} / {formatCoordinate(detailLocation.longitude)}
                                                </p>
                                            </div>
                                            <div className="rounded-[1rem] border border-white/70 bg-white/85 p-3">
                                                <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                                    <MapPin size={13} />
                                                    Kecamatan
                                                </div>
                                                <p className="mt-2 text-sm font-semibold text-emerald-950">
                                                    {detailLocation.district}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <a
                                            href={detailLocation.maps_url ?? '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-sky-700"
                                        >
                                            Buka Google Maps
                                            <ExternalLink size={14} />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleFlyTo(detailLocation, 15);
                                                closeLocationDetail();
                                            }}
                                            className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 transition-colors hover:bg-orange-100"
                                        >
                                            Fokus ke peta
                                            <ArrowUpRight size={14} />
                                        </button>
                                    </div>

                                    <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50/65 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sky-700">
                                                    Bagikan lokasi
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    Salin tautan detail desa ini untuk dibuka ulang atau dibagikan.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCopyLink}
                                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                                                    copiedLink
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'border border-slate-200 bg-white text-emerald-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                                                {copiedLink ? 'Tersalin' : 'Copy link'}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                            <Users size={14} />
                                            Komposisi Kelompok
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {detailLocation.groups.map((group) => (
                                                <div
                                                    key={group.id}
                                                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-emerald-950">
                                                                {group.nama}
                                                            </p>
                                                            <p className="mt-1 flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-sky-700">
                                                                <GraduationCap size={12} />
                                                                Kelompok aktif
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[0.68rem] font-semibold text-orange-700">
                                                            {group.students_count} mhs
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {detailNearbyLocations.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-sky-700">
                                                <MapIcon size={14} />
                                                Lokasi Sekitar
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                {detailNearbyLocations.map((location) => (
                                                    <button
                                                        key={location.id}
                                                        type="button"
                                                        onClick={() => openLocationDetail(location)}
                                                        className="flex w-full items-center justify-between rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-sky-50"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-semibold text-emerald-950">
                                                                {location.name}
                                                            </p>
                                                            <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-orange-600">
                                                                {location.groups.length} kelompok · {totalStudents(location)} mahasiswa
                                                            </p>
                                                        </div>
                                                        <ArrowUpRight size={15} className="text-sky-600" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <style>{`
                .kkn-location-marker-shell {
                    background: transparent;
                    border: 0;
                }

                .kkn-location-marker {
                    position: relative;
                    display: block;
                    width: 44px;
                    height: 58px;
                }

                .kkn-location-marker__halo {
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    width: 34px;
                    height: 34px;
                    transform: translateX(-50%);
                    border-radius: 999px;
                    background: rgba(14, 165, 233, 0.16);
                    animation: kknMarkerPulse 2.6s ease-in-out infinite;
                }

                .kkn-location-marker__pin {
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
                    background: linear-gradient(145deg, #0ea5e9 0%, #059669 56%, #f59e0b 100%);
                    box-shadow: 0 12px 24px rgba(2, 132, 199, 0.22);
                    color: white;
                    font-size: 11px;
                    font-weight: 800;
                    transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
                }

                .kkn-location-marker__pin::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    bottom: -6px;
                    width: 12px;
                    height: 12px;
                    background: #f59e0b;
                    border-right: 3px solid rgba(255, 255, 255, 0.96);
                    border-bottom: 3px solid rgba(255, 255, 255, 0.96);
                    border-radius: 0 0 4px 0;
                    transform: translateX(-50%) rotate(45deg);
                    z-index: -1;
                }

                .kkn-location-marker__count {
                    letter-spacing: 0;
                    line-height: 1;
                }

                .kkn-location-marker.is-active .kkn-location-marker__pin {
                    transform: translateX(-50%) translateY(-3px) scale(1.08);
                    box-shadow: 0 16px 34px rgba(245, 158, 11, 0.22);
                    filter: saturate(1.15);
                }

                .kkn-location-marker.is-active .kkn-location-marker__halo {
                    background: rgba(245, 158, 11, 0.18);
                }

                .premium-popup .leaflet-popup-content-wrapper {
                    border-radius: 1.2rem;
                    padding: 0;
                    box-shadow: 0 18px 50px rgba(6, 78, 59, 0.14);
                }

                .premium-popup .leaflet-popup-content {
                    margin: 0.6rem;
                }

                .leaflet-container {
                    font-family: inherit;
                }

                .leaflet-control-zoom {
                    border: 0 !important;
                    box-shadow: 0 16px 40px rgba(6, 78, 59, 0.14) !important;
                }

                .leaflet-control-zoom a {
                    border: 0 !important;
                    color: #065f46 !important;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #a7f3d0;
                    border-radius: 999px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6ee7b7;
                }

                @keyframes kknMarkerPulse {
                    0%,
                    100% {
                        transform: scale(0.92);
                        opacity: 0.85;
                    }

                    50% {
                        transform: scale(1.16);
                        opacity: 0.35;
                    }
                }
            `}</style>
        </PublicLayout>
    );
}

const toneStyles: Record<
    Tone,
    {
        shell: string;
        label: string;
        value: string;
    }
> = {
    sky: {
        shell: 'border-sky-100 bg-[linear-gradient(180deg,rgba(14,165,233,0.08)_0%,rgba(255,255,255,1)_100%)]',
        label: 'text-sky-700',
        value: 'text-emerald-950',
    },
    emerald: {
        shell: 'border-emerald-100 bg-[linear-gradient(180deg,rgba(16,185,129,0.08)_0%,rgba(255,255,255,1)_100%)]',
        label: 'text-emerald-700',
        value: 'text-emerald-950',
    },
    orange: {
        shell: 'border-orange-100 bg-[linear-gradient(180deg,rgba(245,158,11,0.08)_0%,rgba(255,255,255,1)_100%)]',
        label: 'text-orange-700',
        value: 'text-emerald-950',
    },
};

function StatChip({
    label,
    value,
    tone = 'emerald',
}: {
    label: string;
    value: string;
    tone?: Tone;
}) {
    const style = toneStyles[tone];

    return (
        <div
            className={`rounded-[1.15rem] border px-4 py-3 shadow-[0_12px_35px_rgba(6,78,59,0.04)] ${style.shell}`}
        >
            <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${style.label}`}>{label}</p>
            <p className={`mt-1.5 text-xl font-display font-bold ${style.value}`}>{value}</p>
        </div>
    );
}

function CompactInfo({
    label,
    value,
    compact = false,
    tone = 'emerald',
}: {
    label: string;
    value: string;
    compact?: boolean;
    tone?: Tone;
}) {
    const style = toneStyles[tone];

    return (
        <div
            className={`rounded-[1rem] border ${style.shell} ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}
        >
            <p className={`text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${style.label}`}>{label}</p>
            <p className={`mt-1.5 font-display font-bold ${style.value} ${compact ? 'text-sm' : 'text-lg'}`}>
                {value}
            </p>
        </div>
    );
}
