import React from 'react';
import { clsx } from 'clsx';

interface SectionHeadingProps {
    title: string;
    subtitle?: string;
    accent?: string;
    className?: string;
}

export function SectionHeading({ title, subtitle, accent, className }: SectionHeadingProps) {
    return (
        <div className={clsx("space-y-2", className)}>
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-emerald-950 leading-tight">
                    {title} {accent && <span className="text-[#0d9488]">{accent}</span>}
                </h2>
                {subtitle && (
                    <p className="text-sm text-emerald-800 leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
