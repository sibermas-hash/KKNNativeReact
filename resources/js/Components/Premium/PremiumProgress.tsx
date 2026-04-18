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
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-950">{label}</span>
                <span className="text-sm font-semibold text-[#1a7a4a]">{p}%</span>
            </div>
            <div className="h-2 w-full bg-[#e8f5ee] rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-[#1a7a4a] rounded-full" 
                />
            </div>
        </div>
    );
}
