import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface BadgeProps {
 variant?: BadgeVariant;
 children: React.ReactNode;
 className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
 default: 'border-slate-200 bg-slate-100 text-slate-700',
 success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
 warning: 'border-amber-200 bg-amber-50 text-amber-700',
 danger: 'border-rose-200 bg-rose-50 text-rose-700',
 info: 'border-sky-200 bg-sky-50 text-sky-700',
 primary: 'border-primary/20 bg-primary/10 text-primary',
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
