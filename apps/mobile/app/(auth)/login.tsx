import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getMobileHomeRoute, useAuthIsLoading, useAuthStore, useIsAuthenticated, useLoginAction } from '@/stores';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@sibermas/schemas';
import {
  BrandWordmark,
  FieldLabel,
  InlineAlert,
  PrimaryButton,
  SecondaryButton,
  SurfaceCard,
  useStyles,
  useFormStyles,
  useTheme,
} from '@/components/ui/primitives';

const logoUin = require('../../assets/logo_uinsaizu.png');
const logoSibermas = require('../../assets/Logo_SIBERMAS.png');

export default function LoginScreen() {
  const router = useRouter();
  const login = useLoginAction();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthIsLoading();
  
  const { colors } = useTheme();
  const formStyles = useFormStyles();
  const styles = useStyles((colors) => ({
    root: { flex: 1, backgroundColor: colors.background },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
      gap: 20,
    },
    homePill: {
      alignSelf: 'center',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 16,
      paddingVertical: 7,
    },
    homePillText: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    brandBlock: {
      alignItems: 'center',
      gap: 14,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    logo: {
      width: 48,
      height: 48,
    },
    logoDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    brandTextWrap: {
      alignItems: 'center',
      gap: 6,
    },
    brand: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: 0,
      textTransform: 'uppercase',
    },
    brandCyan: {
      color: colors.primary,
    },
    brandEmerald: {
      color: colors.accent,
    },
    subtitle: {
      color: colors.textSubtle,
      fontSize: 10,
      fontWeight: '800',
      textAlign: 'center',
      lineHeight: 15,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    card: {
      gap: 16,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      gap: 6,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
    },
    cardSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    formGroup: {
      gap: 8,
    },
    captchaPanel: {
      gap: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      padding: 12,
    },
    captchaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    captchaLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    captchaQuestion: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      lineHeight: 22,
    },
    reloadButton: {
      minHeight: 34,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    reloadButtonText: {
      fontSize: 12,
    },
  }));

  const [captchaQuestion, setCaptchaQuestion] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema as any),
    defaultValues: { login: '', password: '', captcha_id: '', captcha_answer: '', remember: false },
  });

  useEffect(() => {
    register('login');
    register('password');
    register('captcha_id');
    register('captcha_answer');
    register('remember');
  }, [register]);

  const fetchCaptcha = useCallback(async () => {
    setCaptchaError(null);
    setIsCaptchaLoading(true);

    if (__DEV__) {
      console.log('[SIBERMAS] fetchCaptcha starting...');
    }
    try {
      const data = await api.get('/auth/captcha') as { captcha_id: string; question: string };
      if (__DEV__) {
        console.log('[SIBERMAS] captcha response:', JSON.stringify(data));
      }
      if (!data?.captcha_id) {
        throw new Error('CAPTCHA tidak tersedia');
      }

      setValue('captcha_id', data.captcha_id);
      setValue('captcha_answer', '');
      setCaptchaQuestion(data.question);
    } catch (err) {
      if (__DEV__) {
        console.warn('[SIBERMAS] fetchCaptcha failed:', err);
      }
      setCaptchaQuestion(null);
      setCaptchaError('CAPTCHA belum dapat dimuat. Periksa koneksi API lalu coba muat ulang.');
    } finally {
      setIsCaptchaLoading(false);
    }
  }, [setValue]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) await fetchCaptcha();
    })();
    return () => { mounted = false; };
  }, [fetchCaptcha]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getMobileHomeRoute(useAuthStore.getState().user));
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);

    try {
      await login(data.login, data.password, data.captcha_id, data.captcha_answer);
      const nextUser = useAuthStore.getState().user;
      router.replace(getMobileHomeRoute(nextUser));
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Login gagal')
        : 'Terjadi kesalahan saat login';
      setLoginError(message);
      await fetchCaptcha();
    }
  };

  const loginValue = watch('login');
  const passwordValue = watch('password');
  const captchaAnswerValue = watch('captcha_answer');
  const submitDisabled = isSubmitting || isCaptchaLoading || !captchaQuestion;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.homePill}>
          <Text style={styles.homePillText}>Portal Mobile SIBERMAS</Text>
        </View>

        <View style={styles.brandBlock}>
          <View style={styles.logoRow}>
            <Image source={logoUin} style={styles.logo} resizeMode="contain" />
            <View style={styles.logoDivider} />
            <Image source={logoSibermas} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.brandTextWrap}>
            <Text style={styles.brand}>
              Portal <Text style={styles.brandCyan}>SIBER</Text><Text style={styles.brandEmerald}>MAS.</Text>
            </Text>
            <Text style={styles.subtitle}>LPPM UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto</Text>
          </View>
        </View>

        <SurfaceCard style={styles.card}>
          <BrandWordmark subtitle="Akses Akun KKN" />
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Masuk ke Akun</Text>
            <Text style={styles.cardSubtitle}>Gunakan akun mahasiswa atau DPL yang sudah terdaftar.</Text>
          </View>

          {loginError ? <InlineAlert tone="rose" description={loginError} /> : null}
          {captchaError ? (
            <InlineAlert
              tone="amber"
              title="CAPTCHA tidak tersedia"
              description={captchaError}
            />
          ) : null}

          <View style={styles.formGroup}>
            <FieldLabel required>Username / Email</FieldLabel>
            <TextInput
              style={formStyles.input}
              value={loginValue}
              onChangeText={(text) => setValue('login', text)}
              placeholder="Masukkan username atau email"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="login"
            />
            {errors.login ? <Text style={formStyles.errorText} selectable>{String(errors.login.message)}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <FieldLabel required>Kata Sandi</FieldLabel>
            <TextInput
              style={formStyles.input}
              value={passwordValue}
              onChangeText={(text) => setValue('password', text)}
              placeholder="Masukkan kata sandi"
              placeholderTextColor={colors.textSubtle}
              secureTextEntry
              accessibilityLabel="password"
            />
            {errors.password ? <Text style={formStyles.errorText} selectable>{String(errors.password.message)}</Text> : null}
          </View>

          <View style={styles.captchaPanel}>
            <View style={styles.captchaHeader}>
              <Text style={styles.captchaLabel}>Verifikasi CAPTCHA</Text>
              <SecondaryButton
                label={isCaptchaLoading ? 'Memuat...' : 'Muat Ulang'}
                onPress={fetchCaptcha}
                disabled={isCaptchaLoading}
                style={styles.reloadButton}
                textStyle={styles.reloadButtonText}
              />
            </View>
            <Text style={styles.captchaQuestion} selectable>
              {captchaQuestion || 'CAPTCHA belum tersedia'}
            </Text>
            <TextInput
              style={formStyles.input}
              value={captchaAnswerValue}
              onChangeText={(text) => setValue('captcha_answer', text)}
              placeholder="Jawaban"
              placeholderTextColor={colors.textSubtle}
              keyboardType="numeric"
              accessibilityLabel="captcha"
              editable={Boolean(captchaQuestion)}
            />
            {errors.captcha_answer ? <Text style={formStyles.errorText} selectable>{String(errors.captcha_answer.message)}</Text> : null}
          </View>

          <PrimaryButton
            label="Masuk"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={submitDisabled}
          />

          {__DEV__ && (
            <SecondaryButton
              label="[DEV] Login Superadmin"
              onPress={async () => {
                try {
                  setLoginError(null);
                  const captcha = await api.get('/auth/captcha') as { captcha_id: string; question: string };
                  const match = captcha.question.match(/(\d+)\s*([+\-])\s*(\d+)/);
                  if (!match) return;
                  const ans = match[2] === '+' ? Number(match[1]) + Number(match[3]) : Number(match[1]) - Number(match[3]);
                  await login('superadmin', 'Password123', captcha.captcha_id, String(ans));
                } catch (e: any) {
                  setLoginError(e?.message || 'Dev login failed');
                }
              }}
            />
          )}
        </SurfaceCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

