import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Tất cả");

  const notifications = [
    { id: '1', title: "Chúc mừng!", body: 'Bạn đã nhận được huy hiệu "Tư duy sắc bén"', time: "2 phút trước", icon: "trophy", color: "#F59E0B" },
    { id: '2', title: "Bài tập mới", body: 'Giáo viên đã giao bài tập mới "Bài toán Truyện Kiều"', time: "1 giờ trước", icon: "book", color: "#3B82F6" },
    { id: '3', title: "Chuỗi ngày học tập", body: "Bạn đã duy trì học tập 7 ngày liên tiếp!", time: "3 giờ trước", icon: "flame", color: "#EF4444" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        {["Tất cả", "Chưa đọc"].map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {notifications.map(noti => (
          <View key={noti.id} style={styles.notiItem}>
            <View style={[styles.iconBox, { backgroundColor: noti.color + '15' }]}>
              <Ionicons name={noti.icon as any} size={20} color={noti.color} />
            </View>
            <View style={styles.notiContent}>
              <Text style={styles.notiTitle}>{noti.title}</Text>
              <Text style={styles.notiBody}>{noti.body}</Text>
              <Text style={styles.notiTime}>{noti.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.footerBtn}>
        <Text style={styles.footerBtnText}>Xem tất cả thông báo</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  tabContainer: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 14, fontWeight: "bold", color: "#94a3b8" },
  activeTabText: { color: "#2E7D32" },
  list: { padding: 20 },
  notiItem: { flexDirection: "row", marginBottom: 24 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 16 },
  notiContent: { flex: 1 },
  notiTitle: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  notiBody: { fontSize: 14, color: "#475569", marginTop: 4, lineHeight: 20 },
  notiTime: { fontSize: 12, color: "#94a3b8", marginTop: 8 },
  footerBtn: { margin: 20, height: 50, borderRadius: 16, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  footerBtnText: { fontSize: 14, fontWeight: "bold", color: "#475569" }
});
