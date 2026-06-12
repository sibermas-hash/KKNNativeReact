import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';
import { unwrapPaginated } from '@/lib/api-helpers';
import { useStyles, LoadingState, EmptyState, StatusPill, type Tone } from '@/components/ui/primitives';

type Notification = {
  id: string;
  type?: string;
  data: { title?: string; message?: string; priority?: string; action?: string };
  read_at: string | null;
  created_at: string;
};

const priorityTone: Record<string, Tone> = {
  info: 'blue',
  success: 'emerald',
  warning: 'amber',
  danger: 'rose',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function NotificationsScreen() {
  const qc = useQueryClient();
  const endpoints = notificationsEndpoints(api);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const styles = useStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    filterRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, padding: 16, paddingBottom: 8 },
    filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    filterBtnActive: { backgroundColor: colors.soft, borderColor: colors.primary },
    filterText: { fontSize: 11, fontWeight: '800' as const, color: colors.textMuted },
    filterTextActive: { color: colors.softText },
    markAllBtn: { marginLeft: 'auto' as const, paddingHorizontal: 10, paddingVertical: 6 },
    markAllText: { fontSize: 11, fontWeight: '800' as const, color: colors.primary },
    list: { padding: 16, paddingTop: 0, gap: 10 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 6, position: 'relative' as const },
    cardUnread: { borderColor: colors.primary, backgroundColor: colors.emeraldSoft },
    cardHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    title: { fontSize: 14, fontWeight: '800' as const, color: colors.text },
    message: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
    time: { fontSize: 10, color: colors.textSubtle, fontWeight: '700' as const },
    unreadDot: { position: 'absolute' as const, top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  }));

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const res = await endpoints.index({ status: filter, per_page: 50 });
      return unwrapPaginated<Notification>(res);
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => endpoints.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => endpoints.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data || [];

  if (isLoading) return <LoadingState label="Memuat notifikasi..." />;

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['all', 'unread'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Semua' : 'Belum Dibaca'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.markAllBtn} onPress={() => markAllRead.mutate()}>
          <Text style={styles.markAllText}>Tandai Semua</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Tidak ada notifikasi" description="Belum ada notifikasi masuk." />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read_at && styles.cardUnread]}
            onPress={() => { if (!item.read_at) markRead.mutate(item.id); }}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <StatusPill label={item.data.priority || 'info'} tone={priorityTone[item.data.priority || 'info'] || 'slate'} />
              <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>{item.data.title || 'Notifikasi'}</Text>
            <Text style={styles.message} numberOfLines={3}>{item.data.message || '-'}</Text>
            {!item.read_at && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
