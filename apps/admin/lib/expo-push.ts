/**
 * Expo Push Notification sender
 * Uses Expo Push API to send notifications to mobile app users
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushResult {
  success: boolean;
  error?: string;
  invalidToken?: boolean;
}

export async function sendExpoPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<ExpoPushResult> {
  try {
    if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken[')) {
      return { success: false, error: 'Invalid push token format', invalidToken: true };
    }

    const message: ExpoPushMessage = {
      to: expoPushToken,
      title,
      body,
      data: data || {},
      sound: 'default',
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data) {
      const ticketData = result.data;
      if (ticketData.status === 'ok') {
        console.log(`✅ Push notification sent to ${expoPushToken.substring(0, 30)}...`);
        return { success: true };
      }

      // Handle specific error types
      if (ticketData.details?.error === 'DeviceNotRegistered') {
        console.warn(`⚠️ Device not registered, token invalid: ${expoPushToken.substring(0, 30)}...`);
        return { success: false, error: 'DeviceNotRegistered', invalidToken: true };
      }

      return { success: false, error: ticketData.message || 'Push send failed' };
    }

    return { success: false, error: 'Unexpected response from Expo Push API' };
  } catch (error) {
    console.error('❌ Expo push error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
