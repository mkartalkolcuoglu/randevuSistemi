import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';

// Same key as in index.tsx to mark onboarding as shown
const ONBOARDING_SHOWN_KEY = 'onboarding_shown_v1';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const handleSave = async () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin');
      return;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Hata', 'Lütfen soyadınızı girin');
      return;
    }

    setIsLoading(true);
    try {
      // Check if user is new (isNewCustomer flag from auth)
      const isNewCustomer = user?.isNewCustomer;

      if (isNewCustomer) {
        // New customer - save profile locally, will be saved when creating first appointment
        if (user) {
          setUser({
            ...user,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
          });
        }

        // Mark onboarding as shown on this device
        await AsyncStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');

        // Navigate to new appointment screen for new customers
        router.replace('/(tabs)/customer/new-appointment');
      } else {
        // Existing customer - save to backend
        const response = await api.put('/api/mobile/customer/profile', {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        });

        if (response.data.success) {
          // Update user in store
          if (user) {
            setUser({
              ...user,
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
            });
          }

          // Mark onboarding as shown on this device
          await AsyncStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');

          // Navigate to main app
          router.replace('/(tabs)/customer');
        } else {
          Alert.alert('Hata', response.data.message || 'Bilgiler kaydedilemedi');
        }
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Bilgiler kaydedilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle" size={80} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Hoş Geldiniz!</Text>
            <Text style={styles.subtitle}>
              Size daha iyi hizmet verebilmemiz için bilgilerinizi tamamlayın
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Ad <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="Adınız"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Soyad <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Soyadınız"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText}>{user?.phone}</Text>
                <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
              </View>
              <Text style={styles.helperText}>Telefon numaranız giriş için kullanılır</Text>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>Devam Et</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.privacyText}>
              Devam ederek{' '}
              <Text style={styles.privacyLink}>Gizlilik Politikası</Text>
              {' '}ve{' '}
              <Text style={styles.privacyLink}>Kullanım Koşulları</Text>
              'nı kabul etmiş olursunuz.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  inputDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  inputDisabledText: {
    fontSize: 16,
    color: '#6B7280',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  privacyLink: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});
