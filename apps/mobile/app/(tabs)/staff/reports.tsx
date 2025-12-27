import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Circle, Text as SvgText, G, Line, Path } from 'react-native-svg';
import api from '../../../src/services/api';

const THEME_COLOR = '#163974';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface KpiMetric {
  value: number;
  previousValue: number;
  change: number;
  isPositive: boolean;
}

interface KpiSummary {
  monthlyRevenue: KpiMetric;
  monthlyAppointments: KpiMetric;
  newCustomers: KpiMetric;
  averageBookingValue: KpiMetric;
}

interface RevenueTrendItem {
  month: string;
  revenue: number;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

interface ServiceStats {
  name: string;
  appointments: number;
  revenue: number;
  averageRevenue: number;
}

interface StaffPerformance {
  name: string;
  completedAppointments: number;
  revenue: number;
  averageValue: number;
}

interface ReportsData {
  kpiSummary: KpiSummary;
  revenueTrend: RevenueTrendItem[];
  appointmentStatusDistribution: StatusDistribution[];
  topServices: ServiceStats[];
  staffPerformance: StaffPerformance[];
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    totalRevenue: number;
    servicesCount: number;
    staffCount: number;
  };
}

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ReportsData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'staff'>('overview');

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/mobile/reports');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error?.response?.data || error.message);
      Alert.alert('Hata', 'Raporlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = async () => {
    if (!data) return;

    const { kpiSummary, topServices, staffPerformance } = data;

    let csvContent = 'Net Randevu - Performans Raporu\n';
    csvContent += `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}\n\n`;

    csvContent += '=== ÖZET İSTATİSTİKLER ===\n';
    csvContent += `Aylık Gelir: ${formatCurrency(kpiSummary.monthlyRevenue.value)} (${kpiSummary.monthlyRevenue.change >= 0 ? '+' : ''}${kpiSummary.monthlyRevenue.change}%)\n`;
    csvContent += `Aylık Randevu: ${kpiSummary.monthlyAppointments.value} (${kpiSummary.monthlyAppointments.change >= 0 ? '+' : ''}${kpiSummary.monthlyAppointments.change}%)\n`;
    csvContent += `Yeni Müşteri: ${kpiSummary.newCustomers.value} (${kpiSummary.newCustomers.change >= 0 ? '+' : ''}${kpiSummary.newCustomers.change}%)\n`;
    csvContent += `Ortalama Değer: ${formatCurrency(kpiSummary.averageBookingValue.value)} (${kpiSummary.averageBookingValue.change >= 0 ? '+' : ''}${kpiSummary.averageBookingValue.change}%)\n\n`;

    csvContent += '=== EN POPÜLER HİZMETLER ===\n';
    csvContent += 'Hizmet,Randevu Sayısı,Toplam Gelir,Ortalama Gelir\n';
    topServices.forEach(s => {
      csvContent += `${s.name},${s.appointments},${formatCurrency(s.revenue)},${formatCurrency(s.averageRevenue)}\n`;
    });
    csvContent += '\n';

    csvContent += '=== PERSONEL PERFORMANSI ===\n';
    csvContent += 'Personel,Tamamlanan Randevu,Toplam Gelir,Ortalama Değer\n';
    staffPerformance.forEach(s => {
      csvContent += `${s.name},${s.completedAppointments},${formatCurrency(s.revenue)},${formatCurrency(s.averageValue)}\n`;
    });

    try {
      await Share.share({
        message: csvContent,
        title: `Rapor_${new Date().toISOString().split('T')[0]}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Simple Bar Chart Component
  const BarChart = ({ data: chartData, height = 200 }: { data: RevenueTrendItem[]; height?: number }) => {
    if (!chartData || chartData.length === 0) return null;

    const maxValue = Math.max(...chartData.map(d => d.revenue), 1);
    const barWidth = (SCREEN_WIDTH - 80) / chartData.length - 8;
    const chartHeight = height - 40;

    return (
      <View style={styles.chartContainer}>
        <Svg width={SCREEN_WIDTH - 48} height={height}>
          {/* Y-axis labels */}
          <SvgText x={5} y={15} fontSize={10} fill="#9CA3AF">
            {formatCurrency(maxValue)}
          </SvgText>
          <SvgText x={5} y={chartHeight / 2 + 10} fontSize={10} fill="#9CA3AF">
            {formatCurrency(maxValue / 2)}
          </SvgText>
          <SvgText x={5} y={chartHeight + 5} fontSize={10} fill="#9CA3AF">
            ₺0
          </SvgText>

          {/* Grid lines */}
          <Line x1={40} y1={10} x2={SCREEN_WIDTH - 60} y2={10} stroke="#E5E7EB" strokeWidth={1} />
          <Line x1={40} y1={chartHeight / 2 + 5} x2={SCREEN_WIDTH - 60} y2={chartHeight / 2 + 5} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4,4" />
          <Line x1={40} y1={chartHeight} x2={SCREEN_WIDTH - 60} y2={chartHeight} stroke="#E5E7EB" strokeWidth={1} />

          {/* Bars */}
          {chartData.map((item, index) => {
            const barHeight = (item.revenue / maxValue) * (chartHeight - 20);
            const x = 50 + index * (barWidth + 8);
            const y = chartHeight - barHeight;

            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={THEME_COLOR}
                  opacity={0.8}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 5}
                  fontSize={10}
                  fill="#6B7280"
                  textAnchor="middle"
                >
                  {item.month}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  // Simple Pie Chart Component
  const PieChart = ({ data: chartData, size = 140 }: { data: StatusDistribution[]; size?: number }) => {
    if (!chartData || chartData.length === 0) return null;

    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;

    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    let currentAngle = -90;

    const getArcPath = (startAngle: number, endAngle: number, r: number) => {
      const start = {
        x: centerX + r * Math.cos((startAngle * Math.PI) / 180),
        y: centerY + r * Math.sin((startAngle * Math.PI) / 180),
      };
      const end = {
        x: centerX + r * Math.cos((endAngle * Math.PI) / 180),
        y: centerY + r * Math.sin((endAngle * Math.PI) / 180),
      };
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

      return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
    };

    return (
      <View style={styles.pieContainer}>
        <Svg width={size} height={size}>
          {chartData.map((item, index) => {
            const angle = (item.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            return (
              <Path
                key={index}
                d={getArcPath(startAngle, endAngle, radius)}
                fill={item.color}
              />
            );
          })}
          {/* Center circle for donut effect */}
          <Circle cx={centerX} cy={centerY} r={radius * 0.5} fill="#fff" />
        </Svg>
        <View style={styles.pieLegend}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.name}</Text>
              <Text style={styles.legendValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // KPI Card Component
  const KpiCard = ({
    title,
    value,
    change,
    isPositive,
    icon,
    color,
    isCurrency = false,
  }: {
    title: string;
    value: number;
    change: number;
    isPositive: boolean;
    icon: string;
    color: string;
    isCurrency?: boolean;
  }) => (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>
        {isCurrency ? formatCurrency(value) : value.toLocaleString('tr-TR')}
      </Text>
      <View style={[styles.kpiChange, { backgroundColor: isPositive ? '#D1FAE5' : '#FEE2E2' }]}>
        <Ionicons
          name={isPositive ? 'trending-up' : 'trending-down'}
          size={12}
          color={isPositive ? '#059669' : '#DC2626'}
        />
        <Text style={[styles.kpiChangeText, { color: isPositive ? '#059669' : '#DC2626' }]}>
          {change >= 0 ? '+' : ''}{change}%
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Raporlar yükleniyor...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { kpiSummary, revenueTrend, appointmentStatusDistribution, topServices, staffPerformance } = data;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_COLOR]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Raporlar</Text>
            <Text style={styles.subtitle}>İşletme performans analizi</Text>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Ionicons name="share-outline" size={20} color={THEME_COLOR} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {[
              { id: 'overview', label: 'Genel Bakış' },
              { id: 'services', label: 'Hizmetler' },
              { id: 'staff', label: 'Personel' },
            ].map(tab => (
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
          <>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <KpiCard
                title="Aylık Gelir"
                value={kpiSummary.monthlyRevenue.value}
                change={kpiSummary.monthlyRevenue.change}
                isPositive={kpiSummary.monthlyRevenue.isPositive}
                icon="wallet-outline"
                color="#059669"
                isCurrency
              />
              <KpiCard
                title="Randevular"
                value={kpiSummary.monthlyAppointments.value}
                change={kpiSummary.monthlyAppointments.change}
                isPositive={kpiSummary.monthlyAppointments.isPositive}
                icon="calendar-outline"
                color="#3B82F6"
              />
              <KpiCard
                title="Yeni Müşteri"
                value={kpiSummary.newCustomers.value}
                change={kpiSummary.newCustomers.change}
                isPositive={kpiSummary.newCustomers.isPositive}
                icon="people-outline"
                color="#8B5CF6"
              />
              <KpiCard
                title="Ort. Değer"
                value={kpiSummary.averageBookingValue.value}
                change={kpiSummary.averageBookingValue.change}
                isPositive={kpiSummary.averageBookingValue.isPositive}
                icon="analytics-outline"
                color="#F59E0B"
                isCurrency
              />
            </View>

            {/* Revenue Trend Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Son 6 Ay Gelir Trendi</Text>
              <View style={styles.chartCard}>
                <BarChart data={revenueTrend} />
              </View>
            </View>

            {/* Appointment Status Distribution */}
            {appointmentStatusDistribution.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Randevu Durumları</Text>
                <View style={styles.chartCard}>
                  <PieChart data={appointmentStatusDistribution} />
                </View>
              </View>
            )}
          </>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En Popüler Hizmetler</Text>
            {topServices.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cut-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>Henüz hizmet verisi yok</Text>
              </View>
            ) : (
              topServices.map((service, index) => (
                <View key={index} style={styles.listCard}>
                  <LinearGradient
                    colors={[THEME_COLOR, '#1e4a8f']}
                    style={styles.listAccent}
                  />
                  <View style={styles.listContent}>
                    <View style={styles.listHeader}>
                      <View style={styles.listRank}>
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listTitle}>{service.name}</Text>
                        <Text style={styles.listSubtitle}>
                          {service.appointments} randevu
                        </Text>
                      </View>
                    </View>
                    <View style={styles.listStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Toplam</Text>
                        <Text style={styles.statValue}>{formatCurrency(service.revenue)}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Ortalama</Text>
                        <Text style={styles.statValue}>{formatCurrency(service.averageRevenue)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personel Performansı</Text>
            {staffPerformance.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>Henüz personel verisi yok</Text>
              </View>
            ) : (
              staffPerformance.map((staff, index) => (
                <View key={index} style={styles.listCard}>
                  <LinearGradient
                    colors={index === 0 ? ['#F59E0B', '#D97706'] : [THEME_COLOR, '#1e4a8f']}
                    style={styles.listAccent}
                  />
                  <View style={styles.listContent}>
                    <View style={styles.listHeader}>
                      <View style={[styles.staffAvatar, index === 0 && styles.topPerformer]}>
                        <Ionicons
                          name={index === 0 ? 'trophy' : 'person'}
                          size={18}
                          color={index === 0 ? '#F59E0B' : THEME_COLOR}
                        />
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listTitle}>{staff.name}</Text>
                        <Text style={styles.listSubtitle}>
                          {staff.completedAppointments} tamamlanan randevu
                        </Text>
                      </View>
                    </View>
                    <View style={styles.listStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Toplam Gelir</Text>
                        <Text style={[styles.statValue, index === 0 && styles.topValue]}>
                          {formatCurrency(staff.revenue)}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Ort. Değer</Text>
                        <Text style={styles.statValue}>{formatCurrency(staff.averageValue)}</Text>
                      </View>
                    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabContainer: {
    marginTop: 12,
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

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  kpiCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  kpiChange: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  kpiChangeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },

  // Chart Container
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Pie Chart
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  pieLegend: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },

  // List Cards
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listAccent: {
    width: 4,
  },
  listContent: {
    flex: 1,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listRank: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME_COLOR,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  listStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 24,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Staff specific
  staffAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topPerformer: {
    backgroundColor: '#FEF3C7',
  },
  topValue: {
    color: '#F59E0B',
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
