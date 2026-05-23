import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function LeaderboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Tuần này");

  const leaderboard = [
    { rank: 1, name: "Minh", xp: "1200 XP", avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", isMe: true },
    { rank: 2, name: "Gia Hân", xp: "900 XP", avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140047.png" },
    { rank: 3, name: "Đức Anh", xp: "870 XP", avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png" },
    { rank: 4, name: "Bảo Châu", xp: "760 XP", avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140051.png" },
    { rank: 5, name: "Tuấn Khang", xp: "650 XP", avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140061.png" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Bảng xếp hạng</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        {["Tuần này", "Tháng này", "Tất cả"].map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {leaderboard.map(user => (
          <View key={user.rank} style={[styles.rankItem, user.isMe && styles.meItem]}>
            <Text style={[styles.rankNum, user.rank <= 3 && styles.topRank]}>{user.rank}</Text>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <Text style={styles.userName}>{user.name} {user.isMe && "(Bạn)"}</Text>
            <Text style={styles.xpText}>{user.xp}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerInfo}>Học nhiều hơn để leo hạng nhé! 🚀</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  tabContainer: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: "#F1F5F9", alignItems: "center" },
  activeTab: { backgroundColor: "#2E7D32" },
  tabText: { fontSize: 14, fontWeight: "bold", color: "#64748b" },
  activeTabText: { color: "#fff" },
  list: { padding: 20 },
  rankItem: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#fff", borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: "#F1F5F9" },
  meItem: { borderColor: "#2E7D32", backgroundColor: "#F0FDF4" },
  rankNum: { fontSize: 18, fontWeight: "900", color: "#94a3b8", width: 30 },
  topRank: { color: "#FF9800" },
  avatar: { width: 44, height: 44, borderRadius: 22, marginHorizontal: 12 },
  userName: { flex: 1, fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  xpText: { fontSize: 14, fontWeight: "900", color: "#2E7D32" },
  footer: { padding: 20, alignItems: "center", borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  footerInfo: { fontSize: 14, color: "#64748b", fontWeight: "600" }
});
