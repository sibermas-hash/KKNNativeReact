import React from 'react';
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

export type Tone = 'teal' | 'blue' | 'amber' | 'rose' | 'slate' | 'emerald';

export const colors = {
  background: '#F8FAFC',
  text: '#0F172A',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  surface: '#FFFFFF',
  surfaceStrong: '#F8FAF9',
  surfaceMuted: '#F8FAFC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  borderSoft: '#F1F5F9',
  soft: '#ECFEFF',
  softText: '#0E7490',
  primary: '#0891B2',
  primaryHover: '#0E7490',
  accent: '#F59E0B',
  emerald: '#059669',
  emeraldSoft: '#ECFDF5',
  blue: '#2563EB',
  amber: '#D97706',
  rose: '#BE123C',
  dangerSoft: '#FFF1F2',
  warningSoft: '#FFFBEB',
  stat: '#F0FDFA',
};

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

const toneMap: Record<Tone, { solid: string; soft: string; text: string; border: string; label: string }> = {
  teal: { solid: colors.primary, soft: colors.soft, text: colors.softText, border: '#A5F3FC', label: 'CY' },
  emerald: { solid: colors.emerald, soft: '#ECFDF5', text: '#047857', border: '#A7F3D0', label: 'EM' },
  blue: { solid: colors.blue, soft: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: 'BL' },
  amber: { solid: colors.amber, soft: colors.warningSoft, text: '#92400E', border: '#FDE68A', label: 'AM' },
  rose: { solid: colors.rose, soft: colors.dangerSoft, text: colors.rose, border: '#FECDD3', label: 'RS' },
  slate: { solid: '#475569', soft: '#F8FAFC', text: '#64748B', border: colors.border, label: 'SL' },
};

export function getTonePalette(tone: Tone = 'teal') {
  return toneMap[tone];
}

export function Screen({ children, refreshControl, contentContainerStyle }: ScrollViewProps) {
  return (
    <ScrollView
      style={styles.screen}
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
  return (
    <View style={styles.wordmarkWrap}>
      <View style={styles.wordmarkRow}>
        <Text style={[styles.wordmark, styles.wordmarkPrimary]}>SIBER</Text>
        <Text style={[styles.wordmark, styles.wordmarkAccent]}>MAS</Text>
        <View style={styles.wordmarkDot} />
      </View>
      {subtitle ? <Text style={styles.wordmarkSubtitle}>{subtitle}</Text> : null}
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
  const palette = toneMap[tone];
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerTop}>
        <View style={styles.headerCopy}>
          {eyebrow ? (
            <View style={styles.kickerRow}>
              <View style={[styles.kickerDot, { backgroundColor: palette.solid }]} />
              <Text style={[styles.heroEyebrow, { color: palette.text }]}>{eyebrow}</Text>
            </View>
          ) : null}
          <Text style={styles.heroTitle}>{title}</Text>
          {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.headerRightCard}>{right}</View> : null}
      </View>
    </View>
  );
}

export function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

export function SurfaceCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.surfaceCard, style]}>{children}</View>;
}

export function StatCard({ label, value, accent = 'emerald' }: { label: string; value: string; accent?: Tone }) {
  const palette = toneMap[accent];
  return (
    <SurfaceCard style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: palette.soft }]}>
        <Text style={[styles.statIconText, { color: palette.text }]}>{label.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={styles.statCopy}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </SurfaceCard>
  );
}

export function StatusPill({ label, tone = 'slate' }: { label: string; tone?: Tone }) {
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
  return (
    <SurfaceCard style={styles.emptyCard}>
      <View style={styles.emptyMark}>
        <View style={styles.emptyMarkInner} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </SurfaceCard>
  );
}

export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingLabel}>{label}</Text>
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
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.secondaryButton, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.secondaryButtonText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Avatar({ name, tone = 'emerald', size = 72 }: { name?: string | null; tone?: Tone; size?: number }) {
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
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} selectable numberOfLines={2}>
        {value || '-'}
      </Text>
    </View>
  );
}

export function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required ? <Text style={styles.fieldRequired}> *</Text> : null}
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
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 36 },
  wordmarkWrap: { gap: 6 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { fontSize: 17, fontWeight: '900', letterSpacing: 0 },
  wordmarkPrimary: { color: colors.primary },
  wordmarkAccent: { color: colors.accent },
  wordmarkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginLeft: 6 },
  wordmarkSubtitle: { color: colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0 },
  pageHeader: {
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  headerCopy: { flex: 1, gap: spacing.xs },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  kickerDot: { width: 8, height: 8, borderRadius: 4 },
  heroEyebrow: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  heroTitle: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: '900', letterSpacing: 0 },
  heroSubtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  headerRightCard: {
    minWidth: 74,
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  sectionCopy: { flex: 1, gap: spacing.xs },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 0 },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  surfaceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  },
  statCard: { flex: 1, minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statIcon: { width: 48, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  statIconText: { fontSize: 12, fontWeight: '900' },
  statCopy: { flex: 1, gap: 2 },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, color: colors.textSubtle, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
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
    borderColor: colors.border,
    backgroundColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMarkInner: { width: 16, height: 16, borderRadius: 4, backgroundColor: colors.textSubtle },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: colors.text, textAlign: 'center' },
  emptyDescription: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  emptyAction: { marginTop: spacing.sm, alignSelf: 'stretch' },
  loadingWrap: { flex: 1, minHeight: 260, justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: colors.background },
  loadingLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '700' },
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { color: colors.text, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  buttonDisabled: { opacity: 0.55 },
  avatar: { alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)' },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  infoLabel: { flex: 0.42, fontSize: 12, color: colors.textSubtle, fontWeight: '900', textTransform: 'uppercase' },
  infoValue: { flex: 0.58, textAlign: 'right', fontSize: 13, color: colors.text, fontWeight: '800', lineHeight: 18 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  fieldRequired: { color: colors.rose },
});
