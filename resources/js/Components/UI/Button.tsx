import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link' | 'clean';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
    primary: 'bg-emerald-600 dark:bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 active:scale-95 shadow-sm',
    secondary: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900 active:bg-emerald-200 dark:active:bg-emerald-800',
    danger: 'bg-rose-600 dark:bg-rose-600 text-white hover:bg-rose-700 dark:hover:bg-rose-500 active:scale-95 shadow-sm',
    ghost: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 active:bg-emerald-100 dark:active:bg-slate-700',
    outline: 'border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 active:bg-emerald-100 dark:active:bg-slate-700',
    link: 'text-emerald-600 dark:text-emerald-400 underline-offset-4 hover:underline',
    clean: 'border border-emerald-50 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-emerald-900 dark:text-slate-100 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm transition-all active:scale-95'
};

const sizeStyles: Record<Size, string> = {
    sm: 'h-8 px-3 text-[10px]',
    md: 'h-10 px-6 text-[11px]',
    lg: 'h-12 px-8 text-[12px]',
    icon: 'h-10 w-10 p-2'
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={clsx(
                    'inline-flex items-center justify-center font-black uppercase tracking-widest transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed',
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
