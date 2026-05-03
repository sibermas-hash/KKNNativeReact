import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchApi } from '@/lib/server-api';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Verifikasi Sertifikat — SIBERMAS',
    description: 'Verifikasi keaslian sertifikat KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
  };
}

interface Certificate {
  nama_mahasiswa?: string;
  nim?: string;
  nama_prodi?: string;
  nama_fakultas?: string;
  certificate_number?: string;
  total_score?: number;
  letter_grade?: string;
  lokasi_kkn?: string;
  issued_at?: string;
}

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const data = await fetchApi<{ success: boolean; data?: Certificate; error?: { message?: string } }>(
    `/public/verify-certificate/${token}`,
    { cache: 'no-store' },
  );

  const isValid = data?.success && data?.data;
  const cert = data?.data;

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
            <Link href="/lokasi" className="text-sm text-teal-100 hover:text-white">
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

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-8 text-center text-3xl font-bold text-slate-800">Verifikasi Sertifikat</h1>

        {!isValid ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">❌</p>
            <p className="mt-4 text-lg font-semibold text-rose-600">Sertifikat Tidak Valid</p>
            <p className="mt-2 text-sm text-slate-500">
              Token verifikasi tidak ditemukan atau sertifikat telah dibatalkan.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <p className="text-4xl">🎓</p>
              <p className="mt-2 text-lg font-semibold text-emerald-600">Sertifikat Valid</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Nama</span>
                <span className="text-sm font-semibold">{cert?.nama_mahasiswa || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">NIM</span>
                <span className="text-sm font-semibold">{cert?.nim || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Prodi</span>
                <span className="text-sm font-semibold">{cert?.nama_prodi || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Fakultas</span>
                <span className="text-sm font-semibold">{cert?.nama_fakultas || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">No. Sertifikat</span>
                <span className="text-sm font-semibold">{cert?.certificate_number || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Total Skor</span>
                <span className="text-sm font-semibold">{cert?.total_score || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Grade</span>
                <span className="text-sm font-semibold text-amber-600">{cert?.letter_grade || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Diterbitkan</span>
                <span className="text-sm font-semibold">{cert?.issued_at || '-'}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
      </footer>
    </div>
  );
}
