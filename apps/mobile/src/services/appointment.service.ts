import api from './api';
import {
  Appointment,
  ApiResponse,
  PaginatedResponse,
  Service,
  Staff,
  TimeSlot,
  Customer,
} from '../types';

export const appointmentService = {
  /**
   * Get customer's appointments
   */
  async getMyAppointments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Appointment>> {
    try {
      console.log('📅 [getMyAppointments] Fetching appointments...');
      const response = await api.get('/api/mobile/appointments', { params });
      console.log('📅 [getMyAppointments] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('❌ [getMyAppointments] Error:', error.message);
      console.error('❌ [getMyAppointments] Status:', error.response?.status);
      console.error('❌ [getMyAppointments] Response data:', JSON.stringify(error.response?.data, null, 2));
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    }
  },

  /**
   * Get single appointment details
   */
  async getAppointment(id: string): Promise<ApiResponse<Appointment>> {
    try {
      const response = await api.get(`/api/mobile/appointments/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get appointment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Randevu bulunamadı',
      };
    }
  },

  /**
   * Create new appointment
   */
  async createAppointment(data: {
    tenantId: string;
    serviceId: string;
    staffId: string;
    date: string;
    time: string;
    notes?: string;
  }): Promise<ApiResponse<Appointment>> {
    try {
      const response = await api.post('/api/mobile/appointments', data, {
        headers: { 'X-Tenant-ID': data.tenantId }
      });
      return response.data;
    } catch (error: any) {
      console.error('Create appointment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Randevu oluşturulamadı',
      };
    }
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.patch(`/api/mobile/appointments/${id}`, {
        status: 'cancelled'
      });
      return response.data;
    } catch (error: any) {
      console.error('Cancel appointment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Randevu iptal edilemedi',
      };
    }
  },

  /**
   * Get available services for a tenant
   */
  async getServices(tenantId: string, includeInactive = false): Promise<ApiResponse<Service[]>> {
    try {
      const response = await api.get(`/api/mobile/services`, {
        params: { tenantId, ...(includeInactive ? { includeInactive: 'true' } : {}) },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get services error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Hizmetler yüklenemedi',
      };
    }
  },

  /**
   * Get available staff for a service
   */
  async getAvailableStaff(
    tenantId: string,
    serviceId?: string
  ): Promise<ApiResponse<Staff[]>> {
    try {
      const response = await api.get(`/api/mobile/staff`, {
        params: { tenantId, serviceId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get staff error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Personel listesi yüklenemedi',
      };
    }
  },

  /**
   * Get available time slots for a date
   */
  async getAvailableSlots(params: {
    tenantId: string;
    staffId: string;
    date: string;
    serviceId?: string;
  }): Promise<ApiResponse<TimeSlot[]>> {
    try {
      const response = await api.get('/api/mobile/appointments/available-slots', {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Get available slots error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Müsait saatler yüklenemedi',
      };
    }
  },

  // ============ STAFF FUNCTIONS ============

  /**
   * Get staff's appointments (for staff/owner users)
   */
  async getStaffAppointments(params?: {
    date?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Appointment>> {
    try {
      const response = await api.get('/api/mobile/staff/appointments', {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Get staff appointments error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    }
  },

  /**
   * Update appointment status (for staff/owner)
   */
  async updateAppointmentStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Appointment>> {
    try {
      console.log('📝 Updating appointment status:', { id, status });
      const response = await api.patch(`/api/mobile/appointments/${id}`, {
        status,
      });
      console.log('📝 Status update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Update appointment status error:', error);
      console.error('Error response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Durum güncellenemedi',
      };
    }
  },

  /**
   * Create appointment for customer (staff/owner)
   */
  async createAppointmentForCustomer(data: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceId: string;
    staffId: string;
    date: string;
    time: string;
    notes?: string;
    paymentType?: string;
  }): Promise<ApiResponse<Appointment>> {
    try {
      const response = await api.post('/api/mobile/staff/appointments', data);
      return response.data;
    } catch (error: any) {
      console.error('Create appointment for customer error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Randevu oluşturulamadı',
      };
    }
  },

  /**
   * Update appointment (staff/owner)
   */
  async updateAppointment(
    id: string,
    data: {
      serviceId?: string;
      staffId?: string;
      date?: string;
      time?: string;
      customerName?: string;
      customerPhone?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<Appointment>> {
    try {
      const response = await api.put(`/api/mobile/appointments/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update appointment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Randevu güncellenemedi',
      };
    }
  },

  /**
   * Delete appointment (staff/owner)
   */
  async deleteAppointment(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/api/mobile/appointments/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete appointment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Randevu silinemedi',
      };
    }
  },

  /**
   * Search customers for autocomplete (staff/owner)
   */
  async searchCustomers(search: string): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await api.get('/api/mobile/customers', {
        params: { search, limit: 10 },
      });
      return response.data;
    } catch (error: any) {
      console.error('Search customers error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Müşteri araması başarısız',
      };
    }
  },

  /**
   * Get tenant settings (working hours, appointment interval, etc.)
   */
  async getTenantSettings(): Promise<ApiResponse<{
    tenantId: string;
    businessName: string;
    workingHours: Record<string, { start: string; end: string; closed: boolean }>;
    appointmentTimeInterval: number;
    blacklistThreshold: number;
    reminderMinutes: number;
    blockedDates?: { id: string; title: string; startDate: string; endDate: string; staffId?: string | null }[];
  }>> {
    try {
      console.log('🔧 Fetching tenant settings...');
      const response = await api.get('/api/mobile/tenant-settings');
      console.log('🔧 Tenant settings response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('❌ Get tenant settings error:', error.message);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', JSON.stringify(error.response?.data, null, 2));
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Ayarlar yüklenemedi',
      };
    }
  },

  /**
   * Get staff appointments for a specific date (for conflict checking)
   */
  async getStaffAppointmentsForDate(
    staffId: string,
    date: string
  ): Promise<ApiResponse<Appointment[]>> {
    try {
      const response = await api.get('/api/mobile/staff/appointments', {
        params: { staffId, date },
      });
      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error: any) {
      console.error('Get staff appointments for date error:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Randevular yüklenemedi',
      };
    }
  },
};
