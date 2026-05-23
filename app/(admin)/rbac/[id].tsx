import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import client from "../../../src/api/client";

const AVAILABLE_PERMISSIONS = [
  'MANAGE_USERS',
  'MANAGE_CONTENT',
  'MODERATE_COMMUNITY',
  'VIEW_REPORTS',
  'MANAGE_CLASSES',
  'MANAGE_GAMIFICATION',
  'ACCESS_AI_CONFIG'
];

export default function AdminRBACEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/users`);
      const foundUser = res.data.find((u: any) => u._id === id);
      setUser(foundUser);
    } catch (error) {
      console.error("Failed to fetch user details", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (perm: string) => {
    const currentPerms = user.permissions || [];
    const newPerms = currentPerms.includes(perm)
      ? currentPerms.filter((p: string) => p !== perm)
      : [...currentPerms, perm];
    setUser({ ...user, permissions: newPerms });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.patch(`/users/${id}`, {
        role: user.role,
        permissions: user.permissions
      });
      Alert.alert("Thành công", "Đã cập nhật quyền hạn người dùng.");
      router.back();
    } catch (error) {
      console.error("Failed to update user RBAC", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thiết lập quyền</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#4F46E5" /> : <Text style={styles.saveText}>Lưu</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.userSection}>
           <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>{user.fullName[0]}</Text>
           </View>
           <Text style={styles.userName}>{user.fullName}</Text>
           <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>Vai trò chính (Role)</Text>
        <View style={styles.roleGrid}>
          {['STUDENT', 'TEACHER', 'PARENT', 'ADMIN'].map(role => (
            <TouchableOpacity 
              key={role} 
              style={[styles.roleBtn, user.role === role && styles.roleBtnActive]}
              onPress={() => setUser({ ...user, role })}
            >
              <Text style={[styles.roleBtnText, user.role === role && styles.roleBtnTextActive]}>{role}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quyền hạn chi tiết (Permissions)</Text>
        <View style={styles.permList}>
          {AVAILABLE_PERMISSIONS.map(perm => (
            <View key={perm} style={styles.permItem}>
              <View style={styles.permInfo}>
                <Text style={styles.permLabel}>{perm.replace(/_/g, ' ')}</Text>
                <Text style={styles.permSub}>Cho phép truy cập module {perm.split('_')[1].toLowerCase()}</Text>
              </View>
              <Switch 
                value={(user.permissions || []).includes(perm)}
                onValueChange={() => togglePermission(perm)}
                trackColor={{ false: "#cbd5e1", true: "#4F46E5" }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  saveText: { fontSize: 16, fontWeight: "bold", color: "#4F46E5" },
  scrollContent: { padding: 20 },
  userSection: { alignItems: "center", marginBottom: 32 },
  avatarLarge: { width: 80, height: 80, borderRadius: 28, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  avatarTextLarge: { fontSize: 32, fontWeight: "bold", color: "#4F46E5" },
  userName: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  userEmail: { fontSize: 14, color: "#64748b", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 16, marginTop: 16 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  roleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#F1F5F9", backgroundColor: "#F8FAFC" },
  roleBtnActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  roleBtnText: { fontSize: 12, fontWeight: "bold", color: "#64748b" },
  roleBtnTextActive: { color: "#FFFFFF" },
  permList: { backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#F1F5F9", overflow: "hidden" },
  permItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  permInfo: { flex: 1, marginRight: 16 },
  permLabel: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
  permSub: { fontSize: 11, color: "#94a3b8", marginTop: 2 }
});
