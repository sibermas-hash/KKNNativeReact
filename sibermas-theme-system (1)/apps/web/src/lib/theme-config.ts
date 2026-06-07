// apps/web/src/lib/theme-config.ts
// SIBERMAS theme system — single source of truth for all 5 themes.
// Each theme has its own color tokens, typography, and layout personality.
// All component styling must read CSS variables (var(--profile-*)).
// Never hardcode HEX/font in components.

export type ThemeStrength = "default" | "warm" | "light" | "fresh" | "dark"

export type ThemeSlug =
	| "akademik"
	| "nusantara"
	| "minimal"
	| "sustainability"
	| "professional"

/** Layout personality per theme. Drives spacing/structure choices in the UI. */
export type ThemeLayout = {
	/** Visual density of lists, tables, paddings. */
	density: "comfortable" | "cozy" | "airy" | "compact"
	/** Primary page composition pattern. */
	pattern: "sidebar-classic" | "hero-stacked" | "centered-airy" | "metric-grid" | "dashboard-dense"
	/** Hero treatment. */
	hero: "banner-accentbar" | "image-overlay" | "minimal-type" | "gradient-stats" | "command-bar"
	/** Card elevation language. */
	elevation: "flat" | "soft" | "raised"
}

/** Typography per theme (CSS font-family stacks + Google font names to load). */
export type ThemeFonts = {
	heading: string
	body: string
	mono: string
	/** Google Fonts to load for this theme (family names). */
	google: string[]
}

/** Contract of color CSS variables every theme must define (20 tokens). */
export type ThemeVars = {
	"--profile-page": string
	"--profile-text": string
	"--profile-muted": string
	"--profile-surface": string
	"--profile-surface-strong": string
	"--profile-border": string
	"--profile-soft": string
	"--profile-soft-text": string
	"--profile-primary": string
	"--profile-primary-hover": string
	"--profile-accent": string
	"--profile-ring": string
	"--profile-input": string
	"--profile-input-disabled": string
	"--profile-stat": string
	"--profile-warning": string
	"--profile-warning-text": string
	"--profile-danger": string
	"--profile-danger-text": string
	"--profile-radius": string
}

export type ThemeConfig = {
	slug: ThemeSlug
	label: string
	strength: ThemeStrength
	description: string
	preview: string
	frame: "border"
	shadow: string
	backdrop: string
	useGlassLayer: boolean
	useParticles: boolean
	fonts: ThemeFonts
	layout: ThemeLayout
	vars: ThemeVars
}

