import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ScrollViewProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Tone = 'teal' | 'blue' | 'amber' | 'rose' | 'slate' | 'emerald';
export type ThemeKey = 'default' | 'ocean' | 'forest' | 'midnight' | 'rose';

export interface ThemeColors {
  background: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  surface: string;
  surfaceStrong: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  borderSoft: string;
  soft: string;
  softText: string;
  primary: string;
  primaryHover: string;
  accent: string;
  emerald: string;
  emeraldSoft: string;
  blue: string;
  amber: string;
  rose: string;
  dangerSoft: string;
  warningSoft: string;
  stat: string;
}

export const MOBILE_THEMES: Record<ThemeKey, ThemeColors> = {
  default: {
    background: '#F7F9F8',
    text: '#102A26',
    textMuted: '#5B716C',
    textSubtle: '#8B9E9A',
    surface: '#FFFFFF',
    surfaceStrong: '#ECF2F0',
    surfaceMuted: '#F0F4F2',
    border: '#D8E2DF',
    borderStrong: '#BCC8C5',
    borderSoft: '#EBF0EE',
    soft: '#E6F2EF',
    softText: '#0F766E',
    primary: '#0F766E',
    primaryHover: '#0B5C56',
    accent: '#C2A14D',
    emerald: '#059669',
    emeraldSoft: '#ECFDF5',
    blue: '#2563EB',
    amber: '#D97706',
    rose: '#BE123C',
    dangerSoft: '#FEE2E2',
    warningSoft: '#FEF3C7',
    stat: '#E6F2EF',
  },
  ocean: {
    background: '#eef2ff',
    text: '#1e1b4b',
    textMuted: '#6366f1',
    textSubtle: '#818cf8',
    surface: '#ffffff',
    surfaceStrong: '#f8faff',
    surfaceMuted: '#f1f5f9',
    border: '#e0e7ff',
    borderStrong: '#c7d2fe',
    borderSoft: '#f0f4ff',
    soft: '#eef2ff',
    softText: '#4338ca',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    accent: '#0ea5e9',
    emerald: '#059669',
    emeraldSoft: '#ECFDF5',
    blue: '#2563EB',
    amber: '#D97706',
    rose: '#BE123C',
    dangerSoft: '#fef2f2',
    warningSoft: '#fffbeb',
    stat: '#eff6ff',
  },
  forest: {
    background: '#ecfdf5',
    text: '#14532d',
    textMuted: '#4d7c0f',
    textSubtle: '#65a30d',
    surface: '#ffffff',
    surfaceStrong: '#f8fdf9',
    surfaceMuted: '#f0fdf4',
    border: '#d1fae5',
    borderStrong: '#a7f3d0',
    borderSoft: '#e6fdf0',
    soft: '#ecfdf5',
    softText: '#065f46',
    primary: '#059669',
    primaryHover: '#047857',
    accent: '#ca8a04',
    emerald: '#059669',
    emeraldSoft: '#ECFDF5',
    blue: '#2563EB',
    amber: '#D97706',
    rose: '#BE123C',
    dangerSoft: '#fef2f2',
    warningSoft: '#fefce8',
    stat: '#f0fdf4',
  },
  midnight: {
    background: '#0f172a',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    textSubtle: '#64748b',
    surface: '#1e293b',
    surfaceStrong: '#162032',
    surfaceMuted: '#1e293b',
    border: '#475569',
    borderStrong: '#64748b',
    borderSoft: '#334155',
    soft: '#293548',
    softText: '#c7d2fe',
    primary: '#818cf8',
    primaryHover: '#a5b4fc',
    accent: '#38bdf8',
    emerald: '#34d399',
    emeraldSoft: 'rgba(52, 211, 153, 0.15)',
    blue: '#60a5fa',
    amber: '#fbbf24',
    rose: '#fda4af',
    dangerSoft: '#4c0519',
    warningSoft: '#451a03',
    stat: '#293548',
  },
  rose: {
    background: '#fff1f2',
    text: '#4c0519',
    textMuted: '#be185d',
    textSubtle: '#db2777',
    surface: '#ffffff',
    surfaceStrong: '#fffbfc',
    surfaceMuted: '#fff5f7',
    border: '#fecdd3',
    borderStrong: '#fda4af',
    borderSoft: '#fff0f2',
    soft: '#fff1f2',
    softText: '#be123c',
    primary: '#e11d48',
    primaryHover: '#be123c',
    accent: '#f97316',
    emerald: '#059669',
    emeraldSoft: '#ECFDF5',
    blue: '#2563EB',
    amber: '#D97706',
    rose: '#BE123C',
    dangerSoft: '#fef2f2',
    warningSoft: '#fffbeb',
    stat: '#fdf2f8',
  },
};

