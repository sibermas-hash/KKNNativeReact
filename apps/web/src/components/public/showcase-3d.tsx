import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Users, Lightbulb, TreePine } from 'lucide-react';
import { RevealOnScroll, StaggerContainer, StaggerItem } from '@/components/ui/motion-effects';

const PROGRAMS = [
  {
    icon: Users,
    title: 'Pemberdayaan Masyarakat',
    description: 'Pendampingan komunitas desa melalui program KKN partisipatif dan berkelanjutan untuk kemandirian ekonomi, sosial, dan budaya masyarakat.',
    kicker: '15+ Desa Mitra KKN',
    iconBg: 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-800 group-hover:border-emerald-100',
  },
  {
    icon: Lightbulb,
    title: 'Inovasi & Edukasi',
    description: 'Transfer ilmu pengetahuan dan teknologi tepat guna untuk mendorong transformasi digital, literasi, serta efisiensi tata pamong pedesaan.',
    kicker: '50+ Rencana Kerja Terapan',
    iconBg: 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-800 group-hover:border-emerald-100',
  },
  {
    icon: TreePine,
    title: 'Pelestarian Lingkungan',
    description: 'Aksi nyata konservasi alam, ketahanan pangan lokal, dan pembangunan sanitasi bersama masyarakat yang berwawasan lingkungan asri.',
    kicker: '100+ Kegiatan Hijau',
    iconBg: 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-800 group-hover:border-emerald-100',
  },
];

function Tilt3DCard({
  children,
  className = '',
  accentColor = 'rgba(16, 185, 129, 0.03)',
}: {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Normalized cursor coords (0 to 1) for rotations
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  
  // Raw cursor coords for glow light
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  // Springs for organic physical movement
  const rotateX = useSpring(useTransform(y, [0, 1], [4.5, -4.5]), { stiffness: 120, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-4.5, 4.5]), { stiffness: 120, damping: 20 });
  
  const translateY = useSpring(0, { stiffness: 120, damping: 20 });
  const scale = useSpring(1, { stiffness: 120, damping: 20 });

  const glareX = useSpring(50, { stiffness: 90, damping: 20 });
  const glareY = useSpring(50, { stiffness: 90, damping: 20 });
  
  const glareOpacity = useSpring(0, { stiffness: 120, damping: 20 });
  const glowOpacity = useSpring(0, { stiffness: 120, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    x.set(px / width);
    y.set(py / height);

    glowX.set(px);
    glowY.set(py);

    glareX.set((px / width) * 100);
    glareY.set((py / height) * 100);
  };

  const handleMouseEnter = () => {
    translateY.set(-6);
    scale.set(1.015);
    glareOpacity.set(0.25);
    glowOpacity.set(1);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
    translateY.set(0);
    scale.set(1);
    glareOpacity.set(0);
    glowOpacity.set(0);
  };

  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 60%)`
  );

  const glowBackground = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(350px circle at ${gx}px ${gy}px, ${accentColor}, transparent 40%)`
  );

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformPerspective: 1000,
        rotateX,
        rotateY,
        translateY,
        scale,
        transformStyle: 'preserve-3d',
      }}
      className={`relative overflow-hidden select-none ${className}`}
    >
      {/* Realistic light glare reflection overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-30 mix-blend-overlay"
        style={{
          opacity: glareOpacity,
          background: glareBackground,
        }}
      />
      {/* Ambient cursor spotlight follower */}
      <motion.div
        className="pointer-events-none absolute -inset-px z-0"
        style={{
          opacity: glowOpacity,
          background: glowBackground,
        }}
      />
      <div style={{ transform: 'translateZ(15px)' }} className="h-full w-full relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

export function Showcase3D() {
  return (
    <section className="bg-white py-20 sm:py-28 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <RevealOnScroll direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-[#065F46] font-bold uppercase tracking-[0.25em] text-xs">Pilar Tri Dharma</p>
            <h2 className="mt-4 text-3xl font-serif font-bold tracking-tight text-emerald-950 sm:text-4xl">
              Tiga Pilar Utama Pengabdian KKN UIN SAIZU
            </h2>
            <div className="mt-4 w-12 h-0.5 bg-[#059669]/30 mx-auto rounded-full" />
          </div>
        </RevealOnScroll>

        <StaggerContainer className="grid gap-6 md:grid-cols-3 md:pb-10" stagger={0.1} delay={0.1}>
          {PROGRAMS.map((p) => {
            const Icon = p.icon;
            return (
              <StaggerItem key={p.title}>
                <Tilt3DCard className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200/80 h-full group">
                  <div className="p-8 flex flex-col h-full items-start text-left">
                    {/* Clean minimal icon container */}
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center mb-6 border transition-colors duration-500 ${p.iconBg}`}>
                      <Icon size={18} strokeWidth={2} />
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#065F46] mb-2">{p.kicker}</p>
                    <h3 className="font-serif text-lg font-semibold text-slate-900 mb-3 group-hover:text-emerald-900 transition-colors duration-300">{p.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500 flex-1">{p.description}</p>
                  </div>
                </Tilt3DCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
