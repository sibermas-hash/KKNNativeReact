'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface ActiveCountdown {
  title: string;
  subtitle: string | null;
  countdown_end: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

interface HeroCountdownProps {
  onEnd?: () => void;
}

export function HeroCountdown({ onEnd }: HeroCountdownProps) {
  const [countdown, setCountdown] = useState<ActiveCountdown | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    fetch(`${apiUrl}/public/countdown/active`)
      .then(r => r.json())
      .then(res => {
        const items: ActiveCountdown[] = res?.data || [];
        const match = items[0];
        if (match) setCountdown(match);
        else onEnd?.();
      })
      .catch(() => onEnd?.());
  }, [onEnd]);

  useEffect(() => {
    if (!countdown) return;

    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(countdown.countdown_end).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        setCountdown(null);
        onEnd?.();
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [countdown, onEnd]);

  if (!countdown || !timeLeft) return null;

  return (
    <div className="flex flex-col items-center px-4">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 mb-4 sm:mb-6"
      >
        <Calendar className="text-emerald-400 animate-bounce w-5 h-5 sm:w-7 sm:h-7" />
        <h1 className="font-display text-sm sm:text-xl md:text-2xl lg:text-3xl font-black text-white uppercase tracking-wider sm:tracking-widest">
          {countdown.title}
        </h1>
      </motion.div>

      {/* Countdown digits */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-2 sm:gap-4 md:gap-6"
      >
        <div className="flex flex-col items-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 py-2 sm:px-5 sm:py-3 md:px-7 md:py-5 border border-white/20 shadow-2xl">
            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-sky-400 tabular-nums drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
          </div>
          <span className="mt-1.5 text-[8px] sm:text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Jam</span>
        </div>

        <span className="text-xl sm:text-3xl md:text-5xl font-black text-white/50 animate-pulse">:</span>

        <div className="flex flex-col items-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 py-2 sm:px-5 sm:py-3 md:px-7 md:py-5 border border-white/20 shadow-2xl">
            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-emerald-400 tabular-nums drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
          </div>
          <span className="mt-1.5 text-[8px] sm:text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Menit</span>
        </div>

        <span className="text-xl sm:text-3xl md:text-5xl font-black text-white/50 animate-pulse">:</span>

        <div className="flex flex-col items-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 py-2 sm:px-5 sm:py-3 md:px-7 md:py-5 border border-white/20 shadow-2xl">
            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-cyan-400 tabular-nums drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
          <span className="mt-1.5 text-[8px] sm:text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Detik</span>
        </div>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-base font-semibold text-white/80 text-center"
      >
        {countdown.subtitle || 'Pendaftaran KKN akan segera dibuka'}
      </motion.p>
    </div>
  );
}
