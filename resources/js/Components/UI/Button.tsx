import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link' | 'clean';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)]',
    secondary: 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 active:scale-95 border border-emerald-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-[0_4px_12px_rgba(225,29,72,0.25)] hover:shadow-[0_4px_20px_rgba(225,29,72,0.4)]',
    ghost: 'text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100',
    outline: 'border border-emerald-100 bg-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 active:bg-emerald-100',
    link: 'text-emerald-600 underline-offset-4 hover:underline',
    clean: 'border border-emerald-50 bg-white text-[10px] font-extrabold uppercase tracking-widest text-emerald-950 hover:border-emerald-500 shadow-sm transition-all active:scale-95'
};

const sizeStyles: Record<Size, string> = {
    sm: 'h-8 px-3 text-[10px]',
    md: 'h-10 px-6 text-[11px]',
    lg: 'h-12 px-8 text-[12px]',
    icon: 'h-10 w-10 p-2'
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={clsx(
                    'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed',
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && icon && <span className="mr-2">{icon}</span>}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
