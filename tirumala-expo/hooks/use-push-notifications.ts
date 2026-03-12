/**
 * use-push-notifications
 * Requests notification permission, obtains the raw device FCM token,
 * and registers it with the backend. Call once from the root layout.
 */

import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// How FCM notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications(): Promise<void> {
  // Physical device required; emulators can't receive FCM in production
  if (!Constants.isDevice && Platform.OS !== 'android') {
    console.log('[push] Push notifications require a physical device');
    return;
  }

  // Request permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] Notification permission not granted');
    return;
  }

  // Get raw FCM token (not Expo token) — required for Firebase Admin SDK
  const { data: token } = await Notifications.getDevicePushTokenAsync();

  if (!token) {
    console.log('[push] Failed to get FCM token');
    return;
  }

  console.log('[push] FCM token obtained, registering with backend…');

  // Register token with backend
  try {
    const resp = await fetch(`${API_BASE}/api/notifications/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
    if (resp.ok) {
      console.log('[push] FCM token registered successfully');
    } else {
      console.warn('[push] Backend registration failed:', resp.status);
    }
  } catch (err) {
    console.warn('[push] Could not reach backend:', err);
  }
}

export function usePushNotifications(): void {
  useEffect(() => {
    void registerForPushNotifications();
  }, []);
}
