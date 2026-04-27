import React from 'react';
import { clsx } from 'clsx';

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  ambientGlow?: boolean;
}

export default function PremiumCard({
  children,
  className = '',
  hoverEffect = true,
  ambientGlow = false,
}: PremiumCardProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden bg-white border border-emerald-50 rounded-xl',
        hoverEffect && 'transition-all duration-200 hover:border-gray-300 group',
        className,
      )}
    >
      {children}
    </div>
  );
}
