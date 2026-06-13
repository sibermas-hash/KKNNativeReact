'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export function HeroParallax({
  background,
  children
}: {
  background: React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalized cursor coordinates (-0.5 to 0.5 relative to screen center)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Springs for realistic physical movement (organic easing)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 22 });

  // Map spring coordinate to translations
  // Background moves slightly opposite to mouse
  const bgTranslateX = useTransform(springX, [-0.5, 0.5], [12, -12]);
  const bgTranslateY = useTransform(springY, [-0.5, 0.5], [12, -12]);

  // Foreground moves with the mouse
  const fgTranslateX = useTransform(springX, [-0.5, 0.5], [-16, 16]);
  const fgTranslateY = useTransform(springY, [-0.5, 0.5], [-16, 16]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      mouseX.set((clientX / innerWidth) - 0.5);
      mouseY.set((clientY / innerHeight) - 0.5);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="relative z-0 h-screen min-h-[100svh] w-full overflow-hidden bg-emerald-950"
    >
      {/* Background layer (scaled up to prevent edge margins on movement) */}
      <motion.div
        style={{
          x: bgTranslateX,
          y: bgTranslateY,
          scale: 1.06,
        }}
        className="absolute inset-0 h-full w-full pointer-events-none"
      >
        {background}
      </motion.div>

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.54)_0%,rgba(0,0,0,0.62)_36%,rgba(0,0,0,0.68)_100%)] pointer-events-none" />

      {/* Floating ambient green liquid blobs for modern fluid look */}
      <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden select-none">
        <motion.div 
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px]"
        />
        <motion.div 
          animate={{
            x: [0, -40, 50, 0],
            y: [0, 40, -40, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px]"
        />
      </div>

      {/* Foreground contents */}
      <div className="relative z-10 flex h-screen min-h-[100svh] items-center justify-center px-6 pb-16 pt-24 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            style={{
              x: fgTranslateX,
              y: fgTranslateY,
            }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
