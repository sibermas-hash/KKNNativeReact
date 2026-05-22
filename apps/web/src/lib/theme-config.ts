import type { CSSProperties } from 'react';

export type ThemeVars = CSSProperties & Record<`--profile-${string}`, string>;

export interface ThemeDefinition {
  label: string;
  strength: string;
  description: string;
  preview: string;
  frame: string;
  shadow: string;
  backdrop: string;
  /** If true, glass pseudo-element layers are applied to surfaces */
  useGlassLayer: boolean;
  /** If true, particle background is shown (only for profile page) */
  useParticles: boolean;
  vars: ThemeVars;
}

export const THEMES: Record<string, ThemeDefinition> = {
  /**
   * DEFAULT — Light, clean, cyan/teal + amber accent.
   * Matches the original SIBERMAS codebase styling.
   */
  default: {
    label: 'SIBERMAS',
    strength: 'Default',
    description: 'Light clean dengan cyan, teal, dan amber. Tema asli SIBERMAS.',
    preview: 'from-cyan-400 via-teal-500 to-amber-400',
    frame: 'border',
    shadow: 'shadow-sm',
    backdrop: '#f8fafc',
    useGlassLayer: false,
    useParticles: false,
    vars: {
      '--profile-page': '#f8fafc',
      '--profile-text': '#0f172a',
      '--profile-muted': '#64748b',
      '--profile-surface': '#ffffff',
      '--profile-surface-strong': '#f8faf9',
      '--profile-border': '#e2e8f0',
      '--profile-soft': '#ecfeff',
      '--profile-soft-text': '#0e7490',
      '--profile-primary': '#0891b2',
      '--profile-primary-hover': '#0e7490',
      '--profile-accent': '#f59e0b',
      '--profile-ring': 'rgba(6,182,212,0.2)',
      '--profile-input': '#ffffff',
      '--profile-input-disabled': '#f1f5f9',
      '--profile-stat': '#f0fdfa',
      '--profile-warning': '#fffbeb',
      '--profile-warning-text': '#92400e',
      '--profile-danger': '#fff1f2',
      '--profile-danger-text': '#be123c',
      '--profile-font-body': 'var(--font-sans)',
      '--profile-font-heading': 'var(--font-display)',
      '--profile-heading-shadow': 'none',
      '--profile-text-shadow': 'none',
    } as ThemeVars,
  },
  /**
   * OCEAN — Deep blue/indigo professional theme.
   */
  ocean: {
    label: 'Ocean',
    strength: 'Profesional',
    description: 'Deep blue profesional dengan indigo dan sky blue.',
    preview: 'from-indigo-600 via-blue-500 to-sky-400',
    frame: 'border',
    shadow: 'shadow-sm',
    backdrop: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 50%, #f8fafc 100%)',
    useGlassLayer: false,
    useParticles: false,
    vars: {
      '--profile-page': '#eef2ff',
      '--profile-text': '#1e1b4b',
      '--profile-muted': '#6366f1',
      '--profile-surface': '#ffffff',
      '--profile-surface-strong': '#f8faff',
      '--profile-border': '#e0e7ff',
      '--profile-soft': '#eef2ff',
      '--profile-soft-text': '#4338ca',
      '--profile-primary': '#4f46e5',
      '--profile-primary-hover': '#4338ca',
      '--profile-accent': '#0ea5e9',
      '--profile-ring': 'rgba(79,70,229,0.2)',
      '--profile-input': '#ffffff',
      '--profile-input-disabled': '#f1f5f9',
      '--profile-stat': '#eff6ff',
      '--profile-warning': '#fffbeb',
      '--profile-warning-text': '#92400e',
      '--profile-danger': '#fef2f2',
      '--profile-danger-text': '#dc2626',
      '--profile-font-body': 'var(--font-sans)',
      '--profile-font-heading': 'var(--font-display)',
      '--profile-heading-shadow': 'none',
      '--profile-text-shadow': 'none',
    } as ThemeVars,
  },
  /**
   * FOREST — Earthy green/emerald natural theme.
   */
  forest: {
    label: 'Forest',
    strength: 'Natural',
    description: 'Hijau natural dengan emerald, lime, dan warm brown.',
    preview: 'from-emerald-600 via-green-500 to-lime-400',
    frame: 'border',
    shadow: 'shadow-sm',
    backdrop: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #fefce8 100%)',
    useGlassLayer: false,
    useParticles: false,
    vars: {
      '--profile-page': '#ecfdf5',
      '--profile-text': '#14532d',
      '--profile-muted': '#4d7c0f',
      '--profile-surface': '#ffffff',
      '--profile-surface-strong': '#f8fdf9',
      '--profile-border': '#d1fae5',
      '--profile-soft': '#ecfdf5',
      '--profile-soft-text': '#065f46',
      '--profile-primary': '#059669',
      '--profile-primary-hover': '#047857',
      '--profile-accent': '#ca8a04',
      '--profile-ring': 'rgba(5,150,105,0.2)',
      '--profile-input': '#ffffff',
      '--profile-input-disabled': '#f0fdf4',
      '--profile-stat': '#f0fdf4',
      '--profile-warning': '#fefce8',
      '--profile-warning-text': '#854d0e',
      '--profile-danger': '#fef2f2',
      '--profile-danger-text': '#dc2626',
      '--profile-font-body': 'var(--font-sans)',
      '--profile-font-heading': 'var(--font-glass)',
      '--profile-heading-shadow': 'none',
      '--profile-text-shadow': 'none',
    } as ThemeVars,
  },
  /**
   * MIDNIGHT — Dark mode with subtle blue tints. All foregrounds are light.
   */
  midnight: {
    label: 'Midnight',
    strength: 'Gelap',
    description: 'Mode gelap elegan dengan aksen biru dan ungu.',
    preview: 'from-slate-900 via-indigo-900 to-violet-800',
    frame: 'border',
    shadow: 'shadow-lg shadow-black/30',
    backdrop: '#0f172a',
    useGlassLayer: false,
    useParticles: false,
    vars: {
      '--profile-page': '#0f172a',
      '--profile-text': '#e2e8f0',
      '--profile-muted': '#94a3b8',
      '--profile-surface': '#1e293b',
      '--profile-surface-strong': '#162032',
      '--profile-border': '#475569',
      '--profile-soft': '#293548',
      '--profile-soft-text': '#c7d2fe',
      '--profile-primary': '#818cf8',
      '--profile-primary-hover': '#a5b4fc',
      '--profile-accent': '#38bdf8',
      '--profile-ring': 'rgba(129,140,248,0.3)',
      '--profile-input': '#1e293b',
      '--profile-input-disabled': '#334155',
      '--profile-stat': '#293548',
      '--profile-warning': '#451a03',
      '--profile-warning-text': '#fde68a',
      '--profile-danger': '#4c0519',
      '--profile-danger-text': '#fda4af',
      '--profile-font-body': 'var(--font-sans)',
      '--profile-font-heading': 'var(--font-display)',
      '--profile-heading-shadow': 'none',
      '--profile-text-shadow': 'none',
    } as ThemeVars,
  },
  /**
   * ROSE — Warm pink/rose soft theme.
   */
  rose: {
    label: 'Rose',
    strength: 'Hangat',
    description: 'Warm rose/pink dengan sentuhan peach dan coral.',
    preview: 'from-rose-400 via-pink-400 to-orange-300',
    frame: 'border',
    shadow: 'shadow-sm',
    backdrop: 'linear-gradient(135deg, #fff1f2 0%, #fdf2f8 50%, #fffbeb 100%)',
    useGlassLayer: false,
    useParticles: false,
    vars: {
      '--profile-page': '#fff1f2',
      '--profile-text': '#4c0519',
      '--profile-muted': '#be185d',
      '--profile-surface': '#ffffff',
      '--profile-surface-strong': '#fffbfc',
      '--profile-border': '#fecdd3',
      '--profile-soft': '#fff1f2',
      '--profile-soft-text': '#be123c',
      '--profile-primary': '#e11d48',
      '--profile-primary-hover': '#be123c',
      '--profile-accent': '#f97316',
      '--profile-ring': 'rgba(225,29,72,0.18)',
      '--profile-input': '#ffffff',
      '--profile-input-disabled': '#fdf2f8',
      '--profile-stat': '#fdf2f8',
      '--profile-warning': '#fffbeb',
      '--profile-warning-text': '#92400e',
      '--profile-danger': '#fef2f2',
      '--profile-danger-text': '#dc2626',
      '--profile-font-body': 'var(--font-sans)',
      '--profile-font-heading': 'var(--font-display)',
      '--profile-heading-shadow': 'none',
      '--profile-text-shadow': 'none',
    } as ThemeVars,
  },
} as const;

