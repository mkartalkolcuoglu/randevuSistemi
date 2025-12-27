import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Hakkında</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="calendar" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>Net Randevu</Text>
          <Text style={styles.version}>Versiyon 1.0.0</Text>
        </View>

        <Text style={styles.description}>
          Net Randevu, işletmeler için geliştirilmiş profesyonel randevu yönetim sistemidir.
          Müşterilerinizin kolayca randevu almasını sağlar, personel yönetimi ve kasa takibi
          gibi tüm işletme ihtiyaçlarınızı tek bir platformda çözer.
        </Text>

        <View style={styles.linksCard}>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Linking.openURL('https://netrandevu.com')}
          >
            <Ionicons name="globe-outline" size={20} color="#3B82F6" />
            <Text style={styles.linkText}>Web Sitesi</Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkItem, styles.linkBorder]}
            onPress={() => Linking.openURL('https://instagram.com/netrandevu')}
          >
            <Ionicons name="logo-instagram" size={20} color="#E4405F" />
            <Text style={styles.linkText}>Instagram</Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkItem, styles.linkBorder]}
            onPress={() => Linking.openURL('https://twitter.com/netrandevu')}
          >
            <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
            <Text style={styles.linkText}>Twitter</Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Geliştirici</Text>
          <Text style={styles.infoText}>Net Randevu Teknoloji A.Ş.</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>İletişim</Text>
          <Text style={styles.infoText}>info@netrandevu.com</Text>
        </View>

        <Text style={styles.copyright}>
          © 2024 Net Randevu. Tüm hakları saklıdır.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  version: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  linksCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  linkBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 12,
  },
  infoSection: {
    width: '100%',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    color: '#1F2937',
  },
  copyright: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 24,
    marginBottom: 40,
  },
});
