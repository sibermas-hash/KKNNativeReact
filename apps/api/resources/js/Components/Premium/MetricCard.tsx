import React from 'react';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  alert?: boolean;
  color?: 'cyan' | 'amber' | 'rose' | 'lime';
  href?: string;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  alert = false,
  color = 'cyan',
  href,
  className,
}: MetricCardProps) {
  const Wrapper = href ? Link : 'div';
  const numericValue = typeof value === 'number' ? value : parseInt(value as string) || 0;

  const colorClasses = {
    cyan: 'border-cyan-100 hover:bg-cyan-50/50 text-cyan-950 icon-bg-cyan-50 icon-text-cyan-600',
    amber:
      'border-amber-100 bg-amber-50/20 hover:bg-amber-50 text-amber-700 icon-bg-amber-100 icon-text-amber-600',
    rose: 'border-rose-100 bg-rose-50/20 hover:bg-rose-50 text-rose-700 icon-bg-rose-100 icon-text-rose-600',
    lime: 'border-lime-100 bg-lime-50/20 hover:bg-lime-50 text-lime-700 icon-bg-lime-100 icon-text-lime-600',
  };

  const selectedColor = colorClasses[color] || colorClasses.cyan;

  return (
    <motion.div
      whileHover={href ? { scale: 1.02 } : {}}
      whileTap={href ? { scale: 0.98 } : {}}
      className={className}
    >
      <Wrapper
        {...(href ? { href } : {})}
        className={clsx(
          'bg-white rounded-2xl border-2 p-6 flex items-start justify-between transition-all duration-300 shadow-sm group h-full',
          selectedColor.split(' ').slice(0, 3).join(' '),
          href && 'cursor-pointer hover:shadow-lg hover:shadow-cyan-900/5',
        )}
      >
        <div className="font-sans">
          <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            {title}
          </p>
          <AnimatedCounter
            value={numericValue}
            className={clsx(
              'text-4xl font-bold tabular-nums tracking-tight leading-none',
              selectedColor.split(' ').find((c) => c.startsWith('text-')),
            )}
          />
        </div>
        <div
          className={clsx(
            'h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6 shrink-0',
            selectedColor
              .split(' ')
              .find((c) => c.startsWith('icon-bg-'))
              ?.replace('icon-bg-', 'bg-'),
            selectedColor
              .split(' ')
              .find((c) => c.startsWith('icon-text-'))
              ?.replace('icon-text-', 'text-'),
          )}
        >
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </Wrapper>
    </motion.div>
  );
}
