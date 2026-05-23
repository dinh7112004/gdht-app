import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import client, { resolveImageUrl } from "../../src/api/client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TeacherProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadWithCache = async () => {
        try {
          const cached = await AsyncStorage.getItem("teacher_profile_cache");
          if (cached) {
            const data = JSON.parse(cached);
            setProfile(data.profile);
            setEditName(data.profile?.fullName || "");
            setStats(data.stats);
            setLoading(false);
          }
        } catch (_) {}
        fetchProfileData();
      };
      void loadWithCache();
    }, []),
  );

  const fetchProfileData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        client.get("/auth/profile"),
        client.get("/classes/teacher/stats"),
      ]);
      setProfile(profileRes.data);
      setEditName(profileRes.data.fullName || "");
      setStats(statsRes.data);
      await AsyncStorage.setItem("userData", JSON.stringify(profileRes.data));
      await AsyncStorage.setItem("teacher_profile_cache", JSON.stringify({
        profile: profileRes.data,
        stats: statsRes.data,
      }));
    } catch (error) {
      console.error("Failed to fetch profile data", error);
      const cached = await AsyncStorage.getItem("userData");
      if (cached) setProfile(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim()) {
      Alert.alert("Lỗi", "Tên không được để trống");
      return;
    }
    try {
      setSaving(true);
      const res = await client.put(`/users/${profile._id}`, {
        fullName: editName.trim(),
      });
      setProfile(res.data);
      await AsyncStorage.setItem("userData", JSON.stringify(res.data));
      setShowEditModal(false);
      Alert.alert("Thành công", "Đã cập nhật tên hiển thị!");
    } catch (e: any) {
      Alert.alert("Lỗi", e.response?.data?.message || "Không thể cập nhật tên");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Thầy/Cô có chắc muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const avatarUrl =
    resolveImageUrl(profile?.equippedItems?.avatarId?.imageUrl || profile?.avatar) ||
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => router.push("/profile/account-info")} style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {profile?.fullName || "Giáo viên"}
              </Text>
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => router.push("/profile/account-info")}
              >
                <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <View style={styles.roleTag}>
              <Ionicons name="school" size={12} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.roleText}>Giáo viên Heritage Math</Text>
            </View>
            <Text style={styles.emailText} numberOfLines={1}>
              {profile?.email || ""}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatBox
            value={stats?.totalStudents || 0}
            label="Học sinh"
            icon="people"
            color="#4F46E5"
          />
          <View style={styles.statDivider} />
          <StatBox
            value={stats?.totalClasses || 0}
            label="Lớp học"
            icon="school"
            color="#10B981"
          />
          <View style={styles.statDivider} />
          <StatBox
            value={stats?.totalLessons || 0}
            label="Bài đã giao"
            icon="document-text"
            color="#F59E0B"
          />
          <View style={styles.statDivider} />
          <StatBox
            value={`${stats?.averageProgress || 0}%`}
            label="TB tiến độ"
            icon="trending-up"
            color="#EF4444"
          />
        </View>

        {/* Menu */}
        <View style={styles.menuList}>
          <Text style={styles.menuSectionTitle}>Quản lý</Text>
          <MenuItem
            icon="school-outline"
            label="Quản lý lớp học"
            color="#10B981"
            onPress={() => router.push("/(teacher)/class-list")}
          />
          <MenuItem
            icon="library-outline"
            label="Thư viện bài giảng"
            color="#F59E0B"
            onPress={() => router.push("/(teacher)/library")}
          />
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="AI Trợ lý"
            color="#3B82F6"
            onPress={() => router.push("/(teacher)/ai")}
          />
          <MenuItem
            icon="share-social-outline"
            label="Chia sẻ phương pháp dạy"
            color="#8B5CF6"
            onPress={() =>
              router.push({
                pathname: "/share-post",
                params: { type: "TEACHING_METHOD" },
              })
            }
          />

          <Text style={[styles.menuSectionTitle, { marginTop: 24 }]}>Tài khoản</Text>
          <MenuItem
            icon="notifications-outline"
            label="Thông báo"
            color="#64748b"
            onPress={() => router.push("/(teacher)/notifications")}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Trung tâm hỗ trợ"
            color="#64748b"
            onPress={() => router.push("/profile/help-center")}
          />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <View style={styles.logoutIconBox}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cập nhật tên hiển thị</Text>
            <TextInput
              style={styles.nameInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nhập tên của Thầy/Cô..."
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdateName}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function StatBox({ value, label, icon, color }: any) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} disabled={!onPress}>
      <View style={[styles.menuIconBox, { backgroundColor: (color || "#64748b") + "15" }]}>
        <Ionicons name={icon} size={20} color={color || "#64748b"} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFDF0" },
  scrollContent: { paddingBottom: 60 },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: "#FFFBEB",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#FEF9C3",
    marginBottom: 20,
  },
  avatarWrapper: { position: "relative", marginRight: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#FEF9C3",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFBEB",
  },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  userName: { fontSize: 20, fontWeight: "900", color: "#1e293b", flex: 1 },
  editIcon: { padding: 4, marginLeft: 4 },
  roleTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  roleText: { fontSize: 11, fontWeight: "bold", color: "#fff" },
  emailText: { fontSize: 12, color: "#94a3b8" },

  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
    backgroundColor: "#FFFBEB",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 10, color: "#94A3B8", marginTop: 4, fontWeight: "700", textAlign: "center" },
  statDivider: { width: 1, height: 36, backgroundColor: "#FEF9C3", alignSelf: "center" },

  menuList: { paddingHorizontal: 24 },
  menuSectionTitle: { fontSize: 13, fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FEF9C3",
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: "#334155" },
  logoutBtn: { flexDirection: "row", alignItems: "center", marginTop: 16, paddingVertical: 16 },
  logoutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  logoutText: { fontSize: 16, color: "#EF4444", fontWeight: "800" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: { backgroundColor: "#FFF", borderRadius: 32, padding: 30, width: "100%" },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b", marginBottom: 20, textAlign: "center" },
  nameInput: {
    backgroundColor: "#F8FAFC",
    padding: 18,
    borderRadius: 20,
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: { color: "#64748B", fontWeight: "800" },
  saveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "#2E7D32",
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontWeight: "900" },
});