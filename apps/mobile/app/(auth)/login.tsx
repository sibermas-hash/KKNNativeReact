import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@sibermas/schemas';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuthStore();

  const { register, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    // Cast to any due to potential Zod/resolver type mismatches across workspace versions
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

  const fetchCaptcha = async () => {
    try {
      const res = await api.get('/auth/captcha');
      const data = res as { success: boolean; data: { captcha_id: string; question: string } };
      if (data.success) {
        setValue('captcha_id', data.data.captcha_id);
        setValue('captcha_answer', '');
        // show question via local state
        setCaptchaQuestion(data.data.question);
      }
    } catch {
      Alert.alert('Error', 'Gagal memuat CAPTCHA');
    }
  };

  const [captchaQuestion, setCaptchaQuestion] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) await fetchCaptcha();
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/(tabs)');
  }, [isAuthenticated, isLoading]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.login, data.password, data.captcha_id, data.captcha_answer);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Login gagal')
        : 'Terjadi kesalahan';
      Alert.alert('Error', message);
      await fetchCaptcha();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SIBERMAS</Text>
      <Text style={styles.subtitle}>KKN UIN Saizu</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Username / Email</Text>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setValue('login', text)}
          placeholder="Masukkan username"
          autoCapitalize="none"
          accessibilityLabel="login"
        />
        {errors.login && <Text style={{ color: '#dc2626' }}>{String(errors.login.message)}</Text>}

        <Text style={styles.label}>Kata Sandi</Text>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setValue('password', text)}
          placeholder="Masukkan kata sandi"
          secureTextEntry
          accessibilityLabel="password"
        />
        {errors.password && <Text style={{ color: '#dc2626' }}>{String(errors.password.message)}</Text>}

        {captchaQuestion && (
          <>
            <Text style={styles.label}>{captchaQuestion}</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setValue('captcha_answer', text)}
              placeholder="Jawaban"
              keyboardType="numeric"
              accessibilityLabel="captcha"
            />
            {errors.captcha_answer && <Text style={{ color: '#dc2626' }}>{String(errors.captcha_answer.message)}</Text>}
          </>
        )}

        <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleSubmit(onSubmit)} disabled={isSubmitting || !captchaQuestion}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Masuk</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f172a' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  button: { backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
