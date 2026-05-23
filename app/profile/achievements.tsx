import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../../src/api/client";

const { width } = Dimensions.get("window");

export default function AchievementsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [userData, setUserData] = useState<any>(null);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    const loadWithCache = async () => {
      try {
        const cached = await AsyncStorage.getItem("profile_achievements_cache");
        if (cached) {
          const data = JSON.parse(cached);
          setUserData(data.userData);
          setAllAchievements(data.allAchievements || []);
          setLoading(false);
        }
      } catch (_) {}
      fetchData();
    };
    void loadWithCache();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, achievementsRes] = await Promise.all([
        client.get("/auth/profile"),
        client.get("/achievements")
      ]);
      setUserData(profileRes.data);
      setAllAchievements(achievementsRes.data);
      await AsyncStorage.setItem("profile_achievements_cache", JSON.stringify({
        userData: profileRes.data,
        allAchievements: achievementsRes.data,
      }));
    } catch (e) {
      console.error("Failed to fetch achievements data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id: string) => {
    try {
      setClaimingId(id);
      const res = await client.post(`/achievements/claim/${id}`);
      setUserData(res.data.user);
      Alert.alert("Chúc mừng!", res.data.message);
    } catch (e: any) {
      Alert.alert("Thông báo", e.response?.data?.message || "Không thể nhận huy hiệu");
    } finally {
      setClaimingId(null);
    }
  };

  const getProgress = (achievement: any) => {
    if (!userData) return 0;
    let current = 0;
    switch (achievement.requirementType) {
      case 'LESSONS_COUNT': current = userData.completedLessons?.length || 0; break;
      case 'XP_COUNT': current = userData.xp || 0; break;
      case 'STREAK_COUNT': current = userData.streak || 0; break;
      case 'PERFECT_QUIZZES': current = userData.completedLessons?.filter((l: any) => l.score === l.total).length || 0; break;
    }
    return Math.min(current / achievement.requirementValue, 1);
  };

  const getCurrentValue = (achievement: any) => {
    if (!userData) return 0;
    switch (achievement.requirementType) {
      case 'LESSONS_COUNT': return userData.completedLessons?.length || 0;
      case 'XP_COUNT': return userData.xp || 0;
      case 'STREAK_COUNT': return userData.streak || 0;
      case 'PERFECT_QUIZZES': return userData.completedLessons?.filter((l: any) => l.score === l.total).length || 0;
      default: return 0;
    }
  };

  const isClaimed = (id: string) => {
    return userData?.achievements?.some((a: any) => 
        (typeof a.achievementId === 'string' ? a.achievementId === id : a.achievementId?._id === id)
    );
  };

  const filteredAchievements = allAchievements.filter(a => {
      if (activeTab === "Tất cả") return true;
      const categoryMap: any = { 'Học tập': 'LEARNING', 'Cộng đồng': 'SOCIAL', 'Đặc biệt': 'SPECIAL' };
      return a.category === categoryMap[activeTab];
  });

  if (loading && !userData) {
    return <View style={styles.loading}><ActivityIndicator color="#2E7D32" size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Huy hiệu của bạn</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        {["Tất cả", "Học tập", "Cộng đồng", "Đặc biệt"].map(tab => (
          <TouchableOpacity 
             key={tab} 
             onPress={() => setActiveTab(tab)} 
             style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredAchievements.map((item) => {
            const progress = getProgress(item);
            const claimed = isClaimed(item._id);
            const canClaim = progress >= 1 && !claimed;
            const currentValue = getCurrentValue(item);

            return (
              <View key={item._id} style={[styles.card, claimed && styles.claimedCard]}>
                <View style={[styles.iconBox, { backgroundColor: item.category === 'SPECIAL' ? '#F5F3FF' : '#F8FAFC' }]}>
                  {item.icon ? (
                    <Image source={{ uri: item.icon }} style={[styles.badgeImg, !canClaim && !claimed && styles.lockedImg]} />
                  ) : (
                    <Ionicons name="trophy" size={40} color={claimed ? "#F59E0B" : "#CBD5E1"} />
                  )}
                  {!claimed && !canClaim && (
                      <View style={styles.lockOverlay}>
                          <Ionicons name="lock-closed" size={20} color="#64748B" />
                      </View>
                  )}
                </View>
                
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: claimed ? '#10B981' : '#3B82F6' }]} />
                    </View>
                    <Text style={styles.progressText}>{currentValue}/{item.requirementValue}</Text>
                  </View>

                  <View style={styles.rewardRow}>
                      {item.xpReward > 0 && (
                          <View style={styles.rewardItem}>
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={styles.rewardText}>+{item.xpReward} XP</Text>
                          </View>
                      )}
                      {item.gemReward > 0 && (
                          <View style={styles.rewardItem}>
                              <Ionicons name="diamond" size={12} color="#8B5CF6" />
                              <Text style={styles.rewardText}>+{item.gemReward} Gems</Text>
                          </View>
                      )}
                  </View>

                  {claimed ? (
                    <View style={styles.claimedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.claimedText}>Đã nhận</Text>
                    </View>
                  ) : canClaim ? (
                    <TouchableOpacity 
                        style={styles.claimBtn} 
                        onPress={() => handleClaim(item._id)}
                        disabled={claimingId === item._id}
                    >
                        {claimingId === item._id ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <Text style={styles.claimBtnText}>Nhận thưởng ngay</Text>
                        )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.lockedBtn}>
                        <Text style={styles.lockedBtnText}>Đang thực hiện</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  placeholder: { width: 32 },
  tabContainer: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: '#FEF9C3' },
  activeTab: { backgroundColor: "#10B981", borderColor: '#10B981' },
  tabText: { fontSize: 13, fontWeight: "800", color: "#64748B" },
  activeTabText: { color: "#FFF" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  grid: { gap: 16 },
  card: { flexDirection: 'row', backgroundColor: '#FFFBEB', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#FEF9C3', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  claimedCard: { borderColor: '#DCFCE7', backgroundColor: '#F0FDF4' },
  iconBox: { width: 90, height: 90, borderRadius: 20, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badgeImg: { width: 60, height: 60, objectFit: 'contain' },
  lockedImg: { opacity: 0.3 },
  lockOverlay: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.7)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  cardInfo: { flex: 1, marginLeft: 16 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#1E293B", marginBottom: 4 },
  cardDesc: { fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  progressText: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  rewardRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  rewardItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  rewardText: { fontSize: 11, fontWeight: '900', color: '#475569' },
  claimBtn: { backgroundColor: '#3B82F6', paddingVertical: 10, borderRadius: 12, alignItems: 'center', shadowColor: '#3B82F6', shadowOpacity: 0.2, shadowRadius: 5 },
  claimBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  claimedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  claimedText: { color: '#10B981', fontSize: 13, fontWeight: '900' },
  lockedBtn: { backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  lockedBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '800' },
});
