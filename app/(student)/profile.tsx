import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, ScrollView, useWindowDimensions, Modal, ActivityIndicator, TextInput, Alert, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import client, { resolveImageUrl } from "../../src/api/client";
import { useTranslation } from "../../src/context/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStreakModal, setShowStreakModal] = useState(false);
  
  // States cho việc sửa hồ sơ
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadWithCache = async () => {
        try {
          const cached = await AsyncStorage.getItem("student_profile_cache");
          if (cached) {
            const data = JSON.parse(cached);
            setUserData(data.userData);
            setEditName(data.userData?.fullName || "");
            setLoading(false);
          }
        } catch (_) {}
        fetchProfile();

        // Nếu quay lại từ kho đồ với lệnh triggerRename
        if (params.triggerRename === "true") {
            setShowEditModal(true);
            // Xóa param sau khi đã dùng để tránh việc cứ focus là hiện modal
            router.setParams({ triggerRename: undefined });
        }
      };
      void loadWithCache();
    }, [params.triggerRename])
  );

  const fetchProfile = async () => {
    try {
      const res = await client.get("/auth/profile");
      setUserData(res.data);
      setEditName(res.data.fullName);
      await AsyncStorage.setItem("userData", JSON.stringify(res.data));
      await AsyncStorage.setItem("student_profile_cache", JSON.stringify({ userData: res.data }));
    } catch (e) {
      console.error("Failed to fetch profile", e);
      const data = await AsyncStorage.getItem("userData");
      if (data) setUserData(JSON.parse(data));
    } finally {
      setLoading(false);
    }
  };

  const renameCount = userData?.renameCount || 0;
  const requiredCards = renameCount + 1;

  const totalCards = (userData?.inventory || []).reduce((sum: number, inv: any) => {
    const isCard = inv.itemId && (inv.itemId.code === 'RENAME_CARD' || inv.itemId.category === 'RENAME_CARD' || inv.itemId.name === 'Thẻ đổi tên');
    return isCard ? sum + (inv.quantity || 1) : sum;
  }, 0);

  const hasEnoughCards = totalCards >= requiredCards;

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
        Alert.alert(t('error'), t('error_name_empty') || "Tên không được để trống");
        return;
    }

    if (!hasEnoughCards) {
        Alert.alert(t('confirm'), `${t('not_enough_cards')}. ${t('rename_cost')}: ${requiredCards} ${t('cards')}.`);
        return;
    }

    try {
      setSaving(true);
      const res = await client.post("/users/rename", { newName: editName });
      setUserData(res.data);
      setShowEditModal(false);
      Alert.alert(t('success'), t('rename_success') || "Bạn đã đổi tên thành công!");
    } catch (e: any) {
      console.error("Rename failed", e);
      Alert.alert(t('error'), e.response?.data?.message || t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/(auth)/login");
  };

  const getStudyDays = () => {
    if (!userData?.completedLessons) return 0;
    const uniqueDays = new Set(
      userData.completedLessons.map((l: any) => new Date(l.completedAt).toDateString())
    );
    return uniqueDays.size;
  };

  const checkDayCompleted = (dayIndex: number) => {
    if (!userData?.completedLessons) return false;
    const now = new Date();
    const monday = new Date(now);
    const day = now.getDay() || 7;
    monday.setDate(now.getDate() - (day - 1));
    monday.setHours(0,0,0,0);
    
    const targetDay = new Date(monday);
    targetDay.setDate(monday.getDate() + dayIndex);
    const nextDay = new Date(targetDay);
    nextDay.setDate(targetDay.getDate() + 1);
    
    return userData.completedLessons.some((l: any) => {
        const date = new Date(l.completedAt);
        return date >= targetDay && date < nextDay;
    });
  };

  const RenderAvatar = () => {
      const equippedAvatar = userData?.equippedItems?.avatarId;
      const equippedFrame = userData?.equippedItems?.frameId;
      const avatarUrl = resolveImageUrl(equippedAvatar?.imageUrl || userData?.avatar);
      
      return (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={[styles.avatar, equippedFrame && styles.avatarWithFrame]} />
          {equippedFrame && (
              <Image 
                source={{ uri: resolveImageUrl(equippedFrame.imageUrl) }} 
                style={styles.frameImage} 
                resizeMode="contain"
              />
          )}
        </View>
      );
  };

  const xpNextLevel = (userData?.level || 1) * 500;
  const progress = (userData?.xp % 500) / 500;

  if (loading && !userData) {
    return <View style={styles.loading}><ActivityIndicator color="#2E7D32" size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => router.push("/profile/account-info")}>
            <RenderAvatar />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => router.push("/profile/account-info")} style={styles.nameRow}>
               <Text style={styles.userName}>{userData?.fullName || t('student')}</Text>
               <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <View style={styles.roleTag}>
              <View style={styles.badgeIconBox}>
                 <Ionicons name="star" size={12} color="#FFF" />
              </View>
              <Text style={styles.roleText}>{t('heritage_mathematician')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.levelSection}>
           <View style={styles.levelHeader}>
              <Text style={styles.levelTextBig}>Lv.{userData?.level || 1}</Text>
              <Text style={styles.xpText}>{userData?.xp || 0} / {xpNextLevel} XP</Text>
           </View>
           <View style={styles.progressBarBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
           </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox value={userData?.completedLessons?.length || 0} label={t('lessons')} />
          <View style={styles.statDivider} />
          <StatBox value={getStudyDays()} label={t('learning_days')} />
          <View style={styles.statDivider} />
          <StatBox 
             value={userData?.streak || 0} 
             label={t('streak')} 
             onPress={() => setShowStreakModal(true)} 
             color="#EF4444"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('featured_achievements')}</Text>
            <TouchableOpacity onPress={() => router.push("/profile/achievements")}>
               <Text style={styles.seeAllText}>{t('see_all')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgeRow}>
            {userData?.achievements && userData.achievements.length > 0 ? (
              userData.achievements.slice(0, 3).map((item: any, idx: number) => (
                <View key={idx} style={styles.badgeWrapper}>
                  <AchievementHex 
                    icon={item.achievementId?.icon || "star"} 
                    color={item.achievementId?.category === 'SPECIAL' ? "#8B5CF6" : 
                           item.achievementId?.category === 'SOCIAL' ? "#3B82F6" : "#F59E0B"} 
                    level={item.level}
                    isUrl={!!item.achievementId?.icon}
                  />
                  <Text style={styles.miniBadgeName} numberOfLines={1}>{item.achievementId?.title}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyAchievements}>
                 <Text style={styles.emptyText}>{t('empty_achievements')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.menuList}>
          <ProfileMenu icon="calendar-outline" label={t('heritage_collection')} color="#3B82F6" onPress={() => router.push("/profile/collection")} />
          <ProfileMenu icon="briefcase-outline" label={t('inventory')} color="#8B5CF6" onPress={() => router.push("/profile/inventory")} />
          <ProfileMenu icon="gift-outline" label={t('rewards')} color="#F59E0B" onPress={() => router.push("/profile/rewards")} />
          <ProfileMenu icon="share-social-outline" label="Chia sẻ cách học hay" color="#10B981" onPress={() => router.push({ pathname: "/share-post", params: { type: "LEARNING_TIP" } })} />
          <ProfileMenu icon="notifications-outline" label="Thông báo" color="#EF4444" onPress={() => router.push("/(student)/notifications")} />
          <ProfileMenu icon="settings-outline" label={t('settings')} color="#64748b" onPress={() => router.push("/profile/settings")} />
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <View style={styles.logoutIconBox}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal Sửa Tên */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.editModalContent}>
                <Text style={styles.modalTitle}>{t('update_display_name')}</Text>
                <Text style={styles.modalSubTitle}>{t('rename_cost')}: {requiredCards} {t('cards')} ({t('you_have')}: {totalCards})</Text>
                <TextInput 
                    style={styles.nameInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={t('enter_name_placeholder')}
                    autoFocus
                />
                <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                        <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={saving}>
                        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{t('save_changes')}</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Streak Modal (Giữ nguyên) */}
      <Modal visible={showStreakModal} transparent animationType="fade" onRequestClose={() => setShowStreakModal(false)}>
        <View style={styles.modalOverlay}>
           <View style={styles.streakModalContent}>
              <View style={styles.streakModalHeader}>
                 <Text style={styles.streakModalTitle}>{t('streak_calendar')}</Text>
                 <TouchableOpacity onPress={() => setShowStreakModal(false)}><Ionicons name="close" size={24} color="#94A3B8" /></TouchableOpacity>
              </View>
              <View style={styles.bigFireBox}>
                 <Ionicons name="flame" size={48} color="#FFF" />
                 <Text style={styles.bigStreakText}>{userData?.streak || 0}</Text>
              </View>
              <Text style={styles.streakStatusText}>
                 {checkDayCompleted(new Date().getDay() || 6) ? t('streak_completed_msg') : t('streak_not_completed_msg')}
              </Text>
              <View style={styles.calendarRow}>
                 {Array.isArray(t('days_short')) && t('days_short').map((day: string, idx: number) => {
                    const isToday = (new Date().getDay() || 7) === idx + 1;
                    const isCompleted = checkDayCompleted(idx);
                    return (
                       <View key={day} style={styles.dayCol}>
                          <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
                          <View style={[styles.dayCircle, isCompleted && styles.completedCircle, isToday && !isCompleted && styles.todayCircle]}>
                             {isCompleted ? <Ionicons name="checkmark" size={16} color="#FFF" /> : <Ionicons name="flame" size={16} color={isToday ? "#FF5722" : "#E2E8F0"} />}
                          </View>
                       </View>
                    );
                 })}
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowStreakModal(false)}><Text style={styles.closeModalBtnText}>{t('awesome')}</Text></TouchableOpacity>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatBox({ value, label, onPress, color }: any) {
  return (
    <TouchableOpacity style={styles.statBox} onPress={onPress} disabled={!onPress}>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const AchievementHex = ({ icon, color, level, isUrl }: any) => (
  <View style={styles.hexContainer}>
    <View style={[styles.hexBase, { backgroundColor: color + '15', borderColor: color }]}>
      {isUrl ? (
        <Image source={{ uri: resolveImageUrl(icon) }} style={styles.hexIconImg} />
      ) : (
        <Ionicons name={icon} size={32} color={color} />
      )}
      <View style={[styles.levelBadge, { backgroundColor: color }]}>
         <Text style={styles.levelBadgeText}>{level}</Text>
      </View>
    </View>
  </View>
);

function ProfileMenu({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconBox}><Ionicons name={icon} size={22} color="#1e293b" /></View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  profileHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 20 },
  avatarContainer: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#F3F4F6" },
  avatarWithFrame: { width: 68, height: 68, borderRadius: 34 },
  frameImage: { position: 'absolute', width: 100, height: 100, zIndex: 10 },
  userInfo: { marginLeft: 16, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  editIcon: { marginLeft: 8, padding: 4 },
  roleTag: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  badgeIconBox: { backgroundColor: '#F59E0B', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  roleText: { fontSize: 12, fontWeight: "bold", color: "#92400E" },
  levelSection: { paddingHorizontal: 24, marginBottom: 30 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  levelTextBig: { fontSize: 24, fontWeight: '900', color: '#10B981' },
  xpText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  progressBarBg: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 6 },
  statsRow: { flexDirection: "row", marginHorizontal: 24, paddingVertical: 10, marginBottom: 30, backgroundColor: "#FFFBEB", borderRadius: 24 },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 28, fontWeight: "900", color: "#10B981" },
  statLabel: { fontSize: 13, color: "#94A3B8", marginTop: 4, fontWeight: "700" },
  statDivider: { width: 1, height: 40, backgroundColor: "#F1F5F9", alignSelf: "center" },
  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  seeAllText: { fontSize: 13, fontWeight: "700", color: "#3B82F6" },
  badgeRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 20 },
  badgeWrapper: { alignItems: 'center', width: (SCREEN_WIDTH - 48) / 3 },
  miniBadgeName: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 10, textAlign: 'center' },
  hexContainer: { width: SCREEN_WIDTH < 380 ? 70 : 85, height: SCREEN_WIDTH < 380 ? 70 : 85, justifyContent: 'center', alignItems: 'center' },
  hexBase: { width: SCREEN_WIDTH < 380 ? 60 : 75, height: SCREEN_WIDTH < 380 ? 60 : 75, borderRadius: 20, borderWidth: 3, justifyContent: 'center', alignItems: 'center', position: 'relative', backgroundColor: '#FFFBEB' },
  hexIconImg: { width: SCREEN_WIDTH < 380 ? 35 : 45, height: SCREEN_WIDTH < 380 ? 35 : 45, objectFit: 'contain' },
  levelBadge: { position: 'absolute', bottom: -10, paddingHorizontal: 8, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 20 },
  levelBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  emptyAchievements: { flex: 1, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  menuList: { paddingHorizontal: 24 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FEF9C3", justifyContent: "center", alignItems: "center", marginRight: 16 },
  menuLabel: { flex: 1, fontSize: 16, color: "#334155", fontWeight: "700" },
  logoutBtn: { flexDirection: "row", alignItems: "center", marginTop: 10, paddingVertical: 18 },
  logoutIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center", marginRight: 16 },
  logoutText: { fontSize: 16, color: "#EF4444", fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  editModalContent: { backgroundColor: '#FFF', borderRadius: 32, padding: 30, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  modalSubTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 20, textAlign: 'center' },
  nameInput: { backgroundColor: '#F8FAFC', padding: 18, borderRadius: 20, fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 25, borderWidth: 1, borderColor: '#E2E8F0' },
  modalButtons: { flexDirection: 'row', gap: 15 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontWeight: '800' },
  saveBtn: { flex: 2, paddingVertical: 16, borderRadius: 18, backgroundColor: '#10B981', alignItems: 'center', shadowColor: "#10B981", shadowOpacity: 0.2, shadowRadius: 10 },
  saveBtnText: { color: '#FFF', fontWeight: '900' },
  streakModalContent: { backgroundColor: '#FFF', borderRadius: 32, padding: 30, width: '100%', alignItems: 'center' },
  streakModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 30 },
  streakModalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  bigFireBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FF5722', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: "#FF5722", shadowOpacity: 0.3, shadowRadius: 20 },
  bigStreakText: { fontSize: 48, fontWeight: '900', color: '#FFF', marginTop: -5 },
  streakStatusText: { fontSize: 16, fontWeight: '700', color: '#475569', textAlign: 'center', marginBottom: 30 },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  dayCol: { alignItems: 'center' },
  dayText: { fontSize: 12, fontWeight: '900', color: '#94A3B8', marginBottom: 10 },
  todayText: { color: '#1e293b' },
  dayCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  completedCircle: { backgroundColor: '#10B981', borderColor: '#10B981' },
  todayCircle: { borderColor: '#FF5722', borderWidth: 2 },
  closeModalBtn: { backgroundColor: '#10B981', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 20, width: '100%', alignItems: 'center' },
  closeModalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});
