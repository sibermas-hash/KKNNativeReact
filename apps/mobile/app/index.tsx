import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();
  useEffect(() => { router.replace('/(tabs)'); }, []);
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#0d9488" /></View>;
}
