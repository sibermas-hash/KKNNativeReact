import { Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { useState } from 'react';

type PublicLayoutProps = {
  children: React.ReactNode;
  overlayNav?: boolean;
};

const safeRoute = (name: string, params?: unknown) => {
  try {
    return (window as any).route ? (window as any).route(name, params) : '#';
  } catch {
    return '#';
  }
};

export default function PublicLayout({ children, overlayNav = false }: PublicLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { auth } = usePage<PageProps>().props;

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Berita', href: safeRoute('public.announcements') },
    { label: 'Lokasi', href: safeRoute('public.locations') },
    { label: 'Unduhan', href: safeRoute('public.downloads') },
  ];

  const getDashboardRoute = () => {
    if (!auth.user) return safeRoute('login');

    const roles =
      (auth.user.roles as Array<string | { name: string }> | undefined)?.map((role) =>
        typeof role === 'string' ? role : role.name,
      ) || [];

    if (roles.some((role) => ['superadmin', 'faculty_admin', 'admin'].includes(role))) {
      return safeRoute('admin.hub');
    }

    if (roles.some((role) => ['dpl', 'dosen'].includes(role))) {
      return safeRoute('dpl.dashboard');
    }

    return safeRoute('student.dashboard');
  };

  const dashboardItem = {
    label: auth.user ? 'Dashboard' : 'Login',
    href: getDashboardRoute(),
  };

  const navTextClass = overlayNav
    ? 'text-white/92 hover:text-white'
    : 'text-emerald-950 hover:text-emerald-700';

  const mobilePanelClass = overlayNav
    ? 'border border-white/12 bg-[rgba(2,24,18,0.92)] text-white shadow-[0_30px_80px_rgba(2,44,34,0.36)]'
    : 'border border-emerald-100 bg-white text-emerald-950 shadow-[0_24px_70px_rgba(6,78,59,0.12)]';

  return (
    <div className="min-h-screen bg-white text-emerald-950">
      <nav
        className={
          overlayNav
            ? 'fixed inset-x-0 top-0 z-50'
            : 'sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur-xl'
        }
      >
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <img
                src="/images/logo_uinsaizu.png"
                alt="Logo UIN SAIZU"
                className="h-9 w-auto object-contain sm:h-10"
              />
              <img
                src="/images/Logo_SIBERMAS.png"
                alt="Logo SIBERMAS"
                className="h-9 w-auto object-contain sm:h-10"
              />
            </Link>

            <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex lg:items-center lg:gap-8">
              {[...navItems, dashboardItem].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`font-display text-[0.76rem] font-semibold uppercase tracking-[0.16em] no-underline transition-colors ${navTextClass}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <button
              type="button"
              className={
                overlayNav
                  ? 'rounded-full border border-white/15 bg-white/8 p-2.5 text-white lg:hidden'
                  : 'rounded-full border border-emerald-100 bg-white p-2.5 text-emerald-950 lg:hidden'
              }
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label="Buka menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-emerald-950/35 lg:hidden"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Tutup menu"
                />
                <motion.div
                  initial={{ opacity: 0, y: -14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  className={`absolute inset-x-0 top-[4.25rem] z-50 mx-5 rounded-[1.4rem] p-5 lg:hidden ${mobilePanelClass}`}
                >
                  <div className="flex flex-col gap-4">
                    {[...navItems, dashboardItem].map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="font-display text-xs font-semibold uppercase tracking-[0.16em] no-underline"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <main className={overlayNav ? '' : 'min-h-[calc(100vh-21rem)]'}>{children}</main>

      <footer className="border-t border-emerald-100 bg-white py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,0.8fr)] lg:px-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo_uinsaizu.png"
                alt="Logo UIN SAIZU"
                className="h-9 w-auto object-contain"
              />
              <img
                src="/images/Logo_SIBERMAS.png"
                alt="Logo SIBERMAS"
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="max-w-lg text-sm leading-6 text-slate-600">
              Portal publik KKN UIN SAIZU untuk menyajikan berita, dokumen resmi, dan informasi
              lokasi pengabdian secara terbuka dan mudah dipantau.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-emerald-950">
              Kontak
            </p>
            <div className="space-y-2.5 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>Jl. Jend. A. Yani No. 40, Purwokerto, Jawa Tengah</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={17} className="shrink-0 text-emerald-600" />
                <span>(0281) 635624</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={17} className="shrink-0 text-emerald-600" />
                <span>lppm@uinsaizu.ac.id</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-emerald-950">
              Tautan Cepat
            </p>
            <div className="grid gap-2.5 text-sm text-slate-600">
              {[...navItems, dashboardItem].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="no-underline transition-colors hover:text-emerald-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-emerald-100 px-6 pt-5 text-[0.68rem] uppercase tracking-[0.16em] text-slate-500 sm:px-8 lg:px-8">
          &copy; {new Date().getFullYear()} LPPM UIN SAIZU Purwokerto
        </div>
      </footer>
    </div>
  );
}
