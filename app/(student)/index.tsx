import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  useWindowDimensions,
  ImageBackground,
  Dimensions,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import client, { BASE_URL } from "../../src/api/client";
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useTranslation } from "../../src/context/LanguageContext";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function StudentHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const [userData, setUserData] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleClaimMission = async (missionId: string, xpReward: number, gemReward: number = 0) => {
    try {
      const res = await client.post("/users/claim-mission", { missionId, xpReward, gemReward });
      setUserData(res.data);
      await AsyncStorage.setItem("userData", JSON.stringify(res.data));
      Alert.alert(t('success'), `${t('claimed')} ${xpReward} XP ${gemReward > 0 ? `& ${gemReward} Gems` : ''}!`);
    } catch (e: any) {
      Alert.alert(t('error'), e.response?.data?.message || t('error'));
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    const socket = io(BASE_URL);
    socket.on("dataChanged", (data) => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, lessonsRes, rankRes, missionsRes] = await Promise.all([
        client.get("/auth/profile"),
        client.get("/lessons/for-student"),
        client.get("/users/leaderboard?type=SCHOOL"),
        client.get("/missions")
      ]);
      
      const user = profileRes.data;
      const categoriesRes = await client.get(`/categories/featured?userId=${user._id}`);
      
      setUserData(profileRes.data);
      setLessons(lessonsRes.data);
      setFeaturedCategories(categoriesRes.data);
      setLeaderboard(rankRes.data.slice(0, 3));
      setMissions(missionsRes.data);
    } catch (e) {
      console.error("Failed to fetch home data", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

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

  // Avatar Component xử lý trang bị
  const RenderAvatar = () => {
      const equippedAvatar = userData?.equippedItems?.avatarId;
      const equippedFrame = userData?.equippedItems?.frameId;
      
      const avatarUrl = equippedAvatar?.imageUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
      
      return (
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={[styles.avatar, equippedFrame && styles.avatarWithFrame]} 
          />
          {equippedFrame && (
              <Image 
                source={{ uri: equippedFrame.imageUrl }} 
                style={styles.frameImage} 
                resizeMode="contain"
              />
          )}
        </View>
      );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <RenderAvatar />
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{userData?.level || 1}</Text>
            <View style={styles.levelProgressContainer}>
              <View style={[styles.levelProgressBar, { width: `${(userData?.xp % 500) / 5}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.statValue}>{userData?.xp || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="diamond" size={18} color="#A855F7" />
            <Text style={styles.statValue}>{userData?.gems || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={18} color="#F97316" />
            <Text style={styles.statValue}>{userData?.streak || 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>{t('hello')}, {userData?.fullName?.split(' ').pop() || 'Minh'}! 👋</Text>
          <Text style={styles.greetingSubtitle}>{t('what_to_learn')}</Text>
        </View>

        {/* Continue Learning */}
        {(() => {
          const lastLesson = lessons.find(l => l._id === userData?.lastLessonId) || lessons[0];
          const isCompleted = userData?.completedLessons?.some((l: any) => 
            (typeof l === 'string' ? l === lastLesson?._id : l.lessonId === lastLesson?._id)
          );
          if (!lastLesson || isCompleted) return null;

          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('continue_learning') || "Tiếp tục học"}</Text>
              <TouchableOpacity 
                style={styles.continueCard}
                onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: lastLesson._id } })}
              >
                <Image 
                  source={{ uri: lastLesson.imageUrl?.trim() || "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=400" }} 
                  style={styles.continueImg} 
                />
                <View style={styles.continueInfo}>
                  <Text style={styles.continueTitle} numberOfLines={2}>
                    {lastLesson.title}
                  </Text>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>{t('progress') || "Tiến độ"}</Text>
                    <Text style={styles.progressPercent}>{t('learning') || "Đang học"}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '30%' }]} />
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.btnTiếpTục}
                  onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: lastLesson._id } })}
                >
                   <Text style={styles.btnTiếpTụcText}>{t('continue') || "Tiếp tục"}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Leaderboard Snippet */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('leaderboard_week')}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: "/community", params: { tab: 'RANK' } })}>
                    <Text style={styles.seeAll}>{t('see_all')}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.leaderboardSmall}>
                {leaderboard.length > 0 ? leaderboard.map((item, index) => (
                    <View key={item._id || index} style={styles.leaderItem}>
                        <Text style={styles.rankText}>{index + 1}</Text>
                        <View style={[styles.miniAvatar, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                            <Text style={styles.miniAvatarText}>{item.fullName?.charAt(0)}</Text>
                        </View>
                        <Text style={styles.leaderName}>{item.fullName}</Text>
                        <Text style={styles.leaderScore}>{(item.periodXp || 0).toLocaleString()} XP</Text>
                    </View>
                )) : (
                    <Text style={[styles.emptyText, { padding: 10 }]}>{t('no_rankings') || "Chưa có xếp hạng tuần này"}</Text>
                )}
            </View>
        </View>

        {/* Missions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('missions_challenges')}</Text>
            <TouchableOpacity onPress={() => router.push("/missions")}>
              <Text style={styles.seeAll}>{t('see_all')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.missionCard}>
            {missions.length > 0 ? missions.slice(0, 2).map((mission, idx) => {
              const progress = getMissionProgress(mission);
              const isClaimed = userData?.claimedMissions?.some((m: any) => {
                 const claimedAt = new Date(m.claimedAt);
                 const today = new Date();
                 today.setHours(0,0,0,0);
                 if (mission.type === 'DAILY') return m.missionId === mission._id && claimedAt >= today;
                 return m.missionId === mission._id;
              });

              return (
                <View key={mission._id}>
                  <MissionItem 
                    icon={mission.type === 'STREAK' ? 'flame' : 'book'} 
                    title={mission.title} 
                    progress={progress} 
                    total={mission.requirementValue} 
                    reward={`+${mission.xpReward} XP`} 
                    color={mission.type === 'DAILY' ? "#3B82F6" : mission.type === 'WEEKLY' ? "#8B5CF6" : "#F59E0B"}
                    isClaimed={isClaimed}
                    onClaim={() => handleClaimMission(mission._id, mission.xpReward, mission.gemReward)}
                    t={t}
                  />
                  {idx < 1 && <View style={styles.divider} />}
                </View>
              );
            }) : (
               <Text style={styles.emptyText}>{t('no_missions') || "Hiện chưa có nhiệm vụ mới."}</Text>
            )}
          </View>
        </View>

        {/* Challenge Banner */}
        {(() => {
          const uncompletedLessons = lessons.filter(l => 
            !userData?.completedLessons?.some((cl: any) => 
              (typeof cl === 'string' ? cl === l._id : cl.lessonId === l._id)
            )
          );
          const featuredLesson = uncompletedLessons.length > 0 
            ? uncompletedLessons[Math.floor(Math.random() * uncompletedLessons.length)] 
            : lessons[0];

          if (!featuredLesson) return null;

          return (
            <TouchableOpacity 
              style={styles.challengeBanner} 
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: featuredLesson._id } })}
            >
                <ImageBackground 
                    source={{ uri: featuredLesson.imageUrl?.trim() || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600' }}
                    style={styles.challengeBg}
                    imageStyle={{ borderRadius: 24 }}
                >
                    <View style={styles.challengeOverlay}>
                        <View style={styles.challengeTag}>
                            <Text style={styles.challengeTagText}>{t('today_challenge')}</Text>
                        </View>
                        <Text style={styles.challengeTitle} numberOfLines={2}>
                          {featuredLesson.title}
                        </Text>
                        <Text style={styles.challengeSub}>{t('join_now')} +{featuredLesson.xpReward || 50} XP</Text>
                        <View style={styles.challengeAction}>
                            <Text style={styles.challengeActionText}>{t('start_learning')}</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFF" />
                        </View>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
          );
        })()}

        {/* Featured Topics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('featured_topics') || "Chủ đề nổi bật"}</Text>
            <TouchableOpacity onPress={() => router.push("/(student)/all-categories")}>
              <Text style={styles.seeAll}>{t('see_all')}</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.topicsScroll}
          >
            {featuredCategories.map((cat) => (
              <TouchableOpacity 
                key={cat._id} 
                style={styles.categoryCard}
                onPress={() => router.push({ pathname: "/category/[id]", params: { id: cat._id, name: cat.name } })}
              >
                <Image 
                  source={{ uri: cat.imageUrl?.trim() || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400" }} 
                  style={styles.categoryImg} 
                />
                <View style={styles.categoryOverlay}>
                  <Text style={styles.categoryTitle} numberOfLines={1}>{cat.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function MissionItem({ icon, title, progress, total, reward, color, isClaimed, onClaim, t }: any) {
  const isComplete = progress >= total;

  return (
    <View style={styles.missionItem}>
      <View style={[styles.missionIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.missionInfo}>
        <Text style={styles.missionTitle}>{title}</Text>
        <View style={styles.missionProgressRow}>
          <View style={styles.missionProgressBg}>
             <View style={[styles.missionProgressFill, { width: `${Math.min((progress/total)*100, 100)}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.missionProgressText}>{progress}/{total}</Text>
        </View>
      </View>
      
      {isClaimed ? (
        <View style={styles.claimedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.claimedText}>{t('claimed')}</Text>
        </View>
      ) : isComplete ? (
        <TouchableOpacity style={styles.claimBtn} onPress={onClaim}>
          <Text style={styles.claimBtnText}>{t('claim') || "Nhận"}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.rewardText, { color: '#F59E0B' }]}>{reward}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: "#FFFDF0",
  },
  headerProfile: { flexDirection: "row", alignItems: "center" },
  avatarContainer: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F3F4F6" },
  avatarWithFrame: { width: 42, height: 42, borderRadius: 21 },
  frameImage: { position: 'absolute', width: 64, height: 64, zIndex: 10 },
  levelBadge: { marginLeft: 10 },
  levelText: { fontSize: 13, fontWeight: "bold", color: "#2E7D32" },
  levelProgressContainer: { width: 70, height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, marginTop: 4, overflow: 'hidden' },
  levelProgressBar: { height: "100%", backgroundColor: "#4ADE80" },
  headerStats: { flexDirection: "row", gap: 12, backgroundColor: "#FFFBEB", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 14, fontWeight: "900", color: "#1F2937" },
  scrollContent: { paddingBottom: 100 },
  greetingSection: { paddingHorizontal: 20, marginTop: 10, marginBottom: 25 },
  greetingTitle: { fontSize: 22, fontWeight: "900", color: "#111827" },
  greetingSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 15 },
  seeAll: { color: "#2E7D32", fontWeight: "700", fontSize: 14 },
  continueCard: { flexDirection: "row", backgroundColor: "#FFFBEB", borderRadius: 24, padding: 15, borderWidth: 1, borderColor: "#FEF9C3", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, alignItems: 'center' },
  continueImg: { width: 80, height: 100, borderRadius: 16, backgroundColor: "#F9FAFB", flexShrink: 0 },
  continueInfo: { flex: 1, marginLeft: 15, marginRight: 10 },
  continueTitle: { fontSize: 15, fontWeight: "bold", color: "#111827", lineHeight: 20 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, marginBottom: 6 },
  progressLabel: { fontSize: 12, color: "#6B7280" },
  progressPercent: { fontSize: 12, fontWeight: "bold", color: "#2E7D32" },
  progressBarBg: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: "100%", backgroundColor: "#4ADE80" },
  btnTiếpTục: { backgroundColor: "#22C55E", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  btnTiếpTụcText: { color: "#FFF", fontWeight: "bold", fontSize: 13 },
  missionCard: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 15, borderWidth: 1, borderColor: "#FEF9C3" },
  missionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  missionIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 15 },
  missionInfo: { flex: 1 },
  missionTitle: { fontSize: 14, fontWeight: "bold", color: "#374151" },
  missionProgressRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  missionProgressBg: { flex: 1, height: 5, backgroundColor: "#F3F4F6", borderRadius: 2.5, marginRight: 10, overflow: 'hidden' },
  missionProgressFill: { height: "100%" },
  missionProgressText: { fontSize: 11, fontWeight: "bold", color: "#9CA3AF" },
  rewardText: { fontSize: 13, fontWeight: "900" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 5 },
  leaderboardSmall: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 10, borderWidth: 1, borderColor: "#FEF9C3" },
  leaderItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10 },
  rankText: { fontSize: 16, fontWeight: "900", color: "#9CA3AF", width: 25 },
  miniAvatar: { width: 35, height: 35, borderRadius: 17.5, justifyContent: "center", alignItems: "center", marginRight: 12 },
  miniAvatarText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  leaderName: { flex: 1, fontSize: 14, fontWeight: "bold", color: "#374151" },
  leaderScore: { fontSize: 14, fontWeight: "900", color: "#2E7D32" },
  challengeBanner: { marginHorizontal: 20, marginBottom: 25, height: 180 },
  challengeBg: { flex: 1, overflow: 'hidden' },
  challengeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, justifyContent: 'center' },
  challengeTag: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  challengeTagText: { fontSize: 10, fontWeight: '900', color: '#111827' },
  challengeTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 5 },
  challengeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 15 },
  challengeAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  challengeActionText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  topicsScroll: { paddingRight: 20 },
  categoryCard: { width: SCREEN_WIDTH < 380 ? 100 : 120, marginRight: 15, alignItems: 'center' },
  categoryImg: { width: SCREEN_WIDTH < 380 ? 100 : 120, height: SCREEN_WIDTH < 380 ? 130 : 160, borderRadius: 20, backgroundColor: "#F3F4F6" },
  categoryOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  categoryTitle: { color: "#FFF", fontSize: SCREEN_WIDTH < 380 ? 10 : 11, fontWeight: "bold", textAlign: "center" },
  emptyText: { color: "#9CA3AF", fontStyle: 'italic' },
  claimBtn: { backgroundColor: "#2E7D32", paddingHorizontal: 15, paddingVertical: 6, borderRadius: 12, shadowColor: "#2E7D32", shadowOpacity: 0.2, shadowRadius: 5, elevation: 2 },
  claimBtnText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  claimedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  claimedText: { color: "#10B981", fontSize: 13, fontWeight: "bold" },
});
