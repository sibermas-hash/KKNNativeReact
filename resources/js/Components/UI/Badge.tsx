import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-white/5 text-white/40 border-white/5',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20
    warning: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20
    primary: 'bg-primary/20 text-primary-light border-primary/20
};

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                variantStyles[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
