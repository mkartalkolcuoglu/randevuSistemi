import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import api from '../../../src/services/api';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Params from navigation
  const tenantId = params.tenantId as string;
  const serviceId = params.serviceId as string;
  const serviceName = params.serviceName as string;
  const amount = parseFloat(params.amount as string);

  useEffect(() => {
    if (tenantId && serviceName && amount) {
      initiatePayment();
    } else {
      setError('Ödeme bilgileri eksik');
      setIsLoading(false);
    }
  }, []);

  const initiatePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('💳 Initiating payment:', { tenantId, serviceId, serviceName, amount, appointmentData: params.appointmentData });

      const response = await api.post('/api/mobile/payment/initiate', {
        tenantId,
        serviceId,
        serviceName,
        amount,
        appointmentData: params.appointmentData ? JSON.parse(params.appointmentData as string) : null
      });

      console.log('💳 Payment initiate response:', response.data);

      if (response.data.success && response.data.data?.paymentUrl) {
        setPaymentUrl(response.data.data.paymentUrl);
      } else {
        setError(response.data.message || 'Ödeme başlatılamadı');
      }
    } catch (err: any) {
      console.error('Payment initiate error:', err);
      setError(err.response?.data?.message || 'Ödeme başlatılırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigationChange = (navState: any) => {
    const { url } = navState;
    console.log('🔗 WebView navigating to:', url);

    // Deep link kontrolü
    if (url.startsWith('netrandevu://')) {
      // Deep link yakalandı - ödeme tamamlandı veya başarısız
      if (url.includes('/success') || url.includes('success')) {
        Alert.alert(
          'Ödeme Başarılı',
          'Ödemeniz başarıyla alındı! Randevularınız sayfasına yönlendiriliyorsunuz.',
          [{ text: 'Randevularıma Git', onPress: () => router.replace('/(tabs)/customer') }]
        );
      } else if (url.includes('/failed') || url.includes('failed')) {
        Alert.alert(
          'Ödeme Başarısız',
          'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.',
          [{ text: 'Tamam', onPress: () => router.back() }]
        );
      }
      return false; // WebView'da bu URL'i açma
    }

    // Ödeme başarı sayfası URL kontrolü (callback URL)
    if (url.includes('/api/mobile/payment/callback') && url.includes('status=success')) {
      console.log('✅ Payment success callback detected');
      // 3 saniye sonra otomatik yönlendir (HTML sayfası yüklendikten sonra)
      setTimeout(() => {
        Alert.alert(
          'Ödeme Başarılı',
          'Ödemeniz başarıyla alındı! Randevularınız sayfasına yönlendiriliyorsunuz.',
          [{ text: 'Randevularıma Git', onPress: () => router.replace('/(tabs)/customer') }]
        );
      }, 1500);
    }

    return true;
  };

  const handleShouldStartLoad = (event: any) => {
    const { url } = event;
    console.log('🔗 WebView shouldStartLoad:', url);

    // Deep link kontrolü
    if (url.startsWith('netrandevu://')) {
      console.log('📱 Deep link detected, redirecting to appointments...');
      // Deep link'i açmaya çalışma, doğrudan randevular sayfasına git
      if (url.includes('success')) {
        Alert.alert(
          'Ödeme Başarılı',
          'Ödemeniz başarıyla alındı! Randevularınız sayfasına yönlendiriliyorsunuz.',
          [{ text: 'Randevularıma Git', onPress: () => router.replace('/(tabs)/customer') }]
        );
      } else {
        Alert.alert(
          'Ödeme Başarısız',
          'Ödeme işlemi tamamlanamadı.',
          [{ text: 'Tamam', onPress: () => router.back() }]
        );
      }
      return false;
    }

    return true;
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setError('Ödeme sayfası yüklenemedi');
  };

  // WebView'dan gelen mesajları işle (postMessage)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📱 WebView message received:', data);

      if (data.type === 'PAYMENT_SUCCESS') {
        Alert.alert(
          'Ödeme Başarılı',
          'Ödemeniz başarıyla alındı! Randevularınız sayfasına yönlendiriliyorsunuz.',
          [{ text: 'Randevularıma Git', onPress: () => router.replace('/(tabs)/customer') }]
        );
      } else if (data.type === 'PAYMENT_FAILED') {
        Alert.alert(
          'Ödeme Başarısız',
          'Ödeme işlemi tamamlanamadı.',
          [{ text: 'Tamam', onPress: () => router.back() }]
        );
      }
    } catch (e) {
      console.log('📱 WebView message (non-JSON):', event.nativeEvent.data);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Ödeme sayfası hazırlanıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ödeme</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initiatePayment}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Ödemeyi İptal Et',
            'Ödeme işlemini iptal etmek istediğinize emin misiniz?',
            [
              { text: 'Hayır', style: 'cancel' },
              { text: 'Evet, İptal Et', style: 'destructive', onPress: () => router.back() }
            ]
          );
        }}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Güvenli Ödeme</Text>
        <View style={styles.secureIcon}>
          <Ionicons name="lock-closed" size={18} color="#059669" />
        </View>
      </View>

      <View style={styles.paymentInfo}>
        <Text style={styles.paymentInfoText}>
          {serviceName} - <Text style={styles.paymentAmount}>{amount} ₺</Text>
        </Text>
      </View>

      {paymentUrl && (
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onError={handleWebViewError}
          onMessage={handleWebViewMessage}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  secureIcon: {
    backgroundColor: '#ECFDF5',
    padding: 6,
    borderRadius: 20,
  },
  paymentInfo: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  paymentAmount: {
    fontWeight: '700',
    color: '#059669',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
