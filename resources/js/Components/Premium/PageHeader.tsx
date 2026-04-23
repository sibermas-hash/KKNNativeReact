import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  groupLabel?: string;
  stats?: {
    label: string;
    value: string | number;
    icon?: LucideIcon;
  };
  children?: React.ReactNode;
}

import AnimatedCounter from './AnimatedCounter';

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  groupLabel, 
  stats,
  children 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-cyan-100 pt-2 font-sans">
      <div className="space-y-3">
        {(groupLabel || Icon) && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-cyan-50 rounded-md flex items-center justify-center text-cyan-800">
                {Icon && <Icon size={12} strokeWidth={3} />}
            </div>
            {groupLabel && <span className="text-[11px] font-semibold text-cyan-800 uppercase tracking-wider">{groupLabel}</span>}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-cyan-950 leading-none tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[1rem] font-medium text-slate-500 max-w-2xl leading-relaxed mt-1.5 opacity-80">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {stats && (
          <div className="px-5 py-3 bg-white border-2 border-cyan-50 rounded-2xl flex items-center gap-4 shadow-sm">
            {stats.icon && (
              <div className="h-10 w-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-700">
                <stats.icon size={20} strokeWidth={2.5} />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-none mb-1.5">{stats.label}</span>
              <AnimatedCounter 
                value={typeof stats.value === 'number' ? stats.value : parseInt(stats.value as string) || 0} 
                className="text-xl font-bold text-cyan-950 leading-none tabular-nums tracking-tight"
              />
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default PageHeader;
