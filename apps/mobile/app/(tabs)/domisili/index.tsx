import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { api } from '@/lib/api';

export default function DomisiliScreen() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    alamat_domisili: '',
    provinsi_domisili: '',
    kabupaten_kota_domisili: '',
    kecamatan_domisili: '',
    kelurahan_desa_domisili: '',
    kode_pos_domisili: '',
    no_rumah_domisili: '',
    rt_domisili: '',
    rw_domisili: '',
    latitude_domisili: '',
    longitude_domisili: '',
    foto_rumah_domisili: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'domisili'],
    queryFn: async () => {
      const endpoints = studentEndpoints(api);
      return await endpoints.domisili.show();
    }
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const endpoints = studentEndpoints(api);
      return await endpoints.domisili.store({
        ...formData,
        latitude_domisili: formData.latitude_domisili ? parseFloat(formData.latitude_domisili) : null,
        longitude_domisili: formData.longitude_domisili ? parseFloat(formData.longitude_domisili) : null,
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Domisili saved successfully');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['student', 'domisili'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save domisili');
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
    if (!formData.alamat_domisili || !formData.kabupaten_kota_domisili) {
      Alert.alert('Validation Error', 'Alamat domisili and kabupaten/kota are required');
      return;
    }
    mutation.mutate();
  };

  const handleEdit = () => {
    if (data?.data?.domisili) {
      setFormData({
        alamat_domisili: data.data.domisili.alamat_domisili || '',
        provinsi_domisili: data.data.domisili.provinsi_domisili || '',
        kabupaten_kota_domisili: data.data.domisili.kabupaten_kota_domisili || '',
        kecamatan_domisili: data.data.domisili.kecamatan_domisili || '',
        kelurahan_desa_domisili: data.data.domisili.kelurahan_desa_domisili || '',
        kode_pos_domisili: data.data.domisili.kode_pos_domisili || '',
        no_rumah_domisili: data.data.domisili.no_rumah_domisili || '',
        rt_domisili: data.data.domisili.rt_domisili || '',
        rw_domisili: data.data.domisili.rw_domisili || '',
        latitude_domisili: data.data.domisili.latitude_domisili?.toString() || '',
        longitude_domisili: data.data.domisili.longitude_domisili?.toString() || '',
        foto_rumah_domisili: data.data.domisili.foto_rumah_domisili || '',
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

  const domisili = data?.data?.domisili;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Domisili KKN</Text>

      {domisili && !isEditing ? (
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Alamat Domisili</Text>
            <Text style={styles.value}>{domisili.alamat_domisili}</Text>
          </View>
          {domisili.provinsi_domisili && (
            <View style={styles.field}>
              <Text style={styles.label}>Provinsi</Text>
              <Text style={styles.value}>{domisili.provinsi_domisili}</Text>
            </View>
          )}
          {domisili.kabupaten_kota_domisili && (
            <View style={styles.field}>
              <Text style={styles.label}>Kabupaten/Kota</Text>
              <Text style={styles.value}>{domisili.kabupaten_kota_domisili}</Text>
            </View>
          )}
          {domisili.kecamatan_domisili && (
            <View style={styles.field}>
              <Text style={styles.label}>Kecamatan</Text>
              <Text style={styles.value}>{domisili.kecamatan_domisili}</Text>
            </View>
          )}
          {domisili.kelurahan_desa_domisili && (
            <View style={styles.field}>
              <Text style={styles.label}>Kelurahan/Desa</Text>
              <Text style={styles.value}>{domisili.kelurahan_desa_domisili}</Text>
            </View>
          )}
          {domisili.kode_pos_domisili && (
            <View style={styles.field}>
              <Text style={styles.label}>Kode Pos</Text>
              <Text style={styles.value}>{domisili.kode_pos_domisili}</Text>
            </View>
          )}
          {(domisili.no_rumah_domisili || domisili.rt_domisili || domisili.rw_domisili) && (
            <View style={styles.field}>
              <Text style={styles.label}>Detail</Text>
              <Text style={styles.value}>
                No. {domisili.no_rumah_domisili || '-'}, RT {domisili.rt_domisili || '-'}, RW {domisili.rw_domisili || '-'}
              </Text>
            </View>
          )}
          {domisili.latitude_domisili && domisili.longitude_domisili && (
            <View style={styles.field}>
              <Text style={styles.label}>Koordinat</Text>
              <Text style={styles.value}>{domisili.latitude_domisili}, {domisili.longitude_domisili}</Text>
            </View>
          )}
          {domisili.foto_rumah_domisili && (
            <View style={styles.field}>
              <Text style={styles.label}>Foto Rumah</Text>
              <Image source={{ uri: domisili.foto_rumah_domisili }} style={styles.photo} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={handleEdit}
          >
            <Text style={styles.buttonText}>Edit Domisili</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.subtitle}>
            {domisili ? 'Edit Domisili' : 'Isi Data Domisili'}
          </Text>
          <View style={styles.field}>
            <Text style={styles.label}>Alamat Domisili *</Text>
            <TextInput
              style={styles.input}
              value={formData.alamat_domisili}
              onChangeText={(text) => setFormData({...formData, alamat_domisili: text})}
              placeholder="Jalan lengkap..."
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Provinsi</Text>
            <TextInput
              style={styles.input}
              value={formData.provinsi_domisili}
              onChangeText={(text) => setFormData({...formData, provinsi_domisili: text})}
              placeholder="Nama provinsi"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Kabupaten/Kota *</Text>
            <TextInput
              style={styles.input}
              value={formData.kabupaten_kota_domisili}
              onChangeText={(text) => setFormData({...formData, kabupaten_kota_domisili: text})}
              placeholder="Nama kabupaten/kota"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Kecamatan</Text>
            <TextInput
              style={styles.input}
              value={formData.kecamatan_domisili}
              onChangeText={(text) => setFormData({...formData, kecamatan_domisili: text})}
              placeholder="Nama kecamatan"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Kelurahan/Desa</Text>
            <TextInput
              style={styles.input}
              value={formData.kelurahan_desa_domisili}
              onChangeText={(text) => setFormData({...formData, kelurahan_desa_domisili: text})}
              placeholder="Nama kelurahan/desa"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Kode Pos</Text>
            <TextInput
              style={styles.input}
              value={formData.kode_pos_domisili}
              onChangeText={(text) => setFormData({...formData, kode_pos_domisili: text})}
              placeholder="5 digit kode pos"
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>No. Rumah</Text>
              <TextInput
                style={styles.input}
                value={formData.no_rumah_domisili}
                onChangeText={(text) => setFormData({...formData, no_rumah_domisili: text})}
                placeholder="Nomor"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>RT</Text>
              <TextInput
                style={styles.input}
                value={formData.rt_domisili}
                onChangeText={(text) => setFormData({...formData, rt_domisili: text})}
                placeholder="001"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>RW</Text>
              <TextInput
                style={styles.input}
                value={formData.rw_domisili}
                onChangeText={(text) => setFormData({...formData, rw_domisili: text})}
                placeholder="001"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Koordinat GPS (Opsional)</Text>
            <View style={styles.coordinatesRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={formData.latitude_domisili}
                onChangeText={(text) => setFormData({...formData, latitude_domisili: text})}
                placeholder="Latitude"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={formData.longitude_domisili}
                onChangeText={(text) => setFormData({...formData, longitude_domisili: text})}
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
            <Text style={styles.label}>Foto Rumah</Text>
            <TouchableOpacity
              style={[styles.button, styles.photoButton]}
              onPress={() => {}}
            >
              <Text style={styles.buttonText}>📷 Ambil Foto</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{domisili ? 'Update' : 'Simpan'} Domisili</Text>
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
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  value: { fontSize: 16, color: '#666', lineHeight: 22 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff' },
  coordinatesRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  halfInput: { flex: 1 },
  photo: { width: '100%', height: 200, borderRadius: 8, marginTop: 8 },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  submitButton: { backgroundColor: '#0d9488' },
  editButton: { backgroundColor: '#059669', marginTop: 16 },
  cancelButton: { backgroundColor: '#92400e' },
  locationButton: { backgroundColor: '#2563eb', paddingVertical: 10 },
  photoButton: { backgroundColor: '#059669', paddingVertical: 10 },
});
