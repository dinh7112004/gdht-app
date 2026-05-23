import { Stack } from "expo-router";
import "../global.css";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "../src/context/LanguageContext";
import { SoundProvider } from "../src/context/SoundContext";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotifications } from "../src/services/pushNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

function NotificationBootstrap() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Only register if user is logged in
    const setup = async () => {
      const data = await AsyncStorage.getItem("userData");
      if (!data) return;
      await registerForPushNotifications();
    };
    void setup();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Notification is shown automatically via setNotificationHandler
      }
    );

    // Handle tap on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        if (data?.classId) {
          router.push("/(student)/notifications");
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <SoundProvider>
        <StatusBar style="auto" />
        <NotificationBootstrap />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="(student)" />
          <Stack.Screen name="share-post" options={{ presentation: 'modal' }} />
          <Stack.Screen name="lesson/[id]" />
          <Stack.Screen name="learning/quiz/[id]" />
          <Stack.Screen name="learning/story/[id]" />
          <Stack.Screen name="learning/result/[id]" />
          <Stack.Screen name="chat/[userId]" />
          <Stack.Screen name="post-detail/[id]" />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="classroom/[id]" />
          <Stack.Screen name="profile/settings" />
          <Stack.Screen name="profile/account-info" />
          <Stack.Screen name="profile/notifications" />
          <Stack.Screen name="profile/help-center" />
        </Stack>
      </SoundProvider>
    </LanguageProvider>
  );
}
