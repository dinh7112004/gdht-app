import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client, { resolveImageUrl } from "../../src/api/client";
import { NOTIF_LAST_SEEN_KEY } from "./notifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadWithCache = async () => {
        try {
          const cached = await AsyncStorage.getItem("teacher_home_cache");
          if (cached) {
            const data = JSON.parse(cached);
            setStats(data.stats);
            setFeaturedCategories(data.featuredCategories || []);
            setRecentActivity(data.recentActivity || []);
            setLoading(false);
          }
        } catch (_) {}
        void fetchData();
      };
      void loadWithCache();
    }, [])
  );

  const fetchData = async () => {
    try {
      const [statsRes, categoriesRes, activityRes] = await Promise.all([
        client.get("/classes/teacher/stats"),
        client.get("/categories/teacher-featured"),
        client.get("/classes/teacher/activity"),
      ]);
      setStats(statsRes.data);
      setFeaturedCategories(categoriesRes.data || []);

      const activity = activityRes.data;
      const completions: any[] = activity.recentCompletions || [];
      setRecentActivity(completions.slice(0, 5));

      await AsyncStorage.setItem("teacher_home_cache", JSON.stringify({
        stats: statsRes.data,
        featuredCategories: categoriesRes.data || [],
        recentActivity: completions.slice(0, 5),
      }));

      const lastSeenStr = await AsyncStorage.getItem(NOTIF_LAST_SEEN_KEY);
      const lastSeen = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;
      const behind: any[] = activity.behindStudents || [];
      const hasNew =
        lastSeen === 0
          ? completions.length > 0 || behind.length > 0
          : completions.some(
              (c) => c.completedAt && new Date(c.completedAt).getTime() > lastSeen
            );
      setHasUnread(hasNew);
    } catch (error) {
      console.error("Failed to fetch teacher dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.headerTitle}>{stats?.teacherName || "Giáo viên"} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push("/(teacher)/notifications")}
        >
          <Ionicons name="notifications-outline" size={22} color="#1e293b" />
          {hasUnread && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Học sinh"
            value={stats?.totalStudents || 0}
            icon="people"
            color="#4F46E5"
            onPress={() => router.push("/(teacher)/class-list")}
          />
          <StatCard
            title="Lớp học"
            value={stats?.totalClasses || 0}
            icon="school"
            color="#10B981"
            onPress={() => router.push("/(teacher)/class-list")}
          />
          <StatCard
            title="Bài đã giao"
            value={stats?.totalLessons || 0}
            icon="document-text"
            color="#F59E0B"
            onPress={() => router.push("/(teacher)/library")}
          />
          <StatCard
            title="Tiến độ TB"
            value={`${stats?.averageProgress || 0}%`}
            icon="trending-up"
            color="#EF4444"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <ActionItem icon="add-circle" label="Giao bài" color="#2E7D32" onPress={() => router.push("/(teacher)/library")} />
          <ActionItem icon="chatbubble-ellipses" label="AI Trợ lý" color="#3B82F6" onPress={() => router.push("/(teacher)/ai")} />
          <ActionItem icon="newspaper" label="Cộng đồng" color="#F59E0B" onPress={() => router.push("/(teacher)/community")} />
          <ActionItem icon="school" label="Quản lý lớp" color="#6366F1" onPress={() => router.push("/(teacher)/class-list")} />
        </View>

        {/* Featured Topics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chủ đề nổi bật</Text>
            <TouchableOpacity onPress={() => router.push("/(teacher)/library")}>
              <Text style={styles.seeAll}>Tất cả</Text>
            </TouchableOpacity>
          </View>

          {featuredCategories.length === 0 ? (
            <View style={styles.emptyTopics}>
              <Ionicons name="bookmark-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyTopicsText}>Chưa có chủ đề nổi bật</Text>
              <Text style={styles.emptyTopicsSub}>Đánh dấu ⭐ chủ đề trong CMS để hiển thị ở đây</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topicsScroll}
            >
              {featuredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={styles.topicCard}
                  onPress={() =>
                    router.push({ pathname: "/category/[id]", params: { id: cat._id, name: cat.name } })
                  }
                  activeOpacity={0.85}
                >
                  <Image
                    source={{
                      uri:
                        resolveImageUrl(cat.imageUrl) ||
                        "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400",
                    }}
                    style={styles.topicImg}
                  />
                  <View style={styles.topicOverlay}>
                    <View style={styles.topicSubjectTag}>
                      <Text style={styles.topicSubjectText}>{cat.subject || "Chung"}</Text>
                    </View>
                    <Text style={styles.topicTitle} numberOfLines={2}>{cat.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
              <TouchableOpacity onPress={() => router.push("/(teacher)/notifications")}>
                <Text style={styles.seeAll}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityList}>
              {recentActivity.map((item, idx) => (
                <View key={idx} style={styles.activityItem}>
                  <View style={styles.activityIconBox}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityText} numberOfLines={1}>
                      <Text style={styles.activityName}>{item.studentName}</Text>
                      {" hoàn thành "}
                      <Text style={styles.activityLesson}>{item.lessonTitle}</Text>
                    </Text>
                    <Text style={styles.activityMeta}>
                      {item.className} · {timeAgo(item.completedAt)}
                      {item.score != null ? ` · ${item.score}/${item.total} điểm` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Classes List */}
        <View style={styles.classesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lớp học của tôi</Text>
            <TouchableOpacity onPress={() => router.push("/(teacher)/class-list")}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {stats?.classes && stats.classes.length > 0 ? (
            stats.classes.map((c: any) => (
              <ClassCard
                key={c.id}
                name={c.name}
                students={c.students}
                progress={c.progress}
                onPress={() =>
                  router.push({ pathname: "/(teacher)/class-detail/[id]", params: { id: c.id } })
                }
              />
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconBox}>
                <Ionicons name="school-outline" size={40} color="#94a3b8" />
              </View>
              <Text style={styles.emptyStateTitle}>Chưa có lớp học nào</Text>
              <Text style={styles.emptyStateSub}>Tạo lớp học để bắt đầu quản lý học sinh</Text>
              <TouchableOpacity
                style={styles.emptyStateBtn}
                onPress={() => router.push("/(teacher)/class-list")}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyStateBtnText}>Tạo lớp học</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, icon, color, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.statIconBox, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValueText, { color }]}>{value}</Text>
      <Text style={styles.statLabelText}>{title}</Text>
    </TouchableOpacity>
  );
}

function ActionItem({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIconBox, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ClassCard({ name, students, progress, onPress }: any) {
  const progressColor = progress >= 80 ? "#10B981" : progress >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <TouchableOpacity style={styles.classCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.classIconBox, { backgroundColor: "#4F46E518" }]}>
        <Ionicons name="school" size={20} color="#4F46E5" />
      </View>
      <View style={styles.classInfo}>
        <Text style={styles.className}>{name}</Text>
        <Text style={styles.classSub}>{students} học sinh</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
        </View>
      </View>
      <View style={styles.progressBadge}>
        <Text style={[styles.progressText, { color: progressColor }]}>{progress}%</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFDF0" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#1e293b", letterSpacing: -0.5 },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFBEB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFBEB",
  },

  scrollContent: { paddingBottom: 40 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  statIconBox: { width: 40, height: 40, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  statValueText: { fontSize: 26, fontWeight: "900", color: "#1e293b" },
  statLabelText: { fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: "600" },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  actionItem: { alignItems: "center", width: (SCREEN_WIDTH - 64) / 4 },
  actionIconBox: { width: 58, height: 58, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: "700", color: "#334155", textAlign: "center" },

  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "900", color: "#1e293b" },
  seeAll: { color: "#2E7D32", fontWeight: "700", fontSize: 13 },

  // Featured topics
  topicsScroll: { paddingLeft: 20, paddingRight: 8 },
  topicCard: {
    width: SCREEN_WIDTH * 0.38,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#e2e8f0",
  },
  topicImg: { width: "100%", height: "100%" },
  topicOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  topicSubjectTag: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  topicSubjectText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  topicTitle: { color: "#FFF", fontSize: 14, fontWeight: "900", lineHeight: 18 },

  emptyTopics: {
    marginHorizontal: 20,
    backgroundColor: "#FFFBEB",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    borderStyle: "dashed",
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyTopicsText: { fontSize: 15, fontWeight: "700", color: "#94a3b8" },
  emptyTopicsSub: { fontSize: 12, color: "#cbd5e1", textAlign: "center", paddingHorizontal: 24 },

  // Activity
  activityList: { paddingHorizontal: 20, gap: 10 },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    gap: 12,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  activityText: { fontSize: 13, color: "#334155", lineHeight: 18 },
  activityName: { fontWeight: "800", color: "#1e293b" },
  activityLesson: { fontWeight: "700", color: "#2E7D32" },
  activityMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },

  // Classes
  classesSection: { paddingHorizontal: 20 },
  classCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    gap: 12,
  },
  classIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  classSub: { fontSize: 12, color: "#94a3b8", marginTop: 2, marginBottom: 6 },
  progressBg: { height: 4, backgroundColor: "#F1F5F9", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressBadge: { alignItems: "center" },
  progressText: { fontSize: 13, fontWeight: "900" },

  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFBEB",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    gap: 8,
  },
  emptyStateIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyStateTitle: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  emptyStateSub: { fontSize: 13, color: "#94a3b8", textAlign: "center", paddingHorizontal: 32 },
  emptyStateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyStateBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});