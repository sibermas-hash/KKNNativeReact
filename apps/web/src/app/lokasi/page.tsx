import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi } from '@/lib/server-api';

export const revalidate = 86400;

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
  const data = await fetchApi<{ success: boolean; data: Location[] }>('/public/locations');
  const locations = data?.data || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            SIBERMAS
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/berita" className="text-sm text-teal-100 hover:text-white">
              Berita
            </Link>
            <Link href="/lokasi" className="text-sm font-semibold text-white">
              Lokasi
            </Link>
            <Link href="/unduhan" className="text-sm text-teal-100 hover:text-white">
              Unduhan
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-700"
            >
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-bold text-slate-800">Lokasi KKN</h1>

        {locations.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-slate-500">Belum ada data lokasi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc) => (
              <div key={loc.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-800">{loc.village_name || '-'}</p>
                <p className="text-sm text-slate-500">
                  {loc.district_name || '-'}
                  {loc.regency_name ? `, ${loc.regency_name}` : ''}
                </p>
                {loc.latitude && loc.longitude ? (
                  <p className="mt-2 text-xs text-slate-400">
                    {String(loc.latitude)}, {String(loc.longitude)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
      </footer>
    </div>
  );
}
