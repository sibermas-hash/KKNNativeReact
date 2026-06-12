"use client"

// apps/web/src/components/ui/button.tsx
// Token-based button. All colors read from var(--profile-*).
import * as React from "react"
import { cn } from "@/lib/utils"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

const base =
	"inline-flex items-center justify-center gap-2 rounded-[var(--profile-radius)] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--profile-ring)] disabled:opacity-50 disabled:pointer-events-none"

const sizes: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-sm",
	lg: "h-12 px-5 text-base",
}

// NOTE: primary text is white by default; the dark "professional" theme
// overrides it to a dark ink via globals.css ([data-theme=professional]).
const variants: Record<ButtonVariant, string> = {
	primary:
		"bg-[var(--profile-primary)] text-white shadow-sm hover:bg-[var(--profile-primary-hover)]",
	secondary:
		"bg-[var(--profile-surface-strong)] text-[var(--profile-text)] border border-[var(--profile-border)] hover:bg-[var(--profile-soft)]",
	ghost:
		"bg-transparent text-[var(--profile-text)] hover:bg-[var(--profile-soft)]",
	danger:
		"bg-[var(--profile-danger)] text-[var(--profile-danger-text)] hover:opacity-90",
}

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant
	size?: ButtonSize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = "primary", size = "md", className, ...props }, ref) => (
		<button
			ref={ref}
			data-variant={variant}
			className={cn(base, sizes[size], variants[variant], className)}
			{...props}
		/>
	),
)
Button.displayName = "Button"
