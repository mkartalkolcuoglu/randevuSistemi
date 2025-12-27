import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Gizlilik Politikası</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Son güncelleme: 27 Aralık 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Veri Toplama</Text>
          <Text style={styles.sectionText}>
            Net Randevu uygulaması, hizmetlerimizi sunabilmek için aşağıdaki bilgileri toplar:
            {'\n\n'}• Ad, soyad ve iletişim bilgileri
            {'\n'}• Randevu geçmişi ve tercihleri
            {'\n'}• Cihaz ve uygulama kullanım bilgileri
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Veri Kullanımı</Text>
          <Text style={styles.sectionText}>
            Toplanan veriler şu amaçlarla kullanılır:
            {'\n\n'}• Randevu hizmetlerinin sağlanması
            {'\n'}• Bildirim ve hatırlatmaların gönderilmesi
            {'\n'}• Hizmet kalitesinin iyileştirilmesi
            {'\n'}• Yasal yükümlülüklerin yerine getirilmesi
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Veri Güvenliği</Text>
          <Text style={styles.sectionText}>
            Verilerinizi korumak için endüstri standardı güvenlik önlemleri uyguluyoruz. Tüm veri transferleri SSL/TLS şifreleme ile korunmaktadır.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Üçüncü Taraflar</Text>
          <Text style={styles.sectionText}>
            Verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. SMS ve bildirim hizmetleri için güvenilir iş ortakları kullanılmaktadır.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Haklarınız</Text>
          <Text style={styles.sectionText}>
            KVKK kapsamında aşağıdaki haklara sahipsiniz:
            {'\n\n'}• Verilerinize erişim hakkı
            {'\n'}• Düzeltme ve silme hakkı
            {'\n'}• İşlemeyi durdurma hakkı
            {'\n'}• Veri taşınabilirliği hakkı
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. İletişim</Text>
          <Text style={styles.sectionText}>
            Gizlilik politikamız hakkında sorularınız için:
            {'\n\n'}E-posta: gizlilik@netrandevu.com
            {'\n'}Telefon: 0850 123 45 67
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    padding: 16,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
});
