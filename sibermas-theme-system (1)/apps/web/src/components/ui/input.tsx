// apps/web/src/components/ui/input.tsx
// Token-based input + label.
import * as React from "react"
import { cn } from "@/lib/utils"

export const Input = React.forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
	<input
		ref={ref}
		className={cn(
			"w-full rounded-[calc(var(--profile-radius)-4px)] border border-[var(--profile-border)] bg-[var(--profile-input)] px-3 py-2 text-[var(--profile-text)] placeholder:text-[var(--profile-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--profile-ring)] disabled:bg-[var(--profile-input-disabled)] disabled:cursor-not-allowed",
			className,
		)}
		{...props}
	/>
))
Input.displayName = "Input"

export function Label({
	className,
	...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
	return (
		<label
			className={cn(
				"mb-1.5 block text-sm font-medium text-[var(--profile-muted)]",
				className,
			)}
			{...props}
		/>
	)
}
