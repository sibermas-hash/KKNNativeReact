import { clsx } from "clsx";

type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "primary"
    | "outline";

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-emerald-50/50 text-emerald-400 border-emerald-50 ",
    success: "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/10 ",
    warning: "bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/10 ",
    danger: "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/10 ",
    info: "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/10 ",
    primary: "bg-slate-900 text-white border-emerald-900 shadow-lg shadow-slate-900/10 ",
    outline: "bg-white text-slate-600 border-slate-200 ",
};

export default function Badge({
    variant = "default",
    children,
    className,
}: BadgeProps) {
    return (
        <span
            className={clsx(
                "inline-flex items-center rounded-[0.5rem] px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] border whitespace-nowrap transition-all duration-300",
                variantStyles[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
