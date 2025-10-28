'use client';

import { createContext, useContext, ReactNode } from 'react';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  settings: {
    allowOnlineBooking: boolean;
    requirePhone: boolean;
    requireEmail: boolean;
    autoConfirmBookings: boolean;
    workingHours: {
      [key: string]: {
        isOpen: boolean;
        start: string;
        end: string;
      };
    };
  };
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    social?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
});

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
  initialTenant?: Tenant | null;
}

export const TenantProvider = ({ children, initialTenant }: TenantProviderProps) => {
  // In a real implementation, this would fetch tenant data from API
  // For now, we'll use mock data or the initial tenant
  
  const mockTenant: Tenant = {
    id: 'demo-tenant-id',
    slug: 'demo-salon',
    name: 'Demo Güzellik Salonu',
    description: 'Uzman kadromuz ile güzellik ve bakım hizmetleri',
    logo: 'https://i.hizliresim.com/4a00l8g.png',
    primaryColor: '#163974',
    secondaryColor: '#0F2A52',
    settings: {
      allowOnlineBooking: true,
      requirePhone: true,
      requireEmail: true,
      autoConfirmBookings: false,
      workingHours: {
        monday: { isOpen: true, start: '09:00', end: '18:00' },
        tuesday: { isOpen: true, start: '09:00', end: '18:00' },
        wednesday: { isOpen: true, start: '09:00', end: '18:00' },
        thursday: { isOpen: true, start: '09:00', end: '18:00' },
        friday: { isOpen: true, start: '09:00', end: '18:00' },
        saturday: { isOpen: true, start: '10:00', end: '17:00' },
        sunday: { isOpen: false, start: '00:00', end: '00:00' },
      },
    },
    contact: {
      phone: '+90 555 123 4567',
      email: 'info@demosalon.com',
      address: 'Demo Mahallesi, Demo Caddesi No:123 Demo/İstanbul',
      website: 'https://demosalon.com',
      social: {
        facebook: 'https://facebook.com/demosalon',
        instagram: 'https://instagram.com/demosalon',
      },
    },
  };

  const value: TenantContextType = {
    tenant: initialTenant || mockTenant,
    loading: false,
    error: null,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};
