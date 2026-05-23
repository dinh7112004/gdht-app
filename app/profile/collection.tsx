import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import client from "../../src/api/client";

const { width } = Dimensions.get("window");

export default function CollectionScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await client.get("/categories/collection-progress");
      setCollections(res.data);
    } catch (e) {
      console.error("Failed to fetch collections", e);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách tabs từ tên các danh mục thực tế
  const tabs = ["Tất cả", ...collections.map(c => c.title)];

  const filteredCollections = activeTab === "Tất cả" 
    ? collections 
    : collections.filter(c => c.title === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Bộ sưu tập di sản</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ height: 50 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabList}>
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : collections.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="school-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Chưa có bộ sưu tập nào</Text>
          <Text style={styles.emptyDesc}>Tham gia lớp học để bắt đầu thu thập các chủ đề di sản</Text>
          <TouchableOpacity style={styles.joinBtn} onPress={() => router.push("/(student)/classroom")}>
            <Text style={styles.joinBtnText}>Tham gia lớp học</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {filteredCollections.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.collectionCard}
              onPress={() => router.push({
                pathname: `/category/${item.id}`,
                params: { name: item.title }
              })}
            >
              <Image source={{ uri: item.img }} style={styles.cardImg} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardProgress}>{item.progress}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${item.percent}%` }]} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  tabList: { paddingHorizontal: 20, gap: 16 },
  tab: { paddingVertical: 8 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 14, color: "#94a3b8", fontWeight: "bold" },
  activeTabText: { color: "#2E7D32" },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 16, justifyContent: "space-between" },
  collectionCard: { width: (width - 44) / 2, backgroundColor: "#FFFBEB", borderRadius: 20, marginBottom: 20, overflow: "hidden", borderWidth: 1, borderColor: "#FEF9C3" },
  cardImg: { width: "100%", height: 120 },
  cardInfo: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
  cardProgress: { fontSize: 12, color: "#94a3b8", fontWeight: "600", marginBottom: 8 },
  progressTrack: { height: 4, backgroundColor: "#F1F5F9", borderRadius: 2 },
  progressFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 2 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#374151" },
  emptyDesc: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 22 },
  joinBtn: { backgroundColor: "#2E7D32", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  joinBtnText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
});
