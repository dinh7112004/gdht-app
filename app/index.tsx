import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("userToken");
      const data = await AsyncStorage.getItem("userData");
      
      if (token && data) {
        const user = JSON.parse(data);
        setRole(user.role);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (role === "ADMIN") {
    return <Redirect href="/(admin)" />;
  } else if (role === "TEACHER" || role === "PARENT") {
    return <Redirect href="/(teacher)" />;
  } else if (role === "STUDENT") {
    return <Redirect href="/(student)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
