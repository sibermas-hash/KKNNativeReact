import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricItemProps {
    label: string;
    value: string | number | undefined | null;
    icon: LucideIcon;
    className?: string;
}

export function MetricItem({ label, value, icon: Icon, className }: MetricItemProps) {
    return (
        <div className={clsx("flex flex-col items-center gap-3", className)}>
             <div className="h-12 w-12 bg-[#e8f5ee] rounded-lg flex items-center justify-center text-[#1a7a4a]">
                <Icon size={22} strokeWidth={2} />
             </div>
             <div className="text-center">
                <p className="text-3xl font-bold text-emerald-950 tabular-nums">
                    {value?.toLocaleString('id-ID') || '-'}
                </p>
                <p className="text-xs font-medium text-emerald-800 mt-1">{label}</p>
             </div>
        </div>
    );
}
