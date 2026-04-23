import { clsx } from 'clsx';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'gray' | 'primary';

interface BadgeProps {
    variant?: Variant;
    children: React.ReactNode;
    className?: string;
}

const variants: Record<Variant, string> = {
    success: 'bg-primary-100 text-primary-700 border border-primary-200',
    warning: 'bg-accent-amber-100 text-accent-amber-600 border border-accent-amber-200',
    danger: 'bg-rose-100 text-rose-700 border border-rose-200',
    info: 'bg-accent-sky-100 text-accent-sky-600 border border-accent-sky-200',
    default: 'bg-emerald-50/60 text-emerald-800 border border-emerald-50/60',
    gray: 'bg-emerald-50/60 text-emerald-950 border border-emerald-50/60',
    primary: 'bg-[#f0fdfa] text-emerald-950 border border-emerald-200',
};

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                variants[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
