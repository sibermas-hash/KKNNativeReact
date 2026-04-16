import React from 'react';
import { clsx } from 'clsx';
import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';

interface PremiumCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    ambientGlow?: boolean;
}

export default function PremiumCard({ 
    children, 
    className = "", 
    hoverEffect = true,
    ambientGlow = false,
    ...props 
}: PremiumCardProps) {
    return (
        <motion.div 
            className={clsx(
                "relative overflow-hidden bg-white/90 backdrop-blur-xl border border-emerald-100/60 rounded-[2rem] shadow-xl shadow-emerald-900/5",
                hoverEffect && "transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10 hover:border-emerald-200 group",
                className
            )}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            {...props}
        >
            {ambientGlow && (
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150 pointer-events-none" />
            )}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </motion.div>
    );
}
