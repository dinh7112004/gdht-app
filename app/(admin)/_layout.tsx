import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: "#4F46E5", // Indigo for Admin
      tabBarInactiveTintColor: "#94a3b8",
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        elevation: 0,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        paddingTop: 10,
        backgroundColor: "#FFFFFF",
      }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          tabBarLabel: "Thống kê",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "analytics" : "analytics-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="moderation" 
        options={{
          tabBarLabel: "Duyệt bài",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "shield-checkmark" : "shield-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="users" 
        options={{
          tabBarLabel: "Người dùng",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          tabBarLabel: "Hồ sơ",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="rbac/[id]" options={{ href: null }} />
    </Tabs>
  );
}
