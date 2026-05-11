import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthUser, useLogoutAction } from '@/stores';
import { colors } from '@/components/ui/primitives';

export default function UnsupportedRoleScreen() {
  const user = useAuthUser();
  const logout = useLogoutAction();

  const roles = useMemo(() => {
    const list = user?.roles || [];
    return list.length > 0 ? list.join(', ') : 'tanpa role';
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Akses Mobile Belum Tersedia</Text>
        <Text style={styles.description}>
          Aplikasi mobile saat ini hanya mendukung akun mahasiswa serta dosen/DPL.
        </Text>
        <Text style={styles.meta}>Role akun Anda: {roles}</Text>
        <TouchableOpacity style={styles.button} onPress={() => logout()}>
          <Text style={styles.buttonText}>Keluar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 16,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
