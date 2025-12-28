import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string | null;
  gender: string | null;
  address: string | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: null,
    gender: null,
    address: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/mobile/customer/profile');
      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          email: data.email || '',
          birthDate: data.birthDate,
          gender: data.gender,
          address: data.address,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Hata', 'Ad ve soyad zorunludur');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put('/api/mobile/customer/profile', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || null,
        birthDate: formData.birthDate,
        gender: formData.gender,
        address: formData.address?.trim() || null,
      });

      if (response.data.success) {
        // Update user in store
        if (user) {
          setUser({
            ...user,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim() || undefined,
          });
        }
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi', [
          { text: 'Tamam', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Hata', response.data.message || 'Profil güncellenemedi');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Profil güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, birthDate: dateStr });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const genderOptions = [
    { value: 'male', label: 'Erkek' },
    { value: 'female', label: 'Kadın' },
    { value: 'other', label: 'Diğer' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kişisel Bilgiler</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButtonContainer}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Text style={styles.saveButton}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {formData.firstName.charAt(0) || user?.phone?.charAt(0) || 'K'}
            </Text>
          </View>
        </View>

        {/* Ad */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ad <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            placeholder="Adınız"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Soyad */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Soyad <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            placeholder="Soyadınız"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Telefon (read-only) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefon</Text>
          <View style={[styles.inputRow, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>{formData.phone}</Text>
            <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
          </View>
          <Text style={styles.helperText}>Telefon numarası değiştirilemez</Text>
        </View>

        {/* E-posta */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="ornek@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Doğum Tarihi */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Doğum Tarihi</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={formData.birthDate ? styles.inputText : styles.inputPlaceholder}>
              {formData.birthDate ? formatDate(formData.birthDate) : 'Seçin'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.birthDate ? new Date(formData.birthDate) : new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1920, 0, 1)}
          />
        )}

        {/* Cinsiyet */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cinsiyet</Text>
          <View style={styles.genderContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  formData.gender === option.value && styles.genderOptionSelected,
                ]}
                onPress={() => setFormData({ ...formData, gender: option.value })}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    formData.gender === option.value && styles.genderOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Adres */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Adres</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={formData.address || ''}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Tam adresiniz"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButtonContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: {
    fontSize: 16,
    color: '#1F2937',
  },
  inputPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  inputDisabledText: {
    fontSize: 16,
    color: '#6B7280',
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  genderOptionTextSelected: {
    color: '#3B82F6',
  },
  bottomSpacer: {
    height: 40,
  },
});
