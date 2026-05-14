import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import client from "../../src/api/client";

const { width } = Dimensions.get("window");

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    totalUsers: 1240,
    activeLessons: 45,
    pendingPosts: 12,
    aiInteractions: 8920
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hệ thống Quản trị</Text>
          <Text style={styles.headerSub}>Chào mừng trở lại, Admin</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color="#1e293b" />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <KpiCard title="Người dùng" value={stats.totalUsers} icon="people" color="#4F46E5" />
          <KpiCard title="Bài học" value={stats.activeLessons} icon="book" color="#10B981" />
          <KpiCard title="Chờ duyệt" value={stats.pendingPosts} icon="shield-checkmark" color="#F59E0B" />
          <KpiCard title="AI Chat" value={stats.aiInteractions} icon="sparkles" color="#8B5CF6" />
        </View>

        {/* Action Sections */}
        <Text style={styles.sectionTitle}>Quản lý nhanh</Text>
        <View style={styles.actionRow}>
          <BigAction icon="document-text-outline" label="Duyệt nội dung" sub="12 bài đang chờ" color="#F59E0B" />
          <BigAction icon="key-outline" label="Phân quyền" sub="Quản lý RBAC" color="#4F46E5" />
        </View>

        <View style={styles.recentSection}>
           <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hoạt động mới nhất</Text>
              <TouchableOpacity><Text style={styles.seeAll}>Tất cả</Text></TouchableOpacity>
           </View>
           
           <ActivityItem user="Cô Mai" action="Giao bài tập" time="2 phút trước" />
           <ActivityItem user="Minh Anh" action="Đăng mẹo học" time="15 phút trước" />
           <ActivityItem user="Admin" action="Cập nhật hệ thống" time="1 giờ trước" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCard({ title, value, icon, color }: any) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{title}</Text>
    </View>
  );
}

function BigAction({ icon, label, sub, color }: any) {
  return (
    <TouchableOpacity style={styles.bigAction}>
      <View style={[styles.bigIconBox, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.bigLabel}>{label}</Text>
      <Text style={styles.bigSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

function ActivityItem({ user, action, time }: any) {
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityAvatar}>
        <Text style={styles.avatarText}>{user[0]}</Text>
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityUser}>{user} <Text style={styles.activityAction}>{action}</Text></Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#fff" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  badge: { position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 2, borderColor: "#fff" },
  scrollContent: { padding: 20 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32 },
  kpiCard: { width: (width - 52) / 2, backgroundColor: "#fff", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "#F1F5F9" },
  iconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  kpiValue: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  kpiLabel: { fontSize: 12, color: "#64748b", marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 16 },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 32 },
  bigAction: { flex: 1, backgroundColor: "#fff", padding: 20, borderRadius: 28, borderWidth: 1, borderColor: "#F1F5F9" },
  bigIconBox: { width: 56, height: 56, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  bigLabel: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  bigSub: { fontSize: 11, color: "#64748b", marginTop: 4 },
  recentSection: { marginTop: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  seeAll: { fontSize: 14, color: "#4F46E5", fontWeight: "bold" },
  activityItem: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  activityAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#E0E7FF", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { color: "#4F46E5", fontWeight: "bold" },
  activityInfo: { flex: 1 },
  activityUser: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
  activityAction: { fontWeight: "normal", color: "#64748b" },
  activityTime: { fontSize: 11, color: "#94a3b8", marginTop: 2 }
});
