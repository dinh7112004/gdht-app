import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import client from "../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SharePostScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const isTeachingMethod = type === "TEACHING_METHOD";

  const handleShare = async () => {
    if (!title || !content) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    try {
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem("userData");
      if (!userDataStr) throw new Error("Không tìm thấy thông tin người dùng");
      
      const userData = JSON.parse(userDataStr);

      await client.post("/posts", {
        title,
        content,
        type,
        authorId: userData._id,
        authorName: userData.fullName,
      });

      Alert.alert("Thành công", "Bài viết của bạn đã được gửi và đang chờ quản trị viên duyệt.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Failed to share post", error);
      Alert.alert("Lỗi", "Không thể gửi bài viết. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isTeachingMethod ? "Chia sẻ Phương pháp" : "Chia sẻ Cách học"}
          </Text>
          <TouchableOpacity 
            style={[styles.shareBtn, (!title || !content) && styles.disabledBtn]} 
            onPress={handleShare}
            disabled={loading || !title || !content}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.shareBtnText}>Gửi</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Bài viết của bạn sẽ được hiển thị sau khi quản trị viên phê duyệt để đảm bảo chất lượng nội dung.
            </Text>
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder={isTeachingMethod ? "Tiêu đề phương pháp dạy..." : "Tiêu đề cách học hay..."}
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <View style={styles.divider} />

          <TextInput
            style={styles.contentInput}
            placeholder="Viết nội dung chi tiết ở đây..."
            placeholderTextColor="#94a3b8"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerAction}>
            <Ionicons name="image-outline" size={24} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerAction}>
            <Ionicons name="list-outline" size={24} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerAction}>
            <Ionicons name="at-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#FEF9C3", backgroundColor: "#FFFDF0" },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "bold", color: "#1e293b" },
  shareBtn: { backgroundColor: "#2E7D32", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  disabledBtn: { backgroundColor: "#cbd5e1" },
  shareBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  content: { flex: 1, padding: 20 },
  infoBox: { flexDirection: "row", backgroundColor: "#FFFBEB", padding: 12, borderRadius: 16, marginBottom: 24, gap: 10, borderWidth: 1, borderColor: '#FEF9C3' },
  infoText: { flex: 1, fontSize: 13, color: "#1E40AF", lineHeight: 18 },
  titleInput: { fontSize: 20, fontWeight: "bold", color: "#1e293b", paddingVertical: 10 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  contentInput: { fontSize: 16, color: "#475569", lineHeight: 24, minHeight: 200, paddingVertical: 10 },
  footer: { flexDirection: "row", padding: 16, borderTopWidth: 1, borderTopColor: "#FEF9C3", gap: 20, backgroundColor: "#FFFDF0" },
  footerAction: { padding: 4 }
});
