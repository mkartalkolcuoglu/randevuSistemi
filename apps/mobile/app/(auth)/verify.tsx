import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { OTP_LENGTH, OTP_RESEND_TIMEOUT } from '../../src/constants/config';
import ErrorBottomSheet from '../../src/components/ErrorBottomSheet';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone, userType } = useLocalSearchParams<{ phone: string; userType?: string }>();
  const { verifyOtp, verifyOtpCustomer, sendOtp, isLoading } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(OTP_RESEND_TIMEOUT);
  const inputRefs = useRef<TextInput[]>([]);

  // Error bottom sheet state
  const [errorSheetVisible, setErrorSheetVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste (multiple digits)
    if (value.length > 1) {
      const digits = value.split('').slice(0, OTP_LENGTH);
      digits.forEach((digit, i) => {
        if (i < OTP_LENGTH) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus last filled input or verify if complete
      const lastIndex = Math.min(digits.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();

      if (digits.length >= OTP_LENGTH) {
        handleVerify(newOtp.join(''));
      }
      return;
    }

    // Single digit
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when complete
    if (value && index === OTP_LENGTH - 1) {
      const code = newOtp.join('');
      if (code.length === OTP_LENGTH) {
        handleVerify(code);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    if (!phone) {
      Alert.alert('Hata', 'Telefon numarası bulunamadı');
      router.back();
      return;
    }

    // Use different verification based on userType
    if (userType === 'customer') {
      // Customer login - no tenant selection
      const result = await verifyOtpCustomer(phone, code);

      if (result.success) {
        // Check if this is a new customer
        if (result.isNewCustomer) {
          // New customer - redirect to onboarding
          router.replace('/onboarding/profile');
        } else {
          // Existing customer - go to main app
          router.replace('/');
        }
      } else {
        // Show error in bottom sheet for customer login errors
        setErrorMessage(result.message);
        setErrorSheetVisible(true);
        setOtp(new Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } else {
      // Business login (staff/owner) - may need tenant selection
      const result = await verifyOtp(phone, code);

      if (result.success) {
        if (result.needsTenantSelection) {
          router.replace('/(auth)/select-tenant');
        } else {
          router.replace('/');
        }
      } else {
        Alert.alert('Hata', result.message);
        setOtp(new Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !phone) return;

    const result = await sendOtp(phone);
    if (result.success) {
      setResendTimer(OTP_RESEND_TIMEOUT);
      Alert.alert('Başarılı', 'Kod tekrar gönderildi');
    } else {
      Alert.alert('Hata', result.message);
    }
  };

  const formatPhone = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return `+90 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    return `+90 ${phoneNumber}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>← Geri</Text>
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.title}>Doğrulama Kodu</Text>
              <Text style={styles.subtitle}>
                <Text style={styles.phoneNumber}>{formatPhone(phone || '')}</Text>
                {'\n'}numarasına gönderilen 6 haneli kodu girin
              </Text>

              {/* OTP Input */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={index === 0 ? OTP_LENGTH : 1}
                    editable={!isLoading}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  (isLoading || otp.join('').length < OTP_LENGTH) &&
                    styles.buttonDisabled,
                ]}
                onPress={() => handleVerify(otp.join(''))}
                disabled={isLoading || otp.join('').length < OTP_LENGTH}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Doğrulanıyor...' : 'Doğrula'}
                </Text>
              </TouchableOpacity>

              {/* Resend */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Kod gelmedi mi? </Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      resendTimer > 0 && styles.resendLinkDisabled,
                    ]}
                  >
                    {resendTimer > 0 ? `Tekrar gönder (${resendTimer}s)` : 'Tekrar gönder'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Error Bottom Sheet */}
      <ErrorBottomSheet
        visible={errorSheetVisible}
        onClose={() => setErrorSheetVisible(false)}
        title="Giriş Başarısız"
        message={errorMessage}
        icon="person-remove"
        iconColor="#EF4444"
        primaryButtonText="Tekrar Dene"
        secondaryButtonText="Geri Dön"
        secondaryButtonAction={() => router.back()}
      />
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
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 32,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
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
    lineHeight: 24,
    marginBottom: 40,
  },
  phoneNumber: {
    fontWeight: '600',
    color: '#1F2937',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1F2937',
  },
  otpInputFilled: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#9CA3AF',
  },
});
