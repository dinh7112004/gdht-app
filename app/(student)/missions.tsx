import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  useWindowDimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../../src/api/client";

export default function MissionsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [userData, setUserData] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'SPECIAL'>('ALL');
  
  const tabs = [
    { id: 'ALL', label: 'Tất cả', icon: 'grid' },
    { id: 'DAILY', label: 'Hàng ngày', icon: 'sunny' },
    { id: 'WEEKLY', label: 'Hàng tuần', icon: 'calendar' },
    { id: 'SPECIAL', label: 'Sự kiện', icon: 'star' },
  ];

  useFocusEffect(
    useCallback(() => {
      const loadWithCache = async () => {
        try {
          const cached = await AsyncStorage.getItem("student_missions_cache");
          if (cached) {
            const data = JSON.parse(cached);
            setUserData(data.userData);
            setMissions(data.missions);
            setLoading(false);
          }
        } catch (_) {}
        fetchData();
      };
      void loadWithCache();
    }, [])
  );

  const fetchData = async () => {
    try {
      const [profileRes, missionsRes] = await Promise.all([
        client.get("/auth/profile"),
        client.get("/missions")
      ]);

      setUserData(profileRes.data);
      setMissions(missionsRes.data);
      await AsyncStorage.setItem("student_missions_cache", JSON.stringify({ userData: profileRes.data, missions: missionsRes.data }));
    } catch (e) {
      console.error("Failed to fetch missions", e);
    } finally {
      setLoading(false);
    }
  };

  const getMissionProgress = (mission: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date();
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0,0,0,0);

    const relevantLessons = userData?.completedLessons?.filter((l: any) => {
       const date = new Date(l.completedAt);
       if (mission.type === 'DAILY') return date >= today;
       if (mission.type === 'WEEKLY') return date >= weekStart;
       return true;
    }) || [];

    switch (mission.requirementType) {
      case 'LESSONS_COUNT': return relevantLessons.length;
      case 'QUIZ_COUNT': return relevantLessons.reduce((sum: number, l: any) => sum + (l.score || 0), 0);
      case 'STREAK_COUNT': return userData?.streak || 0;
      case 'XP_COUNT': return userData?.xp || 0;
      default: return 0;
    }
  };

  const handleClaimReward = async (missionId: string, xp: number, gems: number) => {
    try {
      const res = await client.post("/users/claim-mission", { missionId, xpReward: xp, gemReward: gems });
      setUserData(res.data);
      fetchData(); // Refresh to update claimed status
    } catch (e) {
      console.error(e);
    }
  };

  const filteredMissions = missions.filter(m => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'DAILY') return m.type === 'DAILY';
    if (activeTab === 'WEEKLY') return m.type === 'WEEKLY' || m.type === 'STREAK';
    if (activeTab === 'SPECIAL') return m.type === 'SPECIAL';
    return true;
  });

  if (loading && !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhiệm vụ & Thử thách</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {tabs.map((tab: any) => (
            <TouchableOpacity 
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem, { paddingHorizontal: 16 }]}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={activeTab === tab.id ? '#10B981' : '#94A3B8'} 
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredMissions.length > 0 ? filteredMissions.map((mission) => {
          const progress = getMissionProgress(mission);
          const total = mission.requirementValue;
          const percent = Math.min((progress / total) * 100, 100);
          const isComplete = progress >= total;
          const isClaimed = userData?.claimedMissions?.some((m: any) => {
             const claimedAt = new Date(m.claimedAt);
             const today = new Date();
             today.setHours(0,0,0,0);
             if (mission.type === 'DAILY') return m.missionId === mission._id && claimedAt >= today;
             return m.missionId === mission._id;
          });

          return (
            <View key={mission._id} style={styles.missionCard}>
              <View style={styles.missionHeader}>
                <View style={[styles.iconBox, { backgroundColor: mission.type === 'DAILY' ? '#EFF6FF' : '#F5F3FF' }]}>
                  <Ionicons 
                    name={mission.type === 'STREAK' ? 'flame' : 'trophy'} 
                    size={24} 
                    color={mission.type === 'DAILY' ? '#3B82F6' : '#8B5CF6'} 
                  />
                </View>
                <View style={styles.missionMainInfo}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionDesc}>{mission.description}</Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressTextRow}>
                  <Text style={styles.progressStatus}>
                    {isComplete ? 'Đã hoàn thành' : `Tiến độ: ${progress}/${total}`}
                  </Text>
                  <Text style={styles.percentText}>{Math.round(percent)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: isComplete ? '#10B981' : '#3B82F6' }]} />
                </View>
              </View>

              <View style={styles.footer}>
                <View style={styles.rewardsRow}>
                  {mission.xpReward > 0 && (
                    <View style={styles.rewardBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.rewardText}>+{mission.xpReward} XP</Text>
                    </View>
                  )}
                  {mission.gemReward > 0 && (
                    <View style={styles.rewardBadge}>
                      <Text style={{ fontSize: 12 }}>💎</Text>
                      <Text style={styles.rewardText}>+{mission.gemReward} Gems</Text>
                    </View>
                  )}
                </View>

                {isClaimed ? (
                  <View style={styles.claimedButton}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={styles.claimedButtonText}>Đã nhận thưởng</Text>
                  </View>
                ) : isComplete ? (
                  <TouchableOpacity 
                    style={styles.claimButton}
                    onPress={() => handleClaimReward(mission._id, mission.xpReward, mission.gemReward)}
                  >
                    <Text style={styles.claimButtonText}>Nhận thưởng</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.lockedButton}>
                    <Text style={styles.lockedButtonText}>Đang thực hiện</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <Image 
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/7486/7486744.png" }} 
              style={styles.emptyImg} 
            />
            <Text style={styles.emptyTitle}>Chưa có nhiệm vụ này</Text>
            <Text style={styles.emptySub}>Hãy quay lại sau để đón nhận những thử thách mới nhé!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: "#FFFDF0",
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  tabBar: { 
    flexDirection: "row", 
    backgroundColor: "#FFFBEB", 
    padding: 6, 
    marginHorizontal: 16, 
    marginTop: 16, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    gap: 4
  },
  tabItem: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 10, 
    borderRadius: 12,
    gap: 6
  },
  activeTabItem: { backgroundColor: "#ECFDF5" },
  tabLabel: { fontSize: 13, fontWeight: "700", color: "#94A3B8" },
  activeTabLabel: { color: "#10B981" },
  content: { padding: 16, paddingBottom: 40 },
  missionCard: { 
    backgroundColor: "#FFFBEB", 
    borderRadius: 28, 
    padding: 20, 
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#FEF9C3"
  },
  missionHeader: { flexDirection: "row", gap: 16, marginBottom: 20 },
  iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  missionMainInfo: { flex: 1 },
  missionTitle: { fontSize: 17, fontWeight: "900", color: "#1E293B", marginBottom: 4 },
  missionDesc: { fontSize: 13, color: "#64748B", lineHeight: 18 },
  progressSection: { marginBottom: 20 },
  progressTextRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressStatus: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  percentText: { fontSize: 12, fontWeight: "900", color: "#1E293B" },
  progressBarBg: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  footer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: "#F8FAFC" 
  },
  rewardsRow: { flexDirection: "row", gap: 8 },
  rewardBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    backgroundColor: "#F8FAFC", 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  rewardText: { fontSize: 12, fontWeight: "900", color: "#475569" },
  claimButton: { 
    backgroundColor: "#10B981", 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 14,
    shadowColor: "#10B981",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  claimButtonText: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  claimedButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  claimedButtonText: { color: "#10B981", fontSize: 13, fontWeight: "800" },
  lockedButton: { backgroundColor: "#F1F5F9", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  lockedButtonText: { color: "#94A3B8", fontSize: 12, fontWeight: "700" },
  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
  emptyImg: { width: 120, height: 120, marginBottom: 20, opacity: 0.8 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20 }
});
