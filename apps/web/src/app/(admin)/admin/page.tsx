'use client';
import React from 'react';

import { useAuthStore } from '@/stores';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Newspaper, Settings2, ArrowUpRight, Power, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

type AreaDef = {
  key: string;
  num: string;
  title: string;
  sub: string;
  description: string;
  href: string;
  icon: typeof LayoutDashboard;
  color: string;
  iconBg: string;
  badgeColor: string;
  grad: string;
  shadow: string;
  superadminOnly?: boolean;
};

const ALL_AREAS: AreaDef[] = [
  {
    key: 'operational',
    num: '01',
    title: 'Dashboard Admin',
    sub: 'Operasional',
    description: 'Pendaftaran, kelompok, laporan harian, penilaian, dan seluruh siklus operasional KKN.',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    color: '#0891b2',
    iconBg: 'bg-cyan-50 text-cyan-600',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    grad: 'from-cyan-500 to-sky-600',
    shadow: 'rgba(8,145,178,0.2)',
  },
  {
    key: 'blog',
    num: '02',
    title: 'Dashboard Blog',
    sub: 'Konten Publik',
    description: 'Warta utama, pusat unduhan, profil lembaga, dan skema KKN di halaman publik.',
    href: '/admin/warta-utama',
    icon: Newspaper,
    color: '#16a34a',
    iconBg: 'bg-green-50 text-green-600',
    badgeColor: 'bg-green-50 text-green-700 border-green-100',
    grad: 'from-green-500 to-emerald-600',
    shadow: 'rgba(22,163,74,0.2)',
  },
  {
    key: 'system',
    num: '03',
    title: 'Pusat Administrasi Sistem',
    sub: 'Administrasi',
    description: 'Kelola konfigurasi global, pengguna, integrasi, keamanan, audit, dan monitoring SIBERMAS.',
    href: '/admin/pengguna',
    icon: Settings2,
    color: '#d97706',
    iconBg: 'bg-amber-50 text-amber-600',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
    grad: 'from-amber-400 to-orange-500',
    shadow: 'rgba(217,119,6,0.2)',
    superadminOnly: true,
  },
];

