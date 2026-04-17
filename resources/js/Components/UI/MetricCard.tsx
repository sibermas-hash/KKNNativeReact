import React from 'react';
import type { LucideIcon} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  label: string;
  value: string | number | undefined | null;
  icon: LucideIcon;
  color?: 'emerald' | 'sky' | 'amber' | 'rose' | 'slate' | string;
  desc?: string;
  className?: string;
}

export function MetricCard({ 
  label, 
  value, 
  icon: Icon, 
  color = 'emerald', 
  desc,
  className 
}: MetricCardProps) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-[#e8f5ee] text-emerald-600 border-gray-200 shadow-emerald-50',
    sky: 'bg-sky-50 text-sky-600 border-sky-100 shadow-sky-50',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50',
    slate: 'bg-gray-50 text-gray-900 border-gray-200/60 shadow-emerald-900/5',
  };

  const isLoading = value === undefined || value === null;
  const colorClasses = colorMap[color] || colorMap.emerald;

  return (
    <div className={clsx(
      "bg-white border border-gray-200/50 rounded-xl p-6 space-y-6 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group relative overflow-hidden active:scale-[0.98]",
      className
    )}>
      <div className="flex items-center justify-between relative z-10">
        <div className={clsx(
          "h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6 shadow-sm", 
          colorClasses
        )}>
          <Icon size={20} />
        </div>
        {desc && (
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{desc}</span>
        )}
      </div>
      <div className="space-y-1 relative z-10">
        <p className="text-xs font-bold text-gray-700/40 uppercase tracking-widest leading-none mb-1">{label}</p>
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-gray-700" />
        ) : (
          <p className="text-3xl font-bold text-gray-900 tracking-tighter tabular-nums leading-none uppercase">
            {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
          </p>
        )}
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200/50 rounded-xl p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-12 w-12 rounded-xl bg-[#e8f5ee] border border-[#f3f4f6]/50" />
        <div className="h-2 w-16 bg-[#e8f5ee] rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-2 w-24 bg-[#e8f5ee] rounded" />
        <div className="h-8 w-16 bg-[#e8f5ee] rounded" />
      </div>
    </div>
  );
}
