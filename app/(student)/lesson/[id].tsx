import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import client from "../../../src/api/client";

const { width } = Dimensions.get("window");

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lessonRes, profileRes] = await Promise.all([
        client.get(`/lessons/${id}`),
        client.get("/auth/profile")
      ]);
      setLesson(lessonRes.data);
      setUserData(profileRes.data);
    } catch (e) {
      console.error("Failed to fetch lesson detail", e);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
      case 'Khó': return 5;
      case 'Trung bình': return 3;
      case 'Dễ': return 1;
      default: return 1;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Stats Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.statValue}>{userData?.xp || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="diamond" size={16} color="#9C27B0" />
            <Text style={styles.statValue}>{userData?.gems || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={16} color="#FF5722" />
            <Text style={styles.statValue}>{userData?.streak || 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Image */}
        <Image 
          source={{ uri: lesson?.imageUrl || "https://images.unsplash.com/photo-1599708137303-90432773295c?q=80&w=800" }} 
          style={styles.mainImg} 
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{lesson?.category}</Text>
          </View>
          
          <Text style={styles.lessonTitle}>{lesson?.title}</Text>
          
          <View style={styles.infoGrid}>
             <View style={styles.infoBox}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.infoText}>{lesson?.estimatedMinutes || 15} phút</Text>
             </View>
             <View style={styles.infoBox}>
                <Ionicons name="cellular-outline" size={18} color="#666" />
                <Text style={styles.infoText}>{lesson?.difficulty || 'Dễ'}</Text>
             </View>
             <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={14} color={s <= getDifficultyStars(lesson?.difficulty) ? "#FFD700" : "#E0E0E0"} />
              ))}
            </View>
          </View>

          <Text style={styles.description}>
            {lesson?.description || "Bài toán được trích dẫn từ các tác phẩm văn hóa di sản, giúp bạn rèn luyện tư duy và hiểu thêm về văn hóa Việt Nam."}
          </Text>

          <View style={styles.rewardSection}>
            <Text style={styles.rewardTitle}>Phần thưởng khi hoàn thành</Text>
            <View style={styles.rewardRow}>
              <View style={styles.rewardItem}>
                <View style={[styles.rewardIcon, { backgroundColor: '#FFF9C4' }]}>
                  <Ionicons name="star" size={24} color="#FBC02D" />
                </View>
                <Text style={styles.rewardText}>+{lesson?.xpReward || 20} XP</Text>
              </View>
              <View style={styles.rewardItem}>
                <View style={[styles.rewardIcon, { backgroundColor: '#E0F2F1' }]}>
                  <Ionicons name="trophy-outline" size={24} color="#009688" />
                </View>
                <Text style={styles.rewardText}>Huy hiệu</Text>
              </View>
              <View style={styles.rewardItem}>
                <View style={[styles.rewardIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="sparkles-outline" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.rewardText}>Mở khóa cốt truyện</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.startBtn}
          onPress={() => router.push({ pathname: "/learning/story/[id]", params: { id: lesson?._id } })}
        >
          <Text style={styles.startBtnText}>Bắt đầu học ngay</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  statsRow: { flexDirection: "row", gap: 10 },
  statItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8F8F8", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  statValue: { fontSize: 13, fontWeight: "bold", marginLeft: 4, color: "#444" },
  mainImg: { width: width, height: 280, resizeMode: "cover" },
  contentCard: {
    backgroundColor: "#FFF",
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    minHeight: 500,
  },
  catBadge: { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 12 },
  catBadgeText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  lessonTitle: { fontSize: 24, fontWeight: "900", color: "#1A1A1A", marginBottom: 20, lineHeight: 32 },
  infoGrid: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 14, color: '#666', fontWeight: '500' },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 2, marginLeft: 'auto' },
  description: { fontSize: 15, color: "#4B5563", lineHeight: 26, marginBottom: 32 },
  rewardSection: { marginTop: 10, backgroundColor: '#FAFAFA', padding: 20, borderRadius: 24 },
  rewardTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1A1A", marginBottom: 20, textAlign: 'center' },
  rewardRow: { flexDirection: "row", justifyContent: "space-between" },
  rewardItem: { alignItems: "center", width: (width - 120) / 3 },
  rewardIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  rewardText: { fontSize: 11, fontWeight: "bold", color: "#374151", textAlign: "center" },
  bottomBar: { padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: "#F1F1F1", backgroundColor: '#FFF' },
  startBtn: { backgroundColor: "#2E7D32", height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: "center", alignItems: "center", shadowColor: "#2E7D32", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  startBtnText: { color: "#FFF", fontSize: 17, fontWeight: "900" }
});
