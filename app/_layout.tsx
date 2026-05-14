import { Stack } from "expo-router";
import "../global.css";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "../src/context/LanguageContext";
import { SoundProvider } from "../src/context/SoundContext";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <SoundProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="(student)" />
          <Stack.Screen name="share-post" options={{ presentation: 'modal' }} />
          <Stack.Screen name="lesson/[id]" />
          <Stack.Screen name="learning/[id]" />
          <Stack.Screen name="learning/quiz/[id]" />
          <Stack.Screen name="learning/story/[id]" />
          <Stack.Screen name="learning/result/[id]" />
        </Stack>
      </SoundProvider>
    </LanguageProvider>
  );
}
