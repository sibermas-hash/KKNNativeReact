import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthUser, useLogoutAction } from '@/stores';
import { ROLE_LABELS } from '@sibermas/constants';
import { Avatar, useTheme, useStyles, MOBILE_THEMES, type ThemeKey, InfoRow, Screen, SecondaryButton, StatusPill, SurfaceCard } from '@/components/ui/primitives';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const logout = useLogoutAction();
  const { theme, setTheme } = useTheme();

  const styles = useStyles((colors) => ({
    content: { paddingBottom: 48 },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    identity: {
      flex: 1,
      gap: 8,
    },
    name: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 25,
    },
    nim: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    infoCard: {
      paddingBottom: 6,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
      marginBottom: 6,
    },
    themeSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 16,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingVertical: 4,
      paddingBottom: 10,
    },
    themeButton: {
      flexDirection: 'column',
      alignItems: 'center',
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      gap: 8,
      width: '28%',
      minWidth: 80,
    },
    themeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.soft,
    },
    themeDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMark: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
    },
    themeLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '700',
    },
    themeLabelActive: {
      color: colors.text,
      fontWeight: '900',
    },
    logoutButton: {
      borderColor: colors.dangerSoft === '#fef2f2' ? '#FECDD3' : colors.border,
      backgroundColor: colors.dangerSoft === '#fef2f2' ? '#FFF1F2' : colors.dangerSoft,
    },
    logoutText: {
      color: colors.rose,
    },
  }));

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const roleLabel = ROLE_LABELS[user?.roles?.[0] || 'student'] || 'Mahasiswa';
  const facultyName = user?.faculty ? (user.faculty as { name?: string })?.name : undefined;

  return (
    <Screen contentContainerStyle={styles.content}>
      <SurfaceCard style={styles.profileCard}>
        <Avatar name={user?.name} />
        <View style={styles.identity}>
          <Text style={styles.name}>{user?.name || '-'}</Text>
          <StatusPill label={roleLabel} tone="teal" />
          {user?.nim ? <Text style={styles.nim} selectable>NIM {user.nim}</Text> : null}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.infoCard}>
        <Text style={styles.cardTitle}>Informasi Akun</Text>
        <InfoRow label="Email" value={user?.email || '-'} />
        <InfoRow label="Username" value={user?.username || '-'} />
        <InfoRow label="Fakultas" value={facultyName || '-'} />
      </SurfaceCard>

      <SurfaceCard style={styles.infoCard}>
        <Text style={styles.cardTitle}>Pilih Tema Visual</Text>
        <Text style={styles.themeSubtitle}>Personalisasi seluruh tampilan aplikasi Anda secara dinamis.</Text>
        <View style={styles.themeGrid}>
          {(Object.keys(MOBILE_THEMES) as ThemeKey[]).map((key) => {
            const isActive = theme === key;
            const themeConfig = MOBILE_THEMES[key];
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.8}
                onPress={() => setTheme(key)}
                style={[
                  styles.themeButton,
                  isActive && styles.themeButtonActive
                ]}
              >
                <View style={[styles.themeDot, { backgroundColor: themeConfig.primary }]}>
                  {isActive && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.themeLabel, isActive && styles.themeLabelActive]}>
                  {key === 'default' ? 'Islami' : key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
