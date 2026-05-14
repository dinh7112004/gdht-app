import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import client from "../../src/api/client";

const { width } = Dimensions.get("window");

export default function ClassroomDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");

  useEffect(() => {
    fetchClassDetail();
  }, [id]);

  const fetchClassDetail = async () => {
    try {
      const res = await client.get(`/classes/${id}`);
      setClassData(res.data);
    } catch (e) {
      console.error("Failed to fetch class detail", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy dữ liệu lớp học</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mainColor = classData.color || "#3B82F6";

  // Filter Logic
  const subjects = ["Tất cả", ...new Set([
    ...(classData.assignedCategories || []).map((c: any) => c.subject).filter(Boolean),
    ...(classData.assignedLessons || []).map((l: any) => l.subject).filter(Boolean)
  ])];

  const filteredCategories = selectedSubject === "Tất cả" 
    ? (classData.assignedCategories || [])
    : (classData.assignedCategories || []).filter((c: any) => c.subject === selectedSubject);

  const filteredLessons = selectedSubject === "Tất cả"
    ? (classData.assignedLessons || [])
    : (classData.assignedLessons || []).filter((l: any) => l.subject === selectedSubject);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{classData.name}</Text>
          <Text style={styles.headerSub}>Mã: {classData.code}</Text>
        </View>
        <TouchableOpacity style={styles.settingsIcon}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Class Banner */}
        <View style={[styles.banner, { backgroundColor: mainColor }]}>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerClassName}>{classData.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ID Lớp: {classData.code}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="google-classroom" size={80} color="rgba(255,255,255,0.2)" style={styles.bannerBgIcon} />
        </View>

        {/* Teacher Card */}
        <View style={styles.teacherCard}>
          <View style={[styles.teacherAvatar, { backgroundColor: mainColor + '20' }]}>
            <Ionicons name="person" size={24} color={mainColor} />
          </View>
          <View style={styles.teacherInfo}>
            <Text style={styles.teacherLabel}>Giáo viên phụ trách</Text>
            <Text style={styles.teacherName}>{classData.teacherId?.fullName || "Giáo viên Hệ thống"}</Text>
          </View>
          <TouchableOpacity style={styles.contactBtn}>
            <Ionicons name="chatbubble-ellipses" size={20} color={mainColor} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{classData.studentIds?.length || 0}</Text>
            <Text style={styles.statLabel}>Học sinh</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{classData.assignedLessons?.length || 0}</Text>
            <Text style={styles.statLabel}>Bài học</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{classData.assignedCategories?.length || 0}</Text>
            <Text style={styles.statLabel}>Chủ đề</Text>
          </View>
        </View>

        {/* Subject Filters (Horizontal Chips) */}
        <View style={styles.subjectFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectChipsScroll}>
            {subjects.map((subject) => (
              <TouchableOpacity 
                key={subject} 
                onPress={() => setSelectedSubject(subject)}
                style={[
                  styles.subjectChip, 
                  selectedSubject === subject && { backgroundColor: mainColor, borderColor: mainColor }
                ]}
              >
                <Text style={[
                  styles.subjectChipText, 
                  selectedSubject === subject && { color: "#fff" }
                ]}>{subject}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          {/* Filtered Categories */}
          {filteredCategories.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Chủ đề {selectedSubject !== "Tất cả" ? selectedSubject : ""}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {filteredCategories.map((cat: any) => (
                    <TouchableOpacity 
                      key={cat._id} 
                      style={styles.categoryCard}
                      onPress={() => router.push({ pathname: "/category/[id]", params: { id: cat._id, name: cat.name } })}
                    >
                      <Image source={{ uri: cat.imageUrl }} style={styles.categoryImage} />
                      <View style={styles.categoryOverlay} />
                      <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Filtered Lessons */}
          {filteredLessons.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bài học & Nhiệm vụ</Text>
              </View>
              {filteredLessons.map((lesson: any) => (
                <TouchableOpacity 
                  key={lesson._id} 
                  style={styles.lessonItem}
                  onPress={() => router.push({ pathname: `/learning/story/${lesson._id}` })}
                >
                  <View style={[styles.lessonIcon, { backgroundColor: mainColor + '10' }]}>
                    {lesson.imageUrl ? (
                      <Image source={{ uri: lesson.imageUrl }} style={styles.lessonImage} />
                    ) : (
                      <Ionicons name="book" size={24} color={mainColor} />
                    )}
                  </View>
                  <View style={styles.lessonDetails}>
                    <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                    <Text style={styles.lessonSub}>Môn học: {lesson.subject || "Chung"}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {filteredCategories.length === 0 && filteredLessons.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Không tìm thấy nội dung cho môn học này</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  errorText: { fontSize: 16, color: "#64748b", marginBottom: 20, textAlign: "center" },
  backBtn: { backgroundColor: "#2E7D32", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 15 },
  backBtnText: { color: "#fff", fontWeight: "bold" },
  
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "#FFFDF0" },
  headerInfo: { flex: 1, marginHorizontal: 15 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  headerSub: { fontSize: 11, fontWeight: "bold", color: "#94a3b8", marginTop: 2, textTransform: "uppercase" },
  backIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  settingsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  
  scrollContent: { padding: 20 },
  
  banner: { height: 160, borderRadius: 32, padding: 30, justifyContent: "center", overflow: "hidden", marginBottom: 24 },
  bannerInfo: { zIndex: 1 },
  bannerClassName: { fontSize: 28, fontWeight: "900", color: "#fff", marginBottom: 12 },
  badge: { backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  bannerBgIcon: { position: "absolute", right: -10, bottom: -10 },
  
  teacherCard: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  teacherAvatar: { width: 50, height: 50, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 16 },
  teacherInfo: { flex: 1 },
  teacherLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  teacherName: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginTop: 2 },
  contactBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center" },
  
  statsRow: { flexDirection: "row", backgroundColor: "#FFFBEB", borderRadius: 24, padding: 20, marginBottom: 32, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: "600" },
  statDivider: { width: 1, height: 30, backgroundColor: "#F1F5F9" },
  
  subjectBlock: { marginBottom: 40 },
  subjectFilterContainer: { marginBottom: 24, paddingHorizontal: 4 },
  subjectChipsScroll: { gap: 10 },
  subjectChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FEF9C3" },
  subjectChipText: { fontSize: 13, fontWeight: "bold", color: "#64748b" },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  seeAll: { fontSize: 13, fontWeight: "bold" },
  
  categoryScroll: { gap: 16 },
  categoryCard: { width: 140, height: 180, borderRadius: 24, overflow: "hidden", position: "relative" },
  categoryImage: { width: "100%", height: "100%" },
  categoryOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  categoryBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  categoryBadgeText: { fontSize: 10, fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' },
  categoryName: { position: "absolute", bottom: 15, left: 15, right: 15, color: "#fff", fontSize: 14, fontWeight: "900" },
  
  subjectSection: { marginBottom: 24 },
  subjectHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 },
  subjectDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  subjectTitle: { fontSize: 14, fontWeight: "900", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  subjectCount: { backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  subjectCountText: { fontSize: 10, fontWeight: "900", color: "#94a3b8" },

  lessonItem: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  lessonIcon: { width: 50, height: 50, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 16, overflow: "hidden" },
  lessonImage: { width: "100%", height: "100%", objectFit: "cover" },
  lessonDetails: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  lessonSub: { fontSize: 12, color: "#94a3b8", marginTop: 4, fontWeight: "500" },
  
  emptyBox: { alignItems: "center", paddingVertical: 40, backgroundColor: "#fff", borderRadius: 32, borderStyle: "dashed", borderWidth: 2, borderColor: "#E2E8F0" },
  emptyText: { marginTop: 12, fontSize: 14, color: "#94a3b8", fontWeight: "600", textAlign: "center", paddingHorizontal: 40 }
});
