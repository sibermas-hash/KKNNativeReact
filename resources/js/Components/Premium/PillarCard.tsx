import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface PillarCardProps {
    icon: LucideIcon;
    title: string;
    desc: string;
    className?: string;
}

export function PillarCard({ icon: Icon, title, desc, className }: PillarCardProps) {
    return (
        <div 
            className={clsx(
                "bg-white border border-emerald-50 rounded-xl p-6 space-y-4 hover:border-gray-300 transition-all duration-200 group",
                className
            )}
        >
             <div className="h-12 w-12 bg-[#f0fdfa] text-[#0d9488] rounded-lg flex items-center justify-center group-hover:bg-[#0d9488] group-hover:text-white transition-colors duration-200">
                <Icon size={24} strokeWidth={2} />
             </div>
             <div className="space-y-2">
                <h3 className="text-base font-bold text-emerald-950 leading-tight">{title}</h3>
                <p className="text-sm text-emerald-800 leading-relaxed">
                    {desc}
                </p>
             </div>
        </div>
    );
}
