import { Image, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

const splashLogo = require('../assets/splash-logo.gif');

/**
 * Animated splash screen — clean minimal white design.
 *
 * Desain berjalan dari native splash (Expo splashscreen: logo di tengah,
 * background putih) lalu hand-off ke komponen ini saat JS bundle
 * selesai di-load. Warna latar dan layout tetap konsisten supaya
 * transisi mulus tanpa flicker.
 */
export function AnimatedSplashScreen() {
  return (
    <View style={styles.container}>
      <Image source={splashLogo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.brand}>SIBERMAS</Text>
      <Text style={styles.subtitle}>KKN UIN Saizu</Text>
      <ActivityIndicator size="small" color="#0E7490" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    gap: 10,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 4,
  },
  brand: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  spinner: {
    marginTop: 28,
  },
});
