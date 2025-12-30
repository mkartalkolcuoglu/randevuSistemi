import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';

export default function CustomerLoginScreen() {
  const router = useRouter();
  const { sendOtp, isLoading } = useAuthStore();
  const [phone, setPhone] = useState('');

  const formatPhoneNumber = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length > 11) {
      return phone;
    }
    return digits;
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhoneNumber(text));
  };

  const formatDisplayPhone = (digits: string) => {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert('Hata', 'Lütfen geçerli bir telefon numarası girin');
      return;
    }

    // Send userType: 'customer' to allow unregistered customers
    const result = await sendOtp(phone, 'customer');

    if (result.success) {
      router.push({
        pathname: '/(auth)/verify',
        params: { phone, userType: 'customer' },
      });
    } else {
      Alert.alert('Hata', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={40} color="#059669" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Müşteri Girişi</Text>
          <Text style={styles.subtitle}>
            Telefon numaranıza doğrulama kodu göndereceğiz
          </Text>

          {/* Phone Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.countryCode}>
              <Text style={styles.countryFlag}>🇹🇷</Text>
              <Text style={styles.countryCodeText}>+90</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="5XX XXX XX XX"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={formatDisplayPhone(phone)}
                onChangeText={handlePhoneChange}
                maxLength={14}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (isLoading || phone.length < 10) && styles.buttonDisabled,
            ]}
            onPress={handleSendOtp}
            disabled={isLoading || phone.length < 10}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Doğrulama Kodu Gönder</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.terms}>
            Devam ederek{' '}
            <Text style={styles.termsLink}>Kullanım Koşulları</Text> ve{' '}
            <Text style={styles.termsLink}>Gizlilik Politikası</Text>'nı kabul
            etmiş olursunuz.
          </Text>
        </View>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '500',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#059669',
  },
});