export type ThemeKey = keyof typeof THEMES;

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

export const THEME_TYPOGRAPHY: Record<ThemeKey, { page: string; eyebrow: string; heading: string; body: string; label: string; button: string; meta: string }> = {
  default: {
    page: 'antialiased [font-family:var(--profile-font-body)]',
    eyebrow: 'text-xs font-bold uppercase tracking-[0.14em]',
    heading: 'text-2xl font-black leading-tight tracking-[-0.025em] [font-family:var(--profile-font-heading)]',
    body: 'text-sm font-medium leading-6',
    label: 'text-sm font-semibold',
    button: 'text-sm font-semibold',
    meta: 'text-xs font-semibold',
  },
  ocean: {
    page: 'antialiased [font-family:var(--profile-font-body)]',
    eyebrow: 'text-xs font-bold uppercase tracking-[0.14em]',
    heading: 'text-2xl font-bold leading-tight tracking-[-0.03em] [font-family:var(--profile-font-heading)]',
    body: 'text-sm font-medium leading-6',
    label: 'text-sm font-semibold',
    button: 'text-sm font-semibold',
    meta: 'text-xs font-medium',
  },
  forest: {
    page: 'antialiased [font-family:var(--profile-font-body)]',
    eyebrow: 'text-xs font-semibold uppercase tracking-[0.14em]',
    heading: 'text-2xl font-bold leading-tight tracking-[-0.03em] [font-family:var(--profile-font-heading)]',
    body: 'text-sm font-normal leading-6',
    label: 'text-sm font-semibold',
    button: 'text-sm font-semibold',
    meta: 'text-xs font-medium',
  },
  midnight: {
    page: 'antialiased [font-family:var(--profile-font-body)]',
    eyebrow: 'text-xs font-bold uppercase tracking-[0.16em]',
    heading: 'text-2xl font-bold leading-tight tracking-[-0.025em] [font-family:var(--profile-font-heading)]',
    body: 'text-sm font-medium leading-6',
    label: 'text-sm font-semibold',
    button: 'text-sm font-semibold',
    meta: 'text-xs font-semibold',
  },
  rose: {
    page: 'antialiased [font-family:var(--profile-font-body)]',
    eyebrow: 'text-xs font-bold uppercase tracking-[0.14em]',
    heading: 'text-2xl font-bold leading-tight tracking-[-0.03em] [font-family:var(--profile-font-heading)]',
    body: 'text-sm font-medium leading-6',
    label: 'text-sm font-semibold',
    button: 'text-sm font-semibold',
    meta: 'text-xs font-medium',
  },
};

