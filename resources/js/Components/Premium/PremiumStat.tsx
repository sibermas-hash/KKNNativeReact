import React from 'react';
import { clsx } from 'clsx';
import PremiumCard from './PremiumCard';

interface PremiumStatProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    highlight?: boolean;
    className?: string;
}

export default function PremiumStat({ label, value, icon: Icon, highlight = false, className }: PremiumStatProps) {
    return (
        <PremiumCard 
            hoverEffect={true}
            ambientGlow={false}
            className={clsx("p-7", highlight ? "border-amber-200/60 shadow-amber-900/5 hover:border-amber-300" : "", className)}
        >
            <div className={clsx("absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none -mr-6 -mt-6", highlight ? "bg-gradient-to-br from-amber-50 to-transparent" : "bg-gradient-to-br from-emerald-50 to-transparent")} />
            
            <div className="flex items-center justify-between relative z-10">
                <div className={clsx(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm", 
                    highlight ? "bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-600 border border-amber-100" : "bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 border border-emerald-100"
                )}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            
            <div className="mt-6 relative z-10">
                <p className="text-4xl font-extrabold text-black tracking-tight mb-1 transition-all">{value ?? 0}</p>
                <p className="text-sm font-bold text-emerald-950 tracking-wide uppercase">{label}</p>
            </div>
        </PremiumCard>
    );
}
