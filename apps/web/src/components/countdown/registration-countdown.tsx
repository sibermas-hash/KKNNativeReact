'use client';

import { useEffect, useState } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

interface RegistrationCountdownProps {
  targetDate: string;
  variant?: 'hero' | 'compact';
  title?: string;
  subtitle?: string;
}

export function RegistrationCountdown({ targetDate, variant = 'hero', title = 'Pendaftaran Dibuka Dalam', subtitle }: RegistrationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      const maxWindow = 24 * 60 * 60 * 1000;
      const isInWindow = diff > 0 && diff <= maxWindow;

      if (diff <= 0 || !isInWindow) {
        setIsActive(false);
        setTimeLeft(null);
        return;
      }

      setIsActive(true);
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!isActive || !timeLeft) return null;

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg">
        <Clock size={14} className="animate-pulse sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm font-black tabular-nums">
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-4 sm:p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)] animate-pulse" />
        </div>

        <div className="relative z-10 text-center space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <Calendar className="text-white animate-bounce w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight">
              {title}
            </h2>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl blur-xl" />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-5 sm:py-3 md:px-7 md:py-5 shadow-xl">
                  <span className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-emerald-600 tabular-nums">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <span className="mt-1 sm:mt-2 text-[8px] sm:text-xs md:text-sm font-bold text-white/90 uppercase tracking-widest">Jam</span>
            </div>

            <span className="text-xl sm:text-3xl md:text-5xl font-black text-white animate-pulse">:</span>

            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl blur-xl" />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-5 sm:py-3 md:px-7 md:py-5 shadow-xl">
                  <span className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-teal-600 tabular-nums">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <span className="mt-1 sm:mt-2 text-[8px] sm:text-xs md:text-sm font-bold text-white/90 uppercase tracking-widest">Menit</span>
            </div>

            <span className="text-xl sm:text-3xl md:text-5xl font-black text-white animate-pulse">:</span>

            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl blur-xl" />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-5 sm:py-3 md:px-7 md:py-5 shadow-xl">
                  <span className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-cyan-600 tabular-nums">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <span className="mt-1 sm:mt-2 text-[8px] sm:text-xs md:text-sm font-bold text-white/90 uppercase tracking-widest">Detik</span>
            </div>
          </div>

          {subtitle && (
            <p className="text-white/90 text-xs sm:text-sm md:text-base font-semibold">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
