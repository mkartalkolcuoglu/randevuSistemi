import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const router = useRouter();

  const helpItems = [
    {
      icon: 'chatbubbles-outline',
      label: 'Canlı Destek',
      description: 'Müşteri hizmetleri ile görüşün',
      action: () => {},
    },
    {
      icon: 'mail-outline',
      label: 'E-posta Gönder',
      description: 'destek@netrandevu.com',
      action: () => Linking.openURL('mailto:destek@netrandevu.com'),
    },
    {
      icon: 'call-outline',
      label: 'Telefon',
      description: '0850 123 45 67',
      action: () => Linking.openURL('tel:08501234567'),
    },
    {
      icon: 'book-outline',
      label: 'SSS',
      description: 'Sıkça sorulan sorular',
      action: () => {},
    },
    {
      icon: 'videocam-outline',
      label: 'Video Eğitimler',
      description: 'Uygulama kullanım rehberi',
      action: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Yardım & Destek</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          {helpItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, index < helpItems.length - 1 && styles.menuBorder]}
              onPress={item.action}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={22} color="#3B82F6" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.infoText}>
          7/24 destek hattımızdan bize ulaşabilirsiniz. En kısa sürede size yardımcı olmaktan mutluluk duyarız.
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
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInfo: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});
