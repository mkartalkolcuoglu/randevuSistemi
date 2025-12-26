import api from './api';
import {
  Appointment,
  ApiResponse,
  PaginatedResponse,
  Service,
  Staff,
  TimeSlot,
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
      const response = await api.get('/api/mobile/appointments/my', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get appointments error:', error);
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
      const response = await api.post('/api/mobile/appointments', data);
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
      const response = await api.put(`/api/mobile/appointments/${id}/cancel`);
      return response.data;
    } catch (error: any) {
      console.error('Cancel appointment error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Randevu iptal edilemedi',
      };
    }
  },

  /**
   * Get available services for a tenant
   */
  async getServices(tenantId: string): Promise<ApiResponse<Service[]>> {
    try {
      const response = await api.get(`/api/mobile/services`, {
        params: { tenantId },
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
      const response = await api.put(`/api/mobile/appointments/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error: any) {
      console.error('Update appointment status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Durum güncellenemedi',
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
};