export const THEMES: ThemeConfig[] = [
	{
		slug: "akademik",
		label: "Akademik Islami",
		strength: "default",
		description:
			"Tema bawaan SIBERMAS: tenang, terpercaya, institusional dengan aksen emas tipis.",
		preview: "linear-gradient(135deg,#0F766E 0%,#134E4A 55%,#0B5C56 100%)",
		frame: "border",
		shadow: "0 1px 2px rgba(16,42,38,.06), 0 4px 12px rgba(16,42,38,.08)",
		backdrop:
			"radial-gradient(1200px 600px at 100% -10%, rgba(194,161,77,.10), transparent 60%)",
		useGlassLayer: false,
		useParticles: false,
		fonts: {
			heading: '"Lora", Georgia, "Times New Roman", serif',
			body: '"Inter", system-ui, -apple-system, sans-serif',
			mono: '"JetBrains Mono", ui-monospace, monospace',
			google: ["Lora:wght@500;600;700", "Inter:wght@400;500;600"],
		},
		layout: {
			density: "comfortable",
			pattern: "sidebar-classic",
			hero: "banner-accentbar",
			elevation: "soft",
		},
		vars: {
			"--profile-page": "#F7F9F8",
			"--profile-text": "#102A26",
			"--profile-muted": "#5B716C",
			"--profile-surface": "#FFFFFF",
			"--profile-surface-strong": "#ECF2F0",
			"--profile-border": "#D8E2DF",
			"--profile-soft": "#E6F2EF",
			"--profile-soft-text": "#0F766E",
			"--profile-primary": "#0F766E",
			"--profile-primary-hover": "#0B5C56",
			"--profile-accent": "#C2A14D",
			"--profile-ring": "rgba(15,118,110,.35)",
			"--profile-input": "#FFFFFF",
			"--profile-input-disabled": "#ECF2F0",
			"--profile-stat": "#E6F2EF",
			"--profile-warning": "#FEF3C7",
			"--profile-warning-text": "#92400E",
			"--profile-danger": "#FEE2E2",
			"--profile-danger-text": "#B91C1C",
			"--profile-radius": "12px",
		},
	},
	{
		slug: "nusantara",
		label: "Desa KKN Nusantara",
		strength: "warm",
		description:
			"Hangat, membumi, ramah komunitas dengan nuansa terakota & hijau daun.",
		preview: "linear-gradient(135deg,#B5532A 0%,#97431F 55%,#4F7942 100%)",
		frame: "border",
		shadow: "0 1px 2px rgba(58,42,30,.08), 0 6px 16px rgba(58,42,30,.10)",
		backdrop:
			"radial-gradient(1000px 500px at 0% -10%, rgba(226,160,63,.16), transparent 60%)",
		useGlassLayer: false,
		useParticles: false,
		fonts: {
			heading: '"Poppins", "Trebuchet MS", sans-serif',
			body: '"Nunito Sans", "Segoe UI", sans-serif',
			mono: '"JetBrains Mono", ui-monospace, monospace',
			google: ["Poppins:wght@500;600;700", "Nunito Sans:wght@400;600;700"],
		},
		layout: {
			density: "cozy",
			pattern: "hero-stacked",
			hero: "image-overlay",
			elevation: "raised",
		},
		vars: {
			"--profile-page": "#FBF7F2",
			"--profile-text": "#3A2A1E",
			"--profile-muted": "#7A6655",
			"--profile-surface": "#FFFFFF",
			"--profile-surface-strong": "#F3E9DD",
			"--profile-border": "#E6D8C7",
			"--profile-soft": "#F6E8DC",
			"--profile-soft-text": "#97431F",
			"--profile-primary": "#B5532A",
			"--profile-primary-hover": "#97431F",
			"--profile-accent": "#E2A03F",
			"--profile-ring": "rgba(181,83,42,.32)",
			"--profile-input": "#FFFFFF",
			"--profile-input-disabled": "#F3E9DD",
			"--profile-stat": "#F6E8DC",
			"--profile-warning": "#FDEBC8",
			"--profile-warning-text": "#8A5A12",
			"--profile-danger": "#F8DAD5",
			"--profile-danger-text": "#A33526",
			"--profile-radius": "16px",
		},
	},
	{
		slug: "minimal",
		label: "Modern Minimal",
		strength: "light",
		description:
			"Bersih, lapang, kontemporer. Banyak whitespace, satu aksen tegas.",
		preview: "linear-gradient(135deg,#2563EB 0%,#0EA5E9 55%,#14B8A6 100%)",
		frame: "border",
		shadow: "0 1px 2px rgba(15,23,42,.05)",
		backdrop: "none",
		useGlassLayer: false,
		useParticles: false,
		fonts: {
			heading: '"Inter", system-ui, sans-serif',
			body: '"Inter", system-ui, sans-serif',
			mono: '"Geist Mono", ui-monospace, monospace',
			google: ["Inter:wght@400;500;600;700"],
		},
		layout: {
			density: "airy",
			pattern: "centered-airy",
			hero: "minimal-type",
			elevation: "flat",
		},
		vars: {
			"--profile-page": "#FFFFFF",
			"--profile-text": "#0F172A",
			"--profile-muted": "#64748B",
			"--profile-surface": "#FFFFFF",
			"--profile-surface-strong": "#F4F6FB",
			"--profile-border": "#E2E8F0",
			"--profile-soft": "#EFF4FF",
			"--profile-soft-text": "#1D4ED8",
			"--profile-primary": "#2563EB",
			"--profile-primary-hover": "#1D4ED8",
			"--profile-accent": "#14B8A6",
			"--profile-ring": "rgba(37,99,235,.30)",
			"--profile-input": "#FFFFFF",
			"--profile-input-disabled": "#F4F6FB",
			"--profile-stat": "#EFF4FF",
			"--profile-warning": "#FEF3C7",
			"--profile-warning-text": "#92400E",
			"--profile-danger": "#FEE2E2",
			"--profile-danger-text": "#B91C1C",
			"--profile-radius": "10px",
		},
	},
	{
		slug: "sustainability",
		label: "Green Sustainability",
		strength: "fresh",
		description:
			"Segar, optimis, eco-tech. Cocok untuk dashboard dampak & program lingkungan.",
		preview: "linear-gradient(135deg,#059669 0%,#047857 55%,#65A30D 100%)",
		frame: "border",
		shadow: "0 1px 2px rgba(11,46,32,.06), 0 4px 12px rgba(11,46,32,.08)",
		backdrop:
			"radial-gradient(1100px 560px at 100% -10%, rgba(101,163,13,.12), transparent 60%)",
		useGlassLayer: false,
		useParticles: false,
		fonts: {
			heading: '"Plus Jakarta Sans", "Verdana", sans-serif',
			body: '"Manrope", "Segoe UI", sans-serif',
			mono: '"JetBrains Mono", ui-monospace, monospace',
			google: ["Plus Jakarta Sans:wght@500;600;700", "Manrope:wght@400;500;600"],
		},
		layout: {
			density: "comfortable",
			pattern: "metric-grid",
			hero: "gradient-stats",
			elevation: "soft",
		},
		vars: {
			"--profile-page": "#F6FBF7",
			"--profile-text": "#0B2E20",
			"--profile-muted": "#557A68",
			"--profile-surface": "#FFFFFF",
			"--profile-surface-strong": "#E8F5EC",
			"--profile-border": "#D2E8DA",
			"--profile-soft": "#DCF3E4",
			"--profile-soft-text": "#047857",
			"--profile-primary": "#059669",
			"--profile-primary-hover": "#047857",
			"--profile-accent": "#65A30D",
			"--profile-ring": "rgba(5,150,105,.32)",
			"--profile-input": "#FFFFFF",
			"--profile-input-disabled": "#E8F5EC",
			"--profile-stat": "#DCF3E4",
			"--profile-warning": "#FEF3C7",
			"--profile-warning-text": "#92400E",
			"--profile-danger": "#FEE2E2",
			"--profile-danger-text": "#B91C1C",
			"--profile-radius": "14px",
		},
	},
	{
		slug: "professional",
		label: "Dark Professional",
		strength: "dark",
		description:
			"Gelap, fokus, premium. Untuk panel admin & monitoring densitas tinggi.",
		preview: "linear-gradient(135deg,#0B1220 0%,#111A2B 55%,#1B2740 100%)",
		frame: "border",
		shadow: "0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35)",
		backdrop:
			"radial-gradient(1200px 600px at 100% -10%, rgba(56,189,248,.10), transparent 60%)",
		useGlassLayer: true,
		useParticles: false,
		fonts: {
			heading: '"Space Grotesk", "Segoe UI", sans-serif',
			body: '"IBM Plex Sans", system-ui, sans-serif',
			mono: '"JetBrains Mono", ui-monospace, monospace',
			google: ["Space Grotesk:wght@500;600;700", "IBM Plex Sans:wght@400;500;600"],
		},
		layout: {
			density: "compact",
			pattern: "dashboard-dense",
			hero: "command-bar",
			elevation: "raised",
		},
		vars: {
			"--profile-page": "#0B1220",
			"--profile-text": "#E6EDF6",
			"--profile-muted": "#94A3B8",
			"--profile-surface": "#111A2B",
			"--profile-surface-strong": "#1B2740",
			"--profile-border": "#28344B",
			"--profile-soft": "#16263B",
			"--profile-soft-text": "#7DD3FC",
			"--profile-primary": "#38BDF8",
			"--profile-primary-hover": "#0EA5E9",
			"--profile-accent": "#818CF8",
			"--profile-ring": "rgba(56,189,248,.40)",
			"--profile-input": "#0F1A2C",
			"--profile-input-disabled": "#16263B",
			"--profile-stat": "#16263B",
			"--profile-warning": "#3A2E12",
			"--profile-warning-text": "#FBBF24",
			"--profile-danger": "#3A1B1E",
			"--profile-danger-text": "#FCA5A5",
			"--profile-radius": "12px",
		},
	},
]

export const DEFAULT_THEME: ThemeSlug = "akademik"

/** Backward-compatible mapping from the old slug names to the new ones. */
export const LEGACY_MAP: Record<string, ThemeSlug> = {
	default: "akademik",
	ocean: "minimal",
	forest: "sustainability",
	midnight: "professional",
	rose: "nusantara",
}

export const THEME_STORAGE_KEY = "sibermas-theme"

const THEME_BY_SLUG: Record<ThemeSlug, ThemeConfig> = THEMES.reduce(
	(acc, theme) => {
		acc[theme.slug] = theme
		return acc
	},
	{} as Record<ThemeSlug, ThemeConfig>,
)

export function isThemeSlug(value: unknown): value is ThemeSlug {
	return typeof value === "string" && value in THEME_BY_SLUG
}

/**
 * Normalize any stored/legacy/unknown slug into a valid current slug.
 * current -> itself; legacy -> mapped; anything else -> DEFAULT_THEME.
 */
export function resolveThemeSlug(value: unknown): ThemeSlug {
	if (isThemeSlug(value)) return value
	if (typeof value === "string" && value in LEGACY_MAP) return LEGACY_MAP[value]
	return DEFAULT_THEME
}

/** Get a full theme config by any slug (legacy-safe, never throws). */
export function getTheme(slug: unknown): ThemeConfig {
	return THEME_BY_SLUG[resolveThemeSlug(slug)]
}

export type ThemeStyle = Record<string, string>

/**
 * Full set of CSS custom properties for a theme: the 20 color tokens PLUS
 * the typography vars (--profile-font-heading / -body / -mono).
 * This is what ThemeProvider injects onto the root.
 */
export function getThemeCssVars(theme: ThemeConfig): ThemeStyle {
	return {
		...theme.vars,
		"--profile-font-heading": theme.fonts.heading,
		"--profile-font-body": theme.fonts.body,
		"--profile-font-mono": theme.fonts.mono,
	}
}

/** Alias kept for convenience (same as getThemeCssVars). */
export function themeToStyle(theme: ThemeConfig): ThemeStyle {
	return getThemeCssVars(theme)
}

/** Build the Google Fonts <link> href for a theme (all themes can be combined too). */
export function googleFontsHref(theme: ThemeConfig): string {
	const families = theme.fonts.google
		.map((f) => "family=" + f.replace(/ /g, "+"))
		.join("&")
	const base = "https://fonts.googleapis.com/css2?"
	return base + families + "&display=swap"
}
