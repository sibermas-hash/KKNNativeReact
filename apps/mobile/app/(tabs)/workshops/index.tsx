import { View, Text, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function WorkshopsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'workshops'],
    queryFn: async () => {
      const endpoints = studentEndpoints(api);
      return await endpoints.workshops.index();
    }
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text>Loading workshops...</Text>
      </View>
    );
  }

  const workshops = data?.data?.workshops || [];

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
        Workshops
      </Text>
      {workshops.length === 0 ? (
        <Text>No workshops scheduled</Text>
      ) : (
        workshops.map((workshop: any) => (
          <View key={workshop.id} style={{ marginBottom: 10, padding: 15, backgroundColor: '#fff', borderRadius: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>{workshop.title}</Text>
            <Text>Date: {workshop.workshop_date}</Text>
            <Text>Location: {workshop.location}</Text>
          </View>
        ))
      )}
    </View>
  );
}
