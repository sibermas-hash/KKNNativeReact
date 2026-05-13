import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-api';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { FileText, ExternalLink, Smartphone, Shield, Download as DownloadIcon } from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Unduhan — SIBERMAS UIN SAIZU',
    description: 'File unduhan terkait KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto',
  };
}

interface Download {
  id: number;
  title: string;
  file_name?: string;
  file_type?: string;
  file_url?: string;
  external_url?: string;
  updated_at?: string;
  file_size?: number;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export default async function DownloadsPage() {
  const data = await fetchApi<{ success: boolean; data: Download[] }>('/public/downloads');
  const allDownloads = data?.data || [];

  // Pisahkan file aplikasi mobile (APK) dari dokumen biasa. Konvensi:
  // admin set `file_type = 'mobile-app'` ATAU file_name berakhir dengan `.apk`.
  const mobileApps = allDownloads.filter(
    (d) => d.file_type === 'mobile-app' || (d.file_name?.toLowerCase().endsWith('.apk') ?? false),
  );
  const documents = allDownloads.filter((d) => !mobileApps.includes(d));

  return (
    <div className="min-h-screen bg-white text-emerald-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Pusat Dokumen</p>
          <h1 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
            Unduhan Publik KKN
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Dokumen resmi, panduan, formulir, dan aplikasi mobile yang dapat diunduh oleh seluruh sivitas akademika.
          </p>
        </div>

        {/* --- Mobile App Section --- */}
        {mobileApps.length > 0 && (
          <section aria-labelledby="mobile-app-heading" className="mt-10">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Smartphone size={18} />
              </span>
              <h2 id="mobile-app-heading" className="font-display text-xl font-bold text-emerald-950">
                Aplikasi Mobile SIBERMAS
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {mobileApps.map((d) => (
                <div
                  key={d.id}
                  className="group relative overflow-hidden rounded-[1.6rem] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-[0_14px_40px_rgba(6,78,59,0.05)] transition-all hover:shadow-[0_18px_50px_rgba(6,78,59,0.1)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-md">
                        <Smartphone size={22} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-700">Android</p>
                        <p className="font-display text-base font-bold text-emerald-950">{d.title}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                      APK
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {d.file_name && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-slate-400">File</dt>
                        <dd className="mt-0.5 truncate font-mono text-slate-700" title={d.file_name}>
                          {d.file_name}
                        </dd>
                      </div>
                    )}
                    {d.updated_at && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-slate-400">Rilis</dt>
                        <dd className="mt-0.5 text-slate-700">{formatDate(d.updated_at)}</dd>
                      </div>
                    )}
                  </dl>

                  <a
                    href={d.file_url || d.external_url || '#'}
                    aria-disabled={!d.file_url && !d.external_url}
                    onClick={(e) => {
                      if (!d.file_url && !d.external_url) e.preventDefault();
                    }}
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 ${
                      !d.file_url && !d.external_url
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-600 text-white hover:bg-cyan-700'
                    }`}
                  >
                    <DownloadIcon size={16} />
                    {!d.file_url && !d.external_url ? 'URL Tidak Tersedia' : 'Unduh APK'}
                  </a>
                </div>
              ))}
            </div>

            {/* Install instruction banner — standar untuk distribusi sideload */}
            <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
                <Shield size={14} />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">Cara install APK di Android</p>
                <ol className="ml-4 list-decimal space-y-0.5 text-xs text-amber-900/90">
                  <li>Setelah unduh, buka file APK di Files / Downloads.</li>
                  <li>
                    Android akan meminta izin <em>Install unknown apps</em> — izinkan hanya untuk browser yang Anda pakai.
                  </li>
                  <li>Tap <strong>Install</strong>, tunggu selesai, buka aplikasi.</li>
                  <li>
                    Untuk update: cek halaman ini secara berkala. Download APK baru dan install ulang (data tetap).
                  </li>
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* --- Documents Section --- */}
        <section aria-labelledby="documents-heading" className={mobileApps.length > 0 ? 'mt-12' : 'mt-10'}>
          {mobileApps.length > 0 && (
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <FileText size={18} />
              </span>
              <h2 id="documents-heading" className="font-display text-xl font-bold text-emerald-950">
                Dokumen & Formulir
              </h2>
            </div>
          )}

          {documents.length === 0 && mobileApps.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Belum ada file unduhan
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Dokumen publik akan ditampilkan di halaman ini setelah diunggah oleh administrator.
              </p>
            </div>
          ) : documents.length === 0 ? null : (
            <div className="space-y-4">
              {documents.map((d) => {
                const hasUrl = !!(d.file_url || d.external_url);
                const Wrapper = hasUrl ? 'a' : 'div';
                return (
                  <Wrapper
                    key={d.id}
                    {...(hasUrl
                      ? {
                          href: d.file_url || d.external_url,
                          target: '_blank',
                          rel: 'noopener noreferrer',
                        }
                      : { 'aria-disabled': true })}
                    className={`flex items-center justify-between rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-[0_12px_35px_rgba(6,78,59,0.04)] no-underline group transition-all ${
                      hasUrl
                        ? 'hover:shadow-[0_18px_50px_rgba(6,78,59,0.08)] hover:border-emerald-300'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-display font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">
                          {d.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                          {d.file_type || 'Dokumen'} {d.file_name ? `• ${d.file_name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shrink-0 transition-colors ${
                      hasUrl
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
                        : 'border-slate-200 bg-slate-100 text-slate-500'
                    }`}>
                      <ExternalLink size={14} />
                      {hasUrl ? 'Unduh' : 'Belum Tersedia'}
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
