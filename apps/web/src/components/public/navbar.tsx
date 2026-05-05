'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { useScroll, useTransform, motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  href: string;
}

export function Navbar({ overlayNav = false }: { overlayNav?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  
  // Scroll animation values
  const { scrollY } = useScroll();
  
  // Progressively increase opacity and blur from 0 to 200px scroll
  const bgOpacity = useTransform(scrollY, [0, 200], [0, 1]);
  const blurValue = useTransform(scrollY, [0, 200], [0, 16]);
  const navHeight = useTransform(scrollY, [0, 200], [90, 70]);
  const shadowOpacity = useTransform(scrollY, [150, 250], [0, 0.1]);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setIsScrolled(latest > 100);
    });
  }, [scrollY]);

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Berita', href: '/berita' },
    { label: 'Lokasi', href: '/lokasi' },
    { label: 'Unduhan', href: '/unduhan' },
  ];

  const getDashboardRoute = () => {
    if (!isAuthenticated || !user) return '/login';
    const roles = user.roles || [];
    if (roles.some(r => ['superadmin', 'admin', 'faculty_admin'].includes(r))) return '/admin';
    if (roles.some(r => ['dosen', 'dpl'].includes(r))) return '/dosen';
    return '/mahasiswa';
  };

  const dashboardItem: NavItem = {
    label: isAuthenticated ? 'Dashboard' : 'Login',
    href: getDashboardRoute(),
  };

  const navTextClass = overlayNav
    ? isScrolled 
      ? 'text-emerald-950 hover:text-emerald-600' 
      : 'text-white hover:text-white/80'
    : 'text-emerald-950 hover:text-emerald-700';

  return (
    <motion.nav 
      style={overlayNav ? {
        backgroundColor: useTransform(bgOpacity, (o) => isScrolled ? `rgba(255, 255, 255, ${o})` : `rgba(6, 78, 59, ${o})`),
        backdropFilter: useTransform(blurValue, (b) => `blur(${b}px)`),
        height: navHeight,
        boxShadow: useTransform(shadowOpacity, (s) => `0 4px 30px rgba(0, 0, 0, ${s})`),
      } : {}}
      className={
      overlayNav
        ? 'fixed inset-x-0 top-0 z-50 flex items-center transition-colors duration-500 border-b border-transparent'
        : 'sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur-xl py-4 h-[72px] flex items-center'
    }>
      <div className="mx-auto w-full max-w-[1920px] px-6 py-4 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0 py-1">
            <img src="/images/logo_uinsaizu.png" alt="Logo UIN SAIZU" className="h-9 w-auto object-contain sm:h-11" />
            <div className="w-px h-6 bg-emerald-200/50 mx-0.5" />
            <img src="/images/Logo_SIBERMAS.png" alt="Logo SIBERMAS" className="h-9 w-auto object-contain sm:h-11" />
          </Link>

          <div className="flex items-center gap-8">
            {/* Desktop Nav */}
            <div className="hidden lg:flex lg:items-center lg:gap-8">
              {[...navItems, dashboardItem].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group relative font-display text-[0.76rem] font-bold uppercase tracking-[0.16em] no-underline transition-colors ${navTextClass}`}
                >
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 w-0 bg-current transition-all duration-300 group-hover:w-full ${
                    isScrolled ? 'bg-emerald-600' : 'bg-white'
                  }`} />
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={
                overlayNav
                  ? `rounded-full border p-2.5 lg:hidden transition-all duration-300 ${
                      isScrolled 
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-950 shadow-sm' 
                        : 'border-white/20 bg-white/10 text-white backdrop-blur-md'
                    }`
                  : 'rounded-full border border-emerald-100 bg-white p-2.5 text-emerald-950 lg:hidden'
              }
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

          {/* Mobile Nav */}
          {isMenuOpen && (
            <div className="absolute inset-x-0 top-full mt-4 mx-5 lg:hidden">
              <div className={`p-6 rounded-3xl border shadow-2xl transition-all duration-500 ${
                overlayNav
                  ? isScrolled 
                    ? 'bg-white/95 border-emerald-100 text-emerald-950 backdrop-blur-xl' 
                    : 'bg-emerald-950/90 border-white/10 text-white backdrop-blur-md'
                  : 'bg-white border-emerald-100 text-emerald-950'
              }`}>
              <div className="flex flex-col gap-5">
                {[...navItems, dashboardItem].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="font-display text-xs font-semibold uppercase tracking-[0.16em]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
