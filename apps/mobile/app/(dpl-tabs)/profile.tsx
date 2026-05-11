import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthUser, useLogoutAction } from '@/stores';
import { ROLE_LABELS } from '@sibermas/constants';
import { Avatar, colors, InfoRow, Screen, SecondaryButton, StatusPill, SurfaceCard } from '@/components/ui/primitives';

export default function DplProfileScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const logout = useLogoutAction();

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const roleLabel = ROLE_LABELS[user?.roles?.[0] || 'dosen'] || 'Dosen';

  return (
    <Screen contentContainerStyle={styles.content}>
      <SurfaceCard style={styles.profileCard}>
        <Avatar name={user?.name} tone="blue" />
        <View style={styles.identity}>
          <Text style={styles.name}>{user?.name || '-'}</Text>
          <StatusPill label={roleLabel} tone="blue" />
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.infoCard}>
        <Text style={styles.cardTitle}>Informasi Akun</Text>
        <InfoRow label="Email" value={user?.email || '-'} />
        <InfoRow label="Username" value={user?.username || '-'} />
      </SurfaceCard>

      <SecondaryButton
        label="Keluar dari Akun"
        onPress={handleLogout}
        style={styles.logoutButton}
        textStyle={styles.logoutText}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  identity: { flex: 1, gap: 8 },
  name: { color: colors.text, fontSize: 20, fontWeight: '900', lineHeight: 25 },
  infoCard: { paddingBottom: 6 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginBottom: 6 },
  logoutButton: { borderColor: '#FECDD3', backgroundColor: '#FFF1F2' },
  logoutText: { color: colors.rose },
});
