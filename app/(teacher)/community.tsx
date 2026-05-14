import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList, Image, ActivityIndicator, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import client from "../../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TeacherCommunity() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchPosts();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("userData");
    if (data) setUserData(JSON.parse(data));
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await client.get("/posts?type=TEACHING_METHOD");
      setPosts(res.data);
    } catch (error) {
      console.error("Failed to fetch community posts", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cộng đồng Giáo viên</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Ionicons name="search" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Phương pháp dạy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Thảo luận chung</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <PostCard post={item} onRefresh={fetchPosts} userData={userData} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Chưa có phương pháp dạy nào được chia sẻ.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push("/share-post?type=TEACHING_METHOD")}
      >
        <Ionicons name="add" size={32} color="#fff" />
        <Text style={styles.fabText}>Chia sẻ phương pháp</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function PostCard({ post, onRefresh, userData }: any) {
  const router = useRouter();
  const isLiked = userData && post.likes?.includes(userData._id);

  const handleToggleLike = async () => {
    if (!userData) return;
    try {
      await client.patch(`/posts/${post._id}/like`, { userId: userData._id });
      onRefresh();
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Đồng nghiệp ơi, hãy xem phương pháp dạy này: "${post.title}"\n\nNội dung: ${post.content}`,
      });
    } catch (error) {
      console.error("Error sharing", error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => router.push({ pathname: "/post-detail/[id]", params: { id: post._id } })}
    >
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.authorAvatarBox}>
            <Text style={styles.authorInitial}>{post.authorName[0]}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.authorName}</Text>
            <Text style={styles.postTime}>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</Text>
          </View>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" />
      </View>
      
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postExcerpt} numberOfLines={3}>{post.content}</Text>
      
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.footerAction} onPress={handleToggleLike}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={isLiked ? "#EF4444" : "#64748b"} 
          />
          <Text style={[styles.footerText, isLiked && { color: "#EF4444" }]}>{post.likes?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.footerAction}
          onPress={() => router.push({ pathname: "/post-detail/[id]", params: { id: post._id } })}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
          <Text style={styles.footerText}>{post.comments?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerAction} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFFDF0" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b", letterSpacing: -0.5 },
  searchBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FEF9C3" },
  tabs: { flexDirection: "row", paddingHorizontal: 20, backgroundColor: "#FFFDF0", paddingBottom: 10 },
  tab: { marginRight: 24, paddingBottom: 8 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 14, fontWeight: "bold", color: "#94a3b8" },
  activeTabText: { color: "#2E7D32" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFDF0" },
  listContent: { padding: 20, paddingBottom: 100 },
  postCard: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#FEF9C3", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  postHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  authorInfo: { flexDirection: "row", alignItems: "center" },
  authorAvatarBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#FFFDF0", justifyContent: "center", alignItems: "center", marginRight: 12, borderWidth: 1, borderColor: "#FEF9C3" },
  authorInitial: { fontSize: 16, fontWeight: "bold", color: "#2E7D32" },
  authorName: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  postTime: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  postTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 8 },
  postExcerpt: { fontSize: 14, color: "#475569", lineHeight: 22, marginBottom: 16 },
  postFooter: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#FEF9C3", paddingTop: 16, gap: 20 },
  footerAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 13, fontWeight: "bold", color: "#64748b" },
  fab: { position: "absolute", bottom: 30, right: 20, backgroundColor: "#2E7D32", paddingHorizontal: 24, paddingVertical: 16, borderRadius: 30, flexDirection: "row", alignItems: "center", shadowColor: "#2E7D32", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  fabText: { color: "#fff", fontWeight: "bold", marginLeft: 8, fontSize: 15 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 15, color: "#94a3b8", textAlign: "center", paddingHorizontal: 40, lineHeight: 24 }
});
