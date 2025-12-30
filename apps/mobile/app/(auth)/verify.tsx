import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuthStore } from '../../src/store/auth.store';
import { OTP_LENGTH, OTP_RESEND_TIMEOUT } from '../../src/constants/config';
import ErrorBottomSheet from '../../src/components/ErrorBottomSheet';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone, userType } = useLocalSearchParams<{ phone: string; userType?: string }>();
  const { verifyOtp, verifyOtpCustomer, sendOtp, isLoading } = useAuthStore();

  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(OTP_RESEND_TIMEOUT);
  const inputRef = useRef<TextInput>(null);

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

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Auto verify when code is complete
  useEffect(() => {
    if (code.length === OTP_LENGTH) {
      handleVerify(code);
    }
  }, [code]);

  const handleCodeChange = (value: string) => {
    // Only allow digits, max OTP_LENGTH
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(digits);
  };

  const handleVerify = async (verifyCode: string) => {
    if (!phone) {
      Alert.alert('Hata', 'Telefon numarası bulunamadı');
      router.back();
      return;
    }

    if (userType === 'customer') {
      const result = await verifyOtpCustomer(phone, verifyCode);

      if (result.success) {
        if (result.isNewCustomer) {
          router.replace('/onboarding/profile');
        } else {
          router.replace('/');
        }
      } else {
        setErrorMessage(result.message);
        setErrorSheetVisible(true);
        setCode('');
        inputRef.current?.focus();
      }
    } else {
      const result = await verifyOtp(phone, verifyCode);

      if (result.success) {
        if (result.needsTenantSelection) {
          router.replace('/(auth)/select-tenant');
        } else {
          router.replace('/');
        }
      } else {
        Alert.alert('Hata', result.message);
        setCode('');
        inputRef.current?.focus();
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

  // Render the masked OTP boxes
  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < OTP_LENGTH; i++) {
      const digit = code[i] || '';
      const isFilled = digit !== '';
      const isCurrentIndex = code.length === i;

      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            isFilled && styles.otpBoxFilled,
            isCurrentIndex && styles.otpBoxActive,
          ]}
        >
          <Text style={styles.otpDigit}>{digit}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
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

          {/* OTP Input with Mask */}
          <Pressable
            style={styles.otpContainer}
            onPress={() => inputRef.current?.focus()}
          >
            {renderOtpBoxes()}

            {/* Hidden actual input */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={OTP_LENGTH}
              editable={!isLoading}
              autoFocus
            />
          </Pressable>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (isLoading || code.length < OTP_LENGTH) && styles.buttonDisabled,
            ]}
            onPress={() => handleVerify(code)}
            disabled={isLoading || code.length < OTP_LENGTH}
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
      </KeyboardAwareScrollView>

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
    position: 'relative',
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpBoxFilled: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  otpBoxActive: {
    borderColor: '#3B82F6',
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 56,
    width: '100%',
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
