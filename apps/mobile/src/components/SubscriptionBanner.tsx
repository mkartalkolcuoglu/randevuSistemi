import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';

export default function SubscriptionBanner() {
  const { user } = useAuthStore();

  if (!user || user.userType === 'customer') return null;
  if (!user.subscriptionEnd) return null;

  const endDate = new Date(user.subscriptionEnd);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Expired
  if (daysLeft <= 0) {
    return (
      <View style={[styles.banner, styles.expired]}>
        <Ionicons name="warning" size={18} color="#DC2626" />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: '#DC2626' }]}>Abonelik Süresi Doldu</Text>
          <Text style={styles.subtitle}>Hizmete devam etmek için web panelden paket yenileyin.</Text>
        </View>
      </View>
    );
  }

  // Warning: 7 days or less
  if (daysLeft <= 7) {
    return (
      <View style={[styles.banner, styles.warning]}>
        <Ionicons name="time-outline" size={18} color="#D97706" />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: '#D97706' }]}>Abonelik {daysLeft} gün sonra bitiyor</Text>
          <Text style={styles.subtitle}>Kesintisiz hizmet için paketinizi yenileyin.</Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  expired: {
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  warning: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
});
