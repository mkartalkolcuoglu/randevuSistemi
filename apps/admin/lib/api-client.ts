class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('adminToken');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login';
          }
          throw new Error('Unauthorized');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth Methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  // Customers
  async getCustomers(page = 1, limit = 20, search?: string, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);

    return this.request(`/customers?${params.toString()}`);
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: any) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointments
  async getAppointments(page = 1, limit = 20, search?: string, status?: string, date?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    if (date && date !== 'all') params.append('date', date);

    return this.request(`/appointments?${params.toString()}`);
  }

  async getAppointment(id: string) {
    return this.request(`/appointments/${id}`);
  }

  async createAppointment(data: any) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id: string, data: any) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateAppointmentStatus(id: string, status: string) {
    return this.request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteAppointment(id: string) {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Services
  async getServices(page = 1, limit = 20, search?: string, category?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (category && category !== 'all') params.append('category', category);

    return this.request(`/services?${params.toString()}`);
  }

  async getService(id: string) {
    return this.request(`/services/${id}`);
  }

  async createService(data: any) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: any) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string) {
    return this.request(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Staff
  async getStaff(page = 1, limit = 20, search?: string, status?: string, specialization?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    if (specialization && specialization !== 'all') params.append('specialization', specialization);

    return this.request(`/staff?${params.toString()}`);
  }

  async getStaffMember(id: string) {
    return this.request(`/staff/${id}`);
  }

  async createStaffMember(data: any) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStaffMember(id: string, data: any) {
    return this.request(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStaffMember(id: string) {
    return this.request(`/staff/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks(page = 1, limit = 20, search?: string, status?: string, priority?: string, category?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    if (priority && priority !== 'all') params.append('priority', priority);
    if (category && category !== 'all') params.append('category', category);

    return this.request(`/tasks?${params.toString()}`);
  }

  async getTask(id: string) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Reports
  async getRevenueReport(period: string, tenantId?: string) {
    const params = new URLSearchParams({ period });
    if (tenantId) params.append('tenantId', tenantId);
    
    return this.request(`/reports/revenue?${params.toString()}`);
  }

  async getAppointmentReport(period: string, tenantId?: string) {
    const params = new URLSearchParams({ period });
    if (tenantId) params.append('tenantId', tenantId);
    
    return this.request(`/reports/appointments?${params.toString()}`);
  }

  async getCustomerReport(period: string, tenantId?: string) {
    const params = new URLSearchParams({ period });
    if (tenantId) params.append('tenantId', tenantId);
    
    return this.request(`/reports/customers?${params.toString()}`);
  }

  async getServiceReport(period: string, tenantId?: string) {
    const params = new URLSearchParams({ period });
    if (tenantId) params.append('tenantId', tenantId);
    
    return this.request(`/reports/services?${params.toString()}`);
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.request('/dashboard');
  }

  // Settings
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(data: any) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
