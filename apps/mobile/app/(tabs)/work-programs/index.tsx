import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useState } from 'react';
import {
  colors,
  EmptyState,
  FieldLabel,
  formStyles,
  HeroCard,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionTitle,
  StatusPill,
  SurfaceCard,
} from '@/components/ui/primitives';

const KATEGORI_OPTIONS = ['pendukung', 'utama', 'tambahan'];

type WorkProgramsResponse = {
  programs?: Record<string, unknown>[];
};

function isWorkProgramsResponse(value: unknown): value is WorkProgramsResponse {
  return typeof value === 'object' && value !== null && 'programs' in value;
}

function statusTone(status: string) {
  if (status === 'approved') return 'teal' as const;
  if (status === 'submitted' || status === 'pending') return 'amber' as const;
  if (status === 'revision' || status === 'rejected') return 'rose' as const;
  return 'slate' as const;
}

function formatBudget(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function WorkProgramsScreen() {
  const qc = useQueryClient();
  const endpoints = studentEndpoints(api);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', objectives: '', target_participants: '', budget: '', kategori: 'pendukung' });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'work-programs'],
    queryFn: async () => {
      const result = await endpoints.workPrograms.index();
      return isWorkProgramsResponse(result) ? result : { programs: [] };
    },
  });

  const programs = Array.isArray(data?.programs) ? data.programs : [];

  const mutation = useMutation({
    mutationFn: async () => endpoints.workPrograms.store({
      title: form.title,
      description: form.description || undefined,
      objectives: form.objectives || undefined,
      target_participants: form.target_participants ? Number(form.target_participants) : undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      kategori: form.kategori || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'work-programs'] });
      setShowForm(false);
      setForm({ title: '', description: '', objectives: '', target_participants: '', budget: '', kategori: 'pendukung' });
    },
    onError: () => Alert.alert('Error', 'Gagal menyimpan program kerja'),
  });

  const statusLabels: Record<string, string> = { draft: 'Draft', submitted: 'Menunggu', approved: 'Disetujui', revision: 'Revisi', pending: 'Menunggu', rejected: 'Ditolak' };

  if (isLoading) {
    return <LoadingState label="Memuat program kerja..." />;
  }

  if (showForm) {
    return (
      <Screen>
        <HeroCard
          eyebrow="Program Kerja"
          title="Ajukan Program"
          subtitle="Lengkapi detail program agar DPL dapat meninjau rencana kegiatan kelompok."
        />

        <SurfaceCard style={styles.formCard}>
          <View style={styles.formGroup}>
            <FieldLabel required>Judul Program</FieldLabel>
            <TextInput
              style={formStyles.input}
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="Judul program kerja"
              placeholderTextColor={colors.textSubtle}
            />
          </View>

          <View style={styles.formGroup}>
            <FieldLabel>Kategori</FieldLabel>
            <View style={styles.kategoriRow}>
              {KATEGORI_OPTIONS.map((k) => {
                const active = form.kategori === k;
                return (
                  <TouchableOpacity
                    key={k}
                    activeOpacity={0.82}
                    style={[styles.kategoriBtn, active && styles.kategoriBtnActive]}
                    onPress={() => setForm((p) => ({ ...p, kategori: k }))}
                  >
                    <Text style={[styles.kategoriBtnText, active && styles.kategoriBtnTextActive]}>
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <FieldLabel required>Deskripsi</FieldLabel>
            <TextInput
              style={[formStyles.input, formStyles.textarea]}
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
              placeholder="Deskripsi program"
              placeholderTextColor={colors.textSubtle}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <FieldLabel>Tujuan</FieldLabel>
            <TextInput
              style={[formStyles.input, formStyles.textarea]}
              value={form.objectives}
              onChangeText={(v) => setForm((p) => ({ ...p, objectives: v }))}
              placeholder="Tujuan program"
              placeholderTextColor={colors.textSubtle}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.twoColumn}>
            <View style={[styles.formGroup, styles.flexItem]}>
              <FieldLabel>Target Peserta</FieldLabel>
              <TextInput
                style={formStyles.input}
                value={form.target_participants}
                onChangeText={(v) => setForm((p) => ({ ...p, target_participants: v }))}
                placeholder="30"
                placeholderTextColor={colors.textSubtle}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.formGroup, styles.flexItem]}>
              <FieldLabel>Anggaran</FieldLabel>
              <TextInput
                style={formStyles.input}
                value={form.budget}
                onChangeText={(v) => setForm((p) => ({ ...p, budget: v }))}
                placeholder="500000"
                placeholderTextColor={colors.textSubtle}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <SecondaryButton label="Batal" onPress={() => setShowForm(false)} style={styles.actionButton} />
            <PrimaryButton
              label="Ajukan Program"
              onPress={() => mutation.mutate()}
              disabled={!form.title || !form.description}
              loading={mutation.isPending}
              style={styles.actionButtonWide}
            />
          </View>
        </SurfaceCard>
      </Screen>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      data={programs}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <>
          <HeroCard
            eyebrow="Program Kerja"
            title="Rencana Kegiatan"
            subtitle="Kelola program yang diajukan kelompok dan pantau status persetujuannya."
            right={<Text style={styles.heroCount}>{programs.length}</Text>}
          />
          <PrimaryButton label="Ajukan Program Kerja" onPress={() => setShowForm(true)} />
          <SectionTitle title="Daftar Program" subtitle="Ringkasan program kerja kelompok." />
        </>
      }
      ListEmptyComponent={
        <EmptyState
          title="Belum ada program kerja"
          description="Ajukan program kerja pertama agar rencana kegiatan dapat ditinjau DPL."
        />
      }
      renderItem={({ item }) => {
        const status = String(item.status || 'draft');
        const budget = formatBudget(item.budget);
        return (
          <SurfaceCard style={styles.card}>
            <View style={styles.cardHeader}>
              <StatusPill label={statusLabels[status] || status} tone={statusTone(status)} />
              <Text style={styles.kategoriTag}>{String(item.kategori || 'pendukung').toUpperCase()}</Text>
            </View>
            <Text style={styles.cardTitle}>{String(item.title || '-')}</Text>
            {item.description ? <Text style={styles.cardBody} numberOfLines={3}>{String(item.description)}</Text> : null}
            <View style={styles.metaRow}>
              {item.target_participants ? <Text style={styles.cardMeta}>Peserta {String(item.target_participants)}</Text> : null}
              {budget ? <Text style={styles.cardMeta}>{budget}</Text> : null}
            </View>
          </SurfaceCard>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  heroCount: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  card: { gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  kategoriTag: { fontSize: 10, fontWeight: '900', color: colors.textSubtle, letterSpacing: 0 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: colors.text, lineHeight: 21 },
  cardBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  formCard: { gap: 16 },
  formGroup: { gap: 8 },
  kategoriRow: { flexDirection: 'row', gap: 8 },
  kategoriBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  kategoriBtnActive: { backgroundColor: '#E6FFFA', borderColor: '#99F6E4' },
  kategoriBtnText: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  kategoriBtnTextActive: { color: colors.primary },
  twoColumn: { flexDirection: 'row', gap: 10 },
  flexItem: { flex: 1 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButton: { flex: 1 },
  actionButtonWide: { flex: 1.4 },
});
