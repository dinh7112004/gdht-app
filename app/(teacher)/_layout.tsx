import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function TeacherLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: "#2E7D32",
      tabBarInactiveTintColor: "#94a3b8",
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: "#FEF9C3",
        elevation: 0,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        paddingTop: 10,
        backgroundColor: "#FFFDF0",
      }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          tabBarLabel: "Trang chủ",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="community" 
        options={{
          tabBarLabel: "Cộng đồng",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="library" 
        options={{
          tabBarLabel: "Thư viện",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "library" : "library-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="ai" 
        options={{
          tabBarLabel: "AI",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={24} color={color} />
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

      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="classroom" options={{ href: null }} />
      <Tabs.Screen name="class-list" options={{ href: null }} />
      <Tabs.Screen name="class-detail/[id]" options={{ href: null }} />
      <Tabs.Screen name="student/[id]" options={{ href: null }} />
    </Tabs>
  );
}
