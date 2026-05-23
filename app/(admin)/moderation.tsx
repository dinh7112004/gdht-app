import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import client from "../../src/api/client";

export default function AdminModeration() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("TEACHING_METHOD");

  useEffect(() => {
    fetchPendingPosts();
  }, [activeTab]);

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/posts?status=PENDING&type=${activeTab}`);
      setPosts(res.data);
    } catch (error) {
      console.error("Failed to fetch pending posts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: string) => {
    try {
      await client.patch(`/posts/${id}/status`, { status });
      setPosts(posts.filter(p => p._id !== id));
      Alert.alert("Thành công", `Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} bài viết.`);
    } catch (error) {
      console.error("Failed to update post status", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Duyệt nội dung</Text>
        <TouchableOpacity onPress={fetchPendingPosts}>
          <Ionicons name="refresh" size={20} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "TEACHING_METHOD" && styles.activeTab]}
          onPress={() => setActiveTab("TEACHING_METHOD")}
        >
          <Text style={[styles.tabText, activeTab === "TEACHING_METHOD" && styles.activeTabText]}>Giáo viên</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "LEARNING_TIP" && styles.activeTab]}
          onPress={() => setActiveTab("LEARNING_TIP")}
        >
          <Text style={[styles.tabText, activeTab === "LEARNING_TIP" && styles.activeTabText]}>Học sinh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.authorBadge}>
                  <Text style={styles.authorInitial}>{item.authorName[0]}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.authorName}>{item.authorName}</Text>
                  <Text style={styles.postType}>{item.type === 'TEACHING_METHOD' ? 'Phương pháp dạy' : 'Cách học hay'}</Text>
                </View>
              </View>
              
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleAction(item._id, 'REJECTED')}
                >
                  <Ionicons name="close" size={20} color="#EF4444" />
                  <Text style={styles.rejectText}>Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleAction(item._id, 'APPROVED')}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.approveText}>Duyệt bài</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Tuyệt vời! Không còn bài viết nào đang chờ duyệt.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#fff" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#1e293b" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 20, paddingBottom: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 12, borderRadius: 12 },
  activeTab: { backgroundColor: "#EEF2FF" },
  tabText: { fontSize: 14, fontWeight: "bold", color: "#94a3b8" },
  activeTabText: { color: "#4F46E5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16 },
  postCard: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  authorBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  authorInitial: { fontWeight: "bold", color: "#475569" },
  authorName: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  postType: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  postTitle: { fontSize: 17, fontWeight: "bold", color: "#1e293b", marginBottom: 8 },
  postContent: { fontSize: 14, color: "#64748b", lineHeight: 20, marginBottom: 20 },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, height: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  rejectBtn: { backgroundColor: "#FEF2F2" },
  approveBtn: { backgroundColor: "#4F46E5" },
  rejectText: { color: "#EF4444", fontWeight: "bold", fontSize: 14 },
  approveText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 15, color: "#94a3b8", textAlign: "center", paddingHorizontal: 40, lineHeight: 22 }
});
