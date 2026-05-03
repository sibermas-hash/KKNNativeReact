'use client';

import { useQuery } from '@tanstack/react-query';
import { publicEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function CertificateVerifyPage() {
  const { token } = useParams();
  const endpoints = publicEndpoints(api);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public', 'certificate', String(token)],
    queryFn: async () => {
      const res = await endpoints.certificate(String(token));
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
    enabled: !!token,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">SIBERMAS</Link>
          <nav className="flex items-center gap-6">
            <Link href="/berita" className="text-sm text-teal-100 hover:text-white">Berita</Link>
            <Link href="/lokasi" className="text-sm text-teal-100 hover:text-white">Lokasi</Link>
            <Link href="/unduhan" className="text-sm text-teal-100 hover:text-white">Unduhan</Link>
            <Link href="/login" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-700">Masuk</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-8 text-center text-3xl font-bold text-slate-800">Verifikasi Sertifikat</h1>

        {isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
        ) : error ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">❌</p>
            <p className="mt-4 text-lg font-semibold text-rose-600">Sertifikat Tidak Valid</p>
            <p className="mt-2 text-sm text-slate-500">Token verifikasi tidak ditemukan atau sertifikat telah dibatalkan.</p>
          </div>
        ) : data ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <p className="text-4xl">🎓</p>
              <p className="mt-2 text-lg font-semibold text-emerald-600">Sertifikat Valid</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-sm text-slate-500">Nama</span><span className="text-sm font-semibold">{String(data.nama_mahasiswa || '-')}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-sm text-slate-500">NIM</span><span className="text-sm font-semibold">{String(data.nim || '-')}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-sm text-slate-500">Prodi</span><span className="text-sm font-semibold">{String(data.nama_prodi || '-')}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-sm text-slate-500">Fakultas</span><span className="text-sm font-semibold">{String(data.nama_fakultas || '-')}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-sm text-slate-500">No. Sertifikat</span><span className="text-sm font-semibold">{String(data.certificate_number || '-')}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-sm text-slate-500">Total Skor</span><span className="text-sm font-semibold">{String(data.total_score || '-')}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-sm text-slate-500">Grade</span><span className="text-sm font-semibold text-amber-600">{String(data.letter_grade || '-')}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500">Diterbitkan</span><span className="text-sm font-semibold">{String(data.issued_at || '-')}</span></div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="bg-slate-900 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
      </footer>
    </div>
  );
}
