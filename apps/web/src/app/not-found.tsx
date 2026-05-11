import React from 'react';

import Link from 'next/link';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-7xl font-black text-emerald-600">404</p>
      <h1 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
      >
        ← Kembali ke Beranda
      </Link>
    </div>
  );
}
