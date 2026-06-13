'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Download, FileText, Layers3, MapPinned, Newspaper, Users, UserCheck, MapPin } from 'lucide-react';
import { RevealOnScroll, StaggerContainer, StaggerItem, GlowCard, CountUp, TextReveal, Magnetic } from '@/components/ui/motion-effects';
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

interface SchemeItem {
  title: string;
  description: string;
  color?: 'emerald' | 'blue' | 'amber' | 'slate';
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
  schemesContent,
}: {
  featuredAnnouncement?: Announcement;
  latestAnnouncements: Announcement[];
  featuredDownloads: DownloadItem[];
  stats: { students: number; groups: number; locations: number };
  visi?: string;
  schemesContent?: {
    title: string;
    intro: string;
    items: SchemeItem[];
  };
}): React.JSX.Element {
  const schemes = (schemesContent?.items ?? []).filter((item) => item.title && item.description);

  return (
    <>
      {schemes.length > 0 ? (
        <section className="relative bg-[#F4F8F6] border-y border-slate-100 py-20 text-slate-900 sm:py-28 overflow-hidden">
          {/* Ambient Liquid Glow Blobs */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
            <motion.div
              animate={{
                x: [0, 25, -15, 0],
                y: [0, -35, 15, 0],
                scale: [1, 1.1, 0.95, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-500/5 blur-[80px]"
            />
            <motion.div
              animate={{
                x: [0, -20, 30, 0],
                y: [0, 25, -25, 0],
                scale: [1, 0.95, 1.1, 1],
              }}
              transition={{
                duration: 24,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-40 -right-32 w-[350px] h-[350px] rounded-full bg-teal-500/5 blur-[90px]"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
            <RevealOnScroll direction="up">
              <div className="mx-auto max-w-3xl text-center">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#059669]/20 bg-[#059669]/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#065F46]">
                  <Layers3 size={14} className="text-[#065F46]" /> Skema KKN
                </p>
                <h2 className="mt-5 font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {schemesContent?.title || 'Skema KKN UIN SAIZU'}
                </h2>
                {schemesContent?.intro ? (
                  <p className="mt-4 text-sm leading-relaxed text-slate-500 max-w-2xl mx-auto">
                    {schemesContent.intro}
                  </p>
                ) : null}
              </div>
            </RevealOnScroll>

            <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
              {schemes.map((scheme, index) => {
                return (
                  <StaggerItem key={`${scheme.title}-${index}`}>
                    <GlowCard 
                      className="h-full rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 group relative overflow-hidden cursor-pointer"
                      glowColor="rgba(16, 185, 129, 0.03)"
                    >
                      <div className="p-6 flex flex-col h-full justify-between relative z-10">
                        <div>
                          <div className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F8F6] border border-slate-100 text-[#065F46] text-[0.75rem] font-bold tracking-wider shadow-sm">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <h3 className="font-serif text-lg font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors duration-300">{scheme.title}</h3>
                          <p className="mt-3 text-xs leading-relaxed text-slate-500">{scheme.description}</p>
                        </div>
                      </div>
                    </GlowCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      ) : null}

      {/* --- INFORMATION SECTION (Champagne & Luxury Frames) --- */}
      {/* --- INFORMATION SECTION (Clean Minimalist Grid) --- */}
      <section className="bg-white border-t border-slate-100 py-20 sm:py-28 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <RevealOnScroll direction="up">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#065F46] mb-4">
                Informasi Terkini
              </p>
              <h2 className="mt-3 text-3xl font-serif font-bold tracking-tight text-emerald-950 sm:text-4xl">
                Warta Resmi, Pembaruan Program, & Dokumen KKN
              </h2>
              <TextReveal 
                text="Semua publikasi penting ditempatkan di beranda agar mudah dipantau oleh mahasiswa, dosen, mitra desa, dan masyarakat umum secara transparan."
                className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 font-medium"
              />
            </div>
          </RevealOnScroll>

          <StaggerContainer className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]" stagger={0.1} delay={0.1}>
            <StaggerItem>
              <div className="space-y-5">
                {featuredAnnouncement ? (
                  <GlowCard className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-500 group relative overflow-hidden" glowColor="rgba(16, 185, 129, 0.03)">
                    <article className="overflow-hidden rounded-2xl">
                      <div className="aspect-[16/9] overflow-hidden bg-slate-50">
                        <img
                          src={featuredAnnouncement.image_url || '/images/home-gallery/hero-1.svg'}
                          alt={featuredAnnouncement.title}
                          className="h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-103"
                        />
                      </div>
                      <div className="space-y-4 p-6 sm:p-8">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#065F46]">
                          <span className="rounded-full bg-slate-50 border border-slate-100 px-3 py-1.5 text-slate-800 font-bold">
                            {featuredAnnouncement.category || 'Berita'}
                          </span>
                          <span>{formatDate(featuredAnnouncement.published_at)}</span>
                          {featuredAnnouncement.reading_time ? (
                            <span>{featuredAnnouncement.reading_time} menit baca</span>
                          ) : null}
                        </div>
                        <h3 className="text-xl font-serif font-bold leading-tight text-slate-900 sm:text-[1.8rem]">
                          {featuredAnnouncement.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-500">
                          {featuredAnnouncement.excerpt ||
                            'Baca pengumuman lengkap untuk mengetahui rincian informasi terbaru dari LPPM UIN Prof. K.H. Saifuddin Zuhri.'}
                        </p>
                        <Link
                          href={`/berita/${featuredAnnouncement.slug}`}
                          className="inline-flex items-center gap-2 font-semibold text-xs uppercase tracking-[0.18em] text-[#065F46] hover:text-[#065F46]/80 no-underline group/link transition-colors duration-300"
                        >
                          Baca selengkapnya
                          <ArrowRight size={14} className="transition-transform duration-300 group-hover/link:translate-x-1" />
                        </Link>
                      </div>
                    </article>
                  </GlowCard>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 sm:p-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#065F46]">
                      Belum ada berita utama
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
                      Saat ini belum ada warta yang dipublikasikan. Begitu berita terbaru tersedia,
                      tampilannya akan muncul di bagian ini.
                    </p>
                  </div>
                )}
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="space-y-6">
                <GlowCard className="rounded-2xl border border-slate-100 bg-white shadow-sm" glowColor="rgba(16, 185, 129, 0.03)">
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      <Newspaper size={18} className="text-[#065F46]" />
                      <h3 className="font-serif text-lg font-bold text-slate-950">
                        Warta Terbaru
                      </h3>
                    </div>
                    <div className="mt-6 space-y-4">
                      {latestAnnouncements.length > 0 ? (
                        latestAnnouncements.map((announcement) => {
                          return (
                            <Link
                              key={announcement.id}
                              href={`/berita/${announcement.slug}`}
                              className="block rounded-xl border border-slate-100 bg-[#F4F8F6]/40 p-5 no-underline transition-all duration-300 hover:border-slate-200 hover:shadow-sm hover:-translate-y-0.5 group"
                            >
                              <div className="relative z-10">
                                <div className="flex flex-wrap items-center gap-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#065F46]">
                                  <span>{announcement.category || 'Berita'}</span>
                                  <span>{formatDate(announcement.published_at)}</span>
                                </div>
                                <h4 className="mt-2.5 text-base font-serif font-bold leading-snug text-slate-900 group-hover:text-emerald-900 transition-colors duration-300">
                                  {announcement.title}
                                </h4>
                                <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                                  {announcement.excerpt ||
                                    'Ringkasan berita akan tampil di bagian ini saat konten dipublikasikan.'}
                                </p>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <p className="text-sm leading-relaxed text-slate-500">
                          Belum ada berita tambahan yang dipublikasikan.
                        </p>
                      )}
                    </div>
                    <Link
                      href="/berita"
                      className="mt-6 inline-flex items-center gap-2 font-semibold text-xs uppercase tracking-[0.18em] text-[#065F46] hover:text-[#065F46]/80 no-underline group/all transition-colors duration-300"
                    >
                      Lihat semua berita
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover/all:translate-x-1" />
                    </Link>
                  </div>
                </GlowCard>

                <GlowCard className="rounded-2xl border border-slate-100 bg-[#F4F8F6]/40 shadow-sm" glowColor="rgba(16, 185, 129, 0.03)">
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      <Download size={18} className="text-[#065F46]" />
                      <h3 className="font-serif text-lg font-bold text-slate-950">
                        Unduhan Terbaru
                      </h3>
                    </div>
                    <div className="mt-6 space-y-3">
                      {featuredDownloads.length > 0 ? (
                        featuredDownloads.map((download) => (
                          <a
                            key={download.id}
                            href={download.external_url || download.file_url || (download.file_path ? apiUrl(download.file_path) : '/unduhan')}
                            className="flex items-start gap-4 rounded-xl border border-slate-100 bg-white p-4 no-underline transition-all duration-300 hover:border-slate-200 hover:shadow-sm hover:-translate-y-0.5 group"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100 shadow-sm transition-transform duration-500 group-hover:scale-105">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-relaxed text-slate-950 sm:text-base group-hover:text-emerald-900 transition-colors">
                                {download.title}
                              </p>
                              <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#065F46]">
                                {download.file_type || 'Dokumen publik'}
                              </p>
                            </div>
                          </a>
                        ))
                      ) : (
                        <p className="text-sm leading-relaxed text-slate-500">
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

      {/* --- STATS SECTION with CountUp, GlassPlaques & Emerald Accents --- */}
      <section className="border-t border-slate-100 bg-[#F4F8F6] py-20 relative overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <RevealOnScroll direction="up">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#065F46] mb-3">
                Statistik KKN
              </p>
              <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
                Dampak & Kontribusi Nyata Pengabdian
              </h2>
            </div>
          </RevealOnScroll>

          <StaggerContainer className="grid gap-6 md:grid-cols-3" stagger={0.1}>
            {[
              { label: 'Mahasiswa', value: stats.students || 0, desc: 'Peserta aktif yang terdaftar melaksanakan KKN secara integratif.', icon: Users },
              { label: 'Kelompok KKN', value: stats.groups || 0, desc: 'Kelompok pengabdian terdistribusi di wilayah sasaran.', icon: UserCheck },
              { label: 'Desa Mitra', value: stats.locations || 0, desc: 'Lokasi pengabdian jejaring kolaboratif UIN SAIZU.', icon: MapPin },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <GlowCard className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-500 group relative overflow-hidden" glowColor="rgba(16, 185, 129, 0.03)">
                  <div className="p-7 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100 shadow-sm transition-transform duration-500 group-hover:scale-105">
                        <stat.icon size={18} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {stat.label}
                      </p>
                    </div>
                    <p className="font-serif text-4xl font-bold text-slate-900 tracking-tight">
                      <CountUp end={stat.value} duration={2} />
                    </p>
                    <p className="mt-3 text-xs leading-6 text-slate-500">
                      {stat.desc}
                    </p>
                  </div>
                </GlowCard>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <RevealOnScroll direction="up" delay={0.3}>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Magnetic>
                <Link
                  href="/lokasi"
                  className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50 shadow-sm transition-all duration-300 hover:-translate-y-0.5 group"
                >
                  <MapPinned size={14} className="text-[#065F46]" />
                  Lihat Sebaran Lokasi
                </Link>
              </Magnetic>
              <Magnetic>
                <Link
                  href="/unduhan"
                  className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50 shadow-sm transition-all duration-300 hover:-translate-y-0.5 group"
                >
                  <Download size={14} className="text-[#065F46]" />
                  Buka Unduhan Publik
                </Link>
              </Magnetic>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* --- VISI / TENTANG LPPM SECTION (Asymmetric Academic Journal Layout) --- */}
      {visi && (
        <section className="border-t border-slate-100 bg-[#F4F8F6] py-20 sm:py-28 relative overflow-hidden">
          {/* Ambient Liquid Glow Blobs */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
            <motion.div
              animate={{
                x: [0, -25, 20, 0],
                y: [0, 30, -15, 0],
                scale: [1, 0.9, 1.1, 1],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-[90px]"
            />
            <motion.div
              animate={{
                x: [0, 30, -25, 0],
                y: [0, -25, 25, 0],
                scale: [1, 1.1, 0.95, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-teal-500/5 blur-[80px]"
            />
          </div>

          {/* Subtle decorative overlay ring */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full border border-slate-200/40 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
            <RevealOnScroll direction="up">
              <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 items-center">
                
                {/* Left Column (Concentric Medallion Exhibit) */}
                <div className="relative flex flex-col items-center justify-center w-full max-w-[200px] mx-auto select-none">
                  {/* Single thin circle frame */}
                  <div className="absolute w-[180px] h-[180px] rounded-full border border-slate-200/60 pointer-events-none" />
                  
                  {/* Glass Medallion Core */}
                  <div className="relative w-32 h-32 rounded-full border border-slate-100 bg-white shadow-sm flex items-center justify-center p-5">
                    <img
                      src="/images/logo_uinsaizu.png"
                      alt="Logo UIN Saizu Medallion"
                      className="w-full h-full object-contain filter grayscale opacity-75 transition-all duration-500"
                    />
                  </div>

                  {/* Caption underneath the seal */}
                  <div className="mt-6 text-center">
                    <p className="font-serif text-base font-bold italic text-[#065F46] leading-relaxed tracking-wide">
                      Pengabdian Unggul &<br />Moderasi Islam
                    </p>
                    <div className="mt-3 w-10 h-0.5 bg-slate-200 mx-auto rounded-full" />
                  </div>
                </div>

                {/* Right Column (Visi content with drop cap and highlights) */}
                <div className="space-y-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#065F46]">
                    Visi LPPM UIN Prof. K.H. Saifuddin Zuhri
                  </p>
                  <h3 className="font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                    Komitmen Akademik Pengabdian Masyarakat
                  </h3>
                  <div className="relative pl-6 border-l-2 border-slate-200">
                    <p className="font-serif text-lg sm:text-xl leading-9 text-slate-600 italic">
                      Menjadi Lembaga Penelitian dan Pengabdian kepada Masyarakat yang{" "}
                      <span className="text-[#065F46] font-bold font-serif not-italic">unggul dan kompetitif</span> dalam pengembangan ilmu pengetahuan, teknologi, dan seni yang berbasis pada nilai-nilai{" "}
                      <span className="text-[#065F46] font-bold font-serif not-italic">moderasi Islam dan kearifan lokal</span>.
                    </p>
                  </div>
                </div>

              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}
    </>
  );
}
