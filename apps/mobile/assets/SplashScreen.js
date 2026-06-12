/**
 * SplashScreen.js — SIBERMAS Animated Splash Screen
 *
 * INSTALASI DEPENDENCIES:
 *   npm install react-native-linear-gradient
 *   npx pod-install  (iOS only)
 *
 * CARA PAKAI DI App.js:
 *   Lihat contoh di AppEntry.js
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── Ganti path ini sesuai lokasi logo di proyek kamu ───
const LOGO = require('./assets/Logo_SIBERMAS.png');

const SplashScreen = ({ onFinish }) => {
  // ── Animated values ──────────────────────────────────────
  const bgOpacity      = useRef(new Animated.Value(0)).current;

  const logoScale      = useRef(new Animated.Value(0)).current;
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoRotate     = useRef(new Animated.Value(0)).current;

  const glowScale      = useRef(new Animated.Value(0.6)).current;
  const glowOpacity    = useRef(new Animated.Value(0)).current;

  const titleOpacity   = useRef(new Animated.Value(0)).current;
  const titleY         = useRef(new Animated.Value(30)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY       = useRef(new Animated.Value(20)).current;

  const pill1Opacity   = useRef(new Animated.Value(0)).current;
  const pill2Opacity   = useRef(new Animated.Value(0)).current;
  const pill3Opacity   = useRef(new Animated.Value(0)).current;

  const dividerWidth   = useRef(new Animated.Value(0)).current;

  const screenOpacity  = useRef(new Animated.Value(1)).current;

  // ── Orbit ring animation (looping) ───────────────────────
  const orbitRotate    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Looping orbit ring setelah logo muncul
    const orbitLoop = Animated.loop(
      Animated.timing(orbitRotate, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    );

    // ── Master animation sequence ──────────────────────────
    Animated.sequence([
      // 1. Background fade in
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      // 2. Glow + Logo masuk bersamaan
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(glowScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),

      // 3. Divider line expand
      Animated.timing(dividerWidth, {
        toValue: width * 0.65,
        duration: 400,
        useNativeDriver: false, // width tidak support native driver
      }),

      // 4. Title slide up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),

      // 5. Tagline slide up
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(taglineY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),

      // 6. Stagger pills (KOLABORASI | INOVASI | DAMPAK NYATA)
      Animated.stagger(150, [
        Animated.timing(pill1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(pill2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(pill3Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),

      // 7. Hold
      Animated.delay(1200),

      // 8. Fade out seluruh layar
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onFinish) onFinish();
    });

    // Mulai orbit loop setelah 800ms
    const orbitTimer = setTimeout(() => orbitLoop.start(), 800);

    return () => {
      clearTimeout(orbitTimer);
      orbitLoop.stop();
    };
  }, []);

  // ── Derived interpolations ─────────────────────────────
  const logoSpin = logoRotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ['−15deg', '0deg'],
  });

  const orbitSpin = orbitRotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── Render ─────────────────────────────────────────────
  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Background gradient overlay */}
      <Animated.View style={[styles.bg, { opacity: bgOpacity }]}>
        <View style={styles.bgInner} />
      </Animated.View>

      {/* Glow blob */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* ── Logo Section ── */}
      <View style={styles.logoSection}>
        {/* Orbit ring (dekoratif) */}
        <Animated.View
          style={[
            styles.orbitRing,
            { transform: [{ rotate: orbitSpin }] },
          ]}
        />

        {/* Logo */}
        <Animated.Image
          source={LOGO}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { rotate: logoSpin },
              ],
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* ── Text Section ── */}
      <View style={styles.textSection}>
        {/* SIBERMAS title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleY }],
          }}
        >
          <Text style={styles.titleLeft}>
            SIBER<Text style={styles.titleRight}>MAS</Text>
          </Text>
        </Animated.View>

        {/* Divider with tagline */}
        <View style={styles.dividerRow}>
          <Animated.View style={[styles.dividerLine, { width: dividerWidth }]}>
            <View style={styles.dividerGradientLeft} />
          </Animated.View>

          <Animated.Text
            style={[
              styles.tagline,
              { opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
            ]}
          >
            MENGABDI DENGAN DAMPAK NYATA
          </Animated.Text>

          <Animated.View style={[styles.dividerLine, { width: dividerWidth }]}>
            <View style={styles.dividerGradientRight} />
          </Animated.View>
        </View>

        {/* Pills */}
        <View style={styles.pillRow}>
          <Animated.View style={[styles.pill, { opacity: pill1Opacity }]}>
            <Text style={styles.pillIcon}>👥</Text>
            <Text style={styles.pillText}>KOLABORASI</Text>
          </Animated.View>

          <View style={styles.pillDivider} />

          <Animated.View style={[styles.pill, { opacity: pill2Opacity }]}>
            <Text style={styles.pillIcon}>💡</Text>
            <Text style={styles.pillText}>INOVASI</Text>
          </Animated.View>

          <View style={styles.pillDivider} />

          <Animated.View style={[styles.pill, { opacity: pill3Opacity }]}>
            <Text style={styles.pillIcon}>📈</Text>
            <Text style={styles.pillText}>DAMPAK NYATA</Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

// ── Styles ────────────────────────────────────────────────
const BLUE  = '#1565C0';
const CYAN  = '#00BCD4';
const GREEN = '#4CAF50';
const DARK  = '#050A14';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Background */
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  bgInner: {
    flex: 1,
    backgroundColor: DARK,
  },

  /* Glow blob */
  glow: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: BLUE,
    opacity: 0,
    top: height * 0.1,
    alignSelf: 'center',
    // Blur effect via shadow (RN tidak support blur natively tanpa library)
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
    elevation: 0,
  },

  /* Logo */
  logoSection: {
    width: width * 0.62,
    height: width * 0.62,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  orbitRing: {
    position: 'absolute',
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    borderWidth: 1,
    borderColor: `${CYAN}40`,
    borderStyle: 'dashed',
  },
  logo: {
    width: width * 0.55,
    height: width * 0.55,
  },

  /* Text */
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleLeft: {
    fontSize: 42,
    fontWeight: '900',
    color: BLUE,
    letterSpacing: 3,
    textShadowColor: CYAN,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleRight: {
    color: '#FFFFFF',
  },

  /* Divider row */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  dividerLine: {
    height: 1.5,
    overflow: 'hidden',
  },
  dividerGradientLeft: {
    flex: 1,
    height: 1.5,
    backgroundColor: GREEN,
    opacity: 0.8,
  },
  dividerGradientRight: {
    flex: 1,
    height: 1.5,
    backgroundColor: CYAN,
    opacity: 0.8,
  },
  tagline: {
    color: '#90CAF9',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginHorizontal: 8,
    textAlign: 'center',
  },

  /* Pills */
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pill: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  pillIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  pillText: {
    color: GREEN,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pillDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1E3A5F',
    marginHorizontal: 6,
  },
});

export default SplashScreen;
