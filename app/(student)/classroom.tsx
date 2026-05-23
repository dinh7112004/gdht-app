import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, useWindowDimensions, Modal, TextInput, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../../src/api/client";
import { useTranslation } from "../../src/context/LanguageContext";



export default function ClassroomScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [role, setRole] = useState("STUDENT");
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const loadWithCache = async () => {
        try {
          const cached = await AsyncStorage.getItem("student_classroom_cache");
          if (cached) {
            const data = JSON.parse(cached);
            setRole(data.role || "STUDENT");
            setClasses(data.classes || []);
            setLoading(false);
          }
        } catch (_) {}
        fetchInitialData();
      };
      void loadWithCache();
    }, [])
  );

  const fetchInitialData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem("userData");
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        setRole(user.role || "STUDENT");
        await fetchClasses(user.role || "STUDENT");
      }
    } catch (e) {
      console.error("Failed to fetch classroom data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (currentRole?: string) => {
    try {
      const res = await client.get("/classes/my-classes");
      setClasses(res.data);
      const userDataStr = await AsyncStorage.getItem("userData");
      const user = userDataStr ? JSON.parse(userDataStr) : {};
      await AsyncStorage.setItem("student_classroom_cache", JSON.stringify({
        role: currentRole || user.role || "STUDENT",
        classes: res.data,
      }));
    } catch (e) {
      console.error("Failed to fetch classes", e);
    }
  };

  const handleJoinClass = async () => {
    if (!classCode.trim()) return;
    setJoining(true);
    try {
      await client.post("/classes/join", { code: classCode });
      Alert.alert(t('success'), t('join_class_success') || "Bạn đã tham gia lớp học thành công!");
      setJoinModalVisible(false);
      setClassCode("");
      await fetchClasses();
    } catch (e: any) {
      const msg = e.response?.data?.message || t('error');
      Alert.alert(t('error'), msg);
    } finally {
      setJoining(false);
    }
  };

  if (role === "TEACHER") {
    return <TeacherDashboard t={t} />;
  }

  return (
    <>
      <StudentClassroom 
        classes={classes} 
        onOpenJoin={() => setJoinModalVisible(true)} 
        t={t}
      />
      
      {/* Join Class Modal */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('join_new_class')}</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>{t('enter_code')}</Text>
            <Text style={styles.modalSub}>{t('join_class_desc')}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Ví dụ: ABC123"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              value={classCode}
              onChangeText={setClassCode}
            />
            
            <TouchableOpacity 
              style={[styles.modalBtn, (!classCode.trim() || joining) && styles.modalBtnDisabled]}
              onPress={handleJoinClass}
              disabled={!classCode.trim() || joining}
            >
              {joining ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalBtnText}>{t('confirm')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// --- GIAO DIỆN HỌC SINH ---
function StudentClassroom({ classes, onOpenJoin, t }: { classes: any[], onOpenJoin: () => void, t: any }) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.classTitle}>{t('my_classes')}</Text>
          <Text style={styles.studentCount}>
            {classes.length > 0 ? `${t('joined') || 'Bạn đang tham gia'} ${classes.length} ${t('classes_count') || 'lớp học'}` : t('join_class_to_receive') || "Tham gia lớp học để nhận bài tập"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onOpenJoin}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.joinCard}>
          <View style={styles.joinIconBox}>
            <Ionicons name="enter-outline" size={32} color="#2E7D32" />
          </View>
          <View style={styles.joinInfo}>
            <Text style={styles.joinTitle}>{t('join_new_class')}</Text>
            <Text style={styles.joinSub}>{t('join_class_desc')}</Text>
          </View>
          <TouchableOpacity style={styles.joinActionBtn} onPress={onOpenJoin}>
            <Text style={styles.joinActionText}>{t('enter_code')}</Text>
          </TouchableOpacity>
        </View>

        {classes.length > 0 && <Text style={styles.sectionTitle}>Lớp đang tham gia</Text>}
        
        {classes.map((cls) => (
          <TouchableOpacity 
            key={cls._id} 
            style={[styles.classCard, { borderLeftColor: cls.color || '#3B82F6' }]}
            onPress={() => router.push({ pathname: "/classroom/[id]", params: { id: cls._id } })}
          >
            <View style={[styles.classIcon, { backgroundColor: cls.color || '#3B82F6' }]}>
              <Text style={styles.classInitial}>{cls.name?.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.classDetails}>
              <Text style={styles.className}>{cls.name}</Text>
              <View style={styles.teacherRow}>
                <Ionicons name="person-circle-outline" size={14} color="#64748b" />
                <Text style={styles.teacherName}>{cls.teacherId?.name || t('teacher')}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('class_code')}: {cls.code}</Text>
                </View>
                <View style={styles.studentCountRow}>
                  <Ionicons name="people" size={14} color="#64748b" />
                  <Text style={styles.studentCountText}>{cls.studentIds?.length || 0} {t('students_count')}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        ))}

        {classes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Image 
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/7486/7486744.png" }} 
              style={styles.emptyImg}
            />
            <Text style={styles.emptyText}>{t('empty_classes') || "Bạn chưa tham gia lớp học nào"}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeworkItem({ title, submitted, color }: any) {
  return (
    <View style={styles.hwCard}>
      <View style={[styles.hwIcon, { backgroundColor: color + '20' }]}><Ionicons name="book" size={20} color={color} /></View>
      <Text style={styles.hwTitle}>{title}</Text>
      <Text style={[styles.hwStatus, { color: color }]}>{submitted} nộp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { padding: 24, backgroundColor: "#FFFDF0", borderBottomWidth: 1, borderBottomColor: "#FEF9C3", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  classTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  studentCount: { fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: "500" },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },
  statsRow: { marginBottom: 24 },
  mainStatCard: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: "#FEF9C3" },
  statLabel: { fontSize: 14, color: "#64748b", marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: "900", color: "#2E7D32", marginBottom: 12 },
  progressTrack: { height: 6, backgroundColor: "#FFFDF0", borderRadius: 3 },
  progressFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 16, marginTop: 10 },
  hwCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: "#FEF9C3" },
  hwIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  hwTitle: { flex: 1, fontSize: 15, fontWeight: "bold" },
  hwStatus: { fontSize: 14, fontWeight: "bold" },
  
  joinCard: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: "#FEF9C3" },
  joinIconBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: "#FFFDF0", justifyContent: "center", alignItems: "center", marginRight: 16, borderWidth: 1, borderColor: "#FEF9C3" },
  joinInfo: { flex: 1 },
  joinTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  joinSub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  joinActionBtn: { backgroundColor: "#2E7D32", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  joinActionText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  
  classCard: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 16, borderLeftWidth: 6, borderLeftColor: "#3B82F6", borderWidth: 1, borderColor: "#FEF9C3" },
  classIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center", marginRight: 16 },
  classInitial: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  classDetails: { flex: 1 },
  className: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  teacherRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  teacherName: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 },
  badge: { backgroundColor: "#FFFDF0", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "#FEF9C3" },
  badgeText: { fontSize: 10, fontWeight: "900", color: "#64748b", textTransform: "uppercase" },
  studentCountRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  studentCountText: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },

  emptyContainer: { alignItems: "center", marginTop: 20, padding: 20 },
  emptyImg: { width: 80, height: 80, opacity: 0.2, marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFFDF0", width: "100%", borderRadius: 30, padding: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: "#FEF9C3" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  modalLabel: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
  modalSub: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  modalInput: { backgroundColor: "#FFFBEB", borderRadius: 15, padding: 16, fontSize: 18, fontWeight: "bold", color: "#2E7D32", textAlign: "center", letterSpacing: 2, marginBottom: 20, borderWidth: 1, borderColor: "#FEF9C3" },
  modalBtn: { backgroundColor: "#2E7D32", borderRadius: 15, padding: 16, alignItems: "center", justifyContent: "center" },
  modalBtnDisabled: { backgroundColor: "#cbd5e1" },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});

// --- GIAO DIỆN GIÁO VIÊN ---
function TeacherDashboard({ t }: { t: any }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.classTitle}>{t('teacher_dashboard') || "Bảng điều khiển Giáo viên"}</Text>
          <Text style={styles.studentCount}>{t('teacher_desc') || "Quản lý lớp học và bài tập"}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsRow}>
          <View style={styles.mainStatCard}>
            <Text style={styles.statLabel}>{t('class_progress') || "Tiến độ lớp học"}</Text>
            <Text style={styles.statValue}>{t('use_web_admin') || "Vui lòng xem trên Web"}</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: "100%" }]} /></View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
