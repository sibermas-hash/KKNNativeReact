import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricItemProps {
    label: string;
    value: string | number | undefined | null;
    icon: LucideIcon;
    className?: string;
}

export function MetricItem({ label, value, icon: Icon, className }: MetricItemProps) {
    return (
        <div className={clsx("space-y-6 flex flex-col items-center group italic", className)}>
             <div className="h-14 w-14 bg-white border border-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-950 group-hover:text-emerald-400 transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:shadow-emerald-950/20 group-hover:scale-110">
                <Icon size={24} className="text-emerald-500 group-hover:text-inherit" strokeWidth={2.5} />
             </div>
             <div className="text-center">
                <p className="text-5xl font-bold text-black tabular-nums italic uppercase group-hover:text-emerald-600 transition-colors">
                    {value?.toLocaleString('id-ID') || '-'}
                </p>
                <p className="text-[12px] font-bold text-emerald-700/30 uppercase tracking-[0.3em] mt-3 italic">{label}</p>
             </div>
        </div>
    );
}
