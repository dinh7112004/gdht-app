import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, useWindowDimensions, Dimensions, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import client from "../../src/api/client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TeacherDashboard() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, categoriesRes] = await Promise.all([
        client.get("/classes/teacher/stats"),
        client.get("/categories")
      ]);
      console.log('Mobile Dashboard Stats Response:', JSON.stringify(statsRes.data, null, 2));
      setStats(statsRes.data);
      setFeaturedCategories(categoriesRes.data);
    } catch (error: any) {
      console.error("Failed to fetch teacher dashboard data", error);
      if (error.response) {
        console.log('Error Response Data:', error.response.data);
        console.log('Error Status:', error.response.status);
      }
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
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bảng điều khiển</Text>
          <Text style={styles.headerSub}>Chào buổi sáng, {stats?.teacherName || 'Giáo viên'}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push("/(teacher)/notifications")}>
          <Ionicons name="notifications-outline" size={24} color="#1e293b" />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Tổng học sinh"
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
            title="Bài tập giao"
            value={stats?.totalLessons || 0}
            icon="document-text"
            color="#F59E0B"
            onPress={() => router.push("/(teacher)/library")}
          />
          <StatCard
            title="Trung bình"
            value={`${stats?.averageProgress || 0}%`}
            icon="trending-up"
            color="#EF4444"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <ActionItem icon="document-text" label="Giao bài mới" color="#2E7D32" onPress={() => router.push("/(teacher)/library")} />
          <ActionItem icon="sparkles" label="Tạo bài AI" color="#3B82F6" onPress={() => router.push("/(teacher)/ai")} />
          <ActionItem icon="people" label="Duyệt bài" color="#F59E0B" onPress={() => router.push("/(teacher)/community")} />
          <ActionItem icon="school" label="Quản lý lớp" color="#6366F1" onPress={() => router.push("/(teacher)/class-list")} />
        </View>

        {/* Featured Topics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chủ đề nổi bật</Text>
            <TouchableOpacity onPress={() => router.push("/(teacher)/library")}>
              <Text style={styles.seeAll}>Tất cả</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsScroll}>
            {featuredCategories.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                style={styles.topicCard}
                onPress={() => router.push({ pathname: "/category/[id]", params: { id: cat._id, name: cat.name } })}
              >
                <Image source={{ uri: cat.imageUrl?.trim() || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400" }} style={styles.topicImg} />
                <View style={styles.topicOverlay}>
                  <Text style={styles.topicTitle}>{cat.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Classes List Shortcut */}
        <View style={styles.classesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh sách lớp học</Text>
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
                onPress={() => router.push({ pathname: "/(teacher)/class-detail/[id]", params: { id: c.id } })}
              />
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="school-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateTitle}>Chưa có lớp học</Text>
              <Text style={styles.emptyStateSub}>Bạn chưa tạo hoặc tham gia lớp nào.</Text>
              <TouchableOpacity
                style={styles.emptyStateBtn}
                onPress={() => router.push("/(teacher)/class-list")}
              >
                <Text style={styles.emptyStateBtnText}>Quản lý Lớp học</Text>
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
      activeOpacity={0.7}
    >
      <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValueText}>{value}</Text>
      <Text style={styles.statLabelText}>{title}</Text>
    </TouchableOpacity>
  );
}

function ActionItem({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={[styles.actionIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ClassCard({ name, students, progress, onPress }: any) {
  return (
    <TouchableOpacity style={styles.classCard} onPress={onPress}>
      <View style={styles.classInfo}>
        <Text style={styles.className}>{name}</Text>
        <Text style={styles.classSub}>{students} học sinh</Text>
      </View>
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>{progress}%</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFFDF0" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FEF9C3" },
  badge: { position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 2, borderColor: "#fff" },
  scrollContent: { paddingBottom: 40 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 20 },
  statCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: "#FFFBEB", padding: 16, borderRadius: 24, borderWidth: 1, borderColor: "#FEF9C3" },
  statIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  statValueText: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  statLabelText: { fontSize: 11, color: "#64748b", marginTop: 2 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 32 },
  actionItem: { alignItems: "center", width: (SCREEN_WIDTH - 64) / 4 },
  actionIconBox: { width: 56, height: 56, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: "bold", color: "#1e293b", textAlign: "center" },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  seeAll: { color: "#2E7D32", fontWeight: "600", fontSize: 13 },
  topicsScroll: { paddingLeft: 20, paddingRight: 8 },
  topicCard: { width: SCREEN_WIDTH * 0.35, height: SCREEN_WIDTH * 0.45, borderRadius: 20, overflow: "hidden", marginRight: 12, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FEF9C3" },
  topicImg: { width: "100%", height: "100%" },
  topicOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", padding: 10, backgroundColor: 'rgba(0,0,0,0.2)' },
  topicTitle: { color: "#FFF", fontSize: 13, fontWeight: "bold" },
  classesSection: { paddingHorizontal: 20 },
  classCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: "#FEF9C3" },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  classSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  progressSection: { alignItems: "flex-end", marginRight: 12 },
  progressText: { fontSize: 12, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
  progressBg: { width: 60, height: 4, backgroundColor: "#FFFDF0", borderRadius: 2 },
  progressFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 2 },
  emptyStateContainer: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFFBEB', borderRadius: 20, borderWidth: 1, borderColor: '#FEF9C3' },
  emptyStateTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginTop: 12 },
  emptyStateSub: { fontSize: 13, color: '#94a3b8', marginTop: 4, marginBottom: 16 },
  emptyStateBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyStateBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
