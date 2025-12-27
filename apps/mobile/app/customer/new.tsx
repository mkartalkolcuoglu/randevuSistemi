import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

export default function NewCustomerScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: '',
    address: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Hata', 'Ad alanı zorunludur');
      return;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Hata', 'Soyad alanı zorunludur');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Hata', 'Telefon alanı zorunludur');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/customers', formData);
      Alert.alert('Başarılı', 'Müşteri başarıyla eklendi', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.error || 'Müşteri eklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Yeni Müşteri</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ad *</Text>
          <TextInput
            style={styles.input}
            placeholder="Müşteri adı"
            placeholderTextColor="#9CA3AF"
            value={formData.firstName}
            onChangeText={(v) => updateField('firstName', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Soyad *</Text>
          <TextInput
            style={styles.input}
            placeholder="Müşteri soyadı"
            placeholderTextColor="#9CA3AF"
            value={formData.lastName}
            onChangeText={(v) => updateField('lastName', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefon *</Text>
          <TextInput
            style={styles.input}
            placeholder="05XX XXX XX XX"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(v) => updateField('phone', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@mail.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Doğum Tarihi</Text>
            <TextInput
              style={styles.input}
              placeholder="GG.AA.YYYY"
              placeholderTextColor="#9CA3AF"
              value={formData.birthDate}
              onChangeText={(v) => updateField('birthDate', v)}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Cinsiyet</Text>
            <View style={styles.genderRow}>
              {['Erkek', 'Kadın'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderButton, formData.gender === g && styles.genderButtonActive]}
                  onPress={() => updateField('gender', g)}
                >
                  <Text style={[styles.genderText, formData.gender === g && styles.genderTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Adres</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Müşteri adresi"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={2}
            value={formData.address}
            onChangeText={(v) => updateField('address', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notlar</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Müşteri hakkında notlar..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={formData.notes}
            onChangeText={(v) => updateField('notes', v)}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>Müşteri Ekle</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  genderTextActive: {
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
