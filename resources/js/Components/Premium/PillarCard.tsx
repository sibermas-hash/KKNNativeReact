import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface PillarCardProps {
    icon: LucideIcon;
    title: string;
    desc: string;
    className?: string;
}

export function PillarCard({ icon: Icon, title, desc, className }: PillarCardProps) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={clsx(
                "bg-white border border-emerald-50/50 rounded-[3rem] p-10 space-y-8 hover:bg-emerald-50/30 transition-all duration-500 group group-hover:shadow-2xl group-hover:shadow-emerald-950/5 relative overflow-hidden shadow-sm",
                className
            )}
        >
             <div className="absolute -bottom-4 -right-4 opacity-[0.02] text-black group-hover:scale-110 transition-transform duration-1000">
                <Icon size={120} strokeWidth={0.5} />
             </div>
             <div className="h-16 w-16 bg-emerald-950 text-emerald-500 rounded-2xl flex items-center justify-center p-4 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                <Icon size={32} strokeWidth={2.5} />
             </div>
             <div className="space-y-4 relative z-10 italic">
                <h3 className="text-xl font-bold text-black uppercase tracking-tighter italic leading-none">{title}</h3>
                <p className="text-xs font-bold text-emerald-950 uppercase tracking-tight leading-relaxed italic pr-4">
                    {desc}
                </p>
             </div>
        </motion.div>
    );
}
