import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ActivityIndicator, Share, Modal, TextInput, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import client from "../../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "INAPPROPRIATE", label: "Nội dung không phù hợp" },
  { value: "MISINFORMATION", label: "Thông tin sai lệch" },
  { value: "HARASSMENT", label: "Quấy rối" },
  { value: "OTHER", label: "Lý do khác" },
];

export default function TeacherCommunity() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'TEACHING_METHOD' | 'DISCUSSION'>('TEACHING_METHOD');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("userData");
    if (data) setUserData(JSON.parse(data));
  };

  const fetchPosts = useCallback(async () => {
    try {
      const res = await client.get(`/posts?type=${activeTab}&status=APPROVED`);
      setPosts(res.data);
      await AsyncStorage.setItem("teacher_community_cache", JSON.stringify({ posts: res.data, activeTab }));
    } catch (error) {
      console.error("Failed to fetch community posts", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useFocusEffect(
    useCallback(() => {
      const loadWithCache = async () => {
        try {
          const cached = await AsyncStorage.getItem("teacher_community_cache");
          if (cached) {
            const data = JSON.parse(cached);
            if (data.activeTab === activeTab) {
              setPosts(data.posts || []);
              setLoading(false);
            }
          }
        } catch (_) {}
        fetchPosts();
        loadUserData();
      };
      void loadWithCache();
    }, [fetchPosts])
  );

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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'TEACHING_METHOD' && styles.activeTab]}
          onPress={() => setActiveTab('TEACHING_METHOD')}
        >
          <Text style={[styles.tabText, activeTab === 'TEACHING_METHOD' && styles.activeTabText]}>Phương pháp dạy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'DISCUSSION' && styles.activeTab]}
          onPress={() => setActiveTab('DISCUSSION')}
        >
          <Text style={[styles.tabText, activeTab === 'DISCUSSION' && styles.activeTabText]}>Thảo luận chung</Text>
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

  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState("SPAM");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmitReport = async () => {
    if (!userData) return;
    try {
      setSubmitting(true);
      await client.post("/content-reports", {
        postId: post._id,
        postTitle: post.title,
        reporterId: userData._id,
        reporterName: userData.fullName || userData.name || "Người dùng",
        reason: selectedReason,
        description,
      });
      setReportVisible(false);
      setDescription("");
      setSelectedReason("SPAM");
      Alert.alert("Đã gửi báo cáo", "Cảm ơn bạn! Chúng tôi sẽ xem xét báo cáo này sớm nhất.");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi báo cáo. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
          <TouchableOpacity onPress={() => setMenuVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" />
          </TouchableOpacity>
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

      {/* Menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <View style={styles.menuHandle} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setReportVisible(true);
              }}
            >
              <Ionicons name="flag-outline" size={20} color="#EF4444" />
              <Text style={styles.menuItemTextDanger}>Báo cáo bài viết</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Ionicons name="close-outline" size={20} color="#64748b" />
              <Text style={styles.menuItemText}>Huỷ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report modal */}
      <Modal visible={reportVisible} transparent animationType="slide" onRequestClose={() => setReportVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setReportVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.reportSheet}>
            <View style={styles.menuHandle} />
            <Text style={styles.reportTitle}>Báo cáo bài viết</Text>
            <Text style={styles.reportSubtitle}>Chọn lý do báo cáo</Text>

            {REPORT_REASONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.reasonItem, selectedReason === r.value && styles.reasonItemActive]}
                onPress={() => setSelectedReason(r.value)}
              >
                <View style={[styles.radioOuter, selectedReason === r.value && styles.radioOuterActive]}>
                  {selectedReason === r.value && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.reasonText, selectedReason === r.value && styles.reasonTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.descInput}
              placeholder="Mô tả thêm (không bắt buộc)..."
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitReport}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>{submitting ? "Đang gửi..." : "Gửi báo cáo"}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
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
  emptyText: { marginTop: 16, fontSize: 15, color: "#94a3b8", textAlign: "center", paddingHorizontal: 40, lineHeight: 24 },
  // Menu & report modals
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  menuSheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36 },
  menuHandle: { width: 40, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  menuItemText: { fontSize: 15, fontWeight: "bold", color: "#475569" },
  menuItemTextDanger: { fontSize: 15, fontWeight: "bold", color: "#EF4444" },
  reportSheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  reportTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b", marginBottom: 4 },
  reportSubtitle: { fontSize: 13, color: "#94a3b8", fontWeight: "bold", marginBottom: 20 },
  reasonItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, marginBottom: 8, backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "transparent" },
  reasonItemActive: { backgroundColor: "#F0FDF4", borderColor: "#2E7D32" },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#cbd5e1", justifyContent: "center", alignItems: "center" },
  radioOuterActive: { borderColor: "#2E7D32" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2E7D32" },
  reasonText: { fontSize: 14, fontWeight: "bold", color: "#475569" },
  reasonTextActive: { color: "#166534" },
  descInput: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 16, padding: 14, fontSize: 14, color: "#1e293b", marginTop: 12, marginBottom: 16, minHeight: 80, textAlignVertical: "top" },
  submitBtn: { backgroundColor: "#EF4444", paddingVertical: 16, borderRadius: 20, alignItems: "center" },
  submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});