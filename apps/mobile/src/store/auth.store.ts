import { create } from 'zustand';
import { User, Tenant, AuthState } from '../types';
import { authService } from '../services/auth.service';

interface AuthStore extends AuthState {
  // Actions
  initialize: () => Promise<void>;
  loginWithCredentials: (username: string, password: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  sendOtp: (phone: string, userType?: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (phone: string, code: string) => Promise<{
    success: boolean;
    message: string;
    needsTenantSelection?: boolean;
  }>;
  verifyOtpCustomer: (phone: string, code: string) => Promise<{
    success: boolean;
    message: string;
    isNewCustomer?: boolean;
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
        // Check if user exists - customers may not have tenantId
        if (user) {
          // Verify token is still valid by making a test API call
          try {
            const refreshedUser = await authService.refreshUserData();
            if (refreshedUser) {
              set({
                isAuthenticated: true,
                user: refreshedUser,
                // Customers don't have tenantId, staff/owner do
                selectedTenant: refreshedUser.tenantId
                  ? {
                      id: refreshedUser.tenantId,
                      businessName: refreshedUser.tenantName || '',
                      slug: '',
                    }
                  : null,
              });
            } else {
              // Token is invalid - logout
              console.log('Token validation failed - no user data returned');
              await authService.logout();
              set({ isAuthenticated: false, user: null, selectedTenant: null });
            }
          } catch (error) {
            // API call failed - token might be expired
            console.log('Token validation failed, logging out:', error);
            await authService.logout();
            set({ isAuthenticated: false, user: null, selectedTenant: null });
          }
        } else {
          // No valid user data - logout
          console.log('No valid stored user, logging out');
          await authService.logout();
          set({ isAuthenticated: false, user: null, selectedTenant: null });
        }
      } else {
        // Not authenticated
        set({ isAuthenticated: false, user: null, selectedTenant: null });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await authService.logout();
      set({ isAuthenticated: false, user: null, selectedTenant: null });
    } finally {
      set({ isLoading: false });
    }
  },

  // Login with credentials (for business users)
  loginWithCredentials: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await authService.loginWithCredentials(username, password);

      if (result.success && result.user) {
        set({
          isAuthenticated: true,
          user: result.user,
          selectedTenant: result.user.tenantId
            ? {
                id: result.user.tenantId,
                businessName: result.user.tenantName || '',
                slug: '',
              }
            : null,
        });
        return {
          success: true,
          message: 'Giriş başarılı',
        };
      }

      return {
        success: false,
        message: result.message || 'Giriş başarısız',
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // Send OTP
  sendOtp: async (phone: string, userType?: string) => {
    set({ isLoading: true });
    try {
      const result = await authService.sendOtp(phone, userType);
      return {
        success: result.success,
        message: result.message,
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // Verify OTP (for business users - staff/owner)
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

  // Verify OTP for CUSTOMER - no tenant selection needed
  verifyOtpCustomer: async (phone: string, code: string) => {
    set({ isLoading: true });
    try {
      const result = await authService.verifyOtpCustomer(phone, code);

      if (result.success) {
        // Check if this is a new customer (not registered yet)
        if (result.isNewCustomer) {
          // New customer - set authenticated but with isNewCustomer flag
          set({
            isAuthenticated: true,
            user: result.user || null,
            selectedTenant: null,
          });

          return {
            success: true,
            message: 'Yeni müşteri kaydı gerekiyor',
            isNewCustomer: true,
          };
        }

        // Existing customer login - no tenant selection
        set({
          isAuthenticated: true,
          user: result.user || null,
          selectedTenant: null, // Customers don't have a selected tenant
        });

        return {
          success: true,
          message: 'Giriş başarılı',
          isNewCustomer: false,
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
