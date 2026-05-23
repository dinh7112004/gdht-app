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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client, { resolveImageUrl } from "../../src/api/client";

export const NOTIF_LAST_SEEN_KEY = "teacher_notif_last_seen";

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

interface Conversation {
  userId: string;
  fullName: string;
  avatar?: string;
  role: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Student {
  _id: string;
  fullName: string;
  email?: string;
  avatar?: string;
}

interface ClassWithStudents {
  id: string;
  name: string;
  code: string;
  studentIds: Student[];
}

export default function TeacherNotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">("notifications");
  const [recentCompletions, setRecentCompletions] = useState<any[]>([]);
  const [behindStudents, setBehindStudents] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [classes, setClasses] = useState<ClassWithStudents[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const fetchNotifications = async () => {
    try {
      const res = await client.get("/classes/teacher/activity");
      setRecentCompletions(res.data.recentCompletions || []);
      setBehindStudents(res.data.behindStudents || []);
      try {
        const existing = await AsyncStorage.getItem("teacher_notifications_cache");
        const prev = existing ? JSON.parse(existing) : {};
        await AsyncStorage.setItem("teacher_notifications_cache", JSON.stringify({
          ...prev,
          recentCompletions: res.data.recentCompletions || [],
          behindStudents: res.data.behindStudents || [],
        }));
      } catch (_) {}
    } catch (error) {
      console.error("Failed to fetch teacher activity", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const [convRes, classRes] = await Promise.all([
        client.get<Conversation[]>("/chat/conversations"),
        client.get<any[]>("/classes/my-classes"),
      ]);
      setConversations(convRes.data || []);

      const mapped: ClassWithStudents[] = (classRes.data || []).map((c: any) => ({
        id: c._id || c.id,
        name: c.name,
        code: c.code,
        studentIds: Array.isArray(c.studentIds) ? c.studentIds : [],
      }));
      setClasses(mapped);
      setExpandedClasses(new Set(mapped.map((c) => c.id)));

      try {
        const existing = await AsyncStorage.getItem("teacher_notifications_cache");
        const prev = existing ? JSON.parse(existing) : {};
        await AsyncStorage.setItem("teacher_notifications_cache", JSON.stringify({
          ...prev,
          conversations: convRes.data || [],
          classes: mapped,
        }));
      } catch (_) {}
    } catch (error) {
      console.error("Failed to fetch messages data", error);
    } finally {
      setMsgLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadWithCache = async () => {
        try {
          const cached = await AsyncStorage.getItem("teacher_notifications_cache");
          if (cached) {
            const data = JSON.parse(cached);
            setRecentCompletions(data.recentCompletions || []);
            setBehindStudents(data.behindStudents || []);
            setConversations(data.conversations || []);
            setClasses(data.classes || []);
            setExpandedClasses(new Set((data.classes || []).map((c: ClassWithStudents) => c.id)));
            setLoading(false);
            setMsgLoading(false);
          }
        } catch (_) {}
        void AsyncStorage.setItem(NOTIF_LAST_SEEN_KEY, Date.now().toString());
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

  const totalNotifCount = recentCompletions.length + behindStudents.length;
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const openChat = (userId: string, fullName: string, avatar?: string) => {
    router.push({
      pathname: "/chat/[userId]",
      params: { userId, userName: fullName, userAvatar: avatar || "" },
    });
  };

  const toggleClass = (classId: string) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };

  // Build a map of userId → conversation for quick lookup
  const convMap = new Map(conversations.map((c) => [c.userId, c]));

  // Filter students by search
  const searchLower = search.toLowerCase().trim();
  const filteredClasses = classes
    .map((cls) => ({
      ...cls,
      studentIds: cls.studentIds.filter(
        (s) =>
          !searchLower ||
          s.fullName?.toLowerCase().includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower)
      ),
    }))
    .filter((cls) => cls.studentIds.length > 0 || !searchLower);

  const renderNotifications = () => {
    if (recentCompletions.length === 0 && behindStudents.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="notifications-outline" size={48} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có hoạt động</Text>
          <Text style={styles.emptySub}>
            Khi học sinh hoàn thành bài hoặc có tiến độ chậm, thông báo sẽ xuất hiện ở đây.
          </Text>
        </View>
      );
    }
    return (
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
      >
        {behindStudents.map((item: any) => (
          <TouchableOpacity
            key={`behind-${item.classId}`}
            style={styles.notiItem}
            onPress={() => router.push({ pathname: "/(teacher)/class-detail/[id]", params: { id: item.classId } })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons name="warning" size={22} color="#EF4444" />
            </View>
            <View style={styles.notiContent}>
              <View style={styles.notiTop}>
                <Text style={styles.notiTitle}>Học sinh chậm tiến độ</Text>
                <Text style={styles.notiTime}>Hôm nay</Text>
              </View>
              <Text style={styles.notiBody}>
                <Text style={styles.bold}>{item.count}/{item.total} học sinh</Text> lớp{" "}
                <Text style={styles.bold}>{item.className}</Text> chưa hoàn thành bài nào.
                {item.studentNames?.length > 0 && ` (${item.studentNames.join(", ")}${item.count > 3 ? "..." : ""})`}
              </Text>
              <View style={styles.notiAction}>
                <Text style={[styles.notiActionText, { color: "#EF4444" }]}>Xem lớp học</Text>
                <Ionicons name="chevron-forward" size={13} color="#EF4444" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {recentCompletions.map((item: any, index: number) => {
          const scoreText = item.score !== null && item.total !== null ? ` — Điểm: ${item.score}/${item.total}` : "";
          return (
            <TouchableOpacity
              key={`completion-${index}`}
              style={styles.notiItem}
              onPress={() => router.push({ pathname: "/(teacher)/class-detail/[id]", params: { id: item.classId } })}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: "#F0FDF4" }]}>
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              </View>
              <View style={styles.notiContent}>
                <View style={styles.notiTop}>
                  <Text style={styles.notiTitle} numberOfLines={1}>Hoàn thành bài học</Text>
                  <Text style={styles.notiTime}>{timeAgo(item.completedAt)}</Text>
                </View>
                <Text style={styles.notiBody}>
                  <Text style={styles.bold}>{item.studentName}</Text> (lớp{" "}
                  <Text style={styles.bold}>{item.className}</Text>) đã hoàn thành{" "}
                  <Text style={styles.bold}>"{item.lessonTitle}"</Text>{scoreText}.
                </Text>
                <View style={styles.notiAction}>
                  <Text style={[styles.notiActionText, { color: "#10B981" }]}>Xem lớp học</Text>
                  <Ionicons name="chevron-forward" size={13} color="#10B981" />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderMessages = () => {
    if (msgLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
      >
        {/* Search bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm học sinh..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Active conversations */}
        {conversations.length > 0 && !searchLower && (
          <View style={styles.msgSection}>
            <Text style={styles.msgSectionLabel}>Cuộc trò chuyện</Text>
            {conversations.map((conv) => (
              <TouchableOpacity
                key={conv.userId}
                style={styles.convItem}
                onPress={() => openChat(conv.userId, conv.fullName, conv.avatar)}
                activeOpacity={0.7}
              >
                <View style={styles.convAvatarWrap}>
                  <Image source={{ uri: resolveImageUrl(conv.avatar) }} style={styles.convAvatar} />
                  {conv.unreadCount > 0 && (
                    <View style={styles.unreadDot}>
                      <Text style={styles.unreadDotText}>{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.convContent}>
                  <View style={styles.convTop}>
                    <Text style={[styles.convName, conv.unreadCount > 0 && styles.convNameUnread]}>
                      {conv.fullName}
                    </Text>
                    <Text style={styles.convTime}>{timeAgo(conv.lastMessageAt)}</Text>
                  </View>
                  <Text style={[styles.convLastMsg, conv.unreadCount > 0 && styles.convLastMsgUnread]} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Students by class */}
        {filteredClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Không tìm thấy học sinh</Text>
          </View>
        ) : (
          <View style={styles.msgSection}>
            <Text style={styles.msgSectionLabel}>Học sinh theo lớp</Text>
            {filteredClasses.map((cls) => {
              const isExpanded = expandedClasses.has(cls.id);
              return (
                <View key={cls.id} style={styles.classGroup}>
                  {/* Class header */}
                  <TouchableOpacity
                    style={styles.classHeader}
                    onPress={() => toggleClass(cls.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.classHeaderLeft}>
                      <View style={styles.classIconBox}>
                        <Ionicons name="school" size={18} color="#4F46E5" />
                      </View>
                      <View>
                        <Text style={styles.classHeaderName}>{cls.name}</Text>
                        <Text style={styles.classHeaderSub}>{cls.studentIds.length} học sinh · Mã: {cls.code}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>

                  {/* Student list */}
                  {isExpanded && (
                    <View style={styles.studentList}>
                      {cls.studentIds.length === 0 ? (
                        <Text style={styles.noStudentText}>Chưa có học sinh trong lớp</Text>
                      ) : (
                        cls.studentIds.map((student) => {
                          const conv = convMap.get(student._id);
                          return (
                            <TouchableOpacity
                              key={student._id}
                              style={styles.studentItem}
                              onPress={() => openChat(student._id, student.fullName, student.avatar)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.studentAvatarWrap}>
                                <Image
                                  source={{ uri: resolveImageUrl(student.avatar) }}
                                  style={styles.studentAvatar}
                                />
                                {conv && conv.unreadCount > 0 && (
                                  <View style={styles.unreadDot}>
                                    <Text style={styles.unreadDotText}>
                                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.studentInfo}>
                                <Text style={styles.studentName}>{student.fullName}</Text>
                                {conv ? (
                                  <Text style={[styles.studentLastMsg, conv.unreadCount > 0 && styles.convLastMsgUnread]} numberOfLines={1}>
                                    {conv.lastMessage}
                                  </Text>
                                ) : (
                                  <Text style={styles.studentEmail} numberOfLines={1}>{student.email || "Chưa nhắn tin"}</Text>
                                )}
                              </View>
                              <View style={styles.chatBtn}>
                                <Ionicons name="chatbubble-outline" size={16} color="#2E7D32" />
                                <Text style={styles.chatBtnText}>
                                  {conv ? "Tiếp tục" : "Nhắn tin"}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {activeTab === "notifications" && !loading && totalNotifCount > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{totalNotifCount}</Text></View>
        )}
        {activeTab === "messages" && totalUnread > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{totalUnread}</Text></View>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "notifications" && styles.activeTab]}
          onPress={() => setActiveTab("notifications")}
        >
          <Text style={[styles.tabText, activeTab === "notifications" && styles.activeTabText]}>Thông báo</Text>
          {totalNotifCount > 0 && (
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{totalNotifCount}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "messages" && styles.activeTab]}
          onPress={() => setActiveTab("messages")}
        >
          <Text style={[styles.tabText, activeTab === "messages" && styles.activeTabText]}>Tin nhắn</Text>
          {totalUnread > 0 && (
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{totalUnread}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === "notifications" ? (
        loading ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2E7D32" /></View>
        ) : (
          renderNotifications()
        )
      ) : (
        renderMessages()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b", letterSpacing: -0.5, flex: 1 },
  badge: { backgroundColor: "#EF4444", borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 5 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  tabContainer: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: "#FEF9C3", backgroundColor: "#FFFDF0" },
  tab: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 3, borderBottomColor: "transparent", flexDirection: "row", alignItems: "center", gap: 6 },
  activeTab: { borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 16, fontWeight: "bold", color: "#94a3b8" },
  activeTabText: { color: "#2E7D32" },
  tabBadge: { backgroundColor: "#EF4444", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  tabBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 20, gap: 12 },

  // Notifications
  notiItem: { flexDirection: "row", backgroundColor: "#FFFBEB", padding: 16, borderRadius: 24, borderWidth: 1, borderColor: "#FEF9C3" },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 14, flexShrink: 0 },
  notiContent: { flex: 1 },
  notiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  notiTitle: { fontSize: 14, fontWeight: "800", color: "#1e293b", flex: 1, marginRight: 8 },
  notiTime: { fontSize: 11, color: "#94a3b8", flexShrink: 0 },
  notiBody: { fontSize: 13, color: "#64748b", lineHeight: 19 },
  bold: { fontWeight: "700", color: "#1e293b" },
  notiAction: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 2 },
  notiActionText: { fontSize: 12, fontWeight: "700" },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b", fontWeight: "600" },

  // Message sections
  msgSection: { paddingHorizontal: 16, paddingTop: 16 },
  msgSectionLabel: { fontSize: 13, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  // Conversations
  convItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", padding: 14, borderRadius: 20, borderWidth: 1, borderColor: "#FEF9C3", gap: 12, marginBottom: 8 },
  convAvatarWrap: { position: "relative" },
  convAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#e2e8f0" },
  unreadDot: { position: "absolute", top: -2, right: -2, backgroundColor: "#EF4444", borderRadius: 9, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: "#FFFBEB" },
  unreadDotText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  convContent: { flex: 1 },
  convTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  convName: { fontSize: 15, fontWeight: "600", color: "#1e293b", flex: 1 },
  convNameUnread: { fontWeight: "800" },
  convTime: { fontSize: 11, color: "#94a3b8" },
  convLastMsg: { fontSize: 13, color: "#94a3b8" },
  convLastMsgUnread: { color: "#1e293b", fontWeight: "600" },

  // Class groups
  classGroup: { marginBottom: 12, backgroundColor: "#FFFBEB", borderRadius: 20, borderWidth: 1, borderColor: "#FEF9C3", overflow: "hidden" },
  classHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  classHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  classIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  classHeaderName: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  classHeaderSub: { fontSize: 12, color: "#94a3b8", marginTop: 1 },

  // Student list
  studentList: { borderTopWidth: 1, borderTopColor: "#FEF9C3" },
  noStudentText: { fontSize: 13, color: "#94a3b8", textAlign: "center", paddingVertical: 16 },
  studentItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#FEF9C3", gap: 12 },
  studentAvatarWrap: { position: "relative" },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#e2e8f0" },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  studentLastMsg: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  studentEmail: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  chatBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  chatBtnText: { fontSize: 12, color: "#2E7D32", fontWeight: "700" },

  // Empty
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, paddingVertical: 60, gap: 12 },
  emptyIconBox: { width: 88, height: 88, borderRadius: 28, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: "#FEF9C3" },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  emptySub: { fontSize: 14, color: "#94a3b8", textAlign: "center", lineHeight: 20 },
  emptyBtn: { backgroundColor: "#2E7D32", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
  emptyBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});