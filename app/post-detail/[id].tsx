import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Share, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import client, { resolveImageUrl } from "../../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  useEffect(() => {
    fetchPost();
    loadUserData();
  }, [id]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      scrollToBottom();
    });
    return () => showSub.remove();
  }, []);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("userData");
    if (data) setUserData(JSON.parse(data));
  };

  const fetchPost = async () => {
    try {
      const res = await client.get(`/posts/${id}`);
      setPost(res.data);
    } catch (e) {
      console.error("Failed to fetch post detail", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!userData || !post) return;
    try {
      await client.patch(`/posts/${post._id}/like`, { userId: userData._id });
      fetchPost();
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  const handleSendComment = async () => {
    if (!comment.trim() || !userData) return;
    try {
      setSending(true);
      await client.post(`/posts/${id}/comment`, {
        authorId: userData._id,
        authorName: userData.fullName,
        content: comment.trim()
      });
      setComment("");
      await fetchPost();
      scrollToBottom();
    } catch (e) {
      console.error("Failed to send comment", e);
    } finally {
      setSending(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Khám phá bài viết: "${post.title}" trên ứng dụng Heritage Math!\n\nNội dung: ${post.content}\n\nHãy cùng tham gia học tập di sản nhé!`,
      });
    } catch (error) {
      console.error("Error sharing post", error);
    }
  };

  if (loading || !post) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const isLiked = userData && post.likes?.includes(userData._id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài viết</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Post Content */}
          <View style={styles.postSection}>
            <View style={styles.authorInfo}>
              <Image 
                source={{ uri: resolveImageUrl(post.authorAvatar) }} 
                style={styles.avatar} 
              />
              <View>
                <Text style={styles.authorName}>{post.authorName}</Text>
                <Text style={styles.postTime}>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</Text>
              </View>
            </View>
            
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={16} color="#EF4444" />
                <Text style={styles.statText}>{post.likes?.length || 0} lượt thích</Text>
              </View>
              <Text style={styles.statText}>{post.comments?.length || 0} bình luận</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleToggleLike}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={22} 
                  color={isLiked ? "#EF4444" : "#64748b"} 
                />
                <Text style={[styles.actionText, isLiked && { color: "#EF4444" }]}>Thích</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
                <Text style={styles.actionText}>Bình luận</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color="#64748b" />
                <Text style={styles.actionText}>Chia sẻ</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Bình luận</Text>
            {post.comments?.length > 0 ? (
              post.comments.map((item: any, index: number) => (
                <View key={index} style={styles.commentItem}>
                  <Image 
                    source={{ uri: resolveImageUrl(item.authorAvatar) }} 
                    style={styles.commentAvatar} 
                  />
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>{item.authorName}</Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noComments}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Viết bình luận..."
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !comment.trim() && styles.disabledSend]} 
            onPress={handleSendComment}
            disabled={!comment.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "bold", color: "#1e293b" },
  scrollContent: { paddingBottom: 20 },
  postSection: { padding: 20 },
  authorInfo: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  authorName: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  postTime: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  postTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b", marginBottom: 12 },
  postContent: { fontSize: 16, color: "#475569", lineHeight: 24, marginBottom: 20 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 13, color: "#64748b" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 12 },
  actionsRow: { flexDirection: "row", justifyContent: "space-around" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  actionText: { fontSize: 14, fontWeight: "bold", color: "#64748b" },
  commentsSection: { padding: 20, backgroundColor: "#F8FAFC", minHeight: 300 },
  commentsTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 20 },
  commentItem: { flexDirection: "row", marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, marginTop: 4 },
  commentBubble: { flex: 1, backgroundColor: "#fff", padding: 12, borderRadius: 16, borderTopLeftRadius: 0, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  commentAuthor: { fontSize: 13, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
  commentText: { fontSize: 14, color: "#475569", lineHeight: 20 },
  noComments: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 14 },
  inputContainer: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9", alignItems: "center", backgroundColor: "#fff" },
  input: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center", marginLeft: 10 },
  disabledSend: { backgroundColor: "#cbd5e1" }
});
