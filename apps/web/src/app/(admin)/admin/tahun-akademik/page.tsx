import { fetchApiAuthStrict, getAuthFetchErrorMessage } from '@/lib/server-api';
import { Database, LibraryBig, ShieldAlert } from 'lucide-react';
import { TahunAkademikClient } from './client';

interface TahunAkademik {
  id: number;
  year: string;
  is_active: boolean;
  created_at?: string;
}

export default async function TahunAkademikPage() {
  const result = await fetchApiAuthStrict<{ data: TahunAkademik[] }>('/admin/tahun-akademik');
  const loadError =
    result.kind === 'ok'
      ? undefined
      : getAuthFetchErrorMessage(
          result,
          'Data tahun akademik belum bisa dimuat karena layanan API tidak merespons normal.',
        );
  const data = result.kind === 'ok' ? result.data.data ?? [] : [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-sans text-cyan-950">
      {/* Page Header — static, rendered on server */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-slate-100">
        <div className="flex items-start gap-5">
          <div className="h-14 w-14 rounded-2xl bg-cyan-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <LibraryBig size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Data Master Sistem</p>
            <h1 className="text-3xl font-black text-cyan-950 tracking-tight leading-none">Tahun Akademik.</h1>
            <p className="mt-2 text-sm text-slate-500 max-w-lg">
              Daftar tahun akademik aktif yang digunakan untuk mengelompokkan periode pelaksanaan KKN.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm shrink-0">
          <Database size={16} className="text-cyan-600" />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Terdaftar</p>
            <p className="text-lg font-black text-cyan-950 tabular-nums leading-none">{result.kind === 'ok' ? data.length : '-'}</p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Data tahun akademik belum tersedia.</p>
            <p className="mt-1 text-sm text-amber-800">{loadError}</p>
          </div>
        </div>
      )}

      {/* Interactive parts — client component with server-fetched initial data */}
      <TahunAkademikClient initialData={data} loadError={loadError} />
    </div>
  );
}
