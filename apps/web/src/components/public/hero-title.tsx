'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function HeroTitle({ title, subtitle }: { title: string; subtitle?: React.ReactNode }): React.JSX.Element {
  const letters = title.split('');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    show: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)', 
      transition: { 
        y: { type: 'spring', stiffness: 100, damping: 15 },
        opacity: { duration: 0.4 },
        filter: { duration: 0.4, ease: 'easeOut' }
      } 
    },
  };

  return (
    <div className="flex flex-col items-center">
      <motion.h1 
        variants={container}
        initial="hidden"
        animate="show"
        className="font-display text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-[0.2em] pl-[0.2em]"
      >
        {letters.map((char, index) => {
          // Khusus untuk kata "SIBERMAS": SIBER (biru), MAS (hijau)
          const isSiber = title.toUpperCase() === 'SIBERMAS' && index < 5;
          const isMas = title.toUpperCase() === 'SIBERMAS' && index >= 5;
          
          let colorClass = 'text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]'; // Default
          if (isSiber) colorClass = 'text-sky-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.5)]';
          if (isMas) colorClass = 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.5)]';

          return (
            <motion.span key={index} variants={item} className={`inline-block ${colorClass}`}>
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          );
        })}
      </motion.h1>

      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
          className="mt-6 sm:mt-8"
        >
          {subtitle}
        </motion.div>
      )}

      {/* Lottie-style Scroll Indicator built with Framer Motion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-[26px] h-[42px] rounded-full border-2 border-white/30 flex justify-center p-1 backdrop-blur-sm">
          <motion.div
            animate={{ 
              y: [0, 12, 0],
              opacity: [1, 0, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-1.5 h-1.5 rounded-full bg-white/80"
          />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">
          Scroll
        </span>
      </motion.div>
    </div>
  );
}
