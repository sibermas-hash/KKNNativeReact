import React from 'react';
import { motion } from 'framer-motion';

interface PremiumProgressProps {
    label: string;
    count: number;
    total: number;
}

export default function PremiumProgress({ label, count, total }: PremiumProgressProps) {
    const p = Math.min(100, Math.round((count / (total || 1)) * 100));
    
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-widest">{label}</span>
                <span className="text-sm font-bold text-emerald-600">{p}%</span>
            </div>
            <div className="h-2.5 w-full bg-emerald-50 rounded-full overflow-hidden border border-emerald-100/50 p-px">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.4)]" 
                />
            </div>
        </div>
    );
}
