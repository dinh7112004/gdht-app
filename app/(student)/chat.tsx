import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import client, { resolveImageUrl } from "../../src/api/client";

interface Conversation {
  userId: string;
  fullName?: string;
  name?: string;
  avatar?: string;
  role?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

interface Contact {
  _id: string;
  fullName?: string;
  avatar?: string;
  role: string;
  className?: string;
}

function timeAgo(s: string): string {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

const ROLE_COLOR: Record<string, string> = {
  TEACHER: "#6366f1",
  ADMIN: "#f59e0b",
  STUDENT: "#10b981",
};

const ROLE_LABEL: Record<string, string> = {
  TEACHER: "Giáo viên",
  ADMIN: "Nhà trường",
  STUDENT: "Học sinh",
};

export default function StudentChatScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"conversations" | "contacts">("conversations");
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [convRes, contactRes] = await Promise.all([
        client.get("/chat/conversations"),
        client.get("/chat/contacts"),
      ]);
      setConvs(Array.isArray(convRes.data) ? convRes.data : []);

      // contacts = teachers from classes + admin
      let contactList: Contact[] = Array.isArray(contactRes.data) ? contactRes.data : [];

      // Also fetch admin users to add "Chat với nhà trường"
      try {
        const usersRes = await client.get("/users");
        const allUsers: Contact[] = Array.isArray(usersRes.data) ? usersRes.data : [];
        const admins = allUsers.filter((u) => u.role === "ADMIN");
        // Merge admins (deduplicate)
        const existingIds = new Set(contactList.map((c) => c._id));
        admins.forEach((a) => { if (!existingIds.has(a._id)) contactList.push(a); });
      } catch (_) {}

      setContacts(contactList);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const openChat = (userId: string, userName: string, userAvatar?: string) => {
    router.push({
      pathname: "/chat/[userId]",
      params: { userId, userName, userAvatar: userAvatar ?? "" },
    });
  };

  const filtConvs = convs.filter((c) =>
    (c.fullName ?? c.name ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const filtContacts = contacts.filter((c) =>
    (c.fullName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const renderConv = ({ item }: { item: Conversation }) => {
    const name = item.fullName ?? item.name ?? "Người dùng";
    const color = ROLE_COLOR[item.role ?? ""] ?? "#10b981";
    const label = ROLE_LABEL[item.role ?? ""] ?? item.role ?? "";
    return (
      <TouchableOpacity
        style={styles.convRow}
        onPress={() => openChat(item.userId, name, item.avatar)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarCircle, { backgroundColor: color + "22" }]}>
          {item.avatar ? (
            <Image source={{ uri: resolveImageUrl(item.avatar) }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarLetter, { color }]}>{name.charAt(0).toUpperCase()}</Text>
          )}
          {(item.unreadCount ?? 0) > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{(item.unreadCount ?? 0) > 9 ? "9+" : item.unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.convInfo}>
          <View style={styles.convTop}>
            <Text style={styles.convName} numberOfLines={1}>{name}</Text>
            {item.lastMessageAt && (
              <Text style={styles.convTime}>{timeAgo(item.lastMessageAt)}</Text>
            )}
          </View>
          <View style={styles.convBottom}>
            <Text style={[styles.roleTag, { color, backgroundColor: color + "18" }]}>{label}</Text>
            {item.lastMessage && (
              <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMessage}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const name = item.fullName ?? "Người dùng";
    const color = ROLE_COLOR[item.role] ?? "#10b981";
    const label = ROLE_LABEL[item.role] ?? item.role;
    return (
      <TouchableOpacity
        style={styles.convRow}
        onPress={() => openChat(item._id, name, item.avatar)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarCircle, { backgroundColor: color + "22" }]}>
          {item.avatar ? (
            <Image source={{ uri: resolveImageUrl(item.avatar) }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarLetter, { color }]}>{name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.convInfo}>
          <Text style={styles.convName} numberOfLines={1}>{name}</Text>
          <View style={styles.convBottom}>
            <Text style={[styles.roleTag, { color, backgroundColor: color + "18" }]}>{label}</Text>
            {item.className && (
              <Text style={styles.lastMsg} numberOfLines={1}>· {item.className}</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["conversations", "contacts"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "conversations" ? "Hội thoại" : "Danh bạ"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : tab === "conversations" ? (
        <FlatList
          data={filtConvs}
          keyExtractor={(item) => item.userId}
          renderItem={renderConv}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadData(true)} tintColor="#2E7D32" />}
          contentContainerStyle={filtConvs.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyInner}>
              <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Chưa có hội thoại nào</Text>
              <Text style={styles.emptySubText}>Chuyển sang "Danh bạ" để bắt đầu nhắn tin</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filtContacts}
          keyExtractor={(item) => item._id}
          renderItem={renderContact}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadData(true)} tintColor="#2E7D32" />}
          contentContainerStyle={filtContacts.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyInner}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Không có liên hệ</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1e293b", marginBottom: 10 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#FEF9C3",
    backgroundColor: "#FFFDF0",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#94a3b8" },
  tabTextActive: { color: "#2E7D32" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FEF9C3",
    gap: 12,
    backgroundColor: "#FFFDF0",
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarImg: { width: 46, height: 46, borderRadius: 23 },
  avatarLetter: { fontSize: 18, fontWeight: "700" },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  convInfo: { flex: 1, minWidth: 0 },
  convTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  convName: { fontSize: 14, fontWeight: "700", color: "#1e293b", flex: 1 },
  convTime: { fontSize: 11, color: "#94a3b8", marginLeft: 8 },
  convBottom: { flexDirection: "row", alignItems: "center", gap: 6 },
  roleTag: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lastMsg: { fontSize: 12, color: "#94a3b8", flex: 1 },
  emptyContainer: { flex: 1 },
  emptyInner: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },
  emptySubText: { fontSize: 13, color: "#cbd5e1", textAlign: "center", paddingHorizontal: 32 },
});