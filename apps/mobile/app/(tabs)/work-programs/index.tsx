import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { useState } from 'react';

const KATEGORI_OPTIONS = ['pendukung', 'utama', 'tambahan'];

export default function WorkProgramsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const endpoints = studentEndpoints(api);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', objectives: '', target_participants: '', budget: '', kategori: 'pendukung' });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'work-programs'],
    queryFn: async () => {
      const res = await endpoints.workPrograms.index();
      return (res as { data?: Record<string, unknown>[] }).data ?? [];
    },
  });

  const programs = data ?? [];

  const mutation = useMutation({
    mutationFn: async () => endpoints.workPrograms.store(form as unknown as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'work-programs'] });
      setShowForm(false);
      setForm({ title: '', description: '', objectives: '', target_participants: '', budget: '', kategori: 'pendukung' });
    },
    onError: () => Alert.alert('Error', 'Gagal menyimpan program kerja'),
  });

  const statusColors: Record<string, string> = { draft: '#94a3b8', submitted: '#f59e0b', approved: '#10b981', revision: '#ef4444', pending: '#f59e0b' };
  const statusLabels: Record<string, string> = { draft: 'Draft', submitted: 'Menunggu', approved: 'Disetujui', revision: 'Revisi', pending: 'Menunggu' };

  if (showForm) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.formTitle}>Ajukan Program Kerja</Text>

        <Text style={styles.label}>Judul Program *</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} placeholder="Judul program kerja" />

        <Text style={styles.label}>Kategori</Text>
        <View style={styles.kategoriRow}>
          {KATEGORI_OPTIONS.map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.kategoriBtn, form.kategori === k && styles.kategoriBtnActive]}
              onPress={() => setForm((p) => ({ ...p, kategori: k }))}
            >
              <Text style={[styles.kategoriBtnText, form.kategori === k && styles.kategoriBtnTextActive]}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Deskripsi *</Text>
        <TextInput style={[styles.input, styles.textarea]} value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Deskripsi program" multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.label}>Tujuan</Text>
        <TextInput style={[styles.input, styles.textarea]} value={form.objectives} onChangeText={(v) => setForm((p) => ({ ...p, objectives: v }))} placeholder="Tujuan program" multiline numberOfLines={3} textAlignVertical="top" />

        <Text style={styles.label}>Target Peserta</Text>
        <TextInput style={styles.input} value={form.target_participants} onChangeText={(v) => setForm((p) => ({ ...p, target_participants: v }))} placeholder="Contoh: Ibu PKK, 30 orang" />

        <Text style={styles.label}>Estimasi Anggaran</Text>
        <TextInput style={styles.input} value={form.budget} onChangeText={(v) => setForm((p) => ({ ...p, budget: v }))} placeholder="Contoh: Rp 500.000" />

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
            <Text style={styles.cancelBtnText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending || !form.title || !form.description}
          >
            <Text style={styles.submitBtnText}>{mutation.isPending ? 'Menyimpan...' : 'Ajukan'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={programs}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Belum ada program kerja</Text>
              <Text style={styles.emptySubtext}>Tap tombol + untuk mengajukan</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: statusColors[String(item.status)] || '#94a3b8' }]}>
                <Text style={styles.badgeText}>{statusLabels[String(item.status)] || String(item.status)}</Text>
              </View>
              <Text style={styles.kategoriTag}>{String(item.kategori || 'pendukung').toUpperCase()}</Text>
            </View>
            <Text style={styles.cardTitle}>{String(item.title || '')}</Text>
            {item.description ? <Text style={styles.cardBody} numberOfLines={2}>{String(item.description)}</Text> : null}
            {item.target_participants ? (
              <Text style={styles.cardMeta}>👥 {String(item.target_participants)}</Text>
            ) : null}
            {item.budget ? (
              <Text style={styles.cardMeta}>💰 {String(item.budget)}</Text>
            ) : null}
          </View>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#64748b', marginTop: 12, fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  kategoriTag: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  cardMeta: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center', shadowColor: '#0d9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  // Form styles
  formTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0f172a' },
  textarea: { height: 100, paddingTop: 12 },
  kategoriRow: { flexDirection: 'row', gap: 8 },
  kategoriBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff' },
  kategoriBtnActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  kategoriBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  kategoriBtnTextActive: { color: '#fff' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 40 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#0d9488', alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 13, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
});
