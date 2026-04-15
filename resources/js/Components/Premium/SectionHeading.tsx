import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SectionHeadingProps {
    title: string;
    subtitle?: string;
    accent?: string;
    className?: string;
}

export function SectionHeading({ title, subtitle, accent, className }: SectionHeadingProps) {
    return (
        <div className={clsx("space-y-6 italic", className)}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
            >
                <h2 className="text-5xl lg:text-7xl font-bold text-black tracking-tighter uppercase leading-none">
                    {title} {accent && <span className="text-emerald-500">{accent}</span>}
                </h2>
                {subtitle && (
                    <p className="text-xs font-bold text-emerald-700/40 uppercase tracking-[0.4em] italic leading-none">
                        {subtitle}
                    </p>
                )}
            </motion.div>
        </div>
    );
}
