import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import api from '../../../src/services/api';

const THEME_COLOR = '#163974';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface Stats {
  totalFeedbacks: number;
  averageRating: number;
  satisfactionRate: number;
  ratingDistribution: RatingDistribution;
}

interface StaffRating {
  name: string;
  averageRating: number;
  feedbackCount: number;
}

interface ServiceRating {
  name: string;
  averageRating: number;
  feedbackCount: number;
}

interface Feedback {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  serviceName: string;
  staffName: string;
  appointmentDate: string;
  createdAt: string;
}

interface PerformanceData {
  stats: Stats;
  staffRatings: StaffRating[];
  serviceRatings: ServiceRating[];
  recentFeedbacks: Feedback[];
}

export default function PerformanceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'services' | 'feedbacks'>('overview');

  const fetchPerformance = async () => {
    try {
      const response = await api.get('/api/mobile/feedbacks');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching performance:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPerformance();
  }, []);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Star Rating Component
  const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={size} color="#F59E0B" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={size} color="#F59E0B" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={size} color="#D1D5DB" />
        );
      }
    }

    return <View style={{ flexDirection: 'row', gap: 2 }}>{stars}</View>;
  };

  // Rating Distribution Bar
  const RatingBar = ({ rating, count, total }: { rating: number; count: number; total: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const barWidth = SCREEN_WIDTH - 140;

    return (
      <View style={styles.ratingBar}>
        <View style={styles.ratingLabel}>
          <Text style={styles.ratingNumber}>{rating}</Text>
          <Ionicons name="star" size={12} color="#F59E0B" />
        </View>
        <View style={[styles.barContainer, { width: barWidth }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${percentage}%`,
                backgroundColor: rating >= 4 ? '#10B981' : rating >= 3 ? '#F59E0B' : '#EF4444',
              },
            ]}
          />
        </View>
        <Text style={styles.ratingCount}>{count}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Performans verileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text style={styles.loadingText}>Veri yüklenemedi</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPerformance}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { stats, staffRatings, serviceRatings, recentFeedbacks } = data;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLOR]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Performans</Text>
          <Text style={styles.subtitle}>Müşteri geri bildirimleri</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Average Rating */}
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardLarge}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={24} color="#fff" />
            </View>
            <Text style={styles.statLabelWhite}>Ortalama Puan</Text>
            <View style={styles.ratingValueRow}>
              <Text style={styles.statValueLarge}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.statValueSmall}>/5</Text>
            </View>
            <StarRating rating={stats.averageRating} size={18} />
          </LinearGradient>

          <View style={styles.statsColumn}>
            {/* Total Feedbacks */}
            <LinearGradient
              colors={[THEME_COLOR, '#1e4a8f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardSmall}
            >
              <View style={styles.statRow}>
                <View style={styles.statIconSmall}>
                  <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
                </View>
                <View>
                  <Text style={styles.statValueMedium}>{stats.totalFeedbacks}</Text>
                  <Text style={styles.statLabelSmall}>Değerlendirme</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Satisfaction Rate */}
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardSmall}
            >
              <View style={styles.statRow}>
                <View style={styles.statIconSmall}>
                  <Ionicons name="happy-outline" size={18} color="#fff" />
                </View>
                <View>
                  <Text style={styles.statValueMedium}>%{stats.satisfactionRate}</Text>
                  <Text style={styles.statLabelSmall}>Memnuniyet</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {[
              { id: 'overview', label: 'Genel' },
              { id: 'staff', label: 'Personel' },
              { id: 'services', label: 'Hizmetler' },
              { id: 'feedbacks', label: 'Yorumlar' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                style={styles.tabWrapper}
              >
                {activeTab === tab.id ? (
                  <LinearGradient
                    colors={[THEME_COLOR, '#1e4a8f']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabActive}
                  >
                    <Text style={styles.tabTextActive}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabInactive}>
                    <Text style={styles.tabTextInactive}>{tab.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Puan Dağılımı</Text>
            <View style={styles.distributionCard}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={stats.ratingDistribution[rating as keyof RatingDistribution]}
                  total={stats.totalFeedbacks}
                />
              ))}
            </View>

            {/* Quick Stats */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Özet</Text>
            <View style={styles.quickStatsGrid}>
              <View style={styles.quickStatCard}>
                <View style={[styles.quickStatIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="thumbs-up" size={20} color="#059669" />
                </View>
                <Text style={styles.quickStatValue}>
                  {stats.ratingDistribution[5] + stats.ratingDistribution[4]}
                </Text>
                <Text style={styles.quickStatLabel}>Olumlu</Text>
              </View>
              <View style={styles.quickStatCard}>
                <View style={[styles.quickStatIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="hand-right" size={20} color="#D97706" />
                </View>
                <Text style={styles.quickStatValue}>{stats.ratingDistribution[3]}</Text>
                <Text style={styles.quickStatLabel}>Orta</Text>
              </View>
              <View style={styles.quickStatCard}>
                <View style={[styles.quickStatIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="thumbs-down" size={20} color="#DC2626" />
                </View>
                <Text style={styles.quickStatValue}>
                  {stats.ratingDistribution[2] + stats.ratingDistribution[1]}
                </Text>
                <Text style={styles.quickStatLabel}>Olumsuz</Text>
              </View>
            </View>
          </View>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personel Puanları</Text>
            {staffRatings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>Henüz personel değerlendirmesi yok</Text>
              </View>
            ) : (
              staffRatings.map((staff, index) => (
                <View key={index} style={styles.performanceCard}>
                  <LinearGradient
                    colors={index === 0 ? ['#F59E0B', '#D97706'] : [THEME_COLOR, '#1e4a8f']}
                    style={styles.performanceAccent}
                  />
                  <View style={styles.performanceContent}>
                    <View style={styles.performanceHeader}>
                      <View style={[styles.performanceAvatar, index === 0 && styles.topPerformerAvatar]}>
                        {index === 0 ? (
                          <Ionicons name="trophy" size={18} color="#F59E0B" />
                        ) : (
                          <Ionicons name="person" size={18} color={THEME_COLOR} />
                        )}
                      </View>
                      <View style={styles.performanceInfo}>
                        <Text style={styles.performanceName}>{staff.name}</Text>
                        <Text style={styles.performanceSubtitle}>{staff.feedbackCount} değerlendirme</Text>
                      </View>
                      <View style={styles.performanceRating}>
                        <Text style={[styles.ratingValue, index === 0 && styles.topRatingValue]}>
                          {staff.averageRating.toFixed(1)}
                        </Text>
                        <StarRating rating={staff.averageRating} size={12} />
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hizmet Puanları</Text>
            {serviceRatings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cut-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>Henüz hizmet değerlendirmesi yok</Text>
              </View>
            ) : (
              serviceRatings.map((service, index) => (
                <View key={index} style={styles.performanceCard}>
                  <LinearGradient
                    colors={index === 0 ? ['#10B981', '#059669'] : [THEME_COLOR, '#1e4a8f']}
                    style={styles.performanceAccent}
                  />
                  <View style={styles.performanceContent}>
                    <View style={styles.performanceHeader}>
                      <View style={[styles.performanceAvatar, index === 0 && styles.topServiceAvatar]}>
                        {index === 0 ? (
                          <Ionicons name="ribbon" size={18} color="#10B981" />
                        ) : (
                          <Ionicons name="cut" size={18} color={THEME_COLOR} />
                        )}
                      </View>
                      <View style={styles.performanceInfo}>
                        <Text style={styles.performanceName}>{service.name}</Text>
                        <Text style={styles.performanceSubtitle}>{service.feedbackCount} değerlendirme</Text>
                      </View>
                      <View style={styles.performanceRating}>
                        <Text style={[styles.ratingValue, index === 0 && styles.topServiceRatingValue]}>
                          {service.averageRating.toFixed(1)}
                        </Text>
                        <StarRating rating={service.averageRating} size={12} />
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Feedbacks Tab */}
        {activeTab === 'feedbacks' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Son Yorumlar</Text>
            {recentFeedbacks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>Henüz yorum yok</Text>
              </View>
            ) : (
              recentFeedbacks.map((feedback) => (
                <View key={feedback.id} style={styles.feedbackCard}>
                  <View style={styles.feedbackHeader}>
                    <View style={styles.feedbackAvatar}>
                      <Text style={styles.avatarText}>
                        {feedback.customerName?.charAt(0)?.toUpperCase() || 'M'}
                      </Text>
                    </View>
                    <View style={styles.feedbackInfo}>
                      <Text style={styles.feedbackName}>{feedback.customerName}</Text>
                      <Text style={styles.feedbackMeta}>
                        {feedback.serviceName} • {feedback.staffName}
                      </Text>
                    </View>
                    <View style={styles.feedbackRating}>
                      <StarRating rating={feedback.rating} size={14} />
                    </View>
                  </View>
                  {feedback.comment && (
                    <Text style={styles.feedbackComment}>"{feedback.comment}"</Text>
                  )}
                  <View style={styles.feedbackFooter}>
                    <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                    <Text style={styles.feedbackDate}>
                      {formatDate(feedback.appointmentDate)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: THEME_COLOR,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  statCardLarge: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
  },
  statsColumn: {
    flex: 1,
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabelWhite: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  statLabelSmall: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  statValueLarge: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 2,
  },
  statValueMedium: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },

  // Tabs
  tabContainer: {
    marginTop: 20,
  },
  tabScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabWrapper: {
    marginRight: 8,
  },
  tabActive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabInactive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tabTextInactive: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Section
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },

  // Rating Distribution
  distributionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 30,
    gap: 2,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratingCount: {
    width: 30,
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'right',
  },

  // Quick Stats
  quickStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Performance Cards
  performanceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  performanceAccent: {
    width: 4,
  },
  performanceContent: {
    flex: 1,
    padding: 14,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topPerformerAvatar: {
    backgroundColor: '#FEF3C7',
  },
  topServiceAvatar: {
    backgroundColor: '#D1FAE5',
  },
  performanceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  performanceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  performanceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  performanceRating: {
    alignItems: 'flex-end',
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  topRatingValue: {
    color: '#F59E0B',
  },
  topServiceRatingValue: {
    color: '#10B981',
  },

  // Feedback Cards
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  feedbackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  feedbackName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  feedbackMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  feedbackRating: {
    marginLeft: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 20,
  },
  feedbackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
