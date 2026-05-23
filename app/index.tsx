import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, ActivityIndicator } from "react-native";

export default function Index() {
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [token, data] = await Promise.all([
          AsyncStorage.getItem("userToken"),
          AsyncStorage.getItem("userData"),
        ]);
        if (token && data) {
          const user = JSON.parse(data) as { role?: string };
          setRole(user.role ?? null);
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      }
    };
    void checkAuth();
  }, []);

  // Still reading AsyncStorage — render loading spinner to avoid white flash
  if (role === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFDF0' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 20, color: '#1e293b' }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (role === "ADMIN") return <Redirect href="/(admin)" />;
  if (role === "TEACHER" || role === "PARENT") return <Redirect href="/(teacher)" />;
  if (role === "STUDENT") return <Redirect href="/(student)" />;
  return <Redirect href="/(auth)/login" />;
}
