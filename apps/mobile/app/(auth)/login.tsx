import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<{ captcha_id: string; question: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = async () => {
    try {
      const res = await api.get('/auth/captcha');
      const data = res.data as { success: boolean; data: { captcha_id: string; question: string } };
      if (data.success) setCaptcha(data.data);
    } catch {
      Alert.alert('Error', 'Gagal memuat CAPTCHA');
    }
  };

  useEffect(() => { fetchCaptcha(); }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/(tabs)');
  }, [isAuthenticated, isLoading]);

  const handleLogin = async () => {
    if (!loginInput || !password || !captcha) return;
    setLoading(true);
    try {
      await login(loginInput, password, captcha.captcha_id, captchaAnswer);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Login gagal')
        : 'Terjadi kesalahan';
      Alert.alert('Error', message);
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SIBERMAS</Text>
      <Text style={styles.subtitle}>KKN UIN Saizu</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Username / Email</Text>
        <TextInput style={styles.input} value={loginInput} onChangeText={setLoginInput} placeholder="Masukkan username" autoCapitalize="none" />

        <Text style={styles.label}>Kata Sandi</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Masukkan kata sandi" secureTextEntry />

        {captcha && (
          <>
            <Text style={styles.label}>{captcha.question}</Text>
            <TextInput style={styles.input} value={captchaAnswer} onChangeText={setCaptchaAnswer} placeholder="Jawaban" keyboardType="numeric" />
          </>
        )}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading || !captcha}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Masuk</Text>}
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
