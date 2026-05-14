import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function TeacherNotificationsScreen() {
  const [activeTab, setActiveTab] = useState("Thông báo");

  const notifications = [
    { id: '1', title: "Bài tập hoàn thành", body: "Học sinh Minh đã hoàn thành bài tập 'Ca dao tục ngữ'", time: "3 phút trước", icon: "checkmark-circle", color: "#10B981" },
    { id: '2', title: "Cảnh báo tiến độ", body: "Lớp 5A có 3 học sinh chưa hoàn thành bài đúng hạn", time: "3 phút trước", icon: "warning", color: "#EF4444" },
    { id: '3', title: "AI Trợ lý", body: "Bài tập mới 'Truyện Kiều' đã được tạo và lưu vào kho", time: "3 phút trước", icon: "sparkles", color: "#3B82F6" },
    { id: '4', title: "Câu hỏi mới", body: "Có 5 câu hỏi mới từ học sinh về bài 'Truyện Kiều'", time: "3 phút trước", icon: "chatbubble-ellipses", color: "#F59E0B" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "Tin nhắn" && styles.activeTab]} 
          onPress={() => setActiveTab("Tin nhắn")}
        >
          <Text style={[styles.tabText, activeTab === "Tin nhắn" && styles.activeTabText]}>Tin nhắn</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "Thông báo" && styles.activeTab]} 
          onPress={() => setActiveTab("Thông báo")}
        >
          <Text style={[styles.tabText, activeTab === "Thông báo" && styles.activeTabText]}>Thông báo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {notifications.map((noti) => (
          <View key={noti.id} style={styles.notiItem}>
            <View style={[styles.iconBox, { backgroundColor: noti.color + '15' }]}>
              <Ionicons name={noti.icon as any} size={22} color={noti.color} />
            </View>
            <View style={styles.notiContent}>
              <View style={styles.notiTop}>
                <Text style={styles.notiTitle}>{noti.title}</Text>
                <Text style={styles.notiTime}>{noti.time}</Text>
              </View>
              <Text style={styles.notiBody}>{noti.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  tabContainer: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: "#FEF9C3", backgroundColor: "#FFFDF0" },
  tab: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 3, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 16, fontWeight: "bold", color: "#94a3b8" },
  activeTabText: { color: "#2E7D32" },
  list: { padding: 20 },
  notiItem: { flexDirection: "row", marginBottom: 16, backgroundColor: "#FFFBEB", padding: 16, borderRadius: 24, borderWidth: 1, borderColor: "#FEF9C3" },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 16 },
  notiContent: { flex: 1 },
  notiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  notiTitle: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  notiTime: { fontSize: 11, color: "#94a3b8" },
  notiBody: { fontSize: 14, color: "#64748b", lineHeight: 20 }
});
