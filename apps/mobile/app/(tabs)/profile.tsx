import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores';
import { ROLE_LABELS } from '@sibermas/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || '-'}</Text>
        <Text style={styles.role}>{ROLE_LABELS[user?.roles?.[0] || 'student'] || 'Mahasiswa'}</Text>
        {user?.nim && <Text style={styles.nim}>NIM: {user.nim}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informasi Akun</Text>
        <View style={styles.row}><Text style={styles.rowLabel}>Email</Text><Text style={styles.rowValue}>{user?.email || '-'}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Username</Text><Text style={styles.rowValue}>{user?.username || '-'}</Text></View>
        {user?.faculty && <View style={styles.row}><Text style={styles.rowLabel}>Fakultas</Text><Text style={styles.rowValue}>{(user.faculty as { name?: string })?.name || '-'}</Text></View>}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Keluar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 12 },
  role: { fontSize: 14, color: '#0d9488', fontWeight: '600', marginTop: 4 },
  nim: { fontSize: 14, color: '#64748b', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLabel: { fontSize: 14, color: '#64748b' },
  rowValue: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  logoutButton: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 'auto' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
});
