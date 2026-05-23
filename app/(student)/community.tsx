import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList, Image, ActivityIndicator, Share, Modal, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import client, { resolveImageUrl } from "../../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "INAPPROPRIATE", label: "Nội dung không phù hợp" },
  { value: "MISINFORMATION", label: "Thông tin sai lệch" },
  { value: "HARASSMENT", label: "Quấy rối" },
  { value: "OTHER", label: "Lý do khác" },
];

export default function StudentCommunity() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'TIPS' | 'RANK'>('TIPS');
  const [rankType, setRankType] = useState<'CLASS' | 'SCHOOL'>('SCHOOL');
  const [period, setPeriod] = useState<'WEEK' | 'MONTH' | 'ALL'>('WEEK');
  const [posts, setPosts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const { tab } = useLocalSearchParams<{ tab: string }>();

  useEffect(() => {
    if (tab === 'RANK') {
      setActiveTab('RANK');
    }
  }, [tab]);

  useEffect(() => {
    const loadWithCache = async () => {
      try {
        const cached = await AsyncStorage.getItem("student_community_cache");
        if (cached) {
          const data = JSON.parse(cached);
          if (activeTab === 'TIPS') {
            setPosts(data.posts || []);
          } else {
            setLeaderboard(data.leaderboard || []);
          }
          setLoading(false);
        }
      } catch (_) {}
      fetchProfile();
      if (activeTab === 'TIPS') {
        fetchPosts();
      } else {
        fetchLeaderboard();
      }
    };
    void loadWithCache();
  }, [activeTab, rankType, period]);

  const fetchProfile = async () => {
    try {
      const res = await client.get("/auth/profile");
      setUserProfile(res.data);
    } catch (e) {}
  };

  const fetchPosts = async () => {
    try {
      const res = await client.get("/posts?type=LEARNING_TIP");
      setPosts(res.data);
      await AsyncStorage.setItem("student_community_cache", JSON.stringify({ posts: res.data }));
    } catch (error) {
      console.error("Failed to fetch community posts", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      let url = `/users/leaderboard?type=${rankType}&period=${period}`;
      if (rankType === 'CLASS' && userProfile?.classId) {
        url += `&classId=${userProfile.classId}`;
      }
      const res = await client.get(url);
      setLeaderboard(res.data);
      await AsyncStorage.setItem("student_community_cache", JSON.stringify({ leaderboard: res.data }));
    } catch (error) {
      console.error("Failed to fetch leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{activeTab === 'TIPS' ? "Góc học tập" : "Bảng xếp hạng"}</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Ionicons name="search" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'TIPS' && styles.activeTab]}
          onPress={() => setActiveTab('TIPS')}
        >
          <Text style={[styles.tabText, activeTab === 'TIPS' && styles.activeTabText]}>Cách học hay</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'RANK' && styles.activeTab]}
          onPress={() => setActiveTab('RANK')}
        >
          <Text style={[styles.tabText, activeTab === 'RANK' && styles.activeTabText]}>Bảng xếp hạng</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'RANK' && (
        <View style={styles.rankHeader}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rankFilters}>
            <TouchableOpacity 
              style={[styles.filterBtn, rankType === 'CLASS' && styles.activeFilterBtn]}
              onPress={() => setRankType('CLASS')}
            >
              <Text style={[styles.filterText, rankType === 'CLASS' && styles.activeFilterText]}>Lớp học</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterBtn, rankType === 'SCHOOL' && styles.activeFilterBtn]}
              onPress={() => setRankType('SCHOOL')}
            >
              <Text style={[styles.filterText, rankType === 'SCHOOL' && styles.activeFilterText]}>Toàn trường</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity 
              style={[styles.filterBtn, period === 'WEEK' && styles.activeFilterBtn]}
              onPress={() => setPeriod('WEEK')}
            >
              <Text style={[styles.filterText, period === 'WEEK' && styles.activeFilterText]}>Tuần này</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterBtn, period === 'MONTH' && styles.activeFilterBtn]}
              onPress={() => setPeriod('MONTH')}
            >
              <Text style={[styles.filterText, period === 'MONTH' && styles.activeFilterText]}>Tháng này</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : activeTab === 'TIPS' ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <PostCard post={item} onRefresh={fetchPosts} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bulb-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Chưa có mẹo học tập nào được chia sẻ. Hãy là người đầu tiên!</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item, index }) => (
            <View style={[styles.rankItem, item._id === userProfile?._id && styles.myRankItem]}>
              <View style={styles.rankBadge}>
                {index < 3 ? (
                  <Ionicons 
                    name="trophy" 
                    size={20} 
                    color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"} 
                  />
                ) : (
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                )}
              </View>
              <Image 
                source={{ uri: resolveImageUrl(item.avatar) }} 
                style={styles.rankAvatar} 
              />
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{item.fullName}</Text>
                <Text style={styles.rankLevel}>Level {item.level}</Text>
              </View>
              <View style={styles.rankScoreBox}>
                <Text style={styles.rankScore}>{(item.periodXp || 0).toLocaleString()}</Text>
                <Text style={styles.rankUnit}>XP {period === 'WEEK' ? 'tuần' : 'tháng'}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.rankListContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Chưa có ai trong danh sách này. Hãy bắt đầu học để đứng đầu!</Text>
            </View>
          }
        />
      )}

      {activeTab === 'TIPS' && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push("/share-post?type=LEARNING_TIP")}
        >
          <Ionicons name="rocket" size={24} color="#fff" />
          <Text style={styles.fabText}>Chia sẻ cách học</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function PostCard({ post, onRefresh }: any) {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState("SPAM");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("userData");
    if (data) setUserData(JSON.parse(data));
  };

  const isLiked = userData && post.likes?.includes(userData._id);
  const isSaved = userData && userData.savedPosts?.includes(post._id);

  const handleToggleLike = async () => {
    if (!userData) return;
    try {
      await client.patch(`/posts/${post._id}/like`, { userId: userData._id });
      onRefresh();
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  const handleToggleSave = async () => {
    if (!userData) return;
    try {
      const res = await client.post(`/users/toggle-save/${post._id}`);
      setUserData(res.data);
      await AsyncStorage.setItem("userData", JSON.stringify(res.data));
    } catch (error) {
      console.error("Failed to toggle save", error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Khám phá bài viết: "${post.title}" trên ứng dụng Heritage Math!\n\nNội dung: ${post.content}`,
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
              <Image
                source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
                style={styles.avatar}
              />
            </View>
            <View>
              <Text style={styles.authorName}>{post.authorName}</Text>
              <Text style={styles.postTime}>
                {new Date(post.createdAt).toLocaleDateString('vi-VN')}
              </Text>
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
            <Text style={[styles.footerText, isLiked && { color: "#EF4444" }]}>
              {post.likes?.length || 0}
            </Text>
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
          <TouchableOpacity style={styles.saveBtn} onPress={handleToggleSave}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color="#2E7D32" />
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
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  searchBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center" },
  tabs: { flexDirection: "row", paddingHorizontal: 20, backgroundColor: "#FFFDF0", paddingBottom: 10 },
  tab: { marginRight: 24, paddingBottom: 8 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 14, fontWeight: "bold", color: "#94a3b8" },
  activeTabText: { color: "#2E7D32" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, paddingBottom: 100 },
  postCard: { backgroundColor: "#FFFBEB", borderRadius: 28, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#FEF9C3' },
  postHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  authorInfo: { flexDirection: "row", alignItems: "center" },
  authorAvatarBox: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", marginRight: 12 },
  avatar: { width: "100%", height: "100%" },
  authorName: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  postTime: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  typeBadge: { backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: "black", color: "#166534", textTransform: "uppercase" },
  postTitle: { fontSize: 17, fontWeight: "bold", color: "#1e293b", marginBottom: 8 },
  postExcerpt: { fontSize: 14, color: "#475569", lineHeight: 22, marginBottom: 16 },
  postFooter: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 16, gap: 20, alignItems: "center" },
  footerAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 13, fontWeight: "bold", color: "#64748b" },
  saveBtn: { marginLeft: "auto" },
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
  fab: { position: "absolute", bottom: 30, right: 20, backgroundColor: "#2E7D32", paddingHorizontal: 24, paddingVertical: 16, borderRadius: 30, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  fabText: { color: "#fff", fontWeight: "bold", marginLeft: 10, fontSize: 15 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 15, color: "#94a3b8", textAlign: "center", paddingHorizontal: 40, lineHeight: 24 },
  rankHeader: { backgroundColor: '#FFFDF0', paddingBottom: 10 },
  rankFilters: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, gap: 10, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: '#FEF9C3' },
  activeFilterBtn: { backgroundColor: "#2E7D32" },
  filterText: { fontSize: 12, fontWeight: "bold", color: "#64748b" },
  activeFilterText: { color: "#FFF" },
  divider: { width: 1, height: 20, backgroundColor: '#E2E8F0', marginHorizontal: 5 },
  rankListContent: { padding: 16, paddingBottom: 100 },
  rankItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", borderRadius: 24, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 10, elevation: 1, borderWidth: 1, borderColor: '#FEF9C3' },
  myRankItem: { borderWidth: 2, borderColor: "#2E7D32", backgroundColor: "#F0FDF4" },
  rankBadge: { width: 30, alignItems: "center", marginRight: 10 },
  rankNumber: { fontSize: 16, fontWeight: "900", color: "#94A3B8" },
  rankAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  rankLevel: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  rankScoreBox: { alignItems: "flex-end" },
  rankScore: { fontSize: 18, fontWeight: "900", color: "#2E7D32" },
  rankUnit: { fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase" }
});