// Default fallback colors object for backward compatibility
export const colors = MOBILE_THEMES.default;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export function getToneMap(colors: ThemeColors, isDark: boolean) {
  if (isDark) {
    return {
      teal: { solid: colors.primary, soft: colors.soft, text: colors.softText, border: colors.border, label: 'CY' },
      emerald: { solid: '#10b981', soft: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)', label: 'EM' },
      blue: { solid: '#3b82f6', soft: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)', label: 'BL' },
      amber: { solid: '#f59e0b', soft: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', label: 'AM' },
      rose: { solid: '#f43f5e', soft: 'rgba(244, 63, 94, 0.15)', text: '#fda4af', border: 'rgba(244, 63, 94, 0.3)', label: 'RS' },
      slate: { solid: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)', label: 'SL' },
    };
  }
  return {
    teal: { solid: colors.primary, soft: colors.soft, text: colors.softText, border: colors.borderSoft, label: 'CY' },
    emerald: { solid: colors.emerald, soft: colors.emeraldSoft, text: '#047857', border: '#A7F3D0', label: 'EM' },
    blue: { solid: colors.blue, soft: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: 'BL' },
    amber: { solid: colors.amber, soft: colors.warningSoft, text: '#92400E', border: '#FDE68A', label: 'AM' },
    rose: { solid: colors.rose, soft: colors.dangerSoft, text: colors.rose, border: '#FECDD3', label: 'RS' },
    slate: { solid: '#475569', soft: '#F8FAFC', text: '#64748B', border: colors.border, label: 'SL' },
  };
}

export const STORAGE_KEY = 'sibermas_mobile_theme';

interface ThemeContextValue {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => Promise<void>;
  colors: ThemeColors;
  toneMap: ReturnType<typeof getToneMap>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>('default');

  useEffect(() => {
    async function loadTheme() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && stored in MOBILE_THEMES) {
          setThemeState(stored as ThemeKey);
        }
      } catch (err) {
        console.warn('Failed to load mobile theme:', err);
      }
    }
    loadTheme();
  }, []);

  const setTheme = async (next: ThemeKey) => {
    try {
      setThemeState(next);
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      console.warn('Failed to save mobile theme:', err);
    }
  };

  const isDark = theme === 'midnight';
  const themeColors = MOBILE_THEMES[theme];
  const themeToneMap = useMemo(() => getToneMap(themeColors, isDark), [themeColors, isDark]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    colors: themeColors,
    toneMap: themeToneMap,
    isDark
  }), [theme, themeColors, themeToneMap, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const colorsObj = MOBILE_THEMES.default;
    const toneMapObj = getToneMap(colorsObj, false);
    return {
      theme: 'default' as ThemeKey,
      setTheme: async () => {},
      colors: colorsObj,
      toneMap: toneMapObj,
      isDark: false,
    };
  }
  return ctx;
}

export function useStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  getStyles: (themeColors: ThemeColors, themeToneMap: ReturnType<typeof getToneMap>) => T
): T {
  const { colors: themeColors, toneMap: themeToneMap } = useTheme();
  return useMemo(() => {
    return StyleSheet.create(getStyles(themeColors, themeToneMap));
  }, [themeColors, themeToneMap]);
}

export function useFormStyles() {
  const { colors } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      input: {
        minHeight: 46,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        backgroundColor: colors.surface,
        color: colors.text,
        fontSize: 14,
      },
      textarea: {
        minHeight: 104,
        textAlignVertical: 'top',
      },
      errorText: {
        color: colors.rose,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 18,
      },
    });
  }, [colors]);
}

// Helper to keep old type signature working where needed
export function getTonePalette(tone: Tone = 'teal') {
  const colorsObj = MOBILE_THEMES.default;
  return getToneMap(colorsObj, false)[tone];
}


