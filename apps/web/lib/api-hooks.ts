import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  status: string;
}

export interface CreateAppointmentRequest {
  tenantSlug: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceName: string;
  staffId: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  notes?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  };
}

export interface AvailableSlots {
  date: string;
  slots: {
    time: string;
    available: boolean;
    staffId: string;
    staffName: string;
  }[];
}

// Query Keys
export const queryKeys = {
  tenants: {
    all: ['tenants'] as const,
    detail: (slug: string) => ['tenants', slug] as const,
  },
  services: {
    all: (tenantSlug?: string) => ['services', tenantSlug] as const,
    detail: (id: string) => ['services', 'detail', id] as const,
    categories: (tenantSlug?: string) => ['services', 'categories', tenantSlug] as const,
  },
  staff: {
    all: (tenantSlug?: string) => ['staff', tenantSlug] as const,
    detail: (id: string) => ['staff', 'detail', id] as const,
  },
  appointments: {
    all: (tenantSlug?: string) => ['appointments', tenantSlug] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
    availableSlots: (serviceId: string, date: string, staffId?: string) => 
      ['appointments', 'available-slots', serviceId, date, staffId] as const,
  },
} as const;

// Tenant Hooks
export function useTenant(slug: string) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(slug),
    queryFn: async (): Promise<Tenant> => {
      try {
        // Direct API call instead of apiClient
        const response = await fetch(`/api/tenants/${slug}`);
        if (!response.ok) throw new Error('Failed to fetch tenant');
        const data = await response.json();
        return data.data;
      } catch (error) {
        // Fallback mock data for demo purposes
        const mockTenants: Record<string, Tenant> = {
          'demo-salon': {
            id: 't1',
            name: 'Demo Güzellik Salonu',
            slug: 'demo-salon',
            description: 'Profesyonel güzellik hizmetleri',
            contactPhone: '+90 555 123 4567',
            address: 'İstanbul, Türkiye',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          'demo-berber': {
            id: 't2',
            name: 'Demo Berber',
            slug: 'demo-berber',
            description: 'Erkek kuaförü hizmetleri',
            contactEmail: 'info@demoberber.com',
            contactPhone: '+90 555 123 4568',
            address: 'Ankara, Türkiye',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          'demo-doktor': {
            id: 't3',
            name: 'Demo Klinik',
            slug: 'demo-doktor',
            description: 'Sağlık hizmetleri',
            contactEmail: 'info@demoklinik.com',
            contactPhone: '+90 555 123 4569',
            address: 'İzmir, Türkiye',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          'lobaaaa': {
            id: '4fbf71a9b33e5a29463244f9',
            name: 'Lobaaaa Güzellik Salonu',
            slug: 'lobaaaa',
            description: 'Profesyonel güzellik ve bakım hizmetleri',
            contactPhone: '+90 555 123 4567',
            address: 'Güzellik Mahallesi, Estetik Caddesi No:123 Şişli/İstanbul',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          'kartal-beuaty': {
            id: '1abbe8fe34712dcc0f154d27',
            name: 'Kartal Beauty',
            slug: 'kartal-beuaty',
            description: 'Profesyonel güzellik ve bakım hizmetleri',
            contactPhone: '+90 533 920 9282',
            address: 'Adres Adana',
            isActive: true,
            createdAt: '2025-09-26T10:18:38.543Z',
            updatedAt: '2025-09-26T10:18:38.543Z'
          },
          'kolcuoglu-beauty': {
            id: '1dbbe223bda19431e27ce2e6',
            name: 'Kolcuoglu Beauty',
            slug: 'kolcuoglu-beauty',
            description: 'Profesyonel güzellik ve bakım hizmetleri',
            contactPhone: '03220000001',
            address: 'Adana Seyhan',
            isActive: true,
            createdAt: '2025-09-26T10:54:26.767Z',
            updatedAt: '2025-09-26T10:54:26.767Z'
          }
        };
        
        const tenant = mockTenants[slug];
        if (!tenant) {
          return generateDefaultApiTenant(slug);
        }
        return tenant;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Services Hooks
export function useServices(tenantSlug?: string) {
  return useQuery({
    queryKey: queryKeys.services.all(tenantSlug),
    queryFn: async () => {
      if (!tenantSlug) return [];
      
      try {
        const response = await fetch(`/api/services?tenantSlug=${tenantSlug}`, {
          headers: {
            'X-Tenant-Slug': tenantSlug,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const data = await response.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    },
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useServiceCategories(tenantSlug?: string) {
  return useQuery({
    queryKey: queryKeys.services.categories(tenantSlug),
    queryFn: async () => {
      if (tenantSlug) {
        // Tenant slug set
      }
      
      // Return mock categories for now
      return ['Saç', 'Makyaj', 'Cilt Bakımı', 'Nail Art'];
    },
    enabled: !!tenantSlug,
    staleTime: 10 * 60 * 1000,
  });
}

// Staff Hooks
export function useStaff(tenantSlug?: string) {
  return useQuery({
    queryKey: queryKeys.staff.all(tenantSlug),
    queryFn: async () => {
      if (!tenantSlug) return [];
      
      try {
        const response = await fetch(`/api/staff?tenantSlug=${tenantSlug}`, {
          headers: {
            'X-Tenant-Slug': tenantSlug,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch staff');
        }
        
        const data = await response.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching staff:', error);
        return [];
      }
    },
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Available Slots Hook
export function useAvailableSlots(serviceId: string, date: string, staffId?: string) {
  return useQuery({
    queryKey: queryKeys.appointments.availableSlots(serviceId, date, staffId),
    queryFn: async (): Promise<AvailableSlots> => {
      if (!serviceId || !date || !staffId) {
        return { date, slots: [] };
      }

      try {
        const response = await fetch(`/api/available-slots?serviceId=${serviceId}&date=${date}&staffId=${staffId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch available slots');
        }
        
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Error fetching available slots:', error);
        // Fallback mock data
        const timeSlots = [];
        for (let hour = 9; hour <= 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            // Skip lunch break
            if (hour === 12) continue;
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeSlots.push({
              time: timeString,
              available: Math.random() > 0.3, // 70% chance available
              staffId: staffId || 'staff1',
              staffName: 'Uzman'
            });
          }
        }
        
        return {
          date,
          slots: timeSlots.filter(slot => slot.available)
        };
      }
    },
    enabled: !!serviceId && !!date && !!staffId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Appointment Mutations
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: CreateAppointmentRequest): Promise<Appointment> => {
      try {
        // Direct API call
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointmentData)
        });
        if (!response.ok) throw new Error('Failed to create appointment');
        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error('Error creating appointment:', error);
        throw new Error('Randevu oluşturulamadı: ' + error.message);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all() });
      // Note: availableSlots will be invalidated when user navigates back
    },
  });
}

// Health Check Hook (for API status)
export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      return response.ok;
    },
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Yeni aboneler için otomatik tenant API datası oluşturur
function generateDefaultApiTenant(slug: string): Tenant {
  const name = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    id: slug,
    name: name,
    slug: slug,
    description: 'Profesyonel güzellik ve bakım hizmetleri',
    contactPhone: '+90 555 000 0000',
    address: 'Adres bilgisi güncellenecek',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Export API client for manual usage