/** Utility classes for themed surfaces */
export const GLASS_LAYER_CLASS = 'before:pointer-events-none before:absolute before:inset-px before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,255,255,0.16)_14%,rgba(255,255,255,0.035)_32%,transparent_46%,rgba(255,255,255,0.16)_64%,transparent_82%)] before:opacity-90 before:mix-blend-screen before:content-[""] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[radial-gradient(ellipse_at_16%_0%,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_92%_10%,rgba(94,234,212,0.2),transparent_30%),linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.22)_44%,rgba(255,255,255,0.055)_49%,transparent_64%)] after:opacity-90 after:content-[""]';

export function getSurfaceClass(useGlass: boolean) {
  const base = 'relative overflow-hidden bg-[color:var(--profile-surface)] text-[color:var(--profile-text)] transition-all duration-500 ease-out';
  return useGlass
    ? `${base} bg-[linear-gradient(140deg,rgba(255,255,255,0.34),rgba(255,255,255,0.075)_24%,rgba(255,255,255,0.16)_68%,rgba(255,255,255,0.05))] backdrop-blur-3xl backdrop-saturate-200 ${GLASS_LAYER_CLASS}`
    : base;
}

export function getSurfaceStrongClass(useGlass: boolean) {
  const base = 'relative overflow-hidden bg-[color:var(--profile-surface-strong)] text-[color:var(--profile-text)] transition-all duration-500 ease-out';
  return useGlass
    ? `${base} bg-[linear-gradient(140deg,rgba(255,255,255,0.38),rgba(255,255,255,0.09)_28%,rgba(255,255,255,0.18)_68%,rgba(255,255,255,0.06))] backdrop-blur-3xl backdrop-saturate-200 ${GLASS_LAYER_CLASS}`
    : base;
}

export const SOFT_CLASS = 'border-[color:var(--profile-border)] bg-[color:var(--profile-soft)] text-[color:var(--profile-soft-text)] transition-all duration-300 ease-out';
export const PRIMARY_CLASS = 'bg-[color:var(--profile-primary)] text-white shadow-lg shadow-black/10 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[color:var(--profile-primary-hover)] hover:shadow-xl disabled:hover:translate-y-0';
export const MUTED_TEXT_CLASS = 'text-[color:var(--profile-muted)]';
export const ACCENT_TEXT_CLASS = 'text-[color:var(--profile-accent)]';
export const FIELD_CLASS = 'border-[color:var(--profile-border)] bg-[color:var(--profile-input)] text-[color:var(--profile-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] outline-none transition-all duration-300 placeholder:text-[color:var(--profile-muted)] focus:border-[color:var(--profile-accent)] focus:ring-4 focus:ring-[color:var(--profile-ring)] disabled:bg-[color:var(--profile-input-disabled)] disabled:text-[color:var(--profile-muted)]';

export const STORAGE_KEY = 'sibermas_theme';

export function getStoredTheme(): ThemeKey {
  if (typeof window === 'undefined') return 'default';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored in THEMES) return stored as ThemeKey;
    const legacy = window.localStorage.getItem('sibermas_profile_theme');
    if (legacy && legacy in THEMES) {
      window.localStorage.setItem(STORAGE_KEY, legacy);
      window.localStorage.removeItem('sibermas_profile_theme');
      return legacy as ThemeKey;
    }
  } catch { /* private browsing / quota */ }
  return 'default';
}

export function storeTheme(theme: ThemeKey): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* private browsing */ }
}
