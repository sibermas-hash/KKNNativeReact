'use client';

import Link from 'next/link';
import { ArrowRight, Download, FileText, Layers3, MapPinned, Newspaper, Users, UserCheck, MapPin } from 'lucide-react';
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

interface SchemeItem {
  title: string;
  description: string;
  color?: 'emerald' | 'blue' | 'amber' | 'slate';
}

const schemeTone: Record<NonNullable<SchemeItem['color']>, string> = {
  emerald: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
  blue: 'border-blue-200/80 bg-blue-50 text-blue-700',
  amber: 'border-amber-200/80 bg-amber-50 text-amber-700',
  slate: 'border-slate-200/80 bg-slate-50 text-slate-700',
};

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

const schemeOffsets = [
  'md:translate-y-8 md:rotate-[2deg]',
  'md:-translate-y-4 md:-rotate-[3deg]',
  'md:translate-y-12 md:rotate-[1deg]',
  'md:-translate-y-6 md:-rotate-[2deg]',
];

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
        <section className="relative border-y border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 py-24 sm:py-32 text-white overflow-hidden">
          
          {/* Giant backdrop drifting typography */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-5 font-black text-[11vw] select-none text-emerald-100 tracking-[0.25em] uppercase translate-y-[-15%]">
            SKEMA KKN
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <RevealOnScroll direction="up">
              <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-24">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
                  <Layers3 size={15} /> Skema KKN
                </p>
                <h2 className="mt-5 font-display text-4xl font-black tracking-tight sm:text-5xl leading-tight">
                  {schemesContent?.title || 'Skema KKN UIN SAIZU'}
                </h2>
                {schemesContent?.intro ? (
                  <p className="mt-4 text-sm leading-relaxed text-emerald-50/80 sm:text-base">
                    {schemesContent.intro}
                  </p>
                ) : null}
              </div>
            </RevealOnScroll>

            <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-10" stagger={0.12}>
              {schemes.map((scheme, index) => {
                const offsetClass = schemeOffsets[index % schemeOffsets.length];
                return (
                  <StaggerItem key={`${scheme.title}-${index}`} className={`${offsetClass} transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]`}>
                    <GlowCard className="h-full rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-md hover:bg-white/[0.08] transition-colors duration-300">
                      <div className="p-8 flex flex-col h-full justify-between">
                        <div>
                          <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-black shadow-sm ${schemeTone[scheme.color ?? 'emerald']}`}>
                            {index + 1}
                          </div>
                          <h3 className="font-display text-lg font-bold text-white mb-3">
                            {scheme.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-emerald-100/75">
                            {scheme.description}
                          </p>
                        </div>
                        <div className="h-1 w-12 rounded-full bg-emerald-400/30 mt-6" />
                      </div>
                    </GlowCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      ) : null}

      {/* --- INFORMATION SECTION --- */}
      <section className="bg-white py-24 sm:py-32 relative overflow-hidden">
        {/* Decorative blur blobs */}
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-emerald-50 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-sky-50/50 rounded-full filter blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <RevealOnScroll direction="up">
            <div className="max-w-3xl mb-16 md:mb-20">
              <p className="home-kicker text-emerald-600 font-semibold uppercase tracking-widest text-xs">Informasi Terkini</p>
              <h2 className="mt-3 text-4xl font-display font-black tracking-tight text-emerald-950 sm:text-5xl leading-tight">
                Warta & Dokumen Resmi KKN
              </h2>
              <TextReveal 
                text="Semua informasi terbaru ditempatkan di beranda agar mudah dipantau oleh mahasiswa, dosen, mitra desa, dan masyarakat umum."
                className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base"
              />
            </div>
          </RevealOnScroll>

          <StaggerContainer className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start" stagger={0.15} delay={0.2}>
            
            {/* Featured Announcement Card */}
            <StaggerItem className="md:rotate-[-1deg] md:translate-y-2 hover:rotate-0 transition-transform duration-500">
              {featuredAnnouncement ? (
                <div className="transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.005]">
                  <GlowCard className="rounded-[2.5rem] border border-emerald-100 bg-white shadow-[0_30px_70px_rgba(6,78,59,0.07)] hover:shadow-[0_40px_85px_rgba(6,78,59,0.12)] transition-shadow duration-500 overflow-hidden">
                    <article>
                      <div className="aspect-[16/10] overflow-hidden bg-slate-50 relative">
                        <img
                          src={featuredAnnouncement.image_url || '/images/home-gallery/hero-1.svg'}
                          alt={featuredAnnouncement.title}
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                        />
                        <div className="absolute top-5 left-5">
                          <span className="rounded-full bg-emerald-600 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-md">
                            {featuredAnnouncement.category || 'Berita Utama'}
                          </span>
                        </div>
                      </div>
                      <div className="p-8 sm:p-10 space-y-5">
                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                          <span>{formatDate(featuredAnnouncement.published_at)}</span>
                          {featuredAnnouncement.reading_time ? (
                            <span className="flex items-center gap-1.5 before:content-['•'] before:mr-1.5 font-medium">
                              {featuredAnnouncement.reading_time} menit baca
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-2xl font-display font-black leading-tight text-emerald-950 sm:text-3xl">
                          {featuredAnnouncement.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-500 sm:text-base">
                          {featuredAnnouncement.excerpt ||
                            'Baca pengumuman lengkap untuk mengetahui rincian informasi terbaru dari LPPM UIN SAIZU.'}
                        </p>
                        <div className="pt-2">
                          <Link
                            href={`/berita/${featuredAnnouncement.slug}`}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-50 hover:bg-emerald-100 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 no-underline transition-all group"
                          >
                            Baca selengkapnya
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  </GlowCard>
                </div>
              ) : (
                <div className="rounded-[2rem] border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-8 sm:p-10 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Belum ada berita utama
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-slate-500">
                    Saat ini belum ada warta utama yang dipublikasikan. Begitu berita terbaru tersedia,
                    tampilannya akan muncul di bagian ini.
                  </p>
                </div>
              )}
            </StaggerItem>

            {/* Latest Announcements Stack & Downloads (Overlapping Folder Collage) */}
            <StaggerItem className="space-y-8 md:-ml-4">
              
              {/* Latest Announcements Board */}
              <div className="md:rotate-[1.5deg] hover:rotate-0 transition-transform duration-500">
                <GlowCard className="rounded-[2.5rem] border border-emerald-100 bg-white shadow-[0_25px_60px_rgba(6,78,59,0.05)] p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <Newspaper size={18} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-emerald-950">
                      Berita Terbaru
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {latestAnnouncements.length > 0 ? (
                      latestAnnouncements.map((announcement, idx) => {
                        const rot = idx % 2 === 0 ? 'md:rotate-[-0.5deg]' : 'md:rotate-[0.5deg]';
                        return (
                          <Link
                            key={announcement.id}
                            href={`/berita/${announcement.slug}`}
                            className={`block rounded-2xl border border-emerald-100/60 bg-white p-5 no-underline transition-all hover:border-emerald-300 hover:shadow-md hover:scale-[1.01] ${rot}`}
                          >
                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                              <span className="px-2 py-0.5 rounded bg-emerald-50">{announcement.category || 'Berita'}</span>
                              <span>{formatDate(announcement.published_at)}</span>
                            </div>
                            <h4 className="mt-3 text-base font-display font-bold leading-snug text-emerald-950">
                              {announcement.title}
                            </h4>
                            <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                              {announcement.excerpt ||
                                'Ringkasan berita akan tampil di bagian ini saat konten dipublikasikan.'}
                            </p>
                          </Link>
                        );
                      })
                    ) : (
                      <p className="text-sm leading-relaxed text-slate-500">
                        Belum ada berita tambahan yang dipublikasikan.
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <Link
                      href="/berita"
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 no-underline group hover:text-emerald-800"
                    >
                      Lihat semua berita
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </GlowCard>
              </div>

              {/* Downloads Board */}
              <div className="md:rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500">
                <GlowCard className="rounded-[2.5rem] border border-emerald-100 bg-emerald-50/30 p-8 shadow-[0_20px_50px_rgba(6,78,59,0.04)]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                      <Download size={18} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-emerald-950">
                      Unduhan Terbaru
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {featuredDownloads.length > 0 ? (
                      featuredDownloads.map((download, idx) => {
                        const rot = idx % 2 === 0 ? 'md:rotate-[0.5deg]' : 'md:rotate-[-0.5deg]';
                        return (
                          <a
                            key={download.id}
                            href={download.external_url || download.file_url || (download.file_path ? apiUrl(download.file_path) : '/unduhan')}
                            className={`flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-5 no-underline transition-all hover:border-emerald-300 hover:shadow-md hover:scale-[1.01] ${rot}`}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold leading-normal text-emerald-950">
                                {download.title}
                              </p>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                                {download.file_type || 'Dokumen publik'}
                              </p>
                            </div>
                          </a>
                        );
                      })
                    ) : (
                      <p className="text-sm leading-relaxed text-slate-500">
                        Belum ada dokumen publik yang ditampilkan.
                      </p>
                    )}
                  </div>
                </GlowCard>
              </div>

            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* --- STATS SECTION with CountUp & GlowCards --- */}
      <section className="border-t border-emerald-100 bg-slate-50 py-24 sm:py-32 relative overflow-hidden">
        {/* Glow grid helper */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <RevealOnScroll direction="up">
            <p className="text-center text-xs font-black uppercase tracking-[0.28em] text-emerald-600 mb-16">
              Statistik Pelaksanaan KKN
            </p>
          </RevealOnScroll>

          <StaggerContainer className="flex flex-col md:flex-row md:-space-x-4 space-y-10 md:space-y-0 items-stretch justify-center" stagger={0.15}>
            {[
              { label: 'Mahasiswa', value: stats.students || 0, desc: 'Peserta yang tercatat dalam pelaksanaan program KKN.', icon: Users, layout: 'md:translate-x-[-15px] md:rotate-[-2deg] z-10 hover:z-20' },
              { label: 'Kelompok KKN', value: stats.groups || 0, desc: 'Kelompok yang bergerak di berbagai wilayah pengabdian.', icon: UserCheck, layout: 'md:scale-[1.05] md:translate-y-[-12px] md:rotate-[1deg] z-20' },
              { label: 'Desa Mitra', value: stats.locations || 0, desc: 'Lokasi pengabdian yang menjadi bagian dari jejaring KKN UIN SAIZU.', icon: MapPin, layout: 'md:translate-x-[15px] md:rotate-[-1deg] z-10 hover:z-20' },
            ].map((stat) => (
              <StaggerItem key={stat.label} className={`flex-1 ${stat.layout} transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01]`}>
                <GlowCard className="rounded-3xl border border-emerald-100/50 bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(6,78,59,0.05)] hover:shadow-[0_30px_70px_rgba(6,78,59,0.1)] h-full transition-shadow duration-500" glowColor="rgba(16, 185, 129, 0.12)">
                  <div className="p-8 flex flex-col h-full">
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                        <stat.icon size={20} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
                        {stat.label}
                      </p>
                    </div>

                    <p className="font-display text-5xl font-black text-emerald-950 drop-shadow-[0_10px_20px_rgba(6,78,59,0.06)]">
                      <CountUp end={stat.value} duration={2.5} />
                    </p>

                    <p className="mt-4 text-sm leading-relaxed text-slate-500 flex-1">
                      {stat.desc}
                    </p>

                  </div>
                </GlowCard>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <RevealOnScroll direction="up" delay={0.4}>
            <div className="mt-20 flex flex-wrap justify-center gap-4">
              <Link
                href="/lokasi"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-950 no-underline shadow-sm transition-all hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5"
              >
                <MapPinned size={15} className="text-emerald-600" />
                Lihat sebaran lokasi
              </Link>
              <Link
                href="/unduhan"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-950 no-underline shadow-sm transition-all hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5"
              >
                <Download size={15} className="text-emerald-600" />
                Buka unduhan publik
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* --- VISI / TENTANG LPPM SECTION --- */}
      {visi && (
        <section className="border-t border-emerald-100 bg-white py-24 sm:py-32 relative overflow-hidden">
          {/* Absolute decorative gradient blob */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[450px] h-[450px] bg-emerald-50/50 rounded-full filter blur-[100px] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <RevealOnScroll direction="up">
              <div className="mx-auto max-w-4xl" style={{ perspective: 1500 }}>
                <div className="w-full transition-all duration-300 hover:scale-[1.005]">
                  <GlowCard className="rounded-[3rem] border border-emerald-100 bg-white shadow-[0_30px_70px_rgba(6,78,59,0.06)] p-10 sm:p-16 relative overflow-hidden">
                    
                    {/* Oversized quotes in background */}
                    <div className="absolute -right-6 -bottom-10 text-[18rem] font-serif font-black text-slate-100/80 leading-none select-none pointer-events-none">
                      ”
                    </div>
                    <div className="absolute -left-6 -top-10 text-[18rem] font-serif font-black text-slate-100/80 leading-none select-none pointer-events-none">
                      “
                    </div>

                    <div className="relative z-10">
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600 mb-4">
                        Tentang Lembaga
                      </p>
                      
                      <h2 className="text-3xl font-display font-black tracking-tight text-emerald-950 sm:text-4xl mb-8">
                        Visi LPPM UIN SAIZU
                      </h2>

                      <div className="relative">
                        <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full hidden sm:block" />
                        <div className="sm:pl-8">
                          <TextReveal
                            text={visi}
                            className="text-lg sm:text-xl leading-relaxed text-slate-600 font-medium italic"
                          />
                        </div>
                      </div>
                    </div>

                  </GlowCard>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}
    </>
  );
}

