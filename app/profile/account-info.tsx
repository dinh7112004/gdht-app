import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import client from "../../src/api/client";
import { useTranslation } from "../../src/context/LanguageContext";

export default function AccountInfoScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await client.get("/auth/profile");
      setUserData(res.data);
    } catch (e) {
      console.error("Failed to fetch profile", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return <View style={styles.loading}><ActivityIndicator color="#10B981" size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account_info')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
            <View style={styles.avatarBox}>
               <Image 
                 source={{ uri: userData?.equippedItems?.avatarId?.imageUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} 
                 style={styles.avatar} 
               />
            </View>
            <Text style={styles.fullName}>{userData?.fullName}</Text>
            <View style={styles.roleTag}>
               <Text style={styles.roleText}>{userData?.role === 'STUDENT' ? t('student') : t('teacher')}</Text>
            </View>
        </View>

        <View style={styles.infoCard}>
           <InfoRow label={t('email_address')} value={userData?.email} icon="mail-outline" />
           <InfoRow label={t('current_level')} value={`${t('level_name')} ${userData?.level || 1}`} icon="ribbon-outline" />
           <InfoRow label={t('experience_points')} value={`${userData?.xp || 0} XP`} icon="star-outline" />
           <InfoRow label={t('accumulated_gems')} value={`${userData?.gems || 0} Gems`} icon="diamond-outline" />
           <InfoRow label={t('join_date')} value={new Date(userData?.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')} icon="calendar-outline" />
        </View>

        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => {
            const path = userData?.role === 'TEACHER' ? "/(teacher)/profile" : "/(student)/profile";
            router.replace(path as any);
          }}
        >
           <Text style={styles.editBtnText}>{t('edit_profile_btn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon }: any) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconBox}><Ionicons name={icon} size={20} color="#64748B" /></View>
            <View style={styles.infoTextColumn}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  content: { padding: 24 },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatarBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFBEB', padding: 4, borderWidth: 2, borderColor: '#10B981', marginBottom: 16 },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  fullName: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  roleTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  roleText: { color: '#10B981', fontSize: 12, fontWeight: '800' },
  infoCard: { backgroundColor: '#FFFBEB', borderRadius: 24, padding: 8, borderWidth: 1, borderColor: '#FEF9C3' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFDF0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  infoTextColumn: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  infoValue: { fontSize: 16, fontWeight: '800', color: '#334155', marginTop: 2 },
  editBtn: { height: 56, backgroundColor: '#F1F5F9', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  editBtnText: { color: '#475569', fontSize: 16, fontWeight: '900' }
});
