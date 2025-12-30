import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />

      {/* Decorative Circles */}
      <View style={[styles.decorativeCircle, styles.circle1]} />
      <View style={[styles.decorativeCircle, styles.circle2]} />
      <View style={[styles.decorativeCircle, styles.circle3]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Ionicons name="calendar" size={48} color="#667eea" />
              </View>
            </View>
            <Text style={styles.appName}>Net Randevu</Text>
            <Text style={styles.tagline}>Profesyonel Randevu Yönetimi</Text>
          </View>

          {/* Cards Section */}
          <View style={styles.cardsSection}>
            {/* Business Login Card */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/(auth)/business-login')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardIconContainer}>
                  <Ionicons name="business" size={32} color="#fff" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>İşletme Girişi</Text>
                  <Text style={styles.cardDescription}>
                    İşletme sahibi veya personel olarak giriş yapın
                  </Text>
                </View>
                <View style={styles.cardArrow}>
                  <Ionicons name="arrow-forward" size={24} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Customer Login Card */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/(auth)/customer-login')}
              activeOpacity={0.9}
            >
              <View style={styles.cardLight}>
                <View style={[styles.cardIconContainer, styles.cardIconLight]}>
                  <Ionicons name="person" size={32} color="#667eea" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, styles.cardTitleDark]}>Müşteri Girişi</Text>
                  <Text style={[styles.cardDescription, styles.cardDescriptionDark]}>
                    Randevularınızı görüntüleyin ve yönetin
                  </Text>
                </View>
                <View style={styles.cardArrow}>
                  <Ionicons name="arrow-forward" size={24} color="#667eea" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Henüz hesabınız yok mu?
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://netrandevu.com/register')}>
              <Text style={styles.footerLink}>İletişime Geçin</Text>
            </TouchableOpacity>
          </View>

          {/* Version */}
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.3,
    right: -width * 0.2,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.1,
    left: -width * 0.3,
  },
  circle3: {
    width: width * 0.4,
    height: width * 0.4,
    bottom: -width * 0.1,
    right: -width * 0.1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontWeight: '500',
  },
  cardsSection: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  cardLight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconLight: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardTitleDark: {
    color: '#1a1a2e',
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  cardDescriptionDark: {
    color: '#6b7280',
  },
  cardArrow: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footerLink: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 24,
  },
});
