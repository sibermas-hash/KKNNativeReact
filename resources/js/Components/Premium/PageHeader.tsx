import React from 'react';
import type { LucideIcon } from 'lucide-react';

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

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  groupLabel, 
  stats,
  children 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-emerald-50 pt-2">
      <div className="space-y-3">
        {(groupLabel || Icon) && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-800">
                {Icon && <Icon size={12} strokeWidth={3} />}
            </div>
            {groupLabel && <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] font-display">{groupLabel}</span>}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-emerald-950 leading-none tracking-tighter uppercase font-display">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[1.1rem] font-medium text-slate-500 max-w-2xl leading-relaxed font-elegant italic mt-1.5 opacity-80">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {stats && (
          <div className="px-5 py-3 bg-white border border-emerald-100 rounded-2xl flex items-center gap-4 shadow-sm">
            {stats.icon && (
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
                <stats.icon size={20} strokeWidth={2.5} />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1.5 font-sans">{stats.label}</span>
              <span className="text-base font-black text-emerald-950 leading-none font-display">{stats.value}</span>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default PageHeader;
