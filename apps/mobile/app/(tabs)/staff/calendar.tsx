import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { useAuthStore } from '../../../src/store/auth.store';
import api from '../../../src/services/api';
import { appointmentService } from '../../../src/services/appointment.service';
import { notificationService } from '../../../src/services/notification.service';
import { Appointment } from '../../../src/types';
import { getServiceColor } from '../../../src/constants/service-colors';
import DrawerMenu from '../../../src/components/DrawerMenu';
import Header from '../../../src/components/Header';

// Map JS Date.getDay() (0=Sun) to working hours day key
const DAY_KEY_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

interface StaffWorkingHours {
  [day: string]: { start: string; end: string; closed: boolean };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 48) / 7;

// Time-grid constants
const TIME_LABEL_WIDTH = 50;
const HOUR_HEIGHT = 120; // pixels per hour (fixed)
const STAFF_HEADER_HEIGHT = 40;
const DEFAULT_INTERVAL = 30; // default appointment interval in minutes
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 21;

// Staff header colors (matching reference design)
const STAFF_COLORS: [string, string][] = [
  ['#DC2626', '#B91C1C'],  // Red
  ['#78716C', '#57534E'],  // Gray/Brown
  ['#06B6D4', '#0891B2'],  // Cyan
  ['#1F2937', '#111827'],  // Dark
  ['#8B5CF6', '#7C3AED'],  // Purple
  ['#059669', '#047857'],  // Green
];

// Status configurations with gradients
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; gradient: [string, string] }> = {
  pending: { bg: '#FEF3C7', text: '#D97706', label: 'Beklemede', gradient: ['#FCD34D', '#F59E0B'] },
  scheduled: { bg: '#DBEAFE', text: '#2563EB', label: 'Planlandı', gradient: ['#60A5FA', '#3B82F6'] },
  confirmed: { bg: '#D1FAE5', text: '#059669', label: 'Onaylandı', gradient: ['#34D399', '#10B981'] },
  completed: { bg: '#DBEAFE', text: '#2563EB', label: 'Tamamlandı', gradient: ['#60A5FA', '#3B82F6'] },
  cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'İptal Edildi', gradient: ['#F87171', '#EF4444'] },
  no_show: { bg: '#FFEDD5', text: '#EA580C', label: 'Gelmedi ve Bilgi Vermedi', gradient: ['#FB923C', '#F97316'] },
};

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

type ViewType = 'month' | 'week' | 'day';

