import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function PoskoScreen() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nama_posko: '',
    alamat: '',
    latitude: '',
    longitude: '',
    radius_meters: '',
    jenis_posko: 'kesehatan',
    kontak_person: '',
    nomor_telepon: '',
    foto: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'posko'],
    queryFn: async () => {
      const endpoints = studentEndpoints(api);
      return await endpoints.posko.show();
    }
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const endpoints = studentEndpoints(api);
      return await endpoints.posko.store({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius_meters: parseFloat(formData.radius_meters),
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Posko saved successfully');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['student', 'posko'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save posko');
    },
  });

  const handleLocationPick = () => {
    Alert.alert('Location Picker', 'Select location from map or enter coordinates manually',
      [
        { text: 'Enter Coordinates', onPress: () => {} },
        { text: 'Pick from Map', onPress: () => {} },
      ]
    );
  };

  const handleSubmit = () => {
    if (!formData.nama_posko || !formData.alamat) {
      Alert.alert('Validation Error', 'Nama posko and alamat are required');
      return;
    }
    mutation.mutate();
  };

  const handleEdit = () => {
    if (data?.data?.posko) {
      setFormData({
        nama_posko: data.data.posko.nama_posko || '',
        alamat: data.data.posko.alamat || '',
        latitude: data.data.posko.latitude?.toString() || '',
        longitude: data.data.posko.longitude?.toString() || '',
        radius_meters: data.data.posko.radius_meters?.toString() || '50',
        jenis_posko: data.data.posko.jenis_posko || 'kesehatan',
        kontak_person: data.data.posko.kontak_person || '',
        nomor_telepon: data.data.posko.nomor_telepon || '',
        foto: data.data.posko.foto || '',
      });
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  const posko = data?.data?.posko;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Posko Kelompok</Text>

      {posko && !isEditing ? (
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Nama Posko</Text>
            <Text style={styles.value}>{posko.nama_posko}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Alamat</Text>
            <Text style={styles.value}>{posko.alamat}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Jenis</Text>
            <Text style={styles.value}>{posko.jenis_posko}</Text>
          </View>
          {posko.latitude && posko.longitude && (
            <View style={styles.field}>
              <Text style={styles.label}>Koordinat</Text>
              <Text style={styles.value}>{posko.latitude}, {posko.longitude}</Text>
            </View>
          )}
          {posko.radius_meters && (
            <View style={styles.field}>
              <Text style={styles.label}>Radius</Text>
              <Text style={styles.value}>{posko.radius_meters}m</Text>
            </View>
          )}
          {posko.kontak_person && (
            <View style={styles.field}>
              <Text style={styles.label}>Kontak Person</Text>
              <Text style={styles.value}>{posko.kontak_person}</Text>
            </View>
          )}
          {posko.nomor_telepon && (
            <View style={styles.field}>
              <Text style={styles.label}>Telepon</Text>
              <Text style={styles.value}>{posko.nomor_telepon}</Text>
            </View>
          )}
          {posko.gmaps_link && (
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => {}}
            >
              <Text style={styles.mapButtonText}>📍 Buka Google Maps</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={handleEdit}
          >
            <Text style={styles.buttonText}>Edit Posko</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.subtitle}>
            {posko ? 'Edit Posko' : 'Tambah Posko Baru'}
          </Text>
          <View style={styles.field}>
            <Text style={styles.label}>Nama Posko *</Text>
            <TextInput
              style={styles.input}
              value={formData.nama_posko}
              onChangeText={(text) => setFormData({...formData, nama_posko: text})}
              placeholder="Masukkan nama posko"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Alamat *</Text>
            <TextInput
              style={styles.input}
              value={formData.alamat}
              onChangeText={(text) => setFormData({...formData, alamat: text})}
              placeholder="Masukkan alamat lengkap"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Koordinat</Text>
            <View style={styles.coordinatesRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={formData.latitude}
                onChangeText={(text) => setFormData({...formData, latitude: text})}
                placeholder="Latitude"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={formData.longitude}
                onChangeText={(text) => setFormData({...formData, longitude: text})}
                placeholder="Longitude"
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={[styles.button, styles.locationButton]}
              onPress={handleLocationPick}
            >
              <Text style={styles.buttonText}>📍 Pilih dari Peta</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Radius (meter)</Text>
            <TextInput
              style={styles.input}
              value={formData.radius_meters}
              onChangeText={(text) => setFormData({...formData, radius_meters: text})}
              placeholder="50"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Jenis Posko</Text>
            <TextInput
              style={styles.input}
              value={formData.jenis_posko}
              onChangeText={(text) => setFormData({...formData, jenis_posko: text.toLowerCase()})}
              placeholder="kesehatan / administrasi / logistik"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Kontak Person</Text>
            <TextInput
              style={styles.input}
              value={formData.kontak_person}
              onChangeText={(text) => setFormData({...formData, kontak_person: text})}
              placeholder="Nama kontak person"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Nomor Telepon</Text>
            <TextInput
              style={styles.input}
              value={formData.nomor_telepon}
              onChangeText={(text) => setFormData({...formData, nomor_telepon: text})}
              placeholder="62xxxxxxxxxx"
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{posko ? 'Update' : 'Simpan'} Posko</Text>
            )}
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.buttonText}>Batal</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1f1f1f' },
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#0d9488' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  value: { fontSize: 16, color: '#666', lineHeight: 22 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff' },
  coordinatesRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  halfInput: { flex: 1 },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  submitButton: { backgroundColor: '#0d9488' },
  editButton: { backgroundColor: '#059669', marginTop: 16 },
  cancelButton: { backgroundColor: '#92400e' },
  locationButton: { backgroundColor: '#2563eb', paddingVertical: 10 },
  mapButton: { backgroundColor: '#dcfce7', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 16 },
  mapButtonText: { color: '#166534', fontSize: 16, fontWeight: '600' },
});
