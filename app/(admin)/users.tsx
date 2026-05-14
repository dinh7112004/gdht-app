import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import client from "../../src/api/client";

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await client.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý tài khoản</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.userCard}
              onPress={() => router.push({ pathname: "/(admin)/rbac/[id]", params: { id: item._id } })}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{item.fullName[0]}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <View style={styles.roleContainer}>
                <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>{item.role}</Text>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function getRoleColor(role: string) {
  switch(role) {
    case 'ADMIN': return '#4F46E5';
    case 'TEACHER': return '#10B981';
    case 'PARENT': return '#F59E0B';
    default: return '#64748b';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#fff" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#1e293b" },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: "#F1F5F9" },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, color: "#1e293b", fontWeight: "500" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, paddingTop: 0 },
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 },
  userAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", marginRight: 16 },
  avatarText: { fontSize: 16, fontWeight: "bold", color: "#475569" },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  userEmail: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  roleContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  roleText: { fontSize: 11, fontWeight: "black", textTransform: "uppercase" }
});
