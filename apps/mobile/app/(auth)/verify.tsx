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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Theme colors based on userType
  const isCustomer = userType === 'customer';
  const themeColors = isCustomer
    ? { primary: '#059669', secondary: '#10B981', gradient: ['#059669', '#10B981'] as const }
    : { primary: '#667eea', secondary: '#764ba2', gradient: ['#667eea', '#764ba2'] as const };

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
            isFilled && [styles.otpBoxFilled, { borderColor: themeColors.primary, backgroundColor: isCustomer ? '#ECFDF5' : '#EEF2FF' }],
            isCurrentIndex && [styles.otpBoxActive, { borderColor: themeColors.primary }],
          ]}
        >
          <Text style={styles.otpDigit}>{digit}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <LinearGradient
      colors={themeColors.gradient}
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
              <Ionicons name="arrow-back" size={24} color={themeColors.primary} />
            </TouchableOpacity>
          </View>

          {/* Main Content Card */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: themeColors.primary }]}>
                  <Ionicons name="keypad" size={32} color="#fff" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>Doğrulama Kodu</Text>
              <Text style={styles.subtitle}>
                <Text style={[styles.phoneNumber, { color: themeColors.primary }]}>{formatPhone(phone || '')}</Text>
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
                  { backgroundColor: themeColors.primary },
                  (isLoading || code.length < OTP_LENGTH) && styles.buttonDisabled,
                ]}
                onPress={() => handleVerify(code)}
                disabled={isLoading || code.length < OTP_LENGTH}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Doğrula</Text>
                    <View style={styles.buttonIconContainer}>
                      <Ionicons name="checkmark" size={18} color={themeColors.primary} />
                    </View>
                  </>
                )}
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
                      { color: themeColors.primary },
                      resendTimer > 0 && styles.resendLinkDisabled,
                    ]}
                  >
                    {resendTimer > 0 ? `Tekrar gönder (${resendTimer}s)` : 'Tekrar gönder'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <View style={[styles.infoIconContainer, { backgroundColor: isCustomer ? '#ECFDF5' : '#EEF2FF' }]}>
                    <Ionicons name="mail" size={18} color={themeColors.primary} />
                  </View>
                  <Text style={styles.infoText}>SMS ile gönderildi</Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={[styles.infoIconContainer, { backgroundColor: isCustomer ? '#ECFDF5' : '#EEF2FF' }]}>
                    <Ionicons name="timer" size={18} color={themeColors.primary} />
                  </View>
                  <Text style={styles.infoText}>Kod 5 dakika geçerli</Text>
                </View>
              </View>
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
    justifyContent: 'center',
    alignItems: 'center',
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
  phoneNumber: {
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    position: 'relative',
  },
  otpBox: {
    width: 46,
    height: 54,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  otpBoxFilled: {
    borderWidth: 2,
  },
  otpBoxActive: {
    borderWidth: 2,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 54,
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#9CA3AF',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
