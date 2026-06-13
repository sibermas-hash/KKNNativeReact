'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
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
    <div className="flex flex-col items-center px-4 select-none">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2.5 mb-6 sm:mb-8"
      >
        <Calendar className="text-emerald-300 w-5 h-5 sm:w-6 sm:h-6 opacity-75" />
        <h1 className="font-serif text-sm sm:text-lg md:text-xl lg:text-2xl font-light text-white uppercase tracking-[0.2em]">
          {countdown.title}
        </h1>
      </motion.div>

      {/* Countdown digits */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex items-center gap-3 sm:gap-4 md:gap-5"
      >
        <div className="flex flex-col items-center">
          <div className="bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 border border-white/10 shadow-xl">
            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
          </div>
          <span className="mt-2 text-[8px] sm:text-[9px] md:text-xs font-semibold text-white/50 uppercase tracking-[0.25em]">Jam</span>
        </div>

        <span className="text-xl sm:text-2xl md:text-4xl font-light text-white/30 animate-pulse">:</span>

        <div className="flex flex-col items-center">
          <div className="bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 border border-white/10 shadow-xl">
            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
          </div>
          <span className="mt-2 text-[8px] sm:text-[9px] md:text-xs font-semibold text-white/50 uppercase tracking-[0.25em]">Menit</span>
        </div>

        <span className="text-xl sm:text-2xl md:text-4xl font-light text-white/30 animate-pulse">:</span>

        <div className="flex flex-col items-center">
          <div className="bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 border border-white/10 shadow-xl">
            <span className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
          <span className="mt-2 text-[8px] sm:text-[9px] md:text-xs font-semibold text-white/50 uppercase tracking-[0.25em]">Detik</span>
        </div>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-6 sm:mt-8 text-xs sm:text-sm font-light text-white/60 tracking-wider text-center"
      >
        {countdown.subtitle || 'Pendaftaran KKN akan segera dibuka'}
      </motion.p>
    </div>
  );
}
