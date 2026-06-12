/**
 * App.js — Contoh integrasi SplashScreen SIBERMAS
 *
 * Splash screen akan tampil dulu, lalu otomatis ganti ke
 * layar utama (MainApp) setelah animasi selesai.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SplashScreen from './SplashScreen';

// ─── Ganti komponen ini dengan layar utama kamu ──────────
const MainApp = () => (
  <View style={styles.main}>
    <Text style={styles.mainText}>Selamat datang di SIBERMAS 🎉</Text>
  </View>
);

// ─────────────────────────────────────────────────────────
export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return <MainApp />;
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#050A14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
