import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowRight,
  LayoutDashboard,
  Newspaper,
  Settings2,
  LockKeyhole,
  LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';

type HubAreaKey = 'operational' | 'blog' | 'system';

interface HubArea {
  key: HubAreaKey;
  title: string;
  badge: string;
  description: string;
  href: string;
  available: boolean;
  highlights: string[];
  locked_message: string | null;
}

interface HubProps extends PageProps {
  identity: {
    name: string;
    primary_role: string;
  };
  areas: HubArea[];
}

const iconMap: Record<HubAreaKey, ComponentType<any>> = {
  operational: LayoutDashboard,
  blog: Newspaper,
  system: Settings2,
};

const cardStyles: Record<
  HubAreaKey,
  { icon: string; badge: string; button: string; borderHover: string }
> = {
  operational: {
    icon: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
    badge: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
    button: 'bg-cyan-950 text-white hover:bg-cyan-800 shadow-[0_8px_20px_rgba(6,182,212,0.2)]',
    borderHover: 'hover:border-cyan-300',
  },
  blog: {
    icon: 'bg-lime-50 text-lime-600 border border-lime-100',
    badge: 'bg-lime-50 text-lime-600 border border-lime-100',
    button: 'bg-lime-600 text-white hover:bg-lime-700 shadow-[0_8px_20px_rgba(132,204,22,0.2)]',
    borderHover: 'hover:border-lime-300',
  },
  system: {
    icon: 'bg-amber-50 text-amber-600 border border-amber-100',
    badge: 'bg-amber-50 text-amber-600 border border-amber-100',
    button: 'bg-amber-500 text-white hover:bg-amber-600 shadow-[0_8px_20px_rgba(245,158,11,0.2)]',
    borderHover: 'hover:border-amber-300',
  },
};

export default function AdminHub() {
  const { identity, areas } = usePage<HubProps>().props;

  return (
    <div className="min-h-screen bg-white text-cyan-950 selection:bg-cyan-100 font-sans">
      <Head title="Gerbang Kendali | SIBERMAS KKN" />

      {/* Solid formal background accent - Very Clean */}
      <div className="absolute inset-x-0 top-0 h-[300px] bg-cyan-50/50 border-b border-cyan-50" />

      <div className="relative mx-auto flex min-h-screen max-w-[1400px] flex-col px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
        {/* Header - Pure solid white with high contrast */}
        <header className="flex flex-col gap-6 rounded-xl border border-cyan-100 bg-white px-8 py-6 shadow-sm xl:flex-row xl:items-center xl:justify-between mb-12 relative overflow-hidden">
          {/* Subtle accent line on top of header */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-lime-500 to-amber-500" />

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo_uinsaizu.png"
                alt="Logo UIN SAIZU"
                className="h-12 w-12 object-contain"
              />
              <div className="h-8 w-px bg-cyan-100" />
              <img
                src="/images/Logo_SIBERMAS.png"
                alt="Logo SIBERMAS"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="min-w-0 border-l border-cyan-50 pl-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-600">
                Pusat Kendali Sistem.
              </p>
              <h1 className="text-[1.2rem] font-black tracking-tighter uppercase mt-0.5 font-display">
                <span className="text-sky-500">SIBER</span>
                <span className="text-emerald-500">MAS</span>{' '}
                <span className="text-cyan-950">KKN UIN SAIZU</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center border-t border-cyan-50 pt-4 xl:border-t-0 xl:pt-0">
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/30 px-5 py-3">
              <div className="flex justify-between items-center gap-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-600 mb-0.5 font-sans">
                    Sesi Aktif
                  </p>
                  <p className="text-xs font-black uppercase text-cyan-950 tracking-tight font-display">
                    {identity.name}
                  </p>
                </div>
                <div className="text-right border-l border-cyan-100 pl-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-600 mb-0.5 font-sans">
                    Hak Akses
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-900 font-display">
                    {identity.primary_role.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-6 text-[10px] font-black uppercase tracking-widest text-rose-700 transition-colors hover:bg-rose-100 hover:text-rose-800 font-display"
              >
                <LogOut size={16} />
                Keluar
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-4 mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-[2.5rem] font-black tracking-tighter text-cyan-950 uppercase leading-none mb-3 font-display">
            Pilih Jalur Akses
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed font-sans">
            Sistem KKN dipisahkan secara modular. Pilih dashboard tujuan.
          </p>
        </section>

        {/* 3 BIG CARDS */}
        <section className="grid gap-6 xl:grid-cols-3 max-w-6xl mx-auto w-full">
          {areas.map((area, index) => {
            const Icon = iconMap[area.key];
            const style = cardStyles[area.key];

            let displayTitle = area.title;
            if (area.key === 'operational') displayTitle = 'DASHBOARD ADMIN';
            if (area.key === 'blog') displayTitle = 'DASHBOARD BLOG';
            if (area.key === 'system') displayTitle = 'PENGATURAN SISTEM (API)';

            return (
              <motion.div
                key={area.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`flex flex-col rounded-xl border border-slate-100 bg-white p-8 shadow-sm transition-all ${area.available ? style.borderHover + ' hover:-translate-y-1 hover:shadow-md' : 'opacity-70 grayscale-[0.2]'}`}
              >
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl ${style.icon}`}
                  >
                    <Icon size={28} strokeWidth={2.5} />
                  </div>
                  <span
                    className={`rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] ${style.badge}`}
                  >
                    {area.badge}
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  <h3 className="text-[1.5rem] font-black tracking-tighter text-cyan-950 uppercase leading-tight font-display">
                    {displayTitle}
                  </h3>
                  <p className="text-xs font-medium leading-relaxed text-slate-500 font-sans">
                    {area.description}
                  </p>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-100">
                  {area.available ? (
                    <Link
                      href={area.href}
                      className={`inline-flex w-full items-center justify-between gap-2 rounded-xl px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all font-display ${style.button}`}
                    >
                      Akses Portal
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-800 font-display">
                        <LockKeyhole size={16} />
                        Akses Terkunci
                      </div>
                      {area.locked_message && (
                        <p className="mt-2 text-[10px] font-bold text-amber-700 uppercase tracking-widest font-sans">
                          {area.locked_message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

AdminHub.layout = (page: ReactNode) => page;
