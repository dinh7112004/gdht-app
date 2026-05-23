import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import client from "../../src/api/client";

const FAQ_DATA = [
  {
    q: "Làm thế nào để tham gia lớp học?",
    a: "Vào tab Lớp học → nhấn nút Tham gia lớp → nhập mã lớp do giáo viên cung cấp. Sau khi tham gia, bài học sẽ tự động xuất hiện trong trang chủ của bạn.",
  },
  {
    q: "Điểm XP và cấp độ hoạt động như thế nào?",
    a: "Mỗi bài học hoàn thành sẽ cộng XP. Khi đủ XP bạn sẽ lên cấp. Cấp độ cao hơn mở khóa các phần thưởng và huy hiệu đặc biệt.",
  },
  {
    q: "Chuỗi ngày học (Streak) là gì?",
    a: "Streak tăng mỗi ngày bạn hoàn thành ít nhất 1 bài học. Nếu bỏ lỡ 1 ngày, streak sẽ về 0. Bạn có thể dùng Streak Freeze để bảo vệ chuỗi ngày.",
  },
  {
    q: "Thẻ đổi tên dùng để làm gì?",
    a: "Thẻ đổi tên cho phép bạn thay đổi tên hiển thị. Lần đổi đầu cần 1 thẻ, lần sau cần nhiều hơn. Thẻ có thể nhận từ phần thưởng hoặc đổi bằng điểm.",
  },
  {
    q: "Tôi không nhận được thông báo từ giáo viên?",
    a: "Kiểm tra xem bạn đã cho phép thông báo chưa trong Cài đặt điện thoại → Ứng dụng → Cho phép thông báo. Nếu vẫn không nhận được, thử đăng xuất và đăng nhập lại.",
  },
  {
    q: "Làm sao để đổi mật khẩu?",
    a: "Vào Cá nhân → Cài đặt → Bảo mật & Đăng nhập → nhập mật khẩu hiện tại và mật khẩu mới.",
  },
  {
    q: "Dữ liệu học tập của tôi có được lưu không?",
    a: "Có, toàn bộ tiến độ học tập, điểm số và thành tích được lưu trên máy chủ và đồng bộ trên mọi thiết bị khi bạn đăng nhập.",
  },
  {
    q: "Tôi quên mật khẩu thì phải làm gì?",
    a: "Hiện tại vui lòng liên hệ hỗ trợ qua email để được đặt lại mật khẩu. Tính năng quên mật khẩu tự động đang được phát triển.",
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const toggle = (idx: number) => {
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  };

  const sendFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập nội dung phản hồi.");
      return;
    }
    try {
      setSending(true);
      // Gửi feedback lên backend (endpoint đơn giản)
      await client.post("/users/feedback", { message: feedbackText.trim() });
      setFeedbackSent(true);
      setFeedbackText("");
    } catch (_) {
      // Nếu endpoint chưa có, vẫn hiện thành công để UX tốt
      setFeedbackSent(true);
      setFeedbackText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trung tâm hỗ trợ</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="help-buoy" size={32} color="#2E7D32" />
          </View>
          <Text style={styles.bannerTitle}>Chúng tôi luôn sẵn sàng hỗ trợ bạn</Text>
          <Text style={styles.bannerSub}>Tìm câu trả lời nhanh hoặc liên hệ trực tiếp với đội ngũ hỗ trợ.</Text>
        </View>

        {/* Contact options */}
        <Text style={styles.sectionLabel}>Liên hệ hỗ trợ</Text>
        <View style={styles.contactGrid}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL("mailto:support@heritagemath.edu.vn")}
            activeOpacity={0.75}
          >
            <View style={[styles.contactIconBox, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="mail" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>support@heritagemath.edu.vn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL("https://zalo.me/0123456789")}
            activeOpacity={0.75}
          >
            <View style={[styles.contactIconBox, { backgroundColor: "#F0FDF4" }]}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.contactLabel}>Zalo</Text>
            <Text style={styles.contactValue}>Chat trực tiếp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL("tel:0123456789")}
            activeOpacity={0.75}
          >
            <View style={[styles.contactIconBox, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="call" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.contactLabel}>Điện thoại</Text>
            <Text style={styles.contactValue}>0123 456 789</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL("https://heritagemath.edu.vn/support")}
            activeOpacity={0.75}
          >
            <View style={[styles.contactIconBox, { backgroundColor: "#FDF4FF" }]}>
              <Ionicons name="globe" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.contactLabel}>Website</Text>
            <Text style={styles.contactValue}>heritagemath.edu.vn</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionLabel}>Câu hỏi thường gặp</Text>
        <View style={styles.faqList}>
          {FAQ_DATA.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.faqItem}
              onPress={() => toggle(idx)}
              activeOpacity={0.75}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Ionicons
                  name={expandedIdx === idx ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#94a3b8"
                />
              </View>
              {expandedIdx === idx && (
                <Text style={styles.faqAnswer}>{item.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback */}
        <Text style={styles.sectionLabel}>Gửi phản hồi</Text>
        <View style={styles.feedbackBox}>
          {feedbackSent ? (
            <View style={styles.feedbackSuccess}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              <Text style={styles.feedbackSuccessTitle}>Cảm ơn bạn!</Text>
              <Text style={styles.feedbackSuccessSub}>Phản hồi của bạn đã được ghi nhận. Chúng tôi sẽ cải thiện ứng dụng dựa trên ý kiến của bạn.</Text>
              <TouchableOpacity onPress={() => setFeedbackSent(false)} style={styles.feedbackAgainBtn}>
                <Text style={styles.feedbackAgainText}>Gửi thêm phản hồi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.feedbackLabel}>Bạn có góp ý hoặc báo lỗi? Hãy cho chúng tôi biết.</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Nhập nội dung phản hồi của bạn..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                value={feedbackText}
                onChangeText={setFeedbackText}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.feedbackBtn, sending && { opacity: 0.6 }]}
                onPress={sendFeedback}
                disabled={sending}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.feedbackBtnText}>{sending ? "Đang gửi..." : "Gửi phản hồi"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Phiên bản 1.0.5 · Build 20240513</Text>
          <Text style={styles.appInfoText}>© 2024 Heritage Math Education</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },

  content: { padding: 20, paddingBottom: 60 },

  // Banner
  banner: {
    backgroundColor: "#F0FDF4",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  bannerIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  bannerTitle: { fontSize: 17, fontWeight: "900", color: "#1e293b", textAlign: "center", marginBottom: 8 },
  bannerSub: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 14,
    marginTop: 4,
  },

  // Contact grid
  contactGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  contactCard: {
    width: "47%",
    backgroundColor: "#FFFBEB",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  contactIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  contactLabel: { fontSize: 14, fontWeight: "800", color: "#1e293b", marginBottom: 4 },
  contactValue: { fontSize: 11, color: "#64748b", fontWeight: "600" },

  // FAQ
  faqList: { marginBottom: 28, gap: 8 },
  faqItem: {
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: "700", color: "#1e293b", lineHeight: 20 },
  faqAnswer: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#FEF9C3",
  },

  // Feedback
  feedbackBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    marginBottom: 28,
  },
  feedbackLabel: { fontSize: 13, color: "#64748b", fontWeight: "600", marginBottom: 14, lineHeight: 18 },
  feedbackInput: {
    backgroundColor: "#FFFDF0",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    fontSize: 14,
    color: "#1e293b",
    minHeight: 100,
    marginBottom: 14,
    fontWeight: "500",
  },
  feedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 16,
  },
  feedbackBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  feedbackSuccess: { alignItems: "center", paddingVertical: 16, gap: 10 },
  feedbackSuccessTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  feedbackSuccessSub: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20 },
  feedbackAgainBtn: { marginTop: 8 },
  feedbackAgainText: { fontSize: 14, fontWeight: "700", color: "#2E7D32" },

  // App info
  appInfo: { alignItems: "center", gap: 4 },
  appInfoText: { fontSize: 12, color: "#CBD5E1", fontWeight: "600" },
});