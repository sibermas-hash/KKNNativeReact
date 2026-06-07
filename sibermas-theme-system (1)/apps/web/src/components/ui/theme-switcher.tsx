"use client"

// apps/web/src/components/ui/theme-switcher.tsx
// Dropdown to switch the active SIBERMAS theme.
import * as React from "react"
import { useTheme } from "@/components/ui/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeSwitcher({ className }: { className?: string }) {
	const { slug, themes, setTheme } = useTheme()

	return (
		<label className={cn("inline-flex items-center gap-2", className)}>
			<span className="text-sm text-[var(--profile-muted)]">Tema</span>
			<span
				aria-hidden
				className="h-4 w-4 rounded-full border border-[var(--profile-border)]"
				style={ { background: "var(--profile-primary)" } }
			/>
			<select
				value={slug}
				onChange={(e) => setTheme(e.target.value)}
				className="rounded-[calc(var(--profile-radius)-4px)] border border-[var(--profile-border)] bg-[var(--profile-input)] px-2.5 py-1.5 text-sm text-[var(--profile-text)] focus:outline-none focus:ring-4 focus:ring-[var(--profile-ring)]"
			>
				{themes.map((t) => (
					<option key={t.slug} value={t.slug}>
						{t.label}
					</option>
				))}
			</select>
		</label>
	)
}

// Alternative: swatch-grid switcher (mobile-friendly, visual).
export function ThemeSwatchPicker({ className }: { className?: string }) {
	const { slug, themes, setTheme } = useTheme()
	return (
		<div className={cn("flex flex-wrap gap-2", className)}>
			{themes.map((t) => (
				<button
					key={t.slug}
					type="button"
					onClick={() => setTheme(t.slug)}
					aria-pressed={slug === t.slug}
					title={t.label}
					className={cn(
						"h-9 w-9 rounded-full border-2 transition",
						slug === t.slug
							? "border-[var(--profile-text)] scale-105"
							: "border-[var(--profile-border)]",
					)}
					style={ { backgroundImage: t.preview } }
				/>
			))}
		</div>
	)
}
