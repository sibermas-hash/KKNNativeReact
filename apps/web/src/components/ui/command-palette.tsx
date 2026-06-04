'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/stores';
import {
  LayoutDashboard, Users, ClipboardList, MapPin, FileText,
  BarChart3, Settings, BookOpen, GraduationCap, Search,
} from 'lucide-react';

const ITEMS = [
  { label: 'Dashboard',         href: '/admin/dashboard',          icon: LayoutDashboard, group: 'Halaman' },
  { label: 'Pendaftaran',       href: '/admin/pendaftaran',        icon: ClipboardList,   group: 'Halaman' },
  { label: 'Kelompok',          href: '/admin/kelompok',           icon: Users,           group: 'Halaman' },
  { label: 'Lokasi',            href: '/admin/lokasi',             icon: MapPin,          group: 'Halaman' },
  { label: 'Laporan Harian',    href: '/admin/laporan/harian',     icon: BookOpen,        group: 'Halaman' },
  { label: 'Nilai',             href: '/admin/nilai',              icon: FileText,        group: 'Halaman' },
  { label: 'Rekapitulasi',      href: '/admin/rekapitulasi',       icon: BarChart3,       group: 'Halaman' },
  { label: 'Jenis KKN',         href: '/admin/jenis-kkn',          icon: GraduationCap,   group: 'Master Data' },
  { label: 'Periode',           href: '/admin/periode',            icon: LayoutDashboard, group: 'Master Data' },
  { label: 'Pusat Administrasi Sistem', href: '/admin/pengaturan/sistem',  icon: Settings,        group: 'Sistem' },
  { label: 'Manajemen Pengguna',href: '/admin/pengguna',           icon: Users,           group: 'Sistem', superadminOnly: true },
];

export function CommandPalette(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const roles = useAuthStore((state) => state.user?.roles ?? []);
  const visibleItems = ITEMS.filter((item) => !item.superadminOnly || roles.includes('superadmin'));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const groups = [...new Set(visibleItems.map(i => i.group))];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-lg"
          >
            <Command className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              style={{ fontFamily: 'var(--font-display)' }}>
              <div className="flex items-center gap-3 px-4 border-b border-slate-100">
                <Search size={15} className="text-slate-400 shrink-0" />
                <Command.Input
                  placeholder="Cari halaman atau fitur..."
                  className="flex-1 h-12 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none font-sans"
                />
                <kbd className="shrink-0 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">ESC</kbd>
              </div>

              <Command.List className="max-h-72 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-slate-400 font-sans">
                  Tidak ditemukan.
                </Command.Empty>

                {groups.map(group => (
                  <Command.Group key={group} heading={group}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-slate-400">
                    {visibleItems.filter(i => i.group === group).map(item => (
                      <Command.Item
                        key={item.href}
                        value={item.label}
                        onSelect={() => navigate(item.href)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 cursor-pointer data-[selected=true]:bg-slate-50 data-[selected=true]:text-slate-900 transition-colors font-sans">
                        <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <item.icon size={14} className="text-slate-500" />
                        </div>
                        {item.label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-400 font-sans">
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1 rounded">↑↓</kbd> navigasi</span>
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1 rounded">↵</kbd> buka</span>
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1 rounded">⌘K</kbd> tutup</span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
