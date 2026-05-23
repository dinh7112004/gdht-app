import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import client from '../api/client';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission and register the Expo push token with the backend.
 * Call this once after the user is authenticated.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Thông báo',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2E7D32',
      sound: 'default',
    });
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Ask if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // uses app.json projectId / EAS project ID automatically
  });
  const token = tokenData.data;

  // Register token with backend
  try {
    await client.post('/notifications/register-token', { token });
  } catch (err) {
    console.error('Failed to register push token:', err);
  }

  return token;
}

/**
 * Remove the push token from the backend (call on logout).
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined,
    });
    await client.post('/notifications/remove-token', { token: tokenData.data });
  } catch (_) {
    // Ignore errors on logout
  }
}