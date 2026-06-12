// Offline sanity test for theme-config logic (types are erased at runtime).
import {
	THEMES,
	DEFAULT_THEME,
	LEGACY_MAP,
	resolveThemeSlug,
	getTheme,
	isThemeSlug,
	themeToStyle,
} from "../apps/web/src/lib/theme-config.ts"

let failures = 0
function assert(cond, msg) {
	if (!cond) {
		failures++
		console.error("  ✗ " + msg)
	} else {
		console.log("  ✓ " + msg)
	}
}

const REQUIRED_VARS = [
	"--profile-page","--profile-text","--profile-muted","--profile-surface",
	"--profile-surface-strong","--profile-border","--profile-soft",
	"--profile-soft-text","--profile-primary","--profile-primary-hover",
	"--profile-accent","--profile-ring","--profile-input",
	"--profile-input-disabled","--profile-stat","--profile-warning",
	"--profile-warning-text","--profile-danger","--profile-danger-text",
	"--profile-radius",
]

console.log("THEMES count")
assert(THEMES.length === 5, "exactly 5 themes")

const expectedSlugs = ["akademik","nusantara","minimal","sustainability","professional"]
assert(
	JSON.stringify(THEMES.map(t => t.slug)) === JSON.stringify(expectedSlugs),
	"slugs in expected order: " + expectedSlugs.join(", "),
)

console.log("Each theme has all 20 vars")
for (const t of THEMES) {
	const keys = Object.keys(t.vars)
	assert(keys.length === 20, `${t.slug}: has 20 vars (got ${keys.length})`)
	const missing = REQUIRED_VARS.filter(k => !(k in t.vars))
	assert(missing.length === 0, `${t.slug}: no missing vars` + (missing.length ? " -> " + missing.join(",") : ""))
	// every value non-empty string
	const empties = REQUIRED_VARS.filter(k => !t.vars[k])
	assert(empties.length === 0, `${t.slug}: no empty values`)
}

console.log("Legacy mapping")
const legacyExpect = { default:"akademik", ocean:"minimal", forest:"sustainability", midnight:"professional", rose:"nusantara" }
for (const [old, neu] of Object.entries(legacyExpect)) {
	assert(LEGACY_MAP[old] === neu, `legacy ${old} -> ${neu}`)
	assert(resolveThemeSlug(old) === neu, `resolveThemeSlug("${old}") -> ${neu}`)
}

console.log("Fallback + helpers")
assert(resolveThemeSlug("does-not-exist") === DEFAULT_THEME, "unknown slug -> DEFAULT_THEME (akademik)")
assert(resolveThemeSlug(undefined) === DEFAULT_THEME, "undefined -> DEFAULT_THEME")
assert(resolveThemeSlug("akademik") === "akademik", "current slug passthrough")
assert(isThemeSlug("minimal") === true, "isThemeSlug true for current")
assert(isThemeSlug("ocean") === false, "isThemeSlug false for legacy")
assert(getTheme("midnight").slug === "professional", "getTheme legacy-safe")
assert(getTheme("nope").slug === DEFAULT_THEME, "getTheme unknown -> default")
assert(themeToStyle(getTheme("akademik"))["--profile-primary"] === "#0F766E", "themeToStyle returns vars")
assert(DEFAULT_THEME === "akademik", "default theme is akademik")

console.log("\n" + (failures === 0 ? "ALL PASSED ✅" : failures + " FAILED ❌"))
process.exit(failures === 0 ? 0 : 1)
