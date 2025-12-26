import { create } from 'zustand';
import { User, Tenant, AuthState } from '../types';
import { authService } from '../services/auth.service';

interface AuthStore extends AuthState {
  // Actions
  initialize: () => Promise<void>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (phone: string, code: string) => Promise<{
    success: boolean;
    message: string;
    needsTenantSelection?: boolean;
  }>;
  selectTenant: (tenant: Tenant) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  user: null,
  selectedTenant: null,
  availableTenants: [],

  // Initialize auth state on app start
  initialize: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const user = await authService.getStoredUser();
        if (user) {
          set({
            isAuthenticated: true,
            user,
            selectedTenant: user.tenantId
              ? {
                  id: user.tenantId,
                  businessName: user.tenantName || '',
                  slug: '',
                }
              : null,
          });
        } else {
          // Token exists but no user data - try to refresh
          const refreshedUser = await authService.refreshUserData();
          if (refreshedUser) {
            set({
              isAuthenticated: true,
              user: refreshedUser,
            });
          } else {
            // Failed to get user data - logout
            await authService.logout();
            set({ isAuthenticated: false, user: null });
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isAuthenticated: false, user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  // Send OTP
  sendOtp: async (phone: string) => {
    set({ isLoading: true });
    try {
      const result = await authService.sendOtp(phone);
      return {
        success: result.success,
        message: result.message,
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // Verify OTP
  verifyOtp: async (phone: string, code: string) => {
    set({ isLoading: true });
    try {
      const result = await authService.verifyOtp(phone, code);

      if (result.success) {
        // Check if user has multiple tenants
        if (result.tenants && result.tenants.length > 1) {
          set({
            availableTenants: result.tenants,
            user: result.user || null,
          });
          return {
            success: true,
            message: 'Salon seçimi gerekiyor',
            needsTenantSelection: true,
          };
        }

        // Single tenant or no tenant - complete login
        set({
          isAuthenticated: true,
          user: result.user || null,
          selectedTenant:
            result.tenants && result.tenants.length === 1
              ? result.tenants[0]
              : null,
        });

        return {
          success: true,
          message: 'Giriş başarılı',
          needsTenantSelection: false,
        };
      }

      return {
        success: false,
        message: result.message,
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // Select tenant
  selectTenant: async (tenant: Tenant) => {
    set({ isLoading: true });
    try {
      const result = await authService.selectTenant(tenant.id);

      if (result.success) {
        set({
          isAuthenticated: true,
          selectedTenant: tenant,
          user: result.user || get().user,
          availableTenants: [],
        });
        return true;
      }
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({
        isAuthenticated: false,
        user: null,
        selectedTenant: null,
        availableTenants: [],
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Set user
  setUser: (user: User | null) => set({ user }),

  // Set loading
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
