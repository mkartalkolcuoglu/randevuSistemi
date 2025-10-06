const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

class ApiClient {
  private baseURL: string;
  private tenantSlug: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setTenantSlug(slug: string) {
    this.tenantSlug = slug;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add tenant slug to headers if available
      if (this.tenantSlug) {
        (headers as any)['x-tenant-slug'] = this.tenantSlug;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Tenant API methods
  async getTenant(slug: string) {
    return this.request(`/auth/tenant/${slug}`);
  }

  // Services API methods
  async getServices(tenantSlug: string) {
    this.setTenantSlug(tenantSlug);
    return this.request('/services');
  }

  async getService(tenantSlug: string, serviceId: string) {
    this.setTenantSlug(tenantSlug);
    return this.request(`/services/${serviceId}`);
  }

  // Staff API methods
  async getStaff(tenantSlug: string) {
    this.setTenantSlug(tenantSlug);
    return this.request('/staff');
  }

  async getStaffMember(tenantSlug: string, staffId: string) {
    this.setTenantSlug(tenantSlug);
    return this.request(`/staff/${staffId}`);
  }

  // Appointments API methods
  async getAvailableSlots(tenantSlug: string, params: {
    serviceId: string;
    staffId?: string;
    date: string;
  }) {
    this.setTenantSlug(tenantSlug);
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/appointments/available-slots?${queryParams}`);
  }

  async createAppointment(tenantSlug: string, appointmentData: {
    serviceId: string;
    staffId?: string;
    startAt: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    notes?: string;
  }) {
    this.setTenantSlug(tenantSlug);
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async getAppointment(tenantSlug: string, appointmentId: string) {
    this.setTenantSlug(tenantSlug);
    return this.request(`/appointments/${appointmentId}`);
  }

  async cancelAppointment(tenantSlug: string, appointmentId: string, reason?: string) {
    this.setTenantSlug(tenantSlug);
    return this.request(`/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // OTP API methods
  async requestOTP(tenantSlug: string, data: { phone: string; email?: string }) {
    this.setTenantSlug(tenantSlug);
    return this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(tenantSlug: string, data: { phone: string; otp: string }) {
    this.setTenantSlug(tenantSlug);
    return this.request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payments API methods
  async createPayment(tenantSlug: string, paymentData: {
    amount: number;
    currency: string;
    description: string;
    appointmentId?: string;
    packageId?: string;
    successUrl: string;
    failUrl: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  }) {
    this.setTenantSlug(tenantSlug);
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async verifyPayment(tenantSlug: string, orderId: string, token?: string) {
    this.setTenantSlug(tenantSlug);
    const queryParams = token ? `?token=${token}` : '';
    return this.request(`/payments/verify/${orderId}${queryParams}`);
  }

  // Packages API methods
  async getPackages(tenantSlug: string) {
    this.setTenantSlug(tenantSlug);
    return this.request('/packages');
  }

  async getPackage(tenantSlug: string, packageId: string) {
    this.setTenantSlug(tenantSlug);
    return this.request(`/packages/${packageId}`);
  }

  async purchasePackage(tenantSlug: string, packageData: {
    packageId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    paymentData: {
      successUrl: string;
      failUrl: string;
    };
  }) {
    this.setTenantSlug(tenantSlug);
    return this.request('/packages/purchase', {
      method: 'POST',
      body: JSON.stringify(packageData),
    });
  }

  // Customer API methods
  async getCustomerAppointments(tenantSlug: string, phone: string) {
    this.setTenantSlug(tenantSlug);
    return this.request(`/customers/appointments?phone=${encodeURIComponent(phone)}`);
  }

  async getCustomerPackages(tenantSlug: string, phone: string) {
    this.setTenantSlug(tenantSlug);
    return this.request(`/customers/packages?phone=${encodeURIComponent(phone)}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
