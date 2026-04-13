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
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95 shadow-[0_4px_12px_rgba(16,168,83,0.3)] hover:shadow-[0_4px_20px_rgba(16,168,83,0.4)]',
    secondary: 'bg-primary-50 text-primary-700 hover:bg-primary-100 active:scale-95 border border-primary-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-[0_4px_12px_rgba(225,29,72,0.25)] hover:shadow-[0_4px_20px_rgba(225,29,72,0.4)]',
    ghost: 'text-primary-700 hover:bg-primary-50 active:bg-primary-100',
    outline: 'border border-primary-200 bg-white text-primary-700 hover:bg-primary-50 hover:border-primary-400 active:bg-primary-100',
    link: 'text-primary-600 underline-offset-4 hover:underline',
    clean: 'border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:border-primary-400 hover:text-primary-600 shadow-sm transition-all active:scale-95'
};

const sizeStyles: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-6 text-sm',
    lg: 'h-12 px-8 text-base',
    icon: 'h-10 w-10 p-2'
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={clsx(
                    'inline-flex items-center justify-center font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-xl',
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
