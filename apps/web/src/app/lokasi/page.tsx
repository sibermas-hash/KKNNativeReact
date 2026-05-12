import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-api';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { MapPin } from 'lucide-react';
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

  const totalsOnServer = locations.reduce(
    (acc, loc) => {
      acc.groups += loc.group_count ?? loc.groups?.length ?? 0;
      acc.students +=
        loc.students_count ??
        loc.groups?.reduce((sum, g) => sum + (g.peserta_count ?? 0), 0) ??
        0;
      return acc;
    },
    { groups: 0, students: 0 },
  );

  // Locations yang tidak punya koordinat → tampil sebagai card di bawah peta
  // (tidak bisa di-plot, tapi tetap terinformasikan ke publik).
  const locationsWithoutCoords = locations.filter(
    (loc) => loc.latitude == null || loc.longitude == null,
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
          {locations.length > 0 && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {locations.length} lokasi &middot; {totalsOnServer.groups} kelompok &middot;{' '}
              {totalsOnServer.students} mahasiswa
            </p>
          )}
        </div>

        <div className="mt-10">
          <LocationsMapLoader initialLocations={locations} />
        </div>

        {/* Lokasi tanpa koordinat → tampil sebagai card list (fallback) */}
        {locationsWithoutCoords.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Lokasi tanpa titik peta ({locationsWithoutCoords.length})
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Desa berikut terdaftar sebagai lokasi KKN tetapi belum memiliki koordinat
              untuk ditampilkan di peta.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locationsWithoutCoords.map((loc) => (
                <div
                  key={loc.id}
                  className="rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-[0_12px_35px_rgba(6,78,59,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="font-display font-bold text-emerald-950">
                        {loc.village_name || '-'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {loc.district_name ? `Kec. ${loc.district_name}` : ''}
                        {loc.regency_name ? `, ${loc.regency_name}` : ''}
                      </p>
                      {(loc.group_count ?? loc.groups?.length ?? 0) > 0 && (
                        <p className="mt-2 text-xs font-semibold text-emerald-600">
                          {loc.group_count ?? loc.groups?.length ?? 0} kelompok
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