export function Screen({ children, refreshControl, contentContainerStyle }: ScrollViewProps) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      refreshControl={refreshControl}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.screenContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function BrandWordmark({ subtitle }: { subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wordmarkWrap}>
      <View style={styles.wordmarkRow}>
        <Text style={[styles.wordmark, { color: colors.primary }]}>SIBER</Text>
        <Text style={[styles.wordmark, { color: colors.accent }]}>MAS</Text>
        <View style={[styles.wordmarkDot, { backgroundColor: colors.accent }]} />
      </View>
      {subtitle ? <Text style={[styles.wordmarkSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function HeroCard({
  eyebrow,
  title,
  subtitle,
  tone = 'emerald',
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: Tone;
  right?: React.ReactNode;
}) {
  const { colors, toneMap } = useTheme();
  const palette = toneMap[tone];
  return (
    <View style={[styles.pageHeader, { borderBottomColor: colors.borderSoft }]}>
      <View style={styles.headerTop}>
        <View style={styles.headerCopy}>
          {eyebrow ? (
            <View style={styles.kickerRow}>
              <View style={[styles.kickerDot, { backgroundColor: palette.solid }]} />
              <Text style={[styles.heroEyebrow, { color: palette.text }]}>{eyebrow}</Text>
            </View>
          ) : null}
          <Text style={[styles.heroTitle, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
        {right ? (
          <View style={[styles.headerRightCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            {right}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

export function SurfaceCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.surfaceCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function StatCard({ label, value, accent = 'emerald' }: { label: string; value: string; accent?: Tone }) {
  const { colors, toneMap } = useTheme();
  const palette = toneMap[accent];
  return (
    <SurfaceCard style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: palette.soft }]}>
        <Text style={[styles.statIconText, { color: palette.text }]}>{label.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={styles.statCopy}>
        <Text style={[styles.statLabel, { color: colors.textSubtle }]}>{label}</Text>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      </View>
    </SurfaceCard>
  );
}

export function StatusPill({ label, tone = 'slate' }: { label: string; tone?: Tone }) {
  const { toneMap } = useTheme();
  const palette = toneMap[tone];
  return (
    <View style={[styles.statusPill, { backgroundColor: palette.soft, borderColor: palette.border }]}>
      <Text style={[styles.statusPillText, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function InlineAlert({
  title,
  description,
  tone = 'amber',
}: {
  title?: string;
  description: string;
  tone?: Tone;
}) {
  const { toneMap } = useTheme();
  const palette = toneMap[tone];
  return (
    <View style={[styles.alert, { backgroundColor: palette.soft, borderColor: palette.border }]}>
      {title ? <Text style={[styles.alertTitle, { color: palette.text }]}>{title}</Text> : null}
      <Text style={[styles.alertText, { color: palette.text }]} selectable>
        {description}
      </Text>
    </View>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <SurfaceCard style={styles.emptyCard}>
      <View style={[styles.emptyMark, { borderColor: colors.border, backgroundColor: colors.borderSoft }]}>
        <View style={[styles.emptyMarkInner, { backgroundColor: colors.textSubtle }]} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>{description}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </SurfaceCard>
  );
}

export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.loadingWrap, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  tone = 'emerald',
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const { toneMap } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.primaryButton, { backgroundColor: toneMap[tone].solid }, (disabled || loading) && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{label}</Text>}
    </TouchableOpacity>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  style,
  textStyle,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.secondaryButtonText, { color: colors.text }, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Avatar({ name, tone = 'emerald', size = 72 }: { name?: string | null; tone?: Tone; size?: number }) {
  const { toneMap } = useTheme();
  const palette = toneMap[tone];
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: radius.md, backgroundColor: palette.solid }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.borderSoft }]}>
      <Text style={[styles.infoLabel, { color: colors.textSubtle }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]} selectable numberOfLines={2}>
        {value || '-'}
      </Text>
    </View>
  );
}

export function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.fieldLabel, { color: colors.text }]}>
      {children}
      {required ? <Text style={[styles.fieldRequired, { color: colors.rose }]}> *</Text> : null}
    </Text>
  );
}

export const formStyles = StyleSheet.create({
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
  },
  textarea: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.rose,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 36 },
  wordmarkWrap: { gap: 6 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { fontSize: 17, fontWeight: '900', letterSpacing: 0 },
  wordmarkDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 6 },
  wordmarkSubtitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0 },
  pageHeader: {
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  headerCopy: { flex: 1, gap: spacing.xs },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  kickerDot: { width: 8, height: 8, borderRadius: 4 },
  heroEyebrow: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  heroTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900', letterSpacing: 0 },
  heroSubtitle: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
  headerRightCard: {
    minWidth: 74,
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  sectionCopy: { flex: 1, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  sectionSubtitle: { fontSize: 13, lineHeight: 19 },
  surfaceCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  },
  statCard: { flex: 1, minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statIcon: { width: 48, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  statIconText: { fontSize: 12, fontWeight: '900' },
  statCopy: { flex: 1, gap: 2 },
  statValue: { fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  statusPill: {
    alignSelf: 'flex-start',
    maxWidth: 160,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  alert: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.xs },
  alertTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  alertText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: 34, gap: spacing.sm },
  emptyMark: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMarkInner: { width: 16, height: 16, borderRadius: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyDescription: { fontSize: 13, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  emptyAction: { marginTop: spacing.sm, alignSelf: 'stretch' },
  loadingWrap: { flex: 1, minHeight: 260, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingLabel: { fontSize: 14, fontWeight: '700' },
  primaryButton: {
    minHeight: 48,
    borderRadius: radius.sm,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 18px rgba(5, 150, 105, 0.18)',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.sm,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  buttonDisabled: { opacity: 0.55 },
  avatar: { alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)' },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  infoLabel: { flex: 0.42, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  infoValue: { flex: 0.58, textAlign: 'right', fontSize: 13, fontWeight: '800', lineHeight: 18 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  fieldRequired: { color: '#ef4444' },
});

