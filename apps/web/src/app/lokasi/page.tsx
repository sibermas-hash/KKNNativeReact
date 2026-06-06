import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-api';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import type { MapLocation } from '@/components/public/locations-map';
import LocationsMapLoader from '@/components/public/locations-map-loader';

// Force dynamic rendering supaya initial payload peta selalu fresh tiap
// request (bukan static prerender). Polling client akan refresh tiap 60
// detik setelah hydrate.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Lokasi & Sebaran Kelompok KKN — SIBERMAS UIN SAIZU',
    description:
      'Peta sebaran realtime lokasi dan kelompok KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto.',
  };
}

// Shape response `/api/v1/public/locations` (sesuai ApiResponse trait +
// LokasiResource). `data` adalah array karena endpoint paginate — trait
// successCollection mengembalikan `data: resolved_collection`.
type LocationsApiResponse = {
  success?: boolean;
  message?: string;
  data?: MapLocation[];
};

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

function isPlottedRealLocation(loc: MapLocation): boolean {
  return toNumber(loc.latitude) !== null && toNumber(loc.longitude) !== null && getGroupCount(loc) > 0;
}

export default async function LocationsPage() {
  let locations: MapLocation[] = [];
  try {
    const payload = await fetchApi<LocationsApiResponse>(
      '/public/locations?per_page=500',
    );
    if (Array.isArray(payload?.data)) {
      locations = payload.data;
    }
  } catch (error) {
    // Log sekali di server, jangan crash page — peta akan render kosong
    // dan client polling akan mencoba fetch lagi.
    console.error('[LocationsPage] Failed to fetch locations:', error);
  }

  // Publik hanya menampilkan data real yang sudah terplotting:
  // punya koordinat valid + sudah ada kelompok. Desa master tanpa kelompok
  // tidak ditampilkan supaya peta tidak penuh pin "0".
  const plottedLocations = locations.filter(isPlottedRealLocation);

  const totalsOnServer = plottedLocations.reduce(
    (acc, loc) => {
      acc.groups += getGroupCount(loc);
      acc.students += getStudentCount(loc);
      return acc;
    },
    { groups: 0, students: 0 },
  );

  return (
    <div className="min-h-screen bg-white text-emerald-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Sebaran Wilayah
          </p>
          <h1 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
            Peta Sebaran Kelompok KKN
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Pantau lokasi desa mitra dan komposisi kelompok KKN UIN SAIZU Purwokerto
            secara realtime. Klik titik pada peta untuk melihat daftar kelompok &amp;
            jumlah peserta di desa tersebut.
          </p>
          {plottedLocations.length > 0 && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {plottedLocations.length} lokasi terplot &middot; {totalsOnServer.groups}{' '}
              kelompok &middot; {totalsOnServer.students} mahasiswa
            </p>
          )}
        </div>

        <div className="mt-10">
          <LocationsMapLoader initialLocations={plottedLocations} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
