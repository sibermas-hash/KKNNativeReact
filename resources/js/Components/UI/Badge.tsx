import { clsx } from "clsx";

type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "primary";

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-slate-50 text-slate-400 border-slate-100 italic",
    success: "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/10 italic",
    warning: "bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/10 italic",
    danger: "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/10 italic",
    info: "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/10 italic",
    primary: "bg-slate-900 text-white border-slate-800 shadow-lg shadow-slate-900/10 italic",
};

export default function Badge({
    variant = "default",
    children,
    className,
}: BadgeProps) {
    return (
        <span
            className={clsx(
                "inline-flex items-center rounded-[0.5rem] px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.2em] border whitespace-nowrap transition-all duration-300",
                variantStyles[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
