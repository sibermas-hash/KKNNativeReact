import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchApiStrict } from '@/lib/server-api';

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

function formatDateId(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const SUPPORT_EMAIL = 'admin@uinsaizu.ac.id';

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // 3-state response (valid / invalid / service-down) — jangan treat backend
  // down sebagai sertifikat tidak valid karena audience halaman ini adalah
  // ortu/masyarakat umum yang percaya pada hasil verifikasi.
  const result = await fetchApiStrict<{ success: boolean; data?: Certificate }>(
    `/public/verify-certificate/${token}`,
    { cache: 'no-store' },
  );

  const isValid = result.kind === 'ok' && result.data?.success && result.data?.data;
  const cert = result.kind === 'ok' ? result.data?.data : undefined;
  const isServiceDown = result.kind === 'service_unavailable';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            SIBERMAS
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href="/berita" className="hidden sm:inline text-sm text-teal-100 hover:text-white">
              Berita
            </Link>
            <Link href="/lokasi" className="hidden sm:inline text-sm text-teal-100 hover:text-white">
              Lokasi
            </Link>
            <Link href="/unduhan" className="hidden sm:inline text-sm text-teal-100 hover:text-white">
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
        <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-600 shadow-sm hover:bg-slate-50">
          ← Kembali ke Beranda
        </Link>
        <h1 className="mb-8 text-center text-3xl font-bold text-slate-800">Verifikasi Sertifikat</h1>

        {isServiceDown ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm space-y-3">
            <p className="text-sm font-bold text-amber-700 uppercase tracking-wider">Layanan Sementara Tidak Tersedia</p>
            <p className="text-base font-semibold text-slate-700">
              Kami tidak dapat memverifikasi sertifikat saat ini.
            </p>
            <p className="text-sm text-slate-500">
              Sistem LPPM sedang mengalami gangguan. Ini <strong>BUKAN</strong> berarti sertifikat tidak valid.
              Silakan coba lagi beberapa menit kemudian.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Link
                href={`/verify-certificate/${token}`}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Coba Lagi
              </Link>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Verifikasi%20Sertifikat%20${token}`}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Hubungi LPPM
              </a>
            </div>
          </div>
        ) : !isValid ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm space-y-3">
            <p className="text-sm font-bold text-rose-700 uppercase tracking-wider">Sertifikat Tidak Valid</p>
            <p className="text-base font-semibold text-slate-700">
              Token verifikasi tidak dikenali atau sertifikat telah dibatalkan.
            </p>
            <p className="text-sm text-slate-500">
              Jika Anda yakin sertifikat ini asli, hubungi LPPM untuk konfirmasi manual.
            </p>
            <div className="pt-4">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Konfirmasi%20Sertifikat%20${token}`}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Hubungi LPPM
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Sertifikat Valid</p>
              <p className="mt-1 text-xs text-slate-500">Data di bawah sesuai arsip resmi LPPM UIN Saizu.</p>
            </div>
            <dl className="space-y-3">
              <Row label="Nama" value={cert?.nama_mahasiswa} />
              <Row label="NIM" value={cert?.nim} />
              <Row label="Program Studi" value={cert?.nama_prodi} />
              <Row label="Fakultas" value={cert?.nama_fakultas} />
              <Row label="Nomor Sertifikat" value={cert?.certificate_number} />
              <Row label="Lokasi KKN" value={cert?.lokasi_kkn} />
              <Row label="Nilai Akhir" value={cert?.total_score !== undefined ? String(cert.total_score) : undefined} />
              <Row label="Grade" value={cert?.letter_grade} highlight />
              <Row label="Tanggal Terbit" value={formatDateId(cert?.issued_at)} />
            </dl>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} UIN Prof. K.H. Saifuddin Zuhri Purwokerto</p>
      </footer>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`text-sm font-semibold ${highlight ? 'text-amber-600' : 'text-slate-800'}`}>{value || '-'}</dd>
    </div>
  );
}
