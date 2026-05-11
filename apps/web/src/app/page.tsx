import { Metadata } from 'next';
import { fetchApi } from '@/lib/server-api';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { HeroTitle } from '@/components/public/hero-title';
import { Showcase3D, HomeContent } from '@/components/public/lazy';
import { HomePopupAnnouncement } from '@/components/public/home-popup-announcement';

export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
  title: 'Beranda | SIBERMAS KKN UIN SAIZU',
};

interface Announcement {
  id: number;
  title: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  image_url?: string;
  published_at?: string;
  reading_time?: number;
}

interface DownloadItem {
  id: number;
  title: string;
  file_type?: string;
  file_path?: string;
  file_url?: string;
  external_url?: string;
}

interface HomeData {
  featuredAnnouncements: Announcement[];
  featuredDownloads: DownloadItem[];
  stats: {
    students: number;
    groups: number;
    locations: number;
  };
  aboutContent?: {
    visi: string;
  };
}

async function getHomeData(): Promise<HomeData> {
  const res = await fetchApi<{ success: boolean; data: HomeData }>('/public/home');
  const data = res?.data;
  
  return {
    featuredAnnouncements: data?.featuredAnnouncements || [],
    featuredDownloads: data?.featuredDownloads || [],
    stats: {
      students: data?.stats?.students || 0,
      groups: data?.stats?.groups || 0,
      locations: data?.stats?.locations || 0,
    },
    aboutContent: {
      visi: data?.aboutContent?.visi || 'Menjadi Lembaga Penelitian dan Pengabdian kepada Masyarakat yang unggul dan kompetitif dalam pengembangan ilmu pengetahuan, teknologi, dan seni yang berbasis pada nilai-nilai moderasi Islam dan kearifan lokal.'
    }
  };
}



export default async function LandingPage() {
  const data = await getHomeData();
  const announcements = data.featuredAnnouncements || [];
  const featuredAnnouncement = announcements[0];
  const latestAnnouncements = announcements.slice(1, 5);
  const featuredDownloads = data.featuredDownloads || [];
  const stats = data.stats;
  const visi = data.aboutContent?.visi;

  return (
    <div className="min-h-screen bg-white text-emerald-950">
      <Navbar overlayNav={true} />
      <HomePopupAnnouncement />

      {/* --- HERO SECTION --- */}
      <section className="relative z-0 h-screen min-h-[100svh] overflow-hidden bg-emerald-950">
        <div className="absolute inset-0 h-full w-full bg-emerald-950 pointer-events-none">
          <video
            className="h-full w-full object-cover brightness-[0.58] saturate-[0.9]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/uin-saizu_1712224471.webp"
          >
            <source src="/videos/Video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.54)_0%,rgba(0,0,0,0.62)_36%,rgba(0,0,0,0.68)_100%)] pointer-events-none" />

        <div className="relative z-10 flex h-screen min-h-[100svh] items-center justify-center px-6 pb-16 pt-24 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <HeroTitle 
              title="SIBERMAS" 
              subtitle={
                <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-slate-100 sm:text-lg drop-shadow-lg">
                  Mengabdi tanpa batas, membangun masyarakat cerdas. <br className="hidden sm:block" />
                  Platform digital terintegrasi Pelaksanaan KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto.
                </p>
              }
            />
          </div>
        </div>
      </section>

      {/* --- 3D Showcase Section --- */}
      <Showcase3D />

      {/* --- Animated Content Sections --- */}
      <HomeContent
        featuredAnnouncement={featuredAnnouncement}
        latestAnnouncements={latestAnnouncements}
        featuredDownloads={featuredDownloads}
        stats={stats}
        visi={visi}
      />

      <Footer />
    </div>
  );
}
