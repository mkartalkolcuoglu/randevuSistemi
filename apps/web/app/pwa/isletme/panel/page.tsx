"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Menu,
  X,
  Bell,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Home,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Plus,
  BarChart3,
  Wallet,
  Phone,
  User,
  Scissors,
  RefreshCw,
  XCircle,
  AlertCircle,
  Search,
  UserPlus,
  Activity,
  DollarSign,
  Mail,
  Package,
  Star,
  CreditCard,
  Briefcase,
  LayoutGrid,
  List
} from "lucide-react";

// ==================== HELPERS ====================

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
};

const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700 border-green-200';
    case 'pending': case 'scheduled': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'no_show': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Tamamlandı';
    case 'pending': case 'scheduled': return 'Bekliyor';
    case 'cancelled': return 'İptal';
    case 'no_show': return 'Gelmedi';
    case 'confirmed': return 'Onaylandı';
    default: return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="w-4 h-4" />;
    case 'pending': case 'scheduled': return <Clock className="w-4 h-4" />;
    case 'cancelled': return <XCircle className="w-4 h-4" />;
    case 'no_show': return <AlertCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

// ==================== TYPES ====================

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tenantId: string;
  tenantName: string;
  userType: string;
}

interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  price: number;
  notes?: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  totalAppointments?: number;
  totalSpent?: number;
  lastVisit?: string;
  isBlacklisted?: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category?: string;
  isActive: boolean;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  position?: string;
  monthlyAppointments?: number;
  monthlyRevenue?: number;
}

interface PackageItem {
  id: string;
  itemType: string;
  itemId: string;
  itemName: string;
  quantity: number;
}

interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  items: PackageItem[];
  customerCount?: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  paymentType: string;
  customerName?: string;
  date: string;
  createdAt: string;
}

// ==================== MAIN COMPONENT ====================

