import React from 'react';
import { motion } from 'motion/react';

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
  } as const;

  const item = {
    hidden: { y: '105%', opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        y: { type: 'spring', stiffness: 90, damping: 16 },
        opacity: { duration: 0.5 }
      } 
    },
  } as const;

  return (
    <div className="flex flex-col items-center relative select-none w-full z-10 text-center">
      {/* --- SIBERMAS Clean Nordic Serif Title --- */}
      <motion.h1 
        variants={container}
        initial="hidden"
        animate="show"
        className="font-serif text-5xl sm:text-7xl lg:text-[7rem] font-light uppercase tracking-[0.25em] pl-[0.25em] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex flex-wrap justify-center overflow-visible"
      >
        {letters.map((char, index) => {
          return (
            <span key={index} className="inline-block overflow-hidden py-1">
              <motion.span 
                variants={item} 
                className="inline-block text-white"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            </span>
          );
        })}
      </motion.h1>

      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.9, duration: 1.0, ease: 'easeOut' }}
          className="mt-8 z-10 w-full"
        >
          {subtitle}
        </motion.div>
      )}

      {/* Subtle Minimalist Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
      >
        <div className="w-[20px] h-[34px] rounded-full border border-white/20 flex justify-center p-0.5">
          <motion.div
            animate={{ 
              y: [0, 10, 0],
              opacity: [1, 0, 1]
            }}
            transition={{
              duration: 2.0,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-1 h-1 rounded-full bg-white/80"
          />
        </div>
        <span className="text-[8px] font-medium uppercase tracking-[0.25em] text-white/50">
          Scroll
        </span>
      </motion.div>
    </div>
  );
}
