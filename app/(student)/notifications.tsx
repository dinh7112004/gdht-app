import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client, { resolveImageUrl } from "../../src/api/client";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface Conversation {
  userId: string;
  fullName: string;
  avatar?: string;
  role: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Contact {
  _id: string;
  fullName: string;
  avatar?: string;
  role: string;
  className: string;
}

function notifIcon(type: string) {
  switch (type) {
    case "assignment": return { name: "book" as const, color: "#3B82F6" };
    case "class": return { name: "school" as const, color: "#10B981" };
    default: return { name: "notifications" as const, color: "#F59E0B" };
  }
}

export default function StudentNotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">("notifications");

  // Notifications tab state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Messages tab state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        client.get<AppNotification[]>("/notifications"),
        client.get<{ count: number }>("/notifications/unread-count"),
      ]);
      setNotifications(notifRes.data || []);
      setUnreadNotifCount(countRes.data.count || 0);
      await AsyncStorage.setItem("student_notifications_cache", JSON.stringify({
        notifications: notifRes.data || [],
        unreadNotifCount: countRes.data.count || 0,
        conversations: [],
        contacts: [],
      }));
    } catch (e) {
      console.error("fetch notifications error", e);
    } finally {
      setNotifLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const [convRes, contactRes] = await Promise.all([
        client.get<Conversation[]>("/chat/conversations"),
        client.get<Contact[]>("/chat/contacts"),
      ]);
      setConversations(convRes.data || []);
      setContacts(contactRes.data || []);
      // Merge with existing cache to preserve notifications data
      try {
        const existing = await AsyncStorage.getItem("student_notifications_cache");
        const prev = existing ? JSON.parse(existing) : {};
        await AsyncStorage.setItem("student_notifications_cache", JSON.stringify({
          ...prev,
          conversations: convRes.data || [],
          contacts: contactRes.data || [],
        }));
      } catch (_) {}
    } catch (e) {
      console.error("fetch messages error", e);
    } finally {
      setMsgLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadWithCache = async () => {
        try {
          const cached = await AsyncStorage.getItem("student_notifications_cache");
          if (cached) {
            const data = JSON.parse(cached);
            setNotifications(data.notifications || []);
            setUnreadNotifCount(data.unreadNotifCount || 0);
            setConversations(data.conversations || []);
            setContacts(data.contacts || []);
            setNotifLoading(false);
            setMsgLoading(false);
          }
        } catch (_) {}
        void fetchNotifications();
        void fetchMessages();
      };
      void loadWithCache();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    void fetchNotifications();
    void fetchMessages();
  };

  const markAllRead = async () => {
    try {
      await client.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (_) {}
  };

  const markOneRead = async (id: string) => {
    try {
      await client.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const totalUnreadMsg = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const openChat = (userId: string, fullName: string, avatar?: string) => {
    router.push({
      pathname: "/chat/[userId]",
      params: { userId, userName: fullName, userAvatar: avatar || "" },
    });
  };

  const conversationIds = new Set(conversations.map((c) => c.userId));
  const newContacts = contacts.filter((c) => !conversationIds.has(c._id));

  return (
    <SafeAreaView style={S.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Thông báo</Text>
        {activeTab === "notifications" && unreadNotifCount > 0 && (
          <TouchableOpacity style={S.markAllBtn} onPress={markAllRead}>
            <Text style={S.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
        {activeTab === "messages" && totalUnreadMsg > 0 && (
          <View style={S.badge}><Text style={S.badgeText}>{totalUnreadMsg}</Text></View>
        )}
      </View>

      {/* Tabs */}
      <View style={S.tabContainer}>
        <TouchableOpacity
          style={[S.tab, activeTab === "notifications" && S.activeTab]}
          onPress={() => setActiveTab("notifications")}
        >
          <Text style={[S.tabText, activeTab === "notifications" && S.activeTabText]}>
            Thông báo
          </Text>
          {unreadNotifCount > 0 && (
            <View style={S.tabBadge}><Text style={S.tabBadgeText}>{unreadNotifCount}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.tab, activeTab === "messages" && S.activeTab]}
          onPress={() => setActiveTab("messages")}
        >
          <Text style={[S.tabText, activeTab === "messages" && S.activeTabText]}>
            Tin nhắn
          </Text>
          {totalUnreadMsg > 0 && (
            <View style={S.tabBadge}><Text style={S.tabBadgeText}>{totalUnreadMsg}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications Tab */}
      {activeTab === "notifications" ? (
        notifLoading ? (
          <View style={S.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={S.emptyContainer}>
            <View style={S.emptyIconBox}>
              <Ionicons name="notifications-outline" size={48} color="#cbd5e1" />
            </View>
            <Text style={S.emptyTitle}>Chưa có thông báo</Text>
            <Text style={S.emptySub}>
              Các thông báo từ lớp học và giáo viên sẽ xuất hiện ở đây.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={S.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
          >
            {notifications.map((notif) => {
              const icon = notifIcon(notif.type);
              return (
                <TouchableOpacity
                  key={notif._id}
                  style={[S.notifItem, !notif.isRead && S.notifItemUnread]}
                  onPress={() => { if (!notif.isRead) void markOneRead(notif._id); }}
                  activeOpacity={0.7}
                >
                  <View style={[S.notifIconBox, { backgroundColor: icon.color + "18" }]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                  </View>
                  <View style={S.notifContent}>
                    <View style={S.notifTop}>
                      <Text style={[S.notifTitle, !notif.isRead && S.notifTitleUnread]} numberOfLines={1}>
                        {notif.title}
                      </Text>
                      <Text style={S.notifTime}>{timeAgo(notif.createdAt)}</Text>
                    </View>
                    <Text style={S.notifBody} numberOfLines={2}>{notif.body}</Text>
                  </View>
                  {!notif.isRead && <View style={S.unreadDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )
      ) : /* Messages Tab */ msgLoading ? (
        <View style={S.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : conversations.length === 0 && newContacts.length === 0 ? (
        <View style={S.emptyContainer}>
          <View style={S.emptyIconBox}>
            <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
          </View>
          <Text style={S.emptyTitle}>Chưa có tin nhắn</Text>
          <Text style={S.emptySub}>
            Tham gia lớp học để nhắn tin với giáo viên của bạn.
          </Text>
          <TouchableOpacity style={S.emptyBtn} onPress={() => router.push("/(student)/classroom")}>
            <Text style={S.emptyBtnText}>Xem lớp học</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
        >
          {conversations.map((conv) => (
            <TouchableOpacity
              key={conv.userId}
              style={S.convItem}
              onPress={() => openChat(conv.userId, conv.fullName, conv.avatar)}
              activeOpacity={0.7}
            >
              <View style={S.convAvatarWrap}>
                <Image source={{ uri: resolveImageUrl(conv.avatar) }} style={S.convAvatar} />
                {conv.unreadCount > 0 && (
                  <View style={S.unreadBadge}>
                    <Text style={S.unreadBadgeText}>
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <View style={S.convContent}>
                <View style={S.convTop}>
                  <View style={S.convNameRow}>
                    <Text style={[S.convName, conv.unreadCount > 0 && S.convNameUnread]}>
                      {conv.fullName}
                    </Text>
                    <View style={S.roleTag}>
                      <Text style={S.roleTagText}>Giáo viên</Text>
                    </View>
                  </View>
                  <Text style={S.convTime}>{timeAgo(conv.lastMessageAt)}</Text>
                </View>
                <Text
                  style={[S.convLastMsg, conv.unreadCount > 0 && S.convLastMsgUnread]}
                  numberOfLines={1}
                >
                  {conv.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {newContacts.length > 0 && (
            <View>
              <Text style={S.sectionLabel}>Giáo viên của bạn</Text>
              {newContacts.map((contact) => (
                <TouchableOpacity
                  key={contact._id}
                  style={S.contactItem}
                  onPress={() => openChat(contact._id, contact.fullName, contact.avatar)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: resolveImageUrl(contact.avatar) }} style={S.convAvatar} />
                  <View style={S.convContent}>
                    <Text style={S.convName}>{contact.fullName}</Text>
                    <Text style={S.contactClass}>Lớp {contact.className}</Text>
                  </View>
                  <View style={S.startChatBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color="#2E7D32" />
                    <Text style={S.startChatText}>Nhắn tin</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b", letterSpacing: -0.5, flex: 1 },
  markAllBtn: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markAllText: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FEF9C3",
    backgroundColor: "#FFFDF0",
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeTab: { borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 16, fontWeight: "bold", color: "#94a3b8" },
  activeTabText: { color: "#2E7D32" },
  tabBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, gap: 10 },

  // Notification items
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    gap: 12,
  },
  notifItemUnread: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  notifIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notifContent: { flex: 1 },
  notifTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: { fontSize: 14, fontWeight: "600", color: "#475569", flex: 1 },
  notifTitleUnread: { fontWeight: "800", color: "#1e293b" },
  notifTime: { fontSize: 11, color: "#94a3b8", marginLeft: 8 },
  notifBody: { fontSize: 13, color: "#64748b", lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2E7D32",
    alignSelf: "center",
  },

  // Conversation items
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    gap: 12,
  },
  convAvatarWrap: { position: "relative" },
  convAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#e2e8f0" },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFBEB",
  },
  unreadBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  convContent: { flex: 1 },
  convTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  convNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  convName: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  convNameUnread: { fontWeight: "800" },
  convTime: { fontSize: 11, color: "#94a3b8" },
  convLastMsg: { fontSize: 13, color: "#94a3b8" },
  convLastMsgUnread: { color: "#1e293b", fontWeight: "600" },
  roleTag: {
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleTagText: { fontSize: 10, color: "#2E7D32", fontWeight: "700" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94a3b8",
    marginTop: 8,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    gap: 12,
    marginBottom: 8,
  },
  contactClass: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  startChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  startChatText: { fontSize: 12, color: "#2E7D32", fontWeight: "700" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: "#FFFBEB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 8 },
  emptySub: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});