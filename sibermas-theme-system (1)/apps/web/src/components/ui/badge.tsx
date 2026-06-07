// apps/web/src/components/ui/badge.tsx
// Token-based status badge.
import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeTone = "neutral" | "warning" | "danger"

const tones: Record<BadgeTone, string> = {
	neutral: "bg-[var(--profile-soft)] text-[var(--profile-soft-text)]",
	warning: "bg-[var(--profile-warning)] text-[var(--profile-warning-text)]",
	danger: "bg-[var(--profile-danger)] text-[var(--profile-danger-text)]",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	tone?: BadgeTone
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
				tones[tone],
				className,
			)}
			{...props}
		/>
	)
}