export default function PWAIsletmePanel() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  // Auth
  const [user, setUser] = useState<UserData | null>(null);
  const [tenant, setTenant] = useState<{ businessName: string; id: string } | null>(null);
  const [authToken, setAuthToken] = useState<string>("");

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionSummary, setTransactionSummary] = useState({ income: 0, expense: 0, profit: 0 });

  // Stats
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCompleted: 0,
    todayPending: 0,
    todayRevenue: 0,
    weekTotal: 0,
    monthTotal: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
  });

  // Filters
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  // Modals
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);

  // New Appointment Form
  const [newAppointment, setNewAppointment] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    serviceId: '',
    staffId: '',
    date: getTodayDate(),
    time: '10:00',
    notes: ''
  });
  const [customerInputMode, setCustomerInputMode] = useState<'select' | 'new'>('select');

  // New Customer Form
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // ==================== API CALLS ====================

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-Tenant-ID': tenant?.id || '',
    };

    const response = await fetch(`/api/pwa${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    return response.json();
  }, [authToken, tenant?.id]);

  const fetchAllData = useCallback(async () => {
    if (!authToken || !tenant?.id) return;

    try {
      const [appointmentsRes, customersRes, servicesRes, staffRes, packagesRes, transactionsRes] = await Promise.all([
        apiCall('/appointments'),
        apiCall('/customers'),
        apiCall('/services'),
        apiCall('/staff'),
        apiCall('/packages'),
        apiCall('/transactions'),
      ]);

      if (appointmentsRes.success) {
        setAppointments(appointmentsRes.data || []);
      }
      if (customersRes.success) {
        setCustomers(customersRes.data || []);
      }
      if (servicesRes.success) {
        setServices(servicesRes.data || []);
      }
      if (staffRes.success) {
        setStaffList(staffRes.data || []);
      }
      if (packagesRes.success) {
        setPackages(packagesRes.data || []);
      }
      if (transactionsRes.success) {
        setTransactions(transactionsRes.data || []);
        if (transactionsRes.summary) {
          setTransactionSummary(transactionsRes.summary);
        }
      }
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [apiCall, authToken, tenant?.id]);

  const calculateStats = useCallback((appts: Appointment[], custs: Customer[]) => {
    const today = getTodayDate();
    const todayAppts = appts.filter(apt => apt.date === today);
    const pendingCount = todayAppts.filter(apt => ['pending', 'scheduled', 'confirmed'].includes(apt.status)).length;
    const completedToday = todayAppts.filter(apt => apt.status === 'completed').length;
    const todayRevenue = todayAppts
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.price || 0), 0);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weekTotal = appts.filter(apt => new Date(apt.date) >= weekAgo).length;
    const monthTotal = appts.filter(apt => new Date(apt.date) >= monthAgo).length;
    const monthlyRevenue = appts
      .filter(apt => new Date(apt.date) >= monthAgo && apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.price || 0), 0);

    setStats({
      todayTotal: todayAppts.length,
      todayCompleted: completedToday,
      todayPending: pendingCount,
      todayRevenue,
      weekTotal,
      monthTotal,
      totalCustomers: custs.length,
      monthlyRevenue,
    });
  }, []);

  useEffect(() => {
    calculateStats(appointments, customers);
  }, [appointments, customers, calculateStats]);

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const res = await apiCall(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      if (res.success) {
        setAppointments(prev => prev.map(apt =>
          apt.id === id ? { ...apt, status } : apt
        ));
        setShowAppointmentModal(false);
      }
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
    }
  };

  const createAppointment = async () => {
    // Validasyon - mevcut müşteri veya yeni müşteri bilgisi gerekli
    if (customerInputMode === 'select' && !newAppointment.customerId) {
      setFormError('Lütfen bir müşteri seçin');
      return;
    }

    if (customerInputMode === 'new') {
      if (!newAppointment.customerPhone) {
        setFormError('Müşteri telefon numarası zorunludur');
        return;
      }
      if (!newAppointment.customerName) {
        setFormError('Müşteri adı zorunludur');
        return;
      }
    }

    if (!newAppointment.serviceId || !newAppointment.staffId) {
      setFormError('Lütfen hizmet ve personel seçin');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const selectedService = services.find(s => s.id === newAppointment.serviceId);

      // API'ye gönderilecek data
      const appointmentData: any = {
        serviceId: newAppointment.serviceId,
        staffId: newAppointment.staffId,
        date: newAppointment.date,
        time: newAppointment.time,
        notes: newAppointment.notes,
        duration: selectedService?.duration || 30,
        price: selectedService?.price || 0
      };

      // Mevcut müşteri seçildiyse customerId gönder
      if (customerInputMode === 'select' && newAppointment.customerId) {
        appointmentData.customerId = newAppointment.customerId;
      }

      // Yeni müşteri bilgisi girildiyse customerName ve customerPhone gönder
      if (customerInputMode === 'new') {
        appointmentData.customerName = newAppointment.customerName;
        appointmentData.customerPhone = newAppointment.customerPhone;
      }

      const res = await apiCall('/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData),
      });

      if (res.success) {
        await fetchAllData();
        setShowNewAppointmentModal(false);
        setNewAppointment({
          customerId: '',
          customerName: '',
          customerPhone: '',
          serviceId: '',
          staffId: '',
          date: getTodayDate(),
          time: '10:00',
          notes: ''
        });
        setCustomerInputMode('select');
      } else {
        setFormError(res.message || res.error || 'Randevu oluşturulamadı');
      }
    } catch (error) {
      console.error('Randevu oluşturma hatası:', error);
      setFormError('Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createCustomer = async () => {
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.phone) {
      setFormError('Lütfen zorunlu alanları doldurun');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await apiCall('/customers', {
        method: 'POST',
        body: JSON.stringify(newCustomer),
      });

      if (res.success) {
        await fetchAllData();
        setShowNewCustomerModal(false);
        setNewCustomer({ firstName: '', lastName: '', phone: '', email: '' });
      } else {
        setFormError(res.error || 'Müşteri oluşturulamadı');
      }
    } catch (error) {
      console.error('Müşteri oluşturma hatası:', error);
      setFormError('Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCustomer = async () => {
    if (!selectedCustomer) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await apiCall(`/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: newCustomer.firstName || selectedCustomer.firstName,
          lastName: newCustomer.lastName || selectedCustomer.lastName,
          phone: newCustomer.phone || selectedCustomer.phone,
          email: newCustomer.email || selectedCustomer.email
        }),
      });

      if (res.success) {
        await fetchAllData();
        setShowEditCustomerModal(false);
        setShowCustomerModal(false);
        setNewCustomer({ firstName: '', lastName: '', phone: '', email: '' });
      } else {
        setFormError(res.error || 'Müşteri güncellenemedi');
      }
    } catch (error) {
      console.error('Müşteri güncelleme hatası:', error);
      setFormError('Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditCustomerModal = () => {
    if (selectedCustomer) {
      setNewCustomer({
        firstName: selectedCustomer.firstName,
        lastName: selectedCustomer.lastName,
        phone: selectedCustomer.phone,
        email: selectedCustomer.email || ''
      });
      setShowCustomerModal(false);
      setShowEditCustomerModal(true);
    }
  };

  const openNewAppointmentFromCustomer = () => {
    if (selectedCustomer) {
      setNewAppointment(prev => ({
        ...prev,
        customerId: selectedCustomer.id
      }));
      setShowCustomerModal(false);
      setShowNewAppointmentModal(true);
    }
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);

    const token = localStorage.getItem("pwa-auth-token");
    const savedUser = localStorage.getItem("pwa-user");

    if (!token || !savedUser) {
      router.replace("/pwa/isletme");
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setAuthToken(token);
      setTenant({
        businessName: userData.tenantName || "İşletme",
        id: userData.tenantId
      });
    } catch (e) {
      router.replace("/pwa/isletme");
    }
  }, [router]);

  useEffect(() => {
    if (authToken && tenant?.id) {
      fetchAllData();
    }
  }, [authToken, tenant?.id, fetchAllData]);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem("pwa-auth-token");
    localStorage.removeItem("pwa-user");
    localStorage.removeItem("pwa-user-role");
    router.replace("/pwa");
  };

  // ==================== FILTERED DATA ====================

  const filteredAppointments = appointments.filter(apt => {
    const matchesDate = apt.date === selectedDate;
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesSearch = !searchQuery ||
      apt.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.serviceName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesStatus && matchesSearch;
  }).sort((a, b) => a.time.localeCompare(b.time));

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
           c.phone?.includes(searchQuery) ||
           c.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const upcomingAppointments = appointments
    .filter(apt => {
      const today = getTodayDate();
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (['completed', 'cancelled', 'no_show'].includes(apt.status)) return false;
      if (apt.date > today) return true;
      if (apt.date === today && apt.time >= currentTime) return true;
      return false;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    })
    .slice(0, 5);

  // ==================== LOADING ====================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER SECTIONS ====================

  const renderHome = () => (
    <div className="space-y-6">
      {/* Hızlı İşlemler */}
      <div>
        <h2 className="text-gray-800 font-semibold mb-3 px-1">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowNewAppointmentModal(true)}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-left active:scale-[0.98] transition-all shadow-sm"
          >
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-gray-800 font-semibold text-sm">Yeni Randevu</p>
            <p className="text-gray-400 text-xs mt-0.5">Hızlı randevu oluştur</p>
          </button>

          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-left active:scale-[0.98] transition-all shadow-sm"
          >
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <UserPlus className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-gray-800 font-semibold text-sm">Müşteri Ekle</p>
            <p className="text-gray-400 text-xs mt-0.5">Yeni müşteri kaydı</p>
          </button>
        </div>
      </div>

      {/* Yaklaşan Randevular */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-gray-800 font-semibold">Yaklaşan Randevular</h2>
          <button
            onClick={() => setActiveTab("appointments")}
            className="text-blue-600 text-sm font-medium flex items-center gap-1"
          >
            Tümü <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => { setSelectedAppointment(apt); setShowAppointmentModal(true); }}
                className="bg-white border border-gray-200 rounded-2xl p-4 active:scale-[0.99] transition-all shadow-sm cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-gray-900 font-semibold truncate">{apt.customerName}</p>
                        <p className="text-gray-500 text-sm truncate">{apt.serviceName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gray-900 font-bold text-lg">{formatTime(apt.time)}</p>
                        <p className="text-gray-400 text-xs">
                          {apt.date === getTodayDate() ? "Bugün" : formatDateShort(apt.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500 text-xs">{apt.staffName}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                        {getStatusIcon(apt.status)}
                        {getStatusText(apt.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500">Yaklaşan randevu bulunmuyor</p>
          </div>
        )}
      </div>

      {/* Günlük Gelir */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-5 shadow-lg shadow-green-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium">Bugünkü Gelir</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(stats.todayRevenue)}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-gray-500 text-xs font-medium">Bu Hafta</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.weekTotal}</p>
          <p className="text-gray-400 text-xs">randevu</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-gray-500 text-xs font-medium">Müşteriler</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
          <p className="text-gray-400 text-xs">toplam</p>
        </div>
      </div>
    </div>
  );

  // Calendar view helper: generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get appointments for a specific staff and time
  const getAppointmentForSlot = (staffId: string, time: string) => {
    return filteredAppointments.find(apt => {
      if (apt.staffId !== staffId) return false;
      const aptTime = apt.time.substring(0, 5);
      const aptHour = parseInt(aptTime.split(':')[0]);
      const aptMinute = parseInt(aptTime.split(':')[1]);
      const slotHour = parseInt(time.split(':')[0]);
      const slotMinute = parseInt(time.split(':')[1]);

      const aptStartMinutes = aptHour * 60 + aptMinute;
      const slotStartMinutes = slotHour * 60 + slotMinute;
      const aptEndMinutes = aptStartMinutes + (apt.duration || 30);

      return slotStartMinutes >= aptStartMinutes && slotStartMinutes < aptEndMinutes;
    });
  };

  // Check if this is the start time of an appointment
  const isAppointmentStart = (staffId: string, time: string) => {
    return filteredAppointments.find(apt => {
      if (apt.staffId !== staffId) return false;
      const aptTime = apt.time.substring(0, 5);
      return aptTime === time;
    });
  };

  // Get row span based on duration
  const getRowSpan = (duration: number) => {
    return Math.ceil(duration / 30);
  };

  const renderAppointments = () => (
    <div className="space-y-4">
      {/* Date Navigator with View Toggle */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <p className="text-gray-900 font-semibold pointer-events-none">{formatDate(selectedDate)}</p>
            <p className="text-gray-400 text-xs pointer-events-none">
              {selectedDate === getTodayDate() ? 'Bugün' : 'Tarih seçmek için tıkla'}
            </p>
          </div>
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Quick Date Buttons */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 overflow-x-auto">
          <button
            onClick={() => setSelectedDate(getTodayDate())}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedDate === getTodayDate()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Bugün
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0]
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Yarın
          </button>
          {[...Array(5)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i + 2);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
            const dayNum = d.getDate();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedDate === dateStr
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {dayName} {dayNum}
              </button>
            );
          })}
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mt-3 pt-3 border-t border-gray-100">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "calendar"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Takvim
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === status
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {status === 'all' ? 'Tümü' : getStatusText(status)}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Staff Header */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                <div className="w-16 flex-shrink-0 p-2 border-r border-gray-200 bg-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Saat</span>
                </div>
                {staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex-1 min-w-[120px] p-2 border-r border-gray-200 last:border-r-0 text-center"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-white text-xs font-bold">
                        {staff.firstName?.charAt(0)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 truncate">{staff.firstName}</p>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="max-h-[60vh] overflow-y-auto">
                {timeSlots.map((time, timeIndex) => {
                  const isHour = time.endsWith(':00');
                  return (
                    <div
                      key={time}
                      className={`flex border-b border-gray-100 ${isHour ? 'bg-gray-50/50' : ''}`}
                    >
                      <div className={`w-16 flex-shrink-0 p-2 border-r border-gray-200 ${isHour ? 'bg-gray-100/50' : ''}`}>
                        <span className={`text-xs ${isHour ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {time}
                        </span>
                      </div>
                      {staffList.map((staff) => {
                        const appointment = isAppointmentStart(staff.id, time);
                        const hasAppointment = getAppointmentForSlot(staff.id, time);

                        if (appointment) {
                          const rowSpan = getRowSpan(appointment.duration || 30);
                          return (
                            <div
                              key={staff.id}
                              className="flex-1 min-w-[120px] p-1 border-r border-gray-100 last:border-r-0 relative"
                              style={{ minHeight: '40px' }}
                            >
                              <div
                                onClick={() => { setSelectedAppointment(appointment); setShowAppointmentModal(true); }}
                                className={`absolute left-1 right-1 rounded-lg p-2 cursor-pointer transition-all active:scale-[0.98] overflow-hidden ${
                                  appointment.status === 'completed' ? 'bg-green-100 border-l-4 border-green-500' :
                                  appointment.status === 'cancelled' ? 'bg-red-100 border-l-4 border-red-500' :
                                  appointment.status === 'confirmed' ? 'bg-blue-100 border-l-4 border-blue-500' :
                                  'bg-amber-100 border-l-4 border-amber-500'
                                }`}
                                style={{
                                  height: `${rowSpan * 40 - 8}px`,
                                  zIndex: 5
                                }}
                              >
                                <p className="text-xs font-semibold text-gray-800 truncate">
                                  {appointment.customerName}
                                </p>
                                <p className="text-[10px] text-gray-600 truncate">
                                  {appointment.serviceName}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-[10px] text-gray-500">
                                    {formatTime(appointment.time)} - {appointment.duration}dk
                                  </span>
                                </div>
                                {appointment.price > 0 && (
                                  <p className="text-[10px] font-semibold text-green-600 mt-1">
                                    {formatCurrency(appointment.price)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        } else if (hasAppointment) {
                          // This slot is occupied by an ongoing appointment
                          return (
                            <div
                              key={staff.id}
                              className="flex-1 min-w-[120px] p-1 border-r border-gray-100 last:border-r-0"
                              style={{ minHeight: '40px' }}
                            />
                          );
                        } else {
                          // Empty slot
                          return (
                            <div
                              key={staff.id}
                              className="flex-1 min-w-[120px] p-1 border-r border-gray-100 last:border-r-0 hover:bg-blue-50 transition-colors cursor-pointer"
                              style={{ minHeight: '40px' }}
                              onClick={() => {
                                setNewAppointment(prev => ({
                                  ...prev,
                                  staffId: staff.id,
                                  date: selectedDate,
                                  time: time
                                }));
                                setShowNewAppointmentModal(true);
                              }}
                            />
                          );
                        }
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-3 justify-center text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-100 border-l-2 border-amber-500 rounded-sm"></div>
                <span className="text-gray-600">Bekliyor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-100 border-l-2 border-blue-500 rounded-sm"></div>
                <span className="text-gray-600">Onaylandı</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-100 border-l-2 border-green-500 rounded-sm"></div>
                <span className="text-gray-600">Tamamlandı</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-100 border-l-2 border-red-500 rounded-sm"></div>
                <span className="text-gray-600">İptal</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        filteredAppointments.length > 0 ? (
          <div className="space-y-3">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => { setSelectedAppointment(apt); setShowAppointmentModal(true); }}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    apt.status === 'completed' ? 'bg-green-100' :
                    apt.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <Clock className={`w-6 h-6 ${
                      apt.status === 'completed' ? 'text-green-600' :
                      apt.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-gray-900 font-semibold truncate">{apt.customerName}</p>
                        <p className="text-gray-500 text-sm">{apt.serviceName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gray-900 font-bold text-lg">{formatTime(apt.time)}</p>
                        <p className="text-gray-400 text-xs">{apt.duration} dk</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-500 text-xs">{apt.staffName}</span>
                        </div>
                        {apt.customerPhone && (
                          <a
                            href={`tel:${apt.customerPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-blue-600"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                        {getStatusIcon(apt.status)}
                        {getStatusText(apt.status)}
                      </span>
                    </div>
                    {apt.price > 0 && (
                      <div className="mt-2 text-right">
                        <span className="text-green-600 font-bold">{formatCurrency(apt.price)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">Bu tarihte randevu bulunmuyor</p>
            <button
              onClick={() => setShowNewAppointmentModal(true)}
              className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 active:scale-95 transition-transform"
            >
              Randevu Ekle
            </button>
          </div>
        )
      )}

      {/* FAB */}
      <button
        onClick={() => setShowNewAppointmentModal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-600/40 active:scale-95 transition-transform z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length > 0 ? (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => { setSelectedCustomer(customer); setShowCustomerModal(true); }}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  customer.isBlacklisted ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <span className={`text-lg font-bold ${
                    customer.isBlacklisted ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold truncate">
                    {customer.firstName} {customer.lastName}
                    {customer.isBlacklisted && (
                      <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Kara Liste</span>
                    )}
                  </p>
                  <p className="text-gray-500 text-sm">{customer.phone}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              {(customer.totalAppointments !== undefined || customer.totalSpent !== undefined) && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
                  {customer.totalAppointments !== undefined && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {customer.totalAppointments} randevu
                    </div>
                  )}
                  {customer.totalSpent !== undefined && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Wallet className="w-3.5 h-3.5" />
                      {formatCurrency(customer.totalSpent)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">
            {searchQuery ? 'Müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
          </p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowNewCustomerModal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-purple-600/40 active:scale-95 transition-transform z-30"
      >
        <UserPlus className="w-6 h-6 text-white" />
      </button>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <h2 className="text-gray-800 font-semibold px-1">Raporlar ve İstatistikler</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Aylık Gelir</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Aylık Randevu</span>
          </div>
          <p className="text-2xl font-bold">{stats.monthTotal}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Users className="w-4 h-4" />
            <span className="text-xs">Toplam Müşteri</span>
          </div>
          <p className="text-2xl font-bold">{customers.length}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Activity className="w-4 h-4" />
            <span className="text-xs">Bugün</span>
          </div>
          <p className="text-2xl font-bold">{stats.todayTotal}</p>
        </div>
      </div>

      {/* Services Performance */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <h3 className="text-gray-800 font-semibold mb-4">Popüler Hizmetler</h3>
        {services.slice(0, 5).map((service, index) => (
          <div key={service.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                index === 0 ? 'bg-amber-100 text-amber-600' :
                index === 1 ? 'bg-gray-100 text-gray-600' :
                index === 2 ? 'bg-orange-100 text-orange-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <span className="text-sm font-bold">{index + 1}</span>
              </div>
              <div>
                <p className="text-gray-800 font-medium text-sm">{service.name}</p>
                <p className="text-gray-400 text-xs">{service.duration} dk</p>
              </div>
            </div>
            <p className="text-gray-800 font-semibold">{formatCurrency(service.price)}</p>
          </div>
        ))}
      </div>

      {/* Staff Performance */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <h3 className="text-gray-800 font-semibold mb-4">Personel Performansı</h3>
        {staffList.slice(0, 5).map((staff) => (
          <div key={staff.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">
                  {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-gray-800 font-medium text-sm">{staff.firstName} {staff.lastName}</p>
                <p className="text-gray-400 text-xs">{staff.monthlyAppointments || 0} randevu</p>
              </div>
            </div>
            <p className="text-green-600 font-semibold">{formatCurrency(staff.monthlyRevenue || 0)}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-gray-800 font-semibold">Hizmetler</h2>
        <span className="text-gray-400 text-sm">{services.length} hizmet</span>
      </div>

      {services.length > 0 ? (
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    service.isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Scissors className={`w-6 h-6 ${service.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{service.name}</p>
                    <p className="text-gray-500 text-sm">{service.duration} dakika</p>
                    {service.category && (
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {service.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-bold text-lg">{formatCurrency(service.price)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    service.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {service.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Henüz hizmet eklenmemiş</p>
        </div>
      )}
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-gray-800 font-semibold">Personel</h2>
        <span className="text-gray-400 text-sm">{staffList.length} personel</span>
      </div>

      {staffList.length > 0 ? (
        <div className="space-y-3">
          {staffList.map((staff) => (
            <div
              key={staff.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg font-bold">
                    {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold">{staff.firstName} {staff.lastName}</p>
                  {staff.position && (
                    <p className="text-gray-500 text-sm">{staff.position}</p>
                  )}
                  <div className="flex gap-3 mt-1">
                    {staff.phone && (
                      <a href={`tel:${staff.phone}`} className="text-blue-600 text-xs flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {staff.phone}
                      </a>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Henüz personel eklenmemiş</p>
        </div>
      )}
    </div>
  );

  const renderPackages = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-gray-800 font-semibold">Paketler</h2>
        <span className="text-gray-400 text-sm">{packages.length} paket</span>
      </div>

      {packages.length > 0 ? (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    pkg.isActive ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <Package className={`w-6 h-6 ${pkg.isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{pkg.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-bold text-lg">{formatCurrency(pkg.price)}</p>
                </div>
              </div>

              {pkg.items && pkg.items.length > 0 && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-gray-500 text-xs mb-2">Paket İçeriği:</p>
                  <div className="flex flex-wrap gap-2">
                    {pkg.items.map((item) => (
                      <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {item.itemName} x{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  pkg.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {pkg.isActive ? 'Aktif' : 'Pasif'}
                </span>
                {pkg.customerCount !== undefined && (
                  <span className="text-gray-400 text-xs">{pkg.customerCount} müşteri</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Henüz paket eklenmemiş</p>
        </div>
      )}
    </div>
  );

  const renderKasa = () => (
    <div className="space-y-4">
      <h2 className="text-gray-800 font-semibold px-1">Kasa</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3 text-white shadow-lg">
          <p className="text-white/80 text-xs">Gelir</p>
          <p className="text-lg font-bold">{formatCurrency(transactionSummary.income)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-3 text-white shadow-lg">
          <p className="text-white/80 text-xs">Gider</p>
          <p className="text-lg font-bold">{formatCurrency(transactionSummary.expense)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 text-white shadow-lg">
          <p className="text-white/80 text-xs">Kar</p>
          <p className="text-lg font-bold">{formatCurrency(transactionSummary.profit)}</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-gray-800 font-semibold">Son İşlemler</h3>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'expense' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {tx.type === 'expense' ? (
                      <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{tx.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{tx.date}</span>
                      {tx.customerName && <span>• {tx.customerName}</span>}
                    </div>
                  </div>
                </div>
                <p className={`font-bold ${tx.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                  {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500">Henüz işlem bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-4">
      <h2 className="text-gray-800 font-semibold px-1">Performans</h2>

      {/* Staff Performance Cards */}
      <div className="space-y-3">
        {staffList.map((staff) => (
          <div
            key={staff.id}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">
                  {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-gray-900 font-semibold">{staff.firstName} {staff.lastName}</p>
                {staff.position && <p className="text-gray-500 text-sm">{staff.position}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{staff.monthlyAppointments || 0}</p>
                <p className="text-gray-500 text-xs">Randevu</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(staff.monthlyRevenue || 0)}</p>
                <p className="text-gray-500 text-xs">Gelir</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {staffList.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Performans verisi bulunmuyor</p>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <h2 className="text-gray-800 font-semibold px-1">Ayarlar</h2>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-blue-600 text-xl font-bold">
                {user?.firstName?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{user?.firstName} {user?.lastName}</p>
              <p className="text-white/80 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors active:bg-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium">Profil Bilgileri</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100 active:bg-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium">Bildirimler</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => router.push("/pwa/isletme/ayarlar")}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100 active:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium">İşletme Ayarları</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors border-t border-gray-100 active:bg-red-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-red-600 font-medium">Çıkış Yap</span>
          </div>
        </button>
      </div>

      <p className="text-center text-gray-400 text-xs mt-8">
        Net Randevu PWA v1.0.0
      </p>
    </div>
  );

  // ==================== MODALS ====================

  const AppointmentModal = () => {
    if (!selectedAppointment || !showAppointmentModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Randevu Detayı</h3>
            <button
              onClick={() => setShowAppointmentModal(false)}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">{selectedAppointment.customerName}</p>
                  {selectedAppointment.customerPhone && (
                    <a href={`tel:${selectedAppointment.customerPhone}`} className="text-blue-600 text-sm">
                      {selectedAppointment.customerPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Hizmet</span>
                <span className="text-gray-900 font-medium">{selectedAppointment.serviceName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Personel</span>
                <span className="text-gray-900 font-medium">{selectedAppointment.staffName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Tarih</span>
                <span className="text-gray-900 font-medium">{formatDate(selectedAppointment.date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Saat</span>
                <span className="text-gray-900 font-medium">{formatTime(selectedAppointment.time)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Süre</span>
                <span className="text-gray-900 font-medium">{selectedAppointment.duration} dakika</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Ücret</span>
                <span className="text-green-600 font-bold">{formatCurrency(selectedAppointment.price)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Durum</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedAppointment.status)}`}>
                  {getStatusText(selectedAppointment.status)}
                </span>
              </div>
            </div>

            {!['completed', 'cancelled'].includes(selectedAppointment.status) && (
              <div className="pt-4 space-y-2">
                <p className="text-gray-500 text-sm mb-2">Durumu Değiştir:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                    className="py-3 bg-green-600 text-white rounded-xl font-medium active:scale-95 transition-transform"
                  >
                    Tamamlandı
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, 'no_show')}
                    className="py-3 bg-gray-600 text-white rounded-xl font-medium active:scale-95 transition-transform"
                  >
                    Gelmedi
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, 'cancelled')}
                    className="py-3 bg-red-600 text-white rounded-xl font-medium active:scale-95 transition-transform col-span-2"
                  >
                    İptal Et
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CustomerModal = () => {
    if (!selectedCustomer || !showCustomerModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Müşteri Detayı</h3>
            <button
              onClick={() => setShowCustomerModal(false)}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 ${
                selectedCustomer.isBlacklisted ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <span className={`text-2xl font-bold ${
                  selectedCustomer.isBlacklisted ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {selectedCustomer.firstName?.charAt(0)}{selectedCustomer.lastName?.charAt(0)}
                </span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </h4>
              {selectedCustomer.isBlacklisted && (
                <span className="inline-block mt-2 text-xs text-red-600 bg-red-100 px-3 py-1 rounded-full">
                  Kara Listede
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-3 text-blue-600">
                <Phone className="w-5 h-5" />
                <span>{selectedCustomer.phone}</span>
              </a>
              {selectedCustomer.email && (
                <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-3 text-blue-600">
                  <Mail className="w-5 h-5" />
                  <span>{selectedCustomer.email}</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{selectedCustomer.totalAppointments || 0}</p>
                <p className="text-gray-500 text-sm">Toplam Randevu</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.totalSpent || 0)}</p>
                <p className="text-gray-500 text-sm">Toplam Harcama</p>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={openNewAppointmentFromCustomer}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium active:scale-95 transition-transform"
              >
                Randevu Oluştur
              </button>
              <button
                onClick={openEditCustomerModal}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-95 transition-transform"
              >
                Düzenle
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== NEW APPOINTMENT MODAL ====================

  const NewAppointmentModal = () => {
    if (!showNewAppointmentModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Yeni Randevu</h3>
            <button
              onClick={() => { setShowNewAppointmentModal(false); setFormError(''); }}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {formError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {formError}
              </div>
            )}

            {/* Müşteri Seçim Modu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri *</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerInputMode('select');
                    setNewAppointment(prev => ({ ...prev, customerName: '', customerPhone: '' }));
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                    customerInputMode === 'select'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Mevcut Müşteri
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerInputMode('new');
                    setNewAppointment(prev => ({ ...prev, customerId: '' }));
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                    customerInputMode === 'new'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Yeni Müşteri
                </button>
              </div>

              {customerInputMode === 'select' ? (
                <select
                  value={newAppointment.customerId}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, customerId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Müşteri seçin</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.phone}</option>
                  ))}
                </select>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Müşteri Adı Soyadı *"
                    value={newAppointment.customerName}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon Numarası * (5XX XXX XX XX)"
                    value={newAppointment.customerPhone}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500">
                    Telefon numarası sistemde kayıtlıysa mevcut müşteriye bağlanır, değilse yeni müşteri oluşturulur.
                  </p>
                </div>
              )}
            </div>

            {/* Hizmet Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hizmet *</label>
              <select
                value={newAppointment.serviceId}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, serviceId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Hizmet seçin</option>
                {services.filter(s => s.isActive).map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</option>
                ))}
              </select>
            </div>

            {/* Personel Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personel *</label>
              <select
                value={newAppointment.staffId}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, staffId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Personel seçin</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                ))}
              </select>
            </div>

            {/* Tarih */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tarih *</label>
              <input
                type="date"
                value={newAppointment.date}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Saat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saat *</label>
              <input
                type="time"
                value={newAppointment.time}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Not */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Not (İsteğe bağlı)</label>
              <textarea
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Eklemek istediğiniz notlar..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={createAppointment}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== NEW CUSTOMER MODAL ====================

  const NewCustomerModal = () => {
    if (!showNewCustomerModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Yeni Müşteri</h3>
            <button
              onClick={() => { setShowNewCustomerModal(false); setFormError(''); }}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {formError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
              <input
                type="text"
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Müşteri adı"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
              <input
                type="text"
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Müşteri soyadı"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="5xx xxx xx xx"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-posta (İsteğe bağlı)</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ornek@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={createCustomer}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Müşteri Oluştur'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== EDIT CUSTOMER MODAL ====================

  const EditCustomerModal = () => {
    if (!showEditCustomerModal || !selectedCustomer) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Müşteri Düzenle</h3>
            <button
              onClick={() => { setShowEditCustomerModal(false); setFormError(''); }}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {formError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ad *</label>
              <input
                type="text"
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soyad *</label>
              <input
                type="text"
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={updateCustomer}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RETURN ====================

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 shadow-2xl ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 pt-12">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-blue-600 text-xl font-bold">
                {user?.firstName?.charAt(0)}
              </span>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="text-white/80 p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <h3 className="text-white font-semibold text-lg">{user?.firstName} {user?.lastName}</h3>
          <p className="text-white/70 text-sm">{tenant?.businessName}</p>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          <div className="space-y-1">
            {[
              { id: 'home', icon: Home, label: 'Ana Sayfa' },
              { id: 'appointments', icon: Calendar, label: 'Randevular' },
              { id: 'customers', icon: Users, label: 'Müşteriler' },
              { id: 'services', icon: Scissors, label: 'Hizmetler' },
              { id: 'staff', icon: Briefcase, label: 'Personel' },
              { id: 'packages', icon: Package, label: 'Paketler' },
              { id: 'kasa', icon: CreditCard, label: 'Kasa' },
              { id: 'reports', icon: BarChart3, label: 'Raporlar' },
              { id: 'performance', icon: Star, label: 'Performans' },
              { id: 'settings', icon: Settings, label: 'Ayarlar' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setDrawerOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === item.id ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-12 pb-6 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1 mx-4">
            <h1 className="text-white text-lg font-bold">{getGreeting()}, {user?.firstName}</h1>
            <p className="text-white/70 text-sm">{tenant?.businessName}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 text-sm font-medium">Bugünün Özeti</span>
            <span className="text-gray-400 text-xs">{formatDate(getTodayDate())}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.todayTotal}</p>
              <p className="text-gray-500 text-xs">Toplam</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-3xl font-bold text-green-600">{stats.todayCompleted}</p>
              <p className="text-gray-500 text-xs">Tamamlanan</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">{stats.todayPending}</p>
              <p className="text-gray-500 text-xs">Bekleyen</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-1 px-5 py-6 overflow-y-auto transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {activeTab === "home" && renderHome()}
        {activeTab === "appointments" && renderAppointments()}
        {activeTab === "customers" && renderCustomers()}
        {activeTab === "services" && renderServices()}
        {activeTab === "staff" && renderStaff()}
        {activeTab === "packages" && renderPackages()}
        {activeTab === "kasa" && renderKasa()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "performance" && renderPerformance()}
        {activeTab === "settings" && renderSettings()}
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around">
          {[
            { id: 'home', icon: Home, label: 'Ana Sayfa' },
            { id: 'appointments', icon: Calendar, label: 'Randevular' },
            { id: 'customers', icon: Users, label: 'Müşteriler' },
            { id: 'reports', icon: BarChart3, label: 'Raporlar' },
            { id: 'settings', icon: Settings, label: 'Ayarlar' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
                activeTab === item.id ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <item.icon className={`w-6 h-6 ${activeTab === item.id ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AppointmentModal />
      <CustomerModal />
      <NewAppointmentModal />
      <NewCustomerModal />
      <EditCustomerModal />
    </div>
  );
}
