'use client';

import { Users, Lightbulb, TreePine } from 'lucide-react';
import { RevealOnScroll, StaggerContainer, StaggerItem, GlowCard, PerspectiveTilt } from '@/components/ui/motion-effects';

const PROGRAMS = [
  {
    icon: Users,
    title: 'Pemberdayaan Masyarakat',
    description: 'Pendampingan komunitas desa melalui program partisipatif dan berkelanjutan untuk kemandirian masyarakat.',
    kicker: '15+ Desa Mitra',
    accent: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
    tiltIntensity: 12,
    layoutClass: 'md:-rotate-[3deg] md:translate-y-8 z-10 hover:z-30',
  },
  {
    icon: Lightbulb,
    title: 'Inovasi & Edukasi',
    description: 'Transfer ilmu pengetahuan dan teknologi tepat guna untuk mendorong transformasi digital pedesaan.',
    kicker: '50+ Program Kerja',
    accent: 'bg-teal-500',
    iconBg: 'bg-teal-50 text-teal-600',
    tiltIntensity: 15,
    layoutClass: 'md:rotate-[3deg] md:-translate-y-8 z-20 hover:z-30',
  },
  {
    icon: TreePine,
    title: 'Pelestarian Lingkungan',
    description: 'Konservasi alam dan pembangunan berkelanjutan bersama masyarakat yang berwawasan lingkungan.',
    kicker: '100+ Kegiatan',
    accent: 'bg-cyan-600',
    iconBg: 'bg-cyan-50 text-cyan-700',
    tiltIntensity: 10,
    layoutClass: 'md:-rotate-[1.5deg] md:translate-y-6 z-10 hover:z-30',
  },
];

export function Showcase3D() {
  return (
    <section className="relative bg-white py-24 sm:py-32 border-t border-emerald-100 overflow-hidden">
      {/* Abstract 3D ambient blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-100/40 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-100/30 rounded-full filter blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <RevealOnScroll direction="up">
          <div className="max-w-2xl mb-16 md:mb-24">
            <p className="text-emerald-600 font-semibold uppercase tracking-widest text-xs">Program Unggulan</p>
            <h2 className="mt-3 text-4xl font-display font-black tracking-tight text-emerald-950 sm:text-5xl leading-tight">
              Tiga pilar pengabdian <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">KKN UIN SAIZU.</span>
            </h2>
          </div>
        </RevealOnScroll>

        <StaggerContainer className="flex flex-col md:flex-row md:-space-x-6 space-y-10 md:space-y-0 items-stretch justify-center" stagger={0.12} delay={0.15}>
          {PROGRAMS.map((p) => {
            const Icon = p.icon;
            return (
              <StaggerItem key={p.title} className={`flex-1 ${p.layoutClass}`}>
                <PerspectiveTilt intensity={p.tiltIntensity} className="h-full">
                  <GlowCard className="rounded-3xl border border-emerald-100/50 bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(6,78,59,0.06)] hover:shadow-[0_30px_70px_rgba(6,78,59,0.12)] h-full transition-shadow duration-500" glowColor="rgba(20, 184, 166, 0.12)">
                    <div className="p-8 flex flex-col h-full [transform-style:preserve-3d]">
                      
                      {/* Floating Icon Container */}
                      <div 
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-8 shadow-sm ${p.iconBg}`}
                        style={{ transform: 'translateZ(50px)' }}
                      >
                        <Icon size={22} strokeWidth={2} />
                      </div>

                      {/* Floating Subtitle */}
                      <p 
                        className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-3"
                        style={{ transform: 'translateZ(30px)' }}
                      >
                        {p.kicker}
                      </p>

                      {/* Floating Heading */}
                      <h3 
                        className="font-display text-lg font-bold text-emerald-950 mb-3 leading-snug"
                        style={{ transform: 'translateZ(40px)' }}
                      >
                        {p.title}
                      </h3>

                      {/* Floating Body Text */}
                      <p 
                        className="text-sm leading-relaxed text-slate-500 flex-1"
                        style={{ transform: 'translateZ(20px)' }}
                      >
                        {p.description}
                      </p>

                      {/* Floating Accent Bar */}
                      <div 
                        className={`mt-8 h-1 w-16 rounded-full ${p.accent}`}
                        style={{ transform: 'translateZ(35px)' }}
                      />

                    </div>
                  </GlowCard>
                </PerspectiveTilt>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
