import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token attached to request:', config.url);
      } else {
        console.log('⚠️ No token found for request:', config.url);
      }

      // Add tenant ID if available
      const tenantId = await SecureStore.getItemAsync('selectedTenantId');
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
    } catch (error) {
      console.error('Error reading auth data:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      // Navigation will be handled by auth state change
    }
    return Promise.reject(error);
  }
);

export default api;
