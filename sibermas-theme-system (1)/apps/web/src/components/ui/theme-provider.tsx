"use client"

// apps/web/src/components/ui/theme-provider.tsx
// Injects the active SIBERMAS theme's CSS variables (colors + fonts),
// persists the choice, and exposes a useTheme() hook. SSR-safe & FOUC-free.

import * as React from "react"
import {
	DEFAULT_THEME,
	getTheme,
	getThemeCssVars,
	resolveThemeSlug,
	THEME_STORAGE_KEY,
	THEMES,
	type ThemeConfig,
	type ThemeSlug,
} from "@/lib/theme-config"

type ThemeContextValue = {
	slug: ThemeSlug
	theme: ThemeConfig
	themes: ThemeConfig[]
	setTheme: (slug: string) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function applyThemeToElement(el: HTMLElement, theme: ThemeConfig) {
	const vars = getThemeCssVars(theme)
	for (const [key, value] of Object.entries(vars)) {
		el.style.setProperty(key, value)
	}
	el.dataset.theme = theme.slug
	el.dataset.themeStrength = theme.strength
	el.dataset.themeLayout = theme.layout.pattern
}

export type ThemeProviderProps = {
	children: React.ReactNode
	initialSlug?: string
	target?: "root" | "self"
}

export function ThemeProvider({
	children,
	initialSlug,
	target = "root",
}: ThemeProviderProps) {
	const [slug, setSlug] = React.useState<ThemeSlug>(() =>
		resolveThemeSlug(initialSlug ?? DEFAULT_THEME),
	)
	const wrapperRef = React.useRef<HTMLDivElement | null>(null)

	React.useEffect(() => {
		try {
			const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
			if (stored) {
				const resolved = resolveThemeSlug(stored)
				setSlug(resolved)
				if (resolved !== stored) {
					window.localStorage.setItem(THEME_STORAGE_KEY, resolved)
				}
			}
		} catch {
			/* localStorage unavailable */
		}
	}, [])

	const theme = React.useMemo(() => getTheme(slug), [slug])

	React.useEffect(() => {
		const el =
			target === "self" && wrapperRef.current
				? wrapperRef.current
				: document.documentElement
		applyThemeToElement(el, theme)
	}, [theme, target])

	const setTheme = React.useCallback((next: string) => {
		const resolved = resolveThemeSlug(next)
		setSlug(resolved)
		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, resolved)
			document.cookie = `${THEME_STORAGE_KEY}=${resolved};path=/;max-age=31536000;samesite=lax`
		} catch {
			/* ignore persistence errors */
		}
	}, [])

	const value = React.useMemo<ThemeContextValue>(
		() => ({ slug, theme, themes: THEMES, setTheme }),
		[slug, theme, setTheme],
	)

	return (
		<ThemeContext.Provider value={value}>
			<div
				ref={wrapperRef}
				data-sibermas-theme-root=""
				style={ { fontFamily: "var(--profile-font-body)" } }
			>
				{children}
			</div>
		</ThemeContext.Provider>
	)
}

export function useTheme(): ThemeContextValue {
	const ctx = React.useContext(ThemeContext)
	if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider/>")
	return ctx
}

/**
 * Inline script to set theme variables (colors + fonts) before React hydrates.
 * Render in <head> (Next.js app/layout.tsx) to prevent FOUC.
 */
export function ThemeNoFlashScript({
	storageKey = THEME_STORAGE_KEY,
}: {
	storageKey?: string
}) {
	const cssMap = THEMES.reduce<Record<string, Record<string, string>>>(
		(acc, t) => {
			acc[t.slug] = getThemeCssVars(t)
			return acc
		},
		{},
	)
	const legacy = {
		default: "akademik",
		ocean: "minimal",
		forest: "sustainability",
		midnight: "professional",
		rose: "nusantara",
	}
	const script = `(() => {
	try {
		var maps = ${JSON.stringify(cssMap)};
		var legacy = ${JSON.stringify(legacy)};
		var def = ${JSON.stringify(DEFAULT_THEME)};
		var stored = localStorage.getItem(${JSON.stringify(storageKey)}) || def;
		var slug = maps[stored] ? stored : (legacy[stored] || def);
		var vars = maps[slug];
		var root = document.documentElement;
		for (var k in vars) root.style.setProperty(k, vars[k]);
		root.dataset.theme = slug;
	} catch (e) {}
})();`
	return <script dangerouslySetInnerHTML={ { __html: script } } />
}
