import { Database, LibraryBig } from 'lucide-react';
import { TahunAkademikClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TahunAkademikPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-sans text-cyan-950">
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode Data</p>
            <p className="text-lg font-black text-cyan-950 tabular-nums leading-none">Live API</p>
          </div>
        </div>
      </div>

      <TahunAkademikClient initialData={[]} />
    </div>
  );
}
