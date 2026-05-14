import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, useWindowDimensions, Dimensions, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import client from "../../src/api/client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TeacherProfileScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        client.get("/auth/profile"),
        client.get("/classes/teacher/stats")
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch profile data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.fullName || "Teacher"}` }} 
              style={styles.avatar}
            />
            <View style={styles.editBadge}><Ionicons name="pencil" size={14} color="#fff" /></View>
          </View>
          <Text style={styles.name}>{profile?.fullName || "Giáo viên"}</Text>
          <Text style={styles.roleSub}>Teacher ID: #{profile?._id?.slice(-5).toUpperCase() || "N/A"}</Text>
          <Text style={styles.workplace}>Email: {profile?.email || "Chưa cập nhật"}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox value={stats?.totalStudents || 0} label="Tổng học sinh" />
          <StatBox value={stats?.totalClasses || 0} label="Tổng lớp" />
          <StatBox value={stats?.totalLessons || 0} label="Bài tập đã giao" />
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem icon="sparkles" label="Quản lý AI Assistant" />
          <MenuItem icon="share-social" label="Chia sẻ phương pháp dạy" color="#10B981" onPress={() => router.push({ pathname: "/share-post", params: { type: "TEACHING_METHOD" } })} />
          <MenuItem icon="notifications" label="Cài đặt thông báo" />
          <MenuItem icon="language" label="Cài đặt ngôn ngữ" />
          <MenuItem icon="help-circle" label="Trung tâm hỗ trợ" />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ value, label }: any) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconBox}><Ionicons name={icon} size={20} color="#475569" /></View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFDF0" },
  scrollContent: { paddingBottom: 40 },
  profileCard: { alignItems: "center", padding: 32, backgroundColor: "#FFFBEB", borderBottomLeftRadius: 40, borderBottomRightRadius: 40, borderWidth: 1, borderTopWidth: 0, borderColor: "#FEF9C3" },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#fff", borderWidth: 2, borderColor: "#FEF9C3" },
  editBadge: { position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#FFFBEB" },
  name: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  roleSub: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  workplace: { fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 12, lineHeight: 22 },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, marginTop: -30 },
  statItem: { width: (SCREEN_WIDTH - 64) / 3, backgroundColor: "#FFFBEB", paddingVertical: 20, borderRadius: 24, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: "#FEF9C3" },
  statValue: { fontSize: 20, fontWeight: "900", color: "#2E7D32" },
  statLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "bold", marginTop: 4, textAlign: "center" },
  menuSection: { padding: 24, marginTop: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#FEF9C3" },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center", marginRight: 16, borderWidth: 1, borderColor: "#FEF9C3" },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "bold", color: "#475569" },
  logoutBtn: { margin: 24, height: 60, borderRadius: 20, backgroundColor: "#EF4444", justifyContent: "center", alignItems: "center", shadowColor: "#EF4444", shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  logoutText: { color: "#fff", fontSize: 18, fontWeight: "bold" }
});
