import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import * as Location from 'expo-location';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

type Props = { route: { params: { id: number } } };

export default function WorkshopDetailScreen({ route }: Props) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['workshop', id],
    queryFn: async () => {
      const endpoints = studentEndpoints(api);
      return await endpoints.workshops.show(id);
    }
  });

  const attendMutation = useMutation({
    mutationFn: async (location: any) => {
      const endpoints = studentEndpoints(api);
      const deviceId = Platform.OS === 'android' ? Application.getAndroidId() : (Device.deviceName || 'unknown');
      return await endpoints.workshops.attend(id, {
        token,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        device_signature: deviceId,
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Attendance recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['workshop', id] });
      queryClient.invalidateQueries({ queryKey: ['student', 'workshops'] });
    },
    onError: (error: any) => {
      Alert.alert('Attendance Failed', error.response?.data?.message || 'Failed to record attendance');
    },
  });

  const handleAttendance = async () => {
    if (!token || token.length !== 6) {
      Alert.alert('Invalid Token', 'Please enter the 6-digit attendance code');
      return;
    }

    Alert.alert('Confirm Attendance', 'This will use your GPS location. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Attend',
          onPress: async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required for attendance.');
                return;
              }

              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
              attendMutation.mutate(location);
            } catch (error: any) {
              Alert.alert('Location Error', 'Failed to get GPS location. Please enable location services.');
            }
          },
        },
      ]
    );
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleUploadProof = async () => {
    if (!photoUri) {
      Alert.alert('No Photo', 'Please select a photo first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `attendance_proof_${id}_${Date.now()}.jpg`,
      } as any);

      await uploadMutation.mutateAsync(formData);
    } catch (error: any) {
      console.error('Upload error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  const workshop = data?.data?.workshop;

  return (
    <ScrollView style={styles.container}>
      {workshop && (
        <>
          <Text style={styles.title}>{workshop.title}</Text>
          <Text style={styles.date}>{workshop.workshop_date}</Text>
          <Text style={styles.location}>{workshop.location}</Text>
          <Text style={styles.radius}>Geofence radius: {workshop.radius_meters}m</Text>

          {workshop.attendance_status === 'attended' ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>✅ Attendance Recorded</Text>
              {workshop.media?.attendance_proof_url && (
                <Image source={{ uri: workshop.attendance_proof_url }} style={styles.proofImage} />
              )}
            </View>
          ) : (
            <>
              {workshop.status === 'scheduled' && (
                <View style={styles.formSection}>
                  <Text style={styles.label}>Attendance Code</Text>
                  <TextInput
                    style={styles.input}
                    value={token}
                    onChangeText={setToken}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[styles.button, styles.attendButton]}
                    onPress={handleAttendance}
                    disabled={attendMutation.isPending}
                  >
                    {attendMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Mark Attendance</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {workshop.attendance_status === 'pending_verification' && (
                <View style={styles.formSection}>
                  <Text style={styles.infoText}>Pending waitlist manual verification</Text>
                </View>
              )}
            </>
          )}

          {workshop.attendance_score !== null && (
            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>Attendance Score</Text>
              <Text style={styles.scoreValue}>{workshop.attendance_score}/100</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#1f1f1f' },
  date: { fontSize: 16, color: '#666', marginBottom: 4 },
  location: { fontSize: 16, color: '#666', marginBottom: 4 },
  radius: { fontSize: 14, color: '#999', marginBottom: 20 },
  formSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#1f1f1f' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, fontSize: 16 },
  button: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  attendButton: { backgroundColor: '#0d9488', marginBottom: 12 },
  uploadButton: { backgroundColor: '#059669', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  proofImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },
  successContainer: { backgroundColor: '#dcfce7', borderRadius: 12, padding: 16, alignItems: 'center' },
  successText: { fontSize: 18, fontWeight: '600', color: '#166534' },
  infoText: { fontSize: 14, color: '#666', marginBottom: 12 },
  scoreSection: { backgroundColor: '#dbeafe', borderRadius: 12, padding: 16, marginTop: 16 },
  scoreLabel: { fontSize: 16, color: '#1e40af' },
  scoreValue: { fontSize: 32, fontWeight: 'bold', color: '#1e40af' },
});
