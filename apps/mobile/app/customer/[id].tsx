import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  notes?: string;
  status: string;
  isBlacklisted: boolean;
  noShowCount: number;
  createdAt: string;
  stats?: {
    totalAppointments: number;
    totalSpent: number;
    lastVisit?: string;
  };
}

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await api.get(`/api/customers/${id}`);
      setCustomer(response.data.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (customer?.phone) {
      const phone = customer.phone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=90${phone}`);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Müşteri Detayı</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Müşteri bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Müşteri Detayı</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
            </Text>
          </View>
          <Text style={styles.customerName}>{customer.firstName} {customer.lastName}</Text>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, customer.status === 'active' ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={[styles.statusText, customer.status === 'active' ? styles.activeText : styles.inactiveText]}>
                {customer.status === 'active' ? 'Aktif' : 'Pasif'}
              </Text>
            </View>
            {customer.isBlacklisted && (
              <View style={styles.blacklistBadge}>
                <Ionicons name="warning" size={12} color="#DC2626" />
                <Text style={styles.blacklistText}>Kara Liste</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.whatsappButton]} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{customer.stats?.totalAppointments || 0}</Text>
            <Text style={styles.statLabel}>Randevu</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₺{customer.stats?.totalSpent || 0}</Text>
            <Text style={styles.statLabel}>Harcama</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, customer.noShowCount > 0 && { color: '#F59E0B' }]}>
              {customer.noShowCount}
            </Text>
            <Text style={styles.statLabel}>Gelmedi</Text>
          </View>
        </View>

        {/* Contact Info */}
        <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <Text style={styles.infoLabel}>Telefon</Text>
            <Text style={styles.infoValue}>{customer.phone}</Text>
          </View>
          {customer.email && (
            <View style={[styles.infoRow, styles.infoBorder]}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>E-posta</Text>
              <Text style={styles.infoValue}>{customer.email}</Text>
            </View>
          )}
          {customer.address && (
            <View style={[styles.infoRow, styles.infoBorder]}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Adres</Text>
              <Text style={styles.infoValue}>{customer.address}</Text>
            </View>
          )}
          {customer.birthDate && (
            <View style={[styles.infoRow, styles.infoBorder]}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Doğum Tarihi</Text>
              <Text style={styles.infoValue}>{customer.birthDate}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {customer.notes && (
          <>
            <Text style={styles.sectionTitle}>Notlar</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{customer.notes}</Text>
            </View>
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/appointment/new')}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionText}>Randevu Oluştur</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="time-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionText}>Randevu Geçmişi</Text>
          </TouchableOpacity>
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
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  customerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#DC2626',
  },
  blacklistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  blacklistText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
});
