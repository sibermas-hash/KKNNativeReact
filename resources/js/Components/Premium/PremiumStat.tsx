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
            className={clsx("p-6", className)}
        >
            <div className="flex items-center gap-4">
                <div className={clsx(
                    "h-12 w-12 rounded-lg flex items-center justify-center shrink-0", 
                    highlight ? "bg-amber-50 text-amber-600" : "bg-[#f0fdfa] text-[#0d9488]"
                )}>
                    <Icon size={22} strokeWidth={2} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-emerald-950 tabular-nums leading-tight">{value ?? 0}</p>
                    <p className="text-xs font-medium text-emerald-800 mt-0.5">{label}</p>
                </div>
            </div>
        </PremiumCard>
    );
}
