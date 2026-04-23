import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  variant = 'gray',
  trend 
}) => {
  const iconVariants = {
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    info: 'bg-sky-50 text-sky-600',
    gray: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white border border-emerald-100 rounded-2xl p-6 flex items-center gap-5 hover:shadow-lg hover:shadow-emerald-900/5 hover:border-emerald-200 transition-all shadow-sm group">
      <div className={clsx(
        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:rotate-6",
        iconVariants[variant]
      )}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] leading-none mb-2 font-display">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-950 tabular-nums leading-none font-display">{value}</span>
          {trend && <span className="text-xs font-black text-emerald-600 font-sans">{trend}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
