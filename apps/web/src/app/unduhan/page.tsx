import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-api';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { FileText, ExternalLink } from 'lucide-react';

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
}

export default async function DownloadsPage() {
  const data = await fetchApi<{ success: boolean; data: Download[] }>('/public/downloads');
  const downloads = data?.data || [];

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
            Dokumen resmi, panduan, dan formulir yang dapat diunduh oleh seluruh sivitas akademika.
          </p>
        </div>

        <div className="mt-10">
          {downloads.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Belum ada file unduhan
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Dokumen publik akan ditampilkan di halaman ini setelah diunggah oleh administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {downloads.map((d) => (
                <a
                  key={d.id}
                  href={d.file_url || d.external_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-[1.4rem] border border-emerald-100 bg-white p-5 shadow-[0_12px_35px_rgba(6,78,59,0.04)] hover:shadow-[0_18px_50px_rgba(6,78,59,0.08)] hover:border-emerald-300 transition-all no-underline group"
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
                  <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 group-hover:bg-emerald-100 transition-colors shrink-0">
                    <ExternalLink size={14} />
                    Unduh
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
