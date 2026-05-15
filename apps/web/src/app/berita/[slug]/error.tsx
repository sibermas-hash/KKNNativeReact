'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BeritaSlugError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Audit fix (2026-05-13): heading sebelumnya "Berita Tidak Ditemukan" —
  // misleading karena error.tsx adalah runtime error boundary, bukan 404.
  // 404 sudah di-handle oleh notFound() → not-found.tsx global. Ini dipanggil
  // kalau ada exception saat render artikel (misal sanitizeHtml crash).
  useEffect(() => {
    if (error) {
      console.error('Berita slug render error:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <p className="text-4xl" aria-hidden="true">⚠️</p>
      <h2 className="mt-4 text-xl font-semibold text-slate-800">Gagal Menampilkan Artikel</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        Terjadi kesalahan saat memuat isi berita. Silakan coba lagi atau kembali ke daftar berita.
      </p>
      {error?.digest && (
        <p className="mt-2 text-xs text-slate-400 font-mono">Ref: {error.digest}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Coba Lagi
        </button>
        <Link
          href="/berita"
          className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ke Daftar Berita
        </Link>
      </div>
    </div>
  );
}
