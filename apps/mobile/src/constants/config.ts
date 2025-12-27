// API Configuration
// Production API
export const API_BASE_URL = 'https://admin.netrandevu.com';
export const WEB_BASE_URL = 'https://netrandevu.com';

// Local development (update IP for local testing)
// export const API_BASE_URL = 'http://192.168.1.116:3001';
// export const WEB_BASE_URL = 'http://192.168.1.116:3000';

// App Configuration
export const APP_NAME = 'Net Randevu';
export const APP_VERSION = '1.0.0';

// OTP Configuration
export const OTP_LENGTH = 6;
export const OTP_RESEND_TIMEOUT = 60; // seconds

// Cache Configuration
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Appointment Configuration
export const MIN_CANCEL_HOURS = 2; // Minimum hours before appointment to cancel
