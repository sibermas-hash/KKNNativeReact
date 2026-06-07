// apps/web/src/lib/utils.ts
// Minimal classnames helper (no external deps). Swap for clsx+tailwind-merge if available.
export function cn(
	...classes: Array<string | false | null | undefined>
): string {
	return classes.filter(Boolean).join(" ")
}