function Card({ area, index }: { area: AreaDef; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); setHovered(false); };

  const Icon = area.icon;

  return (
    <motion.a
      ref={ref}
      href={area.href}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2 + index * 0.1, type: 'spring', stiffness: 180, damping: 20 }}
      style={{
        rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d',
        boxShadow: hovered
          ? `0 20px 60px -8px ${area.shadow}, 0 0 0 1px ${area.color}20`
          : '0 2px 16px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.4s ease',
      } as React.CSSProperties}
      whileHover={{ scale: 1.02 }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      className="relative flex flex-col rounded-2xl bg-white border border-slate-100 p-7 overflow-hidden"
    >
      {/* Top accent line */}
      <motion.div
        className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${area.grad}`}
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Glow */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute -top-12 -right-12 h-36 w-36 rounded-full blur-3xl pointer-events-none"
            style={{ background: `${area.color}18` }}
          />
        )}
      </AnimatePresence>

      {/* Shimmer */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ x: '-120%' }}
            animate={{ x: '220%' }}
            exit={{}}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute inset-0 w-1/3 skew-x-12 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${area.color}0a, transparent)` }}
          />
        )}
      </AnimatePresence>

      {/* Number + icon */}
      <div className="flex items-start justify-between mb-7">
        <span className="text-[10px] font-bold tabular-nums text-slate-300">{area.num}</span>
        <motion.div
          animate={hovered ? { y: -3, rotate: -6, scale: 1.08 } : { y: 0, rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${area.iconBg}`}
        >
          <Icon size={22} strokeWidth={2} />
        </motion.div>
      </div>

      {/* Text */}
      <div className="flex-1 mb-7">
        <span className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest mb-3 ${area.badgeColor}`}>
          {area.sub}
        </span>
        <h2 className="text-[1.25rem] font-bold tracking-tight text-slate-900 mb-2 leading-snug">{area.title}</h2>
        <p className="text-[13px] leading-relaxed text-slate-400">{area.description}</p>
      </div>

      {/* CTA */}
      <div
        className={`flex items-center justify-between rounded-xl px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white bg-gradient-to-r ${area.grad} transition-opacity`}
        style={{ opacity: hovered ? 1 : 0.85 }}
      >
        Akses Portal
        <motion.div animate={hovered ? { x: 2, y: -2 } : { x: 0, y: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
          <ArrowUpRight size={15} />
        </motion.div>
      </div>
    </motion.a>
  );
}

export default function AdminHub(): React.JSX.Element {
  const { user, clearUser } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try { await (await import('@/lib/api')).api.post('/auth/logout'); } catch { /* noop */ }
    clearUser();
    router.replace('/');
  };

  const primaryRole = user?.roles?.[0]?.replace(/_/g, ' ') ?? 'Admin';

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-cyan-100 overflow-hidden">

      {/* Ambient blobs */}
      {[
        { cls: 'bg-cyan-200/40', pos: '-top-48 -right-48', size: 'h-[600px] w-[600px]', dur: 9 },
        { cls: 'bg-green-200/30', pos: '-bottom-32 -left-32', size: 'h-[480px] w-[480px]', dur: 11 },
        { cls: 'bg-amber-200/20', pos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', size: 'h-[360px] w-[360px]', dur: 13 },
      ].map((b, i) => (
        <motion.div
          key={i}
          className={`fixed ${b.pos} ${b.size} ${b.cls} rounded-full blur-3xl pointer-events-none -z-10`}
          animate={{ scale: [1, 1.12, 1], x: [0, 16, 0], y: [0, -16, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 2 }}
        />
      ))}

      <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:py-14">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 22 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-16"
        >
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div whileHover={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.4 }}>
              <Image src="/images/logo_uinsaizu.png" alt="Logo UIN SAIZU" width={44} height={44} className="h-11 w-11 object-contain" />
            </motion.div>
            <div className="h-8 w-px bg-slate-200" />
            <Image src="/images/Logo_SIBERMAS.png" alt="Logo SIBERMAS" width={110} height={36} className="h-9 object-contain" style={{ width: 'auto' }} />
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div className="hidden sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">Pusat Kendali</p>
              <p className="text-sm font-bold text-slate-600 tracking-tight">KKN UIN SAIZU</p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"
            >
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Sesi Aktif</p>
              <div className="flex items-center gap-2.5">
                <p className="text-sm font-bold text-slate-800">{user?.name ?? '-'}</p>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.65, type: 'spring', stiffness: 400 }}
                  className="rounded-md bg-cyan-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-700 border border-cyan-100"
                >
                  {primaryRole}
                </motion.span>
              </div>
            </motion.div>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="flex h-[50px] w-[50px] items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-400 shadow-sm hover:bg-rose-50 hover:text-rose-500"
              title="Keluar"
            >
              <Power size={17} />
            </motion.button>
          </motion.div>
        </motion.header>

        {/* Hero */}
        <section className="mb-14 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white px-4 py-1.5 mb-6 shadow-sm"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}>
              <Sparkles size={11} className="text-cyan-500" />
            </motion.div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-700">Sistem Aktif</span>
          </motion.div>

          <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
            {['Pilih', 'Jalur', 'Akses'].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.22 + i * 0.09, type: 'spring', stiffness: 180, damping: 18 }}
                className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-none"
              >
                {word}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.4 }}
            className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed"
          >
            Sistem KKN dipisahkan secara modular. Pilih dashboard tujuan untuk melanjutkan.
          </motion.p>
        </section>

        {/* Cards */}
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" style={{ perspective: '1200px' }}>
          {ALL_AREAS
            .filter((area) => !area.superadminOnly || user?.roles?.includes('superadmin'))
            .map((area, i) => <Card key={area.key} area={area} index={i} />)}
        </section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-14 flex items-center justify-center gap-3 text-[11px] text-slate-300"
        >
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-slate-200" />
          UIN Prof. K.H. Saifuddin Zuhri Purwokerto — SIBERMAS KKN
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-slate-200" />
        </motion.footer>
      </div>
    </div>
  );
}
