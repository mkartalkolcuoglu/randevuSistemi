import api from './api';
import * as SecureStore from 'expo-secure-store';
import { OtpResponse, VerifyOtpResponse, User, Tenant } from '../types';

export const authService = {
  /**
   * Login with username and password (for business users)
   */
  async loginWithCredentials(
    username: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: User; tenants?: Tenant[] }> {
    try {
      const response = await api.post('/api/mobile/auth/login', {
        username,
        password,
      });

      if (response.data.success && response.data.token) {
        await SecureStore.setItemAsync('authToken', response.data.token);

        if (response.data.user) {
          await SecureStore.setItemAsync(
            'userData',
            JSON.stringify(response.data.user)
          );
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Giriş başarısız',
      };
    }
  },

  /**
   * Send OTP to phone number
   */
  async sendOtp(phone: string): Promise<OtpResponse> {
    try {
      const response = await api.post('/api/mobile/auth/send-otp', { phone });
      return response.data;
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'SMS gönderilemedi',
      };
    }
  },

  /**
   * Verify OTP code
   */
  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
    try {
      const response = await api.post('/api/mobile/auth/verify-otp', {
        phone,
        code,
      });

      if (response.data.success && response.data.token) {
        // Store auth token
        await SecureStore.setItemAsync('authToken', response.data.token);

        // Store user data
        if (response.data.user) {
          await SecureStore.setItemAsync(
            'userData',
            JSON.stringify(response.data.user)
          );
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Doğrulama başarısız',
      };
    }
  },

  /**
   * Select tenant (for users with multiple salons)
   */
  async selectTenant(tenantId: string): Promise<{ success: boolean; user?: User }> {
    try {
      const response = await api.post('/api/mobile/auth/select-tenant', {
        tenantId,
      });

      if (response.data.success) {
        // Save new token with userType info
        if (response.data.token) {
          await SecureStore.setItemAsync('authToken', response.data.token);
        }

        await SecureStore.setItemAsync('selectedTenantId', tenantId);

        if (response.data.user) {
          await SecureStore.setItemAsync(
            'userData',
            JSON.stringify(response.data.user)
          );
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Select tenant error:', error);
      return {
        success: false,
      };
    }
  },

  /**
   * Get stored user data
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Get stored user error:', error);
      return null;
    }
  },

  /**
   * Get stored auth token
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },

  /**
   * Logout - clear all stored data
   */
  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('selectedTenantId');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Refresh user data from server
   */
  async refreshUserData(): Promise<User | null> {
    try {
      const response = await api.get('/api/mobile/auth/me');
      if (response.data.success && response.data.user) {
        await SecureStore.setItemAsync(
          'userData',
          JSON.stringify(response.data.user)
        );
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Refresh user data error:', error);
      return null;
    }
  },
};
