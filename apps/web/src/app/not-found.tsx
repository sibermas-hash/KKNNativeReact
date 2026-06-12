import React from 'react';

import Link from 'next/link';
import { Home, Newspaper, HelpCircle } from 'lucide-react';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-7xl font-black text-emerald-600">404</p>
      <h1 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        Halaman yang Anda cari tidak ada atau telah dipindahkan. Silakan pilih salah satu tujuan di bawah.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Home size={16} /> Beranda
        </Link>
        <Link
          href="/berita"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Newspaper size={16} /> Berita
        </Link>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <HelpCircle size={16} /> Bantuan
        </Link>
      </div>
    </div>
  );
}
