'use client';

import { Users, Lightbulb, TreePine } from 'lucide-react';
import { RevealOnScroll, StaggerContainer, StaggerItem, GlowCard } from '@/components/ui/motion-effects';

const PROGRAMS = [
  {
    icon: Users,
    title: 'Pemberdayaan Masyarakat',
    description: 'Pendampingan komunitas desa melalui program partisipatif dan berkelanjutan untuk kemandirian masyarakat.',
    kicker: '15+ Desa Mitra',
    accent: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Lightbulb,
    title: 'Inovasi & Edukasi',
    description: 'Transfer ilmu pengetahuan dan teknologi tepat guna untuk mendorong transformasi digital pedesaan.',
    kicker: '50+ Program Kerja',
    accent: 'bg-teal-500',
    iconBg: 'bg-teal-50 text-teal-600',
  },
  {
    icon: TreePine,
    title: 'Pelestarian Lingkungan',
    description: 'Konservasi alam dan pembangunan berkelanjutan bersama masyarakat yang berwawasan lingkungan.',
    kicker: '100+ Kegiatan',
    accent: 'bg-cyan-600',
    iconBg: 'bg-cyan-50 text-cyan-700',
  },
];

export function Showcase3D() {
  return (
    <section className="bg-white py-14 sm:py-20 border-t border-emerald-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <RevealOnScroll direction="up">
          <div className="max-w-2xl">
            <p className="text-emerald-600 font-semibold uppercase tracking-widest text-xs">Program Unggulan</p>
            <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-emerald-950 sm:text-4xl">
              Tiga pilar pengabdian KKN UIN SAIZU.
            </h2>
          </div>
        </RevealOnScroll>

        <StaggerContainer className="mt-10 grid gap-5 md:grid-cols-3" stagger={0.12} delay={0.15}>
          {PROGRAMS.map((p) => {
            const Icon = p.icon;
            return (
              <StaggerItem key={p.title}>
                <GlowCard className="rounded-2xl border border-slate-100 bg-white shadow-sm h-full">
                  <div className="p-6 flex flex-col h-full">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-5 ${p.iconBg}`}>
                      <Icon size={19} strokeWidth={1.8} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">{p.kicker}</p>
                    <h3 className="font-display text-base font-bold text-emerald-950 mb-2">{p.title}</h3>
                    <p className="text-sm leading-7 text-slate-500 flex-1">{p.description}</p>
                    <div className={`mt-5 h-0.5 w-12 rounded-full ${p.accent}`} />
                  </div>
                </GlowCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
