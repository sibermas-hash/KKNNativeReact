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
    success: 'bg-[#e8f5ee] text-[#1a7a4a]',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    info: 'bg-blue-50 text-blue-600',
    gray: 'bg-[#e8f5ee] text-[#1a7a4a]',
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl p-5 flex items-center gap-4 hover:shadow-md hover:border-slate-400 transition-all shadow-sm group">
      <div className={clsx(
        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
        iconVariants[variant]
      )}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-emerald-950 tabular-nums leading-none">{value}</span>
          {trend && <span className="text-xs font-semibold text-[#16a34a]">{trend}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