// Draggable appointment block — long press (600ms) to drag, short tap to open detail
function DraggableAppointmentBlock({
  apt,
  staffIndex,
  columnWidth,
  top,
  height,
  status,
  isShort,
  onTap,
  onDragStart,
  onDragMove,
  onDragComplete,
}: {
  apt: Appointment;
  staffIndex: number;
  columnWidth: number;
  top: number;
  height: number;
  status: { bg: string; text: string; label: string; gradient: [string, string] };
  isShort: boolean;
  totalGridHeight: number;
  timeInterval: number;
  gridStartHour: number;
  gridEndHour: number;
  onTap: (apt: Appointment) => void;
  onDragStart: (apt: Appointment) => void;
  onDragMove: (translationX: number, translationY: number, absoluteX: number, absoluteY: number) => void;
  onDragComplete: (apt: Appointment, absoluteX: number, absoluteY: number) => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isDraggingShared = useSharedValue(false);

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onTap)(apt);
  });

  const pan = Gesture.Pan()
    .activateAfterLongPress(600)
    .onStart(() => {
      isDraggingShared.value = true;
      scale.value = withSpring(1.06);
      opacity.value = withSpring(0.75);
      runOnJS(onDragStart)(apt);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      runOnJS(onDragMove)(e.translationX, e.translationY, e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      runOnJS(onDragComplete)(apt, e.absoluteX, e.absoluteY);
    })
    .onFinalize(() => {
      isDraggingShared.value = false;
      // Anında sıfırla — optimistic update yeni konumda re-render eder
      translateX.value = 0;
      translateY.value = 0;
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    });

  const gesture = Gesture.Race(tap, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: isDraggingShared.value ? 999 : 10,
    elevation: isDraggingShared.value ? 8 : 0,
    shadowOpacity: isDraggingShared.value ? 0.3 : 0,
    shadowRadius: isDraggingShared.value ? 8 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
  }));

  // Use service color if available, fallback to status color
  const svcColor = getServiceColor(apt.serviceColor);
  const blockBg = svcColor ? svcColor.bg : status.bg;
  const blockText = svcColor ? svcColor.text : status.text;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top,
            left: staffIndex * columnWidth + 2,
            width: columnWidth - 4,
            minHeight: height,
            borderRadius: 6,
            backgroundColor: blockBg,
            borderLeftWidth: 3,
            borderLeftColor: blockText,
            paddingHorizontal: 4,
            paddingVertical: 2,
          },
          animatedStyle,
        ]}
      >
        {/* Status dot in top-right corner */}
        {svcColor && (
          <View style={{ position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: 4, backgroundColor: status.text }} />
        )}
        <Text
          numberOfLines={1}
          style={{ fontSize: isShort ? 10 : 13, fontWeight: '700', color: blockText }}
        >
          {apt.customerName}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: isShort ? 9 : 11, color: blockText, opacity: 0.8 }}>
          {apt.serviceName}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: isShort ? 9 : 10, color: blockText, opacity: 0.65 }}>
          {apt.duration}dk · {apt.price > 0 ? `₺${apt.price}` : 'Ücretsiz'}
        </Text>
        {apt.customerPhone && (
          <Text numberOfLines={1} style={{ fontSize: 10, color: blockText, opacity: 0.55 }}>
            {apt.customerPhone}
          </Text>
        )}
        {apt.notes && (
          <Text numberOfLines={1} style={{ fontSize: 10, color: blockText, opacity: 0.5, fontStyle: 'italic' }}>
            {apt.notes}
          </Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const { selectedTenant } = useAuthStore();

  // State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('day');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeInterval, setTimeInterval] = useState(DEFAULT_INTERVAL);
  const [gridStartHour, setGridStartHour] = useState(DEFAULT_START_HOUR);
  const [gridEndHour, setGridEndHour] = useState(DEFAULT_END_HOUR);
  const [staffWorkingHoursMap, setStaffWorkingHoursMap] = useState<Record<string, StaffWorkingHours>>({});
  const [tenantWorkingHours, setTenantWorkingHours] = useState<StaffWorkingHours | null>(null);
  const [allStaffList, setAllStaffList] = useState<{ id: string; name: string }[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ id: string; title: string; startDate: string; endDate: string; staffId?: string | null }[]>([]);

  const verticalScrollRef = useRef<ScrollView>(null);
  const gridBodyRef = useRef<View>(null);
  const gridBodyTopRef = useRef(0);
  const gridBodyLeftRef = useRef(0);
  const scrollOffsetRef = useRef(0);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [draggingApt, setDraggingApt] = useState<Appointment | null>(null);
  const [dragTargetTime, setDragTargetTime] = useState<string | null>(null);
  const [dragTargetStaffId, setDragTargetStaffId] = useState<string | null>(null);
  const dragTargetTimeRef = useRef<string | null>(null);
  const dragTargetStaffIdRef = useRef<string | null>(null);

  // Derived grid values
  const slotHeight = (timeInterval / 60) * HOUR_HEIGHT;
  const totalHours = gridEndHour - gridStartHour;
  const totalGridHeight = totalHours * HOUR_HEIGHT;

  // Update current time every minute (for red line indicator)
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current time when viewing today in day view
  useEffect(() => {
    if (viewType === 'day' && isToday(currentDate) && !isLoading) {
      const pos = getCurrentTimePosition();
      if (pos !== null) {
        setTimeout(() => {
          verticalScrollRef.current?.scrollTo({
            y: Math.max(0, pos - 150),
            animated: true,
          });
        }, 500);
      }
    }
  }, [currentDate, viewType, isLoading]);

  // Fetch appointments and tenant settings
  const lastAppointmentsHashRef = useRef<string>('');

  const fetchAppointments = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [appointmentsRes, settingsRes, staffRes] = await Promise.all([
        appointmentService.getStaffAppointments({ limit: 1000 }),
        appointmentService.getTenantSettings(),
        api.get('/api/mobile/staff?includeAll=true').catch(() => ({ data: { data: [] } })),
      ]);
      const appts = appointmentsRes.data || [];

      // Arka plan kontrolü: sadece değişiklik varsa güncelle
      const newHash = JSON.stringify(appts.map(a => `${a.id}_${a.status}_${a.time}_${a.date}_${a.staffId}`));
      if (silent && newHash === lastAppointmentsHashRef.current) {
        return; // Değişiklik yok, UI'ı güncelleme
      }

      // Yeni randevu kontrolü — bildirim at
      if (silent && lastAppointmentsHashRef.current) {
        const oldIds = new Set(
          lastAppointmentsHashRef.current.match(/([a-z0-9]+)_/g)?.map(s => s.replace('_', '')) || []
        );
        const newAppts = appts.filter(a => !oldIds.has(a.id));
        if (newAppts.length > 0) {
          const apt = newAppts[0];
          notificationService.scheduleLocalNotification(
            'Yeni Randevu',
            `${apt.customerName} - ${apt.serviceName} (${apt.date} ${apt.time})`,
            { appointmentId: apt.id },
          );
        }
      }

      lastAppointmentsHashRef.current = newHash;
      setAppointments(appts);

      if (settingsRes.success && settingsRes.data) {
        const interval = settingsRes.data.appointmentTimeInterval || DEFAULT_INTERVAL;
        setTimeInterval(interval);

        // Extract working hours to set grid start/end
        const wh = settingsRes.data.workingHours;
        let minStart = DEFAULT_START_HOUR;
        let maxEnd = DEFAULT_END_HOUR;
        if (wh) {
          let whStart = 24;
          let whEnd = 0;
          Object.values(wh).forEach((day: any) => {
            if (!day.closed && day.start && day.end) {
              const startH = parseInt(day.start.split(':')[0], 10);
              const endH = parseInt(day.end.split(':')[0], 10);
              const endM = parseInt(day.end.split(':')[1], 10);
              if (startH < whStart) whStart = startH;
              const endCeil = endM > 0 ? endH + 1 : endH;
              if (endCeil > whEnd) whEnd = endCeil;
            }
          });
          if (whStart < whEnd) {
            minStart = whStart;
            maxEnd = whEnd;
          }
        }

        // Also expand grid to cover any appointment outside working hours
        appts.forEach((apt) => {
          if (apt.time) {
            const h = parseInt(apt.time.split(':')[0], 10);
            const duration = apt.duration || 30;
            const endMin = h * 60 + parseInt(apt.time.split(':')[1], 10) + duration;
            const endCeil = Math.ceil(endMin / 60);
            if (h < minStart) minStart = h;
            if (endCeil > maxEnd) maxEnd = endCeil;
          }
        });

        setGridStartHour(minStart);
        setGridEndHour(maxEnd);

        // Save tenant working hours for fallback
        if (wh) {
          setTenantWorkingHours(wh);
        }

        // Save blocked dates
        if (settingsRes.data.blockedDates) {
          setBlockedDates(settingsRes.data.blockedDates);
        }
      }

      // Build staff working hours map and full staff list
      const staffList = staffRes?.data?.data || [];
      if (staffList.length > 0) {
        const whMap: Record<string, StaffWorkingHours> = {};
        const sList: { id: string; name: string }[] = [];
        staffList.forEach((s: any) => {
          if (s.workingHours && typeof s.workingHours === 'object') {
            whMap[s.id] = s.workingHours;
          }
          if (s.isActive !== false) {
            sList.push({ id: s.id, name: `${s.firstName} ${s.lastName}`.trim() });
          }
        });
        setStaffWorkingHoursMap(whMap);
        setAllStaffList(sList.sort((a, b) => a.name.localeCompare(b.name, 'tr')));
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      if (!silent) setAppointments([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Ekran odaklandığında veri çek + 30sn arka plan polling
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
      pollingRef.current = setInterval(() => {
        fetchAppointments(true); // sessiz arka plan kontrolü
      }, 30000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }, [])
  );

  // Get unique staff members — prefer full staff list from API, fallback to appointments
  const staffMembers = useMemo(() => {
    if (allStaffList.length > 0) return allStaffList;
    const staffMap = new Map<string, string>();
    appointments.forEach(apt => {
      if (apt.staffId && apt.staffName) {
        staffMap.set(apt.staffId, apt.staffName);
      }
    });
    return Array.from(staffMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [appointments, allStaffList]);

  // Display staff list (used both in render and drag handlers)
  const displayStaff = useMemo(() =>
    staffMembers.length > 0 ? staffMembers : [{ id: 'all', name: 'Tüm Randevular' }],
    [staffMembers]
  );

  // Column width for day view (used in drag handlers)
  const staffColumnWidth = useMemo(() => {
    const count = displayStaff.length || 1;
    return (SCREEN_WIDTH - TIME_LABEL_WIDTH) / count;
  }, [displayStaff]);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: string) => {
    return appointments.filter((apt) => apt.date === date);
  };

  // Navigate dates
  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar days for month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    let startPadding = firstDay.getDay() - 1;
    if (startPadding < 0) startPadding = 6;

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Get week days
  const getWeekDays = () => {
    const days: Date[] = [];
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Format date for comparison (local timezone, not UTC)
  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Check if date is today
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return formatDateString(date) === formatDateString(today);
  };

  // Time-grid helpers
  const getAppointmentPosition = (timeStr: string, duration: number) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const minutesFromStart = (hours - gridStartHour) * 60 + minutes;
    const top = (minutesFromStart / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 28);
    return { top, height };
  };

  const getCurrentTimePosition = (): number | null => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    if (hours < gridStartHour || hours >= gridEndHour) return null;
    const minutesFromStart = (hours - gridStartHour) * 60 + minutes;
    return (minutesFromStart / 60) * HOUR_HEIGHT;
  };

  // Get working hours for a staff member on a given date
  // Returns { start, end, closed } or null (use tenant hours as fallback)
  const getStaffDayHours = (staffId: string, date: Date): { start: string; end: string; closed: boolean } | null => {
    const dayKey = DAY_KEY_MAP[date.getDay()];
    // Staff-specific hours first
    const staffWH = staffWorkingHoursMap[staffId];
    if (staffWH && staffWH[dayKey]) {
      return staffWH[dayKey];
    }
    // Fallback to tenant hours
    if (tenantWorkingHours && tenantWorkingHours[dayKey]) {
      return tenantWorkingHours[dayKey];
    }
    return null;
  };

  // Build inactive overlay regions for a staff column
  // Returns array of { top, height } for closed/outside-hours regions
  const getInactiveRegions = (staffId: string, date: Date): { top: number; height: number }[] => {
    if (staffId === 'all') return [];
    const dayHours = getStaffDayHours(staffId, date);
    if (!dayHours) return []; // No data — assume open
    if (dayHours.closed) {
      // Whole day closed
      return [{ top: 0, height: totalGridHeight }];
    }
    const regions: { top: number; height: number }[] = [];
    const [startH, startM] = dayHours.start.split(':').map(Number);
    const [endH, endM] = dayHours.end.split(':').map(Number);
    const openMin = startH * 60 + startM;
    const closeMin = endH * 60 + endM;
    const gridStartMin = gridStartHour * 60;
    const gridEndMin = gridEndHour * 60;
    // Before opening
    if (openMin > gridStartMin) {
      const h = ((openMin - gridStartMin) / 60) * HOUR_HEIGHT;
      regions.push({ top: 0, height: h });
    }
    // After closing
    if (closeMin < gridEndMin) {
      const topPos = ((closeMin - gridStartMin) / 60) * HOUR_HEIGHT;
      regions.push({ top: topPos, height: totalGridHeight - topPos });
    }
    return regions;
  };

  // Check if a date string (YYYY-MM-DD) falls within any blocked date range
  const getBlockedDateForDay = (dateStr: string): { title: string } | null => {
    for (const bd of blockedDates) {
      if (dateStr >= bd.startDate && dateStr <= bd.endDate) {
        return { title: bd.title };
      }
    }
    return null;
  };

  // Handle WhatsApp
  const handleSendWhatsApp = async (appointment: Appointment) => {
    try {
      const message = `Merhaba ${appointment.customerName}, ${appointment.date} tarihinde saat ${appointment.time}'de ${appointment.serviceName} randevunuz bulunmaktadır. ${selectedTenant?.businessName}`;
      const phone = appointment.customerPhone.replace(/\D/g, '');
      const url = `whatsapp://send?phone=90${phone}&text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'WhatsApp uygulaması bulunamadı');
      }
    } catch (error) {
      Alert.alert('Hata', 'WhatsApp açılamadı');
    }
  };

  // Handle phone call
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Appointment block handlers
  const handleDragTap = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setShowDetailModal(true);
  };

  const handleDragStart = (apt: Appointment) => {
    setIsDragging(true);
    setDraggingApt(apt);
    setDragTargetTime(apt.time);
    setDragTargetStaffId(apt.staffId);
    dragTargetTimeRef.current = apt.time;
    dragTargetStaffIdRef.current = apt.staffId;
  };

  const handleDragMove = (_translationX: number, _translationY: number, absoluteX: number, absoluteY: number) => {
    // --- Hedef saat (Y ekseninden) ---
    const relY = absoluteY - gridBodyTopRef.current + scrollOffsetRef.current;
    const totalMin = (relY / HOUR_HEIGHT) * 60 + gridStartHour * 60;
    const snapped = Math.round(totalMin / timeInterval) * timeInterval;
    const clamped = Math.max(
      gridStartHour * 60,
      Math.min((gridEndHour - 1) * 60, snapped)
    );
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    const newTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setDragTargetTime(newTime);
    dragTargetTimeRef.current = newTime;

    // --- Hedef personel (X ekseninden) ---
    const relX = absoluteX - gridBodyLeftRef.current;
    const staffIndex = Math.max(
      0,
      Math.min(displayStaff.length - 1, Math.floor(relX / staffColumnWidth))
    );
    const targetStaff = displayStaff[staffIndex];
    if (targetStaff && targetStaff.id !== 'all') {
      setDragTargetStaffId(targetStaff.id);
      dragTargetStaffIdRef.current = targetStaff.id;
    }
  };

  const handleDragComplete = async (apt: Appointment, _absoluteX: number, _absoluteY: number) => {
    const newTime = dragTargetTimeRef.current;
    const newStaffId = dragTargetStaffIdRef.current;
    setIsDragging(false);
    setDraggingApt(null);
    setDragTargetTime(null);
    setDragTargetStaffId(null);
    dragTargetTimeRef.current = null;
    dragTargetStaffIdRef.current = null;

    const timeChanged = newTime && newTime !== apt.time;
    const staffChanged = newStaffId && newStaffId !== apt.staffId && newStaffId !== 'all';

    console.log('🎯 Drag complete:', {
      aptId: apt.id,
      oldTime: apt.time, newTime,
      oldStaffId: apt.staffId, newStaffId,
      timeChanged, staffChanged,
    });

    if (!timeChanged && !staffChanged) return;

    const updatedTime = newTime || apt.time;
    const updatedStaffId = staffChanged ? newStaffId! : apt.staffId;
    const updatedStaffName = staffChanged
      ? (displayStaff.find(s => s.id === newStaffId)?.name || apt.staffName)
      : apt.staffName;

    // Check for overlap with existing appointments
    const [dropH, dropM] = updatedTime.split(':').map(Number);
    const dropStart = dropH * 60 + dropM;
    const dropEnd = dropStart + (apt.duration || 60);

    const hasConflict = appointments.some(a => {
      if (a.id === apt.id) return false; // skip self
      if (a.staffId !== updatedStaffId) return false; // different staff
      if (a.date !== apt.date) return false; // different date
      if (a.status === 'cancelled') return false;
      const [aH, aM] = (a.time || '').split(':').map(Number);
      if (isNaN(aH)) return false;
      const aStart = aH * 60 + aM;
      const aEnd = aStart + (a.duration || 60);
      return dropStart < aEnd && dropEnd > aStart;
    });

    if (hasConflict) {
      Alert.alert('Uyarı', 'Bu saatte seçili personelin başka bir randevusu var.');
      return;
    }

    // Optimistic update
    setAppointments(prev =>
      prev.map(a =>
        a.id === apt.id
          ? { ...a, time: updatedTime, staffId: updatedStaffId, staffName: updatedStaffName }
          : a
      )
    );

    try {
      const updatePayload: any = { date: apt.date, time: updatedTime };
      if (staffChanged) updatePayload.staffId = newStaffId;
      console.log('📡 Sending update:', updatePayload);
      const res = await appointmentService.updateAppointment(apt.id, updatePayload);
      console.log('📡 Update response:', JSON.stringify(res));
      if (!res.success) {
        throw new Error(res.error || 'Update failed');
      }
    } catch (err: any) {
      console.error('❌ Drag update error:', err?.message || err);
      // Rollback on error
      setAppointments(prev =>
        prev.map(a => (a.id === apt.id ? apt : a))
      );
      Alert.alert('Hata', 'Randevu güncellenemedi');
    }
  };

  // Render view type tabs
  const renderViewTabs = () => (
    <View style={styles.viewTabsContainer}>
      <View style={styles.viewTabs}>
        {(['day', 'week', 'month'] as ViewType[]).map((type) => {
          const isActive = viewType === type;
          const icons: Record<ViewType, string> = { day: 'today', week: 'calendar-outline', month: 'calendar' };
          const labels: Record<ViewType, string> = { day: 'Gün', week: 'Hafta', month: 'Ay' };
          return (
            <TouchableOpacity
              key={type}
              style={[styles.viewTab, isActive && styles.viewTabActive]}
              onPress={() => setViewType(type)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icons[type] as any}
                size={16}
                color={isActive ? '#fff' : '#6B7280'}
              />
              <Text style={[styles.viewTabText, isActive && styles.viewTabTextActive]}>
                {labels[type]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Render month view
  const renderMonthView = () => {
    const days = getMonthDays();

    // Calculate staff appointment counts for the month
    const getMonthStaffCounts = () => {
      const validDays = days.filter(Boolean) as Date[];
      return staffMembers.map(staff => {
        const count = validDays.reduce((sum, day) => {
          const dateStr = formatDateString(day);
          return sum + getAppointmentsForDate(dateStr).filter(apt => apt.staffId === staff.id).length;
        }, 0);
        return { ...staff, count };
      });
    };

    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.monthContainer}>
          {/* Weekday headers */}
          <View style={styles.weekdayHeader}>
            {WEEKDAYS.map((day, index) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={[
                  styles.weekdayText,
                  (index === 5 || index === 6) && styles.weekdayTextWeekend
                ]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.monthGrid}>
            {days.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const dateStr = formatDateString(day);
              const dayAppointments = getAppointmentsForDate(dateStr);
              const todayCheck = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const blockedDay = getBlockedDateForDay(dateStr);

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    todayCheck && styles.dayCellToday,
                    isWeekend && styles.dayCellWeekend,
                    blockedDay && { backgroundColor: 'rgba(239,68,68,0.08)' },
                  ]}
                  onPress={() => {
                    setCurrentDate(day);
                    setViewType('day');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dayNumberContainer, todayCheck && styles.dayNumberContainerToday]}>
                    <Text style={[
                      styles.dayNumber,
                      todayCheck && styles.dayNumberToday,
                      isWeekend && !todayCheck && styles.dayNumberWeekend,
                      blockedDay && { color: 'rgba(220,38,38,0.7)' },
                    ]}>
                      {day.getDate()}
                    </Text>
                  </View>
                  {blockedDay ? (
                    <View style={{ alignItems: 'center', marginTop: 2 }}>
                      <Ionicons name="close-circle" size={10} color="rgba(220,38,38,0.5)" />
                    </View>
                  ) : dayAppointments.length > 0 ? (
                    <View style={styles.appointmentDots}>
                      {dayAppointments.slice(0, 3).map((apt, i) => (
                        <View
                          key={apt.id}
                          style={[
                            styles.appointmentDot,
                            { backgroundColor: STATUS_CONFIG[apt.status]?.text || '#6B7280' },
                          ]}
                        />
                      ))}
                      {dayAppointments.length > 3 && (
                        <Text style={styles.moreDotsText}>+{dayAppointments.length - 3}</Text>
                      )}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Staff breakdown for the month */}
        {staffMembers.length > 1 && (
          <View style={styles.monthStaffBreakdown}>
            <Text style={styles.monthStaffTitle}>Personel Dağılımı</Text>
            {getMonthStaffCounts().map(staff => (
              <View key={staff.id} style={styles.monthStaffRow}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.monthStaffAvatar}
                >
                  <Text style={styles.monthStaffAvatarText}>
                    {staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </Text>
                </LinearGradient>
                <Text style={styles.monthStaffName}>{staff.name}</Text>
                <View style={styles.monthStaffBadge}>
                  <Text style={styles.monthStaffBadgeText}>{staff.count} randevu</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  // Render week columns for a specific staff or all
  const renderWeekColumns = (days: Date[], filterStaffId?: string) => (
    <View style={styles.weekGrid}>
      {days.map((day, index) => {
        const dateStr = formatDateString(day);
        let dayAppts = getAppointmentsForDate(dateStr);
        if (filterStaffId) {
          dayAppts = dayAppts.filter(apt => apt.staffId === filterStaffId);
        }
        const todayCheck = isToday(day);
        const blockedDay = getBlockedDateForDay(dateStr);

        return (
          <View
            key={index}
            style={[
              styles.weekDayColumn,
              todayCheck && styles.weekDayColumnToday,
              blockedDay && { backgroundColor: 'rgba(239,68,68,0.06)' },
            ]}
          >
            {blockedDay ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 12 }}>
                <Ionicons name="close-circle" size={18} color="rgba(220,38,38,0.4)" />
                <Text style={{ fontSize: 9, color: 'rgba(220,38,38,0.6)', marginTop: 3, textAlign: 'center' }} numberOfLines={2}>
                  {blockedDay.title}
                </Text>
              </View>
            ) : dayAppts.length === 0 ? (
              <View style={styles.emptyDayColumn}>
                <Ionicons name="remove-outline" size={16} color="#D1D5DB" />
              </View>
            ) : (
              dayAppts.slice(0, 6).map((apt) => {
                const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                return (
                  <TouchableOpacity
                    key={apt.id}
                    style={styles.weekAppointment}
                    onPress={() => {
                      setSelectedAppointment(apt);
                      setShowDetailModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.weekAptAccent, { backgroundColor: status.text }]} />
                    <View style={styles.weekAptContent}>
                      <Text style={styles.weekAppointmentTime}>{apt.time.substring(0, 5)}</Text>
                      <Text style={styles.weekAppointmentName} numberOfLines={1}>
                        {apt.customerName.split(' ')[0]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
            {!blockedDay && dayAppts.length > 6 && (
              <Text style={styles.moreText}>+{dayAppts.length - 6}</Text>
            )}
          </View>
        );
      })}
    </View>
  );

  // Render week view
  const renderWeekView = () => {
    const days = getWeekDays();

    // Multiple staff: horizontal columns, each with their own week grid
    if (staffMembers.length > 1) {
      const WEEK_COLUMN_MIN_WIDTH = 280;
      const availableWidth = SCREEN_WIDTH - 32;
      const columnWidth = Math.max(availableWidth / staffMembers.length, WEEK_COLUMN_MIN_WIDTH);

      return (
        <View style={styles.weekContainer}>
          <ScrollView style={styles.weekScrollView} showsVerticalScrollIndicator={false}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={columnWidth * staffMembers.length > availableWidth}
              contentContainerStyle={styles.staffColumnsRow}
            >
              {staffMembers.map(staff => {
                const weekCount = days.reduce((sum, day) => {
                  const dateStr = formatDateString(day);
                  return sum + getAppointmentsForDate(dateStr).filter(apt => apt.staffId === staff.id).length;
                }, 0);
                return (
                  <View key={staff.id} style={[styles.staffColumn, { width: columnWidth }]}>
                    <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.staffColumnHeader}>
                      <Text style={styles.staffColumnInitials}>
                        {staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </Text>
                      <Text style={styles.staffColumnName} numberOfLines={1}>{staff.name}</Text>
                      <Text style={styles.staffColumnCount}>{weekCount} randevu</Text>
                    </LinearGradient>
                    {/* Mini weekday headers inside each staff column */}
                    <View style={styles.weekStaffDayHeaders}>
                      {days.map((day, idx) => {
                        const todayCheck = isToday(day);
                        const dayBlocked = getBlockedDateForDay(formatDateString(day));
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.weekStaffDayHeader,
                              todayCheck && styles.weekStaffDayHeaderToday,
                              dayBlocked && { backgroundColor: 'rgba(239,68,68,0.1)' },
                            ]}
                            onPress={() => { setCurrentDate(day); setViewType('day'); }}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.weekStaffDayName,
                              todayCheck && styles.weekStaffDayNameToday,
                              dayBlocked && { color: 'rgba(220,38,38,0.7)' },
                            ]}>
                              {WEEKDAYS[idx]}
                            </Text>
                            <Text style={[
                              styles.weekStaffDayNum,
                              todayCheck && styles.weekStaffDayNumToday,
                              dayBlocked && { color: 'rgba(220,38,38,0.7)' },
                            ]}>
                              {day.getDate()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {renderWeekColumns(days, staff.id)}
                  </View>
                );
              })}
            </ScrollView>
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      );
    }

    // Single staff or no staff: original layout
    return (
      <View style={styles.weekContainer}>
        {/* Weekday headers */}
        <View style={styles.weekHeader}>
          {days.map((day, index) => {
            const todayCheck = isToday(day);
            const dayBlocked = getBlockedDateForDay(formatDateString(day));
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.weekDayHeader,
                  todayCheck && styles.weekDayHeaderToday,
                  dayBlocked && { backgroundColor: 'rgba(239,68,68,0.1)' },
                ]}
                onPress={() => {
                  setCurrentDate(day);
                  setViewType('day');
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.weekDayName,
                  todayCheck && styles.weekDayNameToday,
                  dayBlocked && { color: 'rgba(220,38,38,0.7)' },
                ]}>
                  {WEEKDAYS[index]}
                </Text>
                <Text style={[
                  styles.weekDayNum,
                  todayCheck && styles.weekDayNumToday,
                  dayBlocked && { color: 'rgba(220,38,38,0.7)' },
                ]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={styles.weekScrollView} showsVerticalScrollIndicator={false}>
          {renderWeekColumns(days)}
        </ScrollView>
      </View>
    );
  };

  // Render day view - Time Grid Layout
  const renderDayView = () => {
    const dateStr = formatDateString(currentDate);
    const dayAppointments = getAppointmentsForDate(dateStr);

    // columnWidth is staffColumnWidth from scope (matches drag handler calculations)
    const columnWidth = staffColumnWidth;

    // Generate time slot labels based on appointment interval
    const timeSlots: string[] = [];
    const startMinutes = gridStartHour * 60;
    const endMinutes = gridEndHour * 60;
    for (let m = startMinutes; m < endMinutes; m += timeInterval) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      timeSlots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }

    // Current time indicator position (only for today)
    const currentTimeTop = isToday(currentDate) ? getCurrentTimePosition() : null;
    // displayStaff comes from scope (useMemo)

    return (
      <View style={{ flex: 1 }}>
        {/* Sticky Staff Header - no scroll, all fit on screen */}
        <View style={styles.timeGridHeader}>
          <View style={{ width: TIME_LABEL_WIDTH, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          </View>
          {displayStaff.map((staff, index) => (
            <LinearGradient
              key={staff.id}
              colors={STAFF_COLORS[index % STAFF_COLORS.length]}
              style={[styles.staffHeaderCell, { width: columnWidth }]}
            >
              <Text style={styles.staffHeaderText} numberOfLines={1}>
                {staff.name}
              </Text>
            </LinearGradient>
          ))}
        </View>

        {/* Time Grid Body */}
        <ScrollView
          ref={verticalScrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
          scrollEnabled={!isDragging}
          scrollEventThrottle={16}
          onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
        >
          <View style={{ flexDirection: 'row', height: totalGridHeight }}>
            {/* Fixed Time Labels Column */}
            <View style={{ width: TIME_LABEL_WIDTH }}>
              {timeSlots.map((slot, i) => {
                // Show label for full hours, hide for sub-intervals
                const min = parseInt(slot.split(':')[1], 10);
                const isFullHour = min === 0;
                return (
                  <View
                    key={slot}
                    style={{
                      height: slotHeight,
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      borderTopWidth: 1,
                      borderTopColor: isFullHour ? '#E5E7EB' : '#F3F4F6',
                    }}
                  >
                    <Text style={styles.gridTimeLabelText}>
                      {isFullHour ? slot : ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Staff Grid Columns - fixed, no horizontal scroll */}
            <View
              ref={gridBodyRef}
              onLayout={() => {
                gridBodyRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
                  gridBodyTopRef.current = pageY;
                  gridBodyLeftRef.current = pageX;
                });
              }}
              style={{ flex: 1, height: totalGridHeight, position: 'relative' }}
            >
              {/* Horizontal grid lines (every interval) */}
              {timeSlots.map((slot, i) => {
                const min = parseInt(slot.split(':')[1], 10);
                const isFullHour = min === 0;
                return (
                  <View
                    key={`hline-${i}`}
                    style={{
                      position: 'absolute',
                      top: i * slotHeight,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: isFullHour ? '#E5E7EB' : '#F3F4F6',
                    }}
                  />
                );
              })}

              {/* Vertical staff column dividers */}
              {displayStaff.map((_, index) => (
                index > 0 ? (
                  <View
                    key={`vline-${index}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: index * columnWidth,
                      width: 1,
                      backgroundColor: '#E5E7EB',
                    }}
                  />
                ) : null
              ))}

              {/* Blocked date (holiday) overlay — full grid cover */}
              {(() => {
                const blocked = getBlockedDateForDay(dateStr);
                if (!blocked) return null;
                return (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: totalGridHeight,
                      backgroundColor: 'rgba(239,68,68,0.08)',
                      zIndex: 2,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' }}>
                      <Ionicons name="calendar-outline" size={28} color="rgba(220,38,38,0.5)" />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(220,38,38,0.7)', marginTop: 4 }}>Tatil</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(220,38,38,0.5)', marginTop: 2 }}>{blocked.title}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Inactive / closed hour overlays per staff */}
              {displayStaff.map((staff, staffIndex) => {
                const regions = getInactiveRegions(staff.id, currentDate);
                return regions.map((region, ri) => (
                  <View
                    key={`inactive-${staff.id}-${ri}`}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: region.top,
                      left: staffIndex * columnWidth,
                      width: columnWidth,
                      height: region.height,
                      backgroundColor: 'rgba(148,163,184,0.13)',
                      zIndex: 0,
                    }}
                  >
                    {/* Diagonal stripes pattern indicator */}
                    {region.height === totalGridHeight && (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="close-circle-outline" size={24} color="rgba(148,163,184,0.4)" />
                        <Text style={{ fontSize: 10, color: 'rgba(100,116,139,0.5)', marginTop: 2 }}>Kapalı</Text>
                      </View>
                    )}
                  </View>
                ));
              })}

              {/* Tappable background areas for each staff column */}
              {displayStaff.map((staff, staffIndex) => (
                <TouchableOpacity
                  key={`tap-${staff.id}`}
                  activeOpacity={0.7}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: staffIndex * columnWidth,
                    width: columnWidth,
                    height: totalGridHeight,
                  }}
                  onPress={(e) => {
                    const y = e.nativeEvent.locationY;
                    const minutesFromStart = (y / HOUR_HEIGHT) * 60;
                    // Snap to nearest interval
                    const snapped = Math.floor(minutesFromStart / timeInterval) * timeInterval;
                    const totalMin = gridStartHour * 60 + snapped;
                    const h = Math.floor(totalMin / 60);
                    const m = totalMin % 60;
                    const tappedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

                    // Block taps on blocked dates (holidays)
                    if (getBlockedDateForDay(dateStr)) return;

                    // Block past time slots for today
                    if (isToday(currentDate)) {
                      const now = new Date();
                      const nowMinutes = now.getHours() * 60 + now.getMinutes();
                      if (totalMin <= nowMinutes) return;
                    }

                    // Block taps on closed/inactive hours
                    const dayHours = getStaffDayHours(staff.id, currentDate);
                    if (dayHours) {
                      if (dayHours.closed) return;
                      const [openH, openM] = dayHours.start.split(':').map(Number);
                      const [closeH, closeM] = dayHours.end.split(':').map(Number);
                      const openMin = openH * 60 + openM;
                      const closeMin = closeH * 60 + closeM;
                      if (totalMin < openMin || totalMin >= closeMin) return;
                    }

                    router.push({
                      pathname: '/appointment/new',
                      params: {
                        date: dateStr,
                        time: tappedTime,
                        staffId: staff.id !== 'all' ? staff.id : undefined,
                      },
                    });
                  }}
                />
              ))}

              {/* Appointment blocks (draggable) */}
              {displayStaff.map((staff, staffIndex) => {
                const staffAppts = staff.id === 'all'
                  ? dayAppointments
                  : dayAppointments.filter(a => a.staffId === staff.id);
                return staffAppts.map(apt => {
                  const { top, height } = getAppointmentPosition(apt.time, apt.duration || 30);
                  const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                  const isShort = height < 50;
                  return (
                    <DraggableAppointmentBlock
                      key={apt.id}
                      apt={apt}
                      staffIndex={staffIndex}
                      columnWidth={columnWidth}
                      top={top}
                      height={height}
                      status={status}
                      isShort={isShort}
                      totalGridHeight={totalGridHeight}
                      timeInterval={timeInterval}
                      gridStartHour={gridStartHour}
                      gridEndHour={gridEndHour}
                      onTap={handleDragTap}
                      onDragStart={handleDragStart}
                      onDragMove={handleDragMove}
                      onDragComplete={(a, ax, ay) => handleDragComplete(a, ax, ay)}
                    />
                  );
                });
              })}

              {/* Drag: hedef personel kolonu mavi highlight */}
              {isDragging && dragTargetStaffId && displayStaff.map((staff, staffIndex) =>
                staff.id === dragTargetStaffId ? (
                  <View
                    key={`highlight-${staffIndex}`}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: staffIndex * columnWidth,
                      width: columnWidth,
                      height: totalGridHeight,
                      backgroundColor: 'rgba(59,130,246,0.09)',
                      borderWidth: 1,
                      borderColor: 'rgba(59,130,246,0.25)',
                      zIndex: 1,
                    }}
                  />
                ) : null
              )}

              {/* Drag: hedef saat çizgisi (sadece hedef personel kolonunda) */}
              {isDragging && dragTargetTime && dragTargetStaffId && (() => {
                const targetTop = getAppointmentPosition(dragTargetTime, 0).top;
                const staffIndex = displayStaff.findIndex(s => s.id === dragTargetStaffId);
                const colLeft = staffIndex >= 0 ? staffIndex * columnWidth : 0;
                return (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: targetTop,
                      left: colLeft,
                      width: columnWidth,
                      zIndex: 50,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{
                      backgroundColor: '#EF4444',
                      borderRadius: 4,
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      marginLeft: 2,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                        {dragTargetTime}
                      </Text>
                    </View>
                    <View style={{ flex: 1, height: 2, backgroundColor: '#EF4444', opacity: 0.6 }} />
                  </View>
                );
              })()}

              {/* Current time red line */}
              {currentTimeTop !== null && (
                <View style={[styles.currentTimeLine, { top: currentTimeTop }]}>
                  <View style={styles.currentTimeDot} />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedAppointment) return null;
    const status = STATUS_CONFIG[selectedAppointment.status] || STATUS_CONFIG.pending;

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHandle} />

            {/* Header with gradient */}
            <LinearGradient
              colors={status.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalGradientHeader}
            >
              <View style={styles.modalHeaderContent}>
                <View>
                  <Text style={styles.modalStatusLabel}>{status.label}</Text>
                  <Text style={styles.modalHeaderTime}>
                    {selectedAppointment.time.substring(0, 5)} • {selectedAppointment.duration} dk
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Date */}
              <View style={styles.detailCard}>
                <View style={styles.detailCardIcon}>
                  <Ionicons name="calendar" size={20} color="#3B82F6" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Tarih</Text>
                  <Text style={styles.detailCardValue}>
                    {new Date(selectedAppointment.date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                </View>
              </View>

              {/* Customer */}
              <View style={styles.detailCard}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="person" size={20} color="#D97706" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Müşteri</Text>
                  <Text style={styles.detailCardValue}>{selectedAppointment.customerName}</Text>
                  <View style={styles.contactRow}>
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => handleCall(selectedAppointment.customerPhone)}
                    >
                      <Ionicons name="call" size={14} color="#3B82F6" />
                      <Text style={styles.contactChipText}>{selectedAppointment.customerPhone}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.contactChip, styles.whatsappChip]}
                      onPress={() => handleSendWhatsApp(selectedAppointment)}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Service */}
              <View style={styles.detailCard}>
                <View style={[styles.detailCardIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="cut" size={20} color="#059669" />
                </View>
                <View style={styles.detailCardContent}>
                  <Text style={styles.detailCardLabel}>Hizmet</Text>
                  <Text style={styles.detailCardValue}>{selectedAppointment.serviceName}</Text>
                  <Text style={styles.priceText}>
                    {selectedAppointment.price?.toLocaleString('tr-TR')} ₺
                  </Text>
                </View>
              </View>

              {/* Staff */}
              {selectedAppointment.staffName && (
                <View style={styles.detailCard}>
                  <View style={[styles.detailCardIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="people" size={20} color="#4F46E5" />
                  </View>
                  <View style={styles.detailCardContent}>
                    <Text style={styles.detailCardLabel}>Personel</Text>
                    <Text style={styles.detailCardValue}>{selectedAppointment.staffName}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  router.push(`/appointment/edit?id=${selectedAppointment.id}`);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editBtnText}>Düzenle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Format header date
  const getHeaderTitle = () => {
    if (viewType === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewType === 'week') {
      const weekDays = getWeekDays();
      const startMonth = MONTHS[weekDays[0].getMonth()];
      const endMonth = MONTHS[weekDays[6].getMonth()];
      if (startMonth === endMonth) {
        return `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${startMonth}`;
      }
      return `${weekDays[0].getDate()} ${startMonth} - ${weekDays[6].getDate()} ${endMonth}`;
    } else {
      return currentDate.toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header - Using shared Header component */}
      <Header
        title="Takvim"
        subtitle={selectedTenant?.businessName}
        onMenuPress={() => setDrawerOpen(true)}
        showCalendar
        onCalendarPress={() => router.push('/(tabs)/staff/appointments')}
        gradientColors={['#163974', '#1e4a8f']}
      />

      {/* Date Navigation Bar */}
      <View style={styles.dateNavContainer}>
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate(-1)}>
            <Ionicons name="chevron-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateTitle} onPress={goToToday}>
            <Text style={styles.dateTitleText}>{getHeaderTitle()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate(1)}>
            <Ionicons name="chevron-forward" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayBtn} onPress={goToToday}>
            <Text style={styles.todayBtnText}>Bugün</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View tabs */}
      {renderViewTabs()}

      {/* Calendar content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <View style={styles.calendarContent}>
          {viewType === 'month' && renderMonthView()}
          {viewType === 'week' && renderWeekView()}
          {viewType === 'day' && renderDayView()}
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/appointment/new')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Drawer Menu */}
      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Date Navigation Bar
  dateNavContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTitle: {
    flex: 1,
    alignItems: 'center',
  },
  dateTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  todayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  viewTabsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  viewTabActive: {
    backgroundColor: '#3B82F6',
  },
  viewTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewTabTextActive: {
    color: '#fff',
  },

  // Staff columns (horizontal layout)
  staffColumnsRow: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    gap: 8,
  },
  staffColumn: {
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  staffColumnHeader: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  staffColumnInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    textAlign: 'center',
    lineHeight: 36,
    overflow: 'hidden',
  },
  staffColumnName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  staffColumnCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  // Week view staff column day headers
  weekStaffDayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekStaffDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 1,
  },
  weekStaffDayHeaderToday: {
    backgroundColor: '#3B82F6',
  },
  weekStaffDayName: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6B7280',
  },
  weekStaffDayNameToday: {
    color: '#BFDBFE',
  },
  weekStaffDayNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 1,
  },
  weekStaffDayNumToday: {
    color: '#fff',
  },

  // Month staff breakdown
  monthStaffBreakdown: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  monthStaffTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  monthStaffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  monthStaffAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthStaffAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  monthStaffName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  monthStaffBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthStaffBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
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
  },
  calendarContent: {
    flex: 1,
  },

  // Month view
  monthContainer: {
    flex: 1,
    padding: 16,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekdayTextWeekend: {
    color: '#DC2626',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: 56,
    alignItems: 'center',
    paddingTop: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  dayCellToday: {
    backgroundColor: '#EFF6FF',
  },
  dayCellWeekend: {
    backgroundColor: '#FEF2F2',
  },
  dayNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberContainerToday: {
    backgroundColor: '#3B82F6',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  dayNumberToday: {
    color: '#fff',
    fontWeight: '700',
  },
  dayNumberWeekend: {
    color: '#DC2626',
  },
  appointmentDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  appointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreDotsText: {
    fontSize: 8,
    color: '#6B7280',
    marginLeft: 2,
  },

  // Week view
  weekContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  weekDayHeaderToday: {
    backgroundColor: '#3B82F6',
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  weekDayNameToday: {
    color: '#BFDBFE',
  },
  weekDayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  weekDayNumToday: {
    color: '#fff',
  },
  weekScrollView: {
    flex: 1,
  },
  weekGrid: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
  },
  weekDayColumn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    minHeight: 280,
  },
  weekDayColumnToday: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  emptyDayColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekAppointment: {
    flexDirection: 'row',
    marginBottom: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  weekAptAccent: {
    width: 3,
  },
  weekAptContent: {
    flex: 1,
    padding: 6,
  },
  weekAppointmentTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
  },
  weekAppointmentName: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  moreText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },

  // Day view - Time Grid
  timeGridHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    height: STAFF_HEADER_HEIGHT,
  },
  staffHeaderCell: {
    height: STAFF_HEADER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  staffHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  gridTimeLabelText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: -7,
  },
  appointmentBlock: {
    position: 'absolute',
    borderRadius: 4,
    padding: 4,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  appointmentBlockTime: {
    fontSize: 10,
    fontWeight: '700',
  },
  appointmentBlockCustomer: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentBlockService: {
    fontSize: 10,
    color: '#6B7280',
  },
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#EF4444',
    zIndex: 10,
  },
  currentTimeDot: {
    position: 'absolute',
    left: -5,
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },


  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalGradientHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  modalHeaderTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 14,
  },
  detailCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCardContent: {
    flex: 1,
  },
  detailCardLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 6,
  },
  contactChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  whatsappChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
  },
  modalActions: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    gap: 8,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
