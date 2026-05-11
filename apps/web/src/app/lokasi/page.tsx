import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi } from '@/lib/server-api';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Lokasi KKN — SIBERMAS UIN SAIZU',
    description: 'Peta lokasi KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
  };
}

interface Location {
  id: number;
  village_name?: string;
  district_name?: string;
  regency_name?: string;
  latitude?: number;
  longitude?: number;
}

export default async function LocationsPage() {
  let locations: Location[] = [];
  try {
    const data = await fetchApi<{ success: boolean; data: Location[] }>('/public/locations');
    locations = data?.data || [];
  } catch (error) {
    console.error('Failed to fetch locations:', error);
  }

  return (
    <div className="min-h-screen bg-white text-emerald-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Sebaran Wilayah</p>
          <h1 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
            Lokasi Pengabdian KKN
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Daftar desa dan kecamatan yang menjadi mitra program KKN UIN SAIZU Purwokerto.
          </p>
        </div>

        <div className="mt-10">
          {locations.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Belum ada data lokasi
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Data lokasi pengabdian akan ditampilkan setelah periode aktif dimulai.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((loc) => (
                <div key={loc.id} className="rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-[0_12px_35px_rgba(6,78,59,0.04)] hover:shadow-[0_18px_50px_rgba(6,78,59,0.08)] transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="font-display font-bold text-emerald-950">{loc.village_name || '-'}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Kec. {loc.district_name || '-'}
                        {loc.regency_name ? `, ${loc.regency_name}` : ''}
                      </p>
                      {loc.latitude && loc.longitude ? (
                        <p className="mt-2 text-xs font-medium text-emerald-600">
                          📍 {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
