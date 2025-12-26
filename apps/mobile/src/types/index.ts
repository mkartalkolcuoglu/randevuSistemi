// User Types
export type UserType = 'customer' | 'staff' | 'owner';

export interface User {
  id: string;
  phone: string;
  userType: UserType;
  tenantId?: string;
  tenantName?: string;
  customerId?: string;
  staffId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
}

export interface Tenant {
  id: string;
  businessName: string;
  slug: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Authentication
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  selectedTenant: Tenant | null;
  availableTenants: Tenant[];
}

export interface OtpResponse {
  success: boolean;
  message: string;
  otpId?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  user?: User;
  tenants?: Tenant[];
  token?: string;
}

// Appointments
export interface Appointment {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  price: number;
  paymentType: PaymentType;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentType = 'cash' | 'card' | 'transfer';

// Services
export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  isActive: boolean;
}

// Staff
export interface Staff {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  avatar?: string;
  isActive: boolean;
  workingHours?: WorkingHours;
}

// Working Hours
export interface DayHours {
  start: string;
  end: string;
  closed: boolean;
}

export interface WorkingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

// Customer
export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'vip';
  isBlacklisted: boolean;
  noShowCount: number;
  createdAt: string;
}

// API Responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Notifications
export interface Notification {
  id: string;
  tenantId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Time Slot
export interface TimeSlot {
  time: string;
  available: boolean;
}
