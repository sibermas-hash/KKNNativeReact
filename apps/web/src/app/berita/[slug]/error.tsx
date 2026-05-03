'use client';

export default function BeritaSlugError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <p className="text-4xl">📰</p>
      <h2 className="mt-4 text-xl font-semibold text-slate-800">Berita Tidak Ditemukan</h2>
      <p className="mt-2 text-sm text-slate-500">Berita yang Anda cari mungkin sudah dihapus atau tidak tersedia.</p>
      <button
        onClick={reset}
        className="mt-4 rounded-xl bg-teal-600 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-700"
      >
        Kembali
      </button>
    </div>
  );
}
