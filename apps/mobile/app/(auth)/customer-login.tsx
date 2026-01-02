import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuthStore } from '../../src/store/auth.store';

const { width } = Dimensions.get('window');

export default function CustomerLoginScreen() {
  const router = useRouter();
  const { sendOtp, isLoading } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

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
    <LinearGradient
      colors={['#059669', '#10B981']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />

        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#059669" />
            </TouchableOpacity>
          </View>

          {/* Main Content Card */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person" size={32} color="#fff" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>Müşteri Girişi</Text>
              <Text style={styles.subtitle}>
                Telefon numaranıza doğrulama kodu göndereceğiz
              </Text>

              {/* Phone Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Telefon Numarası</Text>
                <View style={[
                  styles.inputWrapper,
                  isPhoneFocused && styles.inputWrapperFocused
                ]}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryFlag}>🇹🇷</Text>
                    <Text style={styles.countryCodeText}>+90</Text>
                  </View>
                  <View style={styles.inputDivider} />
                  <TextInput
                    style={styles.input}
                    placeholder="5XX XXX XX XX"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={formatDisplayPhone(phone)}
                    onChangeText={handlePhoneChange}
                    maxLength={14}
                    editable={!isLoading}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
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
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Doğrulama Kodu Gönder</Text>
                    <View style={styles.buttonIconContainer}>
                      <Ionicons name="arrow-forward" size={18} color="#059669" />
                    </View>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="shield-checkmark" size={18} color="#059669" />
                  </View>
                  <Text style={styles.infoText}>Güvenli ve şifreli bağlantı</Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="time" size={18} color="#059669" />
                  </View>
                  <Text style={styles.infoText}>Kod 2 dakika içinde gelecek</Text>
                </View>
              </View>
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              Devam ederek{' '}
              <Text style={styles.termsLink}>Kullanım Koşulları</Text> ve{' '}
              <Text style={styles.termsLink}>Gizlilik Politikası</Text>'nı kabul
              etmiş olursunuz.
            </Text>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Decorative circles
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: 150,
    left: -75,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: 100,
    right: -30,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#059669',
    backgroundColor: '#fff',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
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
  inputDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#1F2937',
    fontWeight: '500',
    letterSpacing: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  terms: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  termsLink: {
    color: '#fff',
    fontWeight: '600',
  },
});
