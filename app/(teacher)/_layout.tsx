import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import client from "../../src/api/client";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={badge.dot}>
      <Text style={badge.text}>{count > 9 ? "9+" : count}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  dot: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  text: { color: "#fff", fontSize: 9, fontWeight: "bold" },
});

export default function TeacherLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await client.get<{ count: number }>("/chat/unread-count");
        setUnreadCount(res.data.count || 0);
      } catch (_) {}
    };
    void fetchUnread();
    const interval = setInterval(() => void fetchUnread(), 30000);
    return () => clearInterval(interval);
  }, []);

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
        name="chat"
        options={{
          tabBarLabel: "Tin nhắn",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={24} color={color} />
              <UnreadBadge count={unreadCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{ href: null }}
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
