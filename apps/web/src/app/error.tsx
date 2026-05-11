'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
          <AlertTriangle size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Terjadi Kesalahan
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Mohon maaf, halaman tidak dapat dimuat. Silakan coba lagi atau kembali ke beranda.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
            Coba Lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Home size={16} />
            Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
