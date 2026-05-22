'use client';

import Link from 'next/link';
import { ArrowRight, Download, FileText, MapPinned, Newspaper, Users, UserCheck, MapPin } from 'lucide-react';
import { RevealOnScroll, StaggerContainer, StaggerItem, GlowCard, CountUp, TextReveal } from '@/components/ui/motion-effects';
import { apiUrl } from '@/lib/api';

export interface Announcement {
  id: number;
  title: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  image_url?: string;
  published_at?: string;
  reading_time?: number;
}

export interface DownloadItem {
  id: number;
  title: string;
  file_type?: string;
  file_path?: string;
  file_url?: string;
  external_url?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Informasi terbaru';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return 'Informasi terbaru';
  }
};

export function HomeContent({
  featuredAnnouncement,
  latestAnnouncements,
  featuredDownloads,
  stats,
  visi,
}: {
  featuredAnnouncement?: Announcement;
  latestAnnouncements: Announcement[];
  featuredDownloads: DownloadItem[];
  stats: { students: number; groups: number; locations: number };
  visi?: string;
}): React.JSX.Element {
  return (
    <>
      {/* --- INFORMATION SECTION --- */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <RevealOnScroll direction="up">
            <div className="max-w-3xl">
              <p className="home-kicker text-emerald-600 font-semibold uppercase tracking-widest text-xs">Informasi Terkini</p>
              <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
                Berita, pembaruan program, dan dokumen publik KKN.
              </h2>
              <TextReveal 
                text="Semua informasi terbaru ditempatkan di beranda agar mudah dipantau oleh mahasiswa, dosen, mitra desa, dan masyarakat umum."
                className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base"
              />
            </div>
          </RevealOnScroll>

          <StaggerContainer className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]" stagger={0.15} delay={0.2}>
            <StaggerItem>
              <div className="space-y-5">
                {featuredAnnouncement ? (
                  <GlowCard className="rounded-[1.6rem] border border-emerald-100 bg-white shadow-[0_20px_55px_rgba(6,78,59,0.07)]">
                    <article className="overflow-hidden rounded-[1.6rem]">
                      <div className="aspect-[16/9] overflow-hidden bg-emerald-50">
                        <img
                          src={featuredAnnouncement.image_url || '/images/home-gallery/hero-1.svg'}
                          alt={featuredAnnouncement.title}
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                      </div>
                      <div className="space-y-4 p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          <span className="rounded-full bg-emerald-50 px-3 py-1.5">
                            {featuredAnnouncement.category || 'Berita'}
                          </span>
                          <span>{formatDate(featuredAnnouncement.published_at)}</span>
                          {featuredAnnouncement.reading_time ? (
                            <span>{featuredAnnouncement.reading_time} menit baca</span>
                          ) : null}
                        </div>
                        <h3 className="text-xl font-display font-bold leading-tight text-emerald-950 sm:text-[1.7rem]">
                          {featuredAnnouncement.title}
                        </h3>
                        <p className="text-sm leading-7 text-slate-600 sm:text-base">
                          {featuredAnnouncement.excerpt ||
                            'Baca pengumuman lengkap untuk mengetahui rincian informasi terbaru dari LPPM UIN SAIZU.'}
                        </p>
                        <Link
                          href={`/berita/${featuredAnnouncement.slug}`}
                          className="inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 no-underline group"
                        >
                          Baca selengkapnya
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </article>
                  </GlowCard>
                ) : (
                  <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 sm:p-7">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Belum ada berita utama
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                      Saat ini belum ada warta yang dipublikasikan. Begitu berita terbaru tersedia,
                      tampilannya akan muncul di bagian ini.
                    </p>
                  </div>
                )}
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-5">
                <GlowCard className="rounded-[1.6rem] border border-emerald-100 bg-white shadow-[0_18px_45px_rgba(6,78,59,0.05)]">
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <Newspaper size={18} className="text-emerald-600" />
                      <h3 className="font-display text-lg font-bold text-emerald-950">
                        Berita Terbaru
                      </h3>
                    </div>
                    <div className="mt-5 space-y-4">
                      {latestAnnouncements.length > 0 ? (
                        latestAnnouncements.map((announcement) => (
                          <Link
                            key={announcement.id}
                            href={`/berita/${announcement.slug}`}
                            className="block rounded-[1.15rem] border border-emerald-100 p-4 no-underline transition-all hover:border-emerald-300 hover:shadow-md"
                          >
                            <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                              <span>{announcement.category || 'Berita'}</span>
                              <span>{formatDate(announcement.published_at)}</span>
                            </div>
                            <h4 className="mt-2.5 text-base font-display font-bold leading-snug text-emerald-950">
                              {announcement.title}
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {announcement.excerpt ||
                                'Ringkasan berita akan tampil di bagian ini saat konten dipublikasikan.'}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm leading-7 text-slate-600">
                          Belum ada berita tambahan yang dipublikasikan.
                        </p>
                      )}
                    </div>
                    <Link
                      href="/berita"
                      className="mt-5 inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 no-underline group"
                    >
                      Lihat semua berita
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </GlowCard>

                <GlowCard className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/55">
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <Download size={18} className="text-emerald-600" />
                      <h3 className="font-display text-lg font-bold text-emerald-950">
                        Unduhan Terbaru
                      </h3>
                    </div>
                    <div className="mt-5 space-y-3">
                      {featuredDownloads.length > 0 ? (
                        featuredDownloads.map((download) => (
                          <a
                            key={download.id}
                            href={download.external_url || download.file_url || (download.file_path ? apiUrl(download.file_path) : '/unduhan')}
                            className="flex items-start gap-3 rounded-[1.15rem] border border-emerald-100 bg-white p-4 no-underline transition-all hover:border-emerald-300 hover:shadow-md"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-6 text-emerald-950 sm:text-base">
                                {download.title}
                              </p>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                {download.file_type || 'Dokumen publik'}
                              </p>
                            </div>
                          </a>
                        ))
                      ) : (
                        <p className="text-sm leading-7 text-slate-600">
                          Belum ada dokumen publik yang ditampilkan.
                        </p>
                      )}
                    </div>
                  </div>
                </GlowCard>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* --- STATS SECTION with CountUp & GlowCards --- */}
      <section className="border-t border-emerald-100 bg-emerald-50/70 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <RevealOnScroll direction="up">
            <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-emerald-600 mb-8">
              Statistik KKN
            </p>
          </RevealOnScroll>

          <StaggerContainer className="grid gap-4 md:grid-cols-3" stagger={0.15}>
            {[
              { label: 'Mahasiswa', value: stats.students || 0, desc: 'Peserta yang tercatat dalam pelaksanaan program KKN.', icon: Users },
              { label: 'Kelompok', value: stats.groups || 0, desc: 'Kelompok yang bergerak di berbagai wilayah pengabdian.', icon: UserCheck },
              { label: 'Desa Mitra', value: stats.locations || 0, desc: 'Lokasi pengabdian yang menjadi bagian dari jejaring KKN UIN SAIZU.', icon: MapPin },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <GlowCard className="rounded-[1.4rem] border border-emerald-100 bg-white">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <stat.icon size={18} />
                      </div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        {stat.label}
                      </p>
                    </div>
                    <p className="font-display text-4xl font-bold text-emerald-950">
                      <CountUp end={stat.value} duration={2.5} />
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {stat.desc}
                    </p>
                  </div>
                </GlowCard>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <RevealOnScroll direction="up" delay={0.4}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/lokasi"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-950 no-underline transition-all hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5"
              >
                <MapPinned size={16} className="text-emerald-600" />
                Lihat sebaran lokasi
              </Link>
              <Link
                href="/unduhan"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-950 no-underline transition-all hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5"
              >
                <Download size={16} className="text-emerald-600" />
                Buka unduhan publik
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* --- VISI / TENTANG LPPM SECTION --- */}
      {visi && (
        <section className="border-t border-emerald-100 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <RevealOnScroll direction="up">
              <div className="mx-auto max-w-3xl text-center">
                <p className="home-kicker text-emerald-600 font-semibold uppercase tracking-widest text-xs">
                  Tentang Lembaga
                </p>
                <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
                  Visi LPPM UIN SAIZU
                </h2>
                <div className="mt-6 relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-emerald-200 rounded-full hidden sm:block" />
                  <TextReveal
                    text={visi}
                    className="text-base sm:text-lg leading-8 text-slate-600 font-medium italic sm:pl-6"
                  />
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}
    </>
  );
}
