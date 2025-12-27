import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.appName}>Net Randevu</Text>
          <Text style={styles.tagline}>Randevu yönetimi artık çok kolay</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>
            Devam etmek için giriş türünüzü seçin
          </Text>
        </View>

        {/* Login Options */}
        <View style={styles.optionsContainer}>
          {/* Business Login */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/(auth)/business-login')}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="business" size={32} color="#3B82F6" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>İşletme Girişi</Text>
              <Text style={styles.optionDescription}>
                İşletme sahibi veya personel olarak giriş yapın
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Customer Login */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => router.push('/(auth)/customer-login')}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="person" size={32} color="#059669" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Müşteri Girişi</Text>
              <Text style={styles.optionDescription}>
                Randevu almak için telefon numaranızla giriş yapın
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Henüz bir hesabınız yok mu?{' '}
            <Text style={styles.footerLink}>Bize ulaşın</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 48,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
  },
  welcomeContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
