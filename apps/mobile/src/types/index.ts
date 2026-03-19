// User Types
export type UserType = 'customer' | 'staff' | 'owner';

// Permission types for staff members
export type PagePermission = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type StaffPermissions = {
  dashboard: PagePermission;
  appointments: PagePermission;
  customers: PagePermission;
  services: PagePermission;
  staff: PagePermission;
  packages: PagePermission;
  kasa: PagePermission;
  stock: PagePermission;
  reports: PagePermission;
  settings: PagePermission;
};

export interface User {
  id: string | null;
  phone: string;
  userType: UserType;
  tenantId?: string | null;
  tenantName?: string | null;
  customerId?: string;
  staffId?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatar?: string;
  isNewCustomer?: boolean;
  permissions?: StaffPermissions | null;
  subscriptionEnd?: string | null;
  subscriptionPlan?: string | null;
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
  isGuestMode: boolean;
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
  tenantName?: string;
  tenantStatus?: 'active' | 'inactive' | 'deleted';
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  serviceName: string;
  serviceColor?: string;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  price: number;
  paymentType: PaymentType;
  extraCharge?: number;
  extraChargeNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'scheduled'
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
  color?: string;
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

// Default restricted permissions for staff with no permissions set
const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  dashboard: { read: true, create: false, update: false, delete: false },
  appointments: { read: true, create: true, update: true, delete: false },
  customers: { read: true, create: true, update: true, delete: false },
  services: { read: true, create: false, update: false, delete: false },
  staff: { read: false, create: false, update: false, delete: false },
  packages: { read: false, create: false, update: false, delete: false },
  kasa: { read: false, create: false, update: false, delete: false },
  stock: { read: true, create: false, update: false, delete: false },
  reports: { read: false, create: false, update: false, delete: false },
  settings: { read: false, create: false, update: false, delete: false },
};

// Helper function to check if user has permission
export function hasPermission(
  permissions: StaffPermissions | null | undefined,
  page: keyof StaffPermissions,
  action: keyof PagePermission
): boolean {
  const effectivePermissions = permissions || DEFAULT_STAFF_PERMISSIONS;
  return effectivePermissions[page]?.[action] ?? false;
}

// Check if user can access a page (at least read permission)
export function canAccessPage(
  permissions: StaffPermissions | null | undefined,
  page: keyof StaffPermissions
): boolean {
  return hasPermission(permissions, page, 'read');
}
