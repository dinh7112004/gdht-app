import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import client, { resolveImageUrl } from "../../../src/api/client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

const PALETTE = [
  "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#EF4444", "#F97316",
  "#14B8A6", "#6366F1", "#84CC16", "#A855F7",
];

function buildColorMap(subjects: string[]): Record<string, string> {
  const map: Record<string, string> = { "Chung": "#64748b" };
  subjects.forEach((s, i) => { map[s] = PALETTE[i % PALETTE.length]; });
  return map;
}

export default function StudentProgressScreen() {
  const router = useRouter();
  const { id, name, avatar, classId } = useLocalSearchParams<{
    id: string;
    name?: string;
    avatar?: string;
    classId?: string;
  }>();

  const [student, setStudent] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [colorMap, setColorMap] = useState<Record<string, string>>({ "Chung": "#64748b" });

  useEffect(() => {
    client.get("/subjects").then(res => {
      const names: string[] = (res.data || []).map((s: any) => s.name as string);
      setColorMap(buildColorMap(names));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    void loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch student profile + teacher's classes in parallel
      const [studentRes, classesRes] = await Promise.all([
        client.get(`/users/${id}`),
        client.get("/classes/my-classes"),
      ]);
      setStudent(studentRes.data);

      // Collect all assigned lessons from teacher's classes
      const allLessons: any[] = [];
      for (const cls of classesRes.data || []) {
        const clsId = cls._id || cls.id;
        // Only include classes this student is in
        const studentIds = (cls.studentIds || []).map((s: any) =>
          typeof s === "string" ? s : s._id
        );
        if (!studentIds.includes(String(id))) continue;

        try {
          const detailRes = await client.get(`/classes/${clsId}`);
          const assigned = detailRes.data?.assignedLessons || [];
          for (const l of assigned) {
            allLessons.push({ ...l, className: cls.name, classId: clsId });
          }
        } catch (_) {}
      }
      setLessons(allLessons);
    } catch (e) {
      console.error("Failed to load student data", e);
    } finally {
      setLoading(false);
    }
  };

  const studentName = student?.fullName ?? name ?? "Học sinh";
  const studentAvatar = student?.avatar ?? avatar;
  const xpNextLevel = (student?.level || 1) * 500;

  // Build completed lesson map: lessonId → completion data
  const completedMap = new Map<string, any>();
  for (const cl of student?.completedLessons || []) {
    const lid = typeof cl === "string" ? cl : cl.lessonId;
    if (lid) completedMap.set(lid, cl);
  }

  // Subject stats: group lessons by subject, calc avg score %
  const subjectMap = new Map<string, { total: number; completed: number; scoreSum: number; scoreCount: number }>();
  for (const lesson of lessons) {
    const subject = lesson.subject || "Chung";
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, { total: 0, completed: 0, scoreSum: 0, scoreCount: 0 });
    }
    const entry = subjectMap.get(subject)!;
    entry.total++;
    const comp = completedMap.get(lesson._id?.toString());
    if (comp) {
      entry.completed++;
      if (comp.score != null && comp.total != null && comp.total > 0) {
        entry.scoreSum += (comp.score / comp.total) * 100;
        entry.scoreCount++;
      }
    }
  }

  const getColor = (subject: string) => colorMap[subject] || colorMap["Chung"] || "#64748b";

  const subjectStats = Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    avgScore: data.scoreCount > 0 ? Math.round(data.scoreSum / data.scoreCount) : null,
    completed: data.completed,
    total: data.total,
    color: getColor(subject),
  })).sort((a, b) => b.percent - a.percent);

  // Weekly bar chart: completions per day for last 7 days
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const weekCounts = weekDays.map((day) => {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    return (student?.completedLessons || []).filter((cl: any) => {
      const at = cl.completedAt ? new Date(cl.completedAt) : null;
      return at && at >= start && at <= end;
    }).length;
  });

  const maxCount = Math.max(...weekCounts, 1);
  const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // Recent completions (last 5)
  const recentCompletions = [...(student?.completedLessons || [])]
    .filter((cl: any) => cl.completedAt)
    .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5)
    .map((cl: any) => {
      const lid = cl.lessonId;
      const lesson = lessons.find((l) => l._id?.toString() === lid);
      return { ...cl, lessonTitle: lesson?.title || "Bài học", subject: lesson?.subject || "Chung" };
    });

  const openChat = () => {
    router.push({
      pathname: "/chat/[userId]",
      params: { userId: String(id), userName: studentName, userAvatar: studentAvatar ?? "" },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Báo cáo học sinh</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo học sinh</Text>
        <TouchableOpacity onPress={openChat} style={styles.chatIconBtn}>
          <Ionicons name="chatbubble-ellipses" size={22} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Student Info */}
        <View style={styles.studentCard}>
          <Image source={{ uri: resolveImageUrl(studentAvatar) }} style={styles.avatar} />
          <Text style={styles.studentName}>{studentName}</Text>
          <View style={styles.levelBadge}>
            <Ionicons name="star" size={12} color="#B45309" style={{ marginRight: 4 }} />
            <Text style={styles.levelText}>
              Cấp {student?.level || 1} · {student?.xp || 0} / {xpNextLevel} XP
            </Text>
          </View>

          {/* XP progress bar */}
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${Math.min(((student?.xp || 0) % 500) / 500 * 100, 100)}%` }]} />
          </View>

          {/* Quick stats */}
          <View style={styles.quickStats}>
            <QuickStat icon="checkmark-circle" value={student?.completedLessons?.length || 0} label="Bài hoàn thành" color="#10B981" />
            <View style={styles.statDivider} />
            <QuickStat icon="flame" value={student?.streak || 0} label="Chuỗi ngày" color="#EF4444" />
            <View style={styles.statDivider} />
            <QuickStat icon="trophy" value={`${Math.round(((student?.completedLessons?.length || 0) / Math.max(lessons.length, 1)) * 100)}%`} label="Tiến độ" color="#F59E0B" />
          </View>

          <TouchableOpacity style={styles.chatButton} onPress={openChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
            <Text style={styles.chatButtonText}>Nhắn tin</Text>
          </TouchableOpacity>
        </View>

        {/* Subject Skills */}
        <Text style={styles.sectionTitle}>Phân tích theo môn học</Text>
        {subjectStats.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Chưa có dữ liệu bài học</Text>
          </View>
        ) : (
          <View style={styles.subjectList}>
            {subjectStats.map((s) => (
              <View key={s.subject} style={styles.subjectItem}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{s.subject}</Text>
                  <Text style={[styles.subjectPercent, { color: s.color }]}>{s.percent}%</Text>
                </View>
                <View style={styles.subjectBarBg}>
                  <View style={[styles.subjectBarFill, { width: `${s.percent}%`, backgroundColor: s.color }]} />
                </View>
                <Text style={styles.subjectMeta}>
                  {s.completed}/{s.total} bài
                  {s.avgScore != null ? ` · Điểm TB: ${s.avgScore}%` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Weekly Activity */}
        <Text style={styles.sectionTitle}>Hoạt động 7 ngày qua</Text>
        <View style={styles.weekChart}>
          {weekCounts.map((count, i) => {
            const barH = maxCount > 0 ? Math.max((count / maxCount) * 80, count > 0 ? 8 : 0) : 0;
            const isToday = i === 6;
            return (
              <View key={i} style={styles.weekBarCol}>
                <Text style={styles.weekCountLabel}>{count > 0 ? count : ""}</Text>
                <View style={styles.weekBarBg}>
                  <View style={[
                    styles.weekBarFill,
                    { height: barH, backgroundColor: isToday ? "#2E7D32" : "#10B981" }
                  ]} />
                </View>
                <Text style={[styles.weekDayLabel, isToday && styles.weekDayToday]}>
                  {DAY_LABELS[weekDays[i].getDay()]}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Recent Completions */}
        {recentCompletions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Bài học gần đây</Text>
            <View style={styles.recentList}>
              {recentCompletions.map((item, idx) => (
                <View key={idx} style={styles.recentItem}>
                  <View style={[styles.recentIconBox, { backgroundColor: getColor(item.subject) + "18" }]}>
                    <Ionicons name="book" size={18} color={getColor(item.subject)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentTitle} numberOfLines={1}>{item.lessonTitle}</Text>
                    <Text style={styles.recentMeta}>
                      {item.subject} · {timeAgo(item.completedAt)}
                      {item.score != null ? ` · ${item.score}/${item.total} điểm` : ""}
                    </Text>
                  </View>
                  <View style={styles.recentCheck}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function QuickStat({ icon, value, label, color }: any) {
  return (
    <View style={styles.quickStatBox}>
      <Text style={[styles.quickStatValue, { color }]}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  chatIconBtn: { padding: 4 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  // Student card
  studentCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#FEF9C3",
  },
  studentName: { fontSize: 22, fontWeight: "900", color: "#1e293b", marginBottom: 8 },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  levelText: { fontSize: 13, fontWeight: "700", color: "#B45309" },
  xpBarBg: {
    width: "80%",
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 20,
  },
  xpBarFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 3 },
  quickStats: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#FFFDF0",
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  quickStatBox: { flex: 1, alignItems: "center" },
  quickStatValue: { fontSize: 20, fontWeight: "900" },
  quickStatLabel: { fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: "600" },
  statDivider: { width: 1, height: 32, backgroundColor: "#FEF9C3", alignSelf: "center" },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
  },
  chatButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  sectionTitle: { fontSize: 17, fontWeight: "900", color: "#1e293b", marginBottom: 14 },

  // Subject skills
  subjectList: { marginBottom: 28, gap: 12 },
  subjectItem: {
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  subjectHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  subjectName: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  subjectPercent: { fontSize: 16, fontWeight: "900" },
  subjectBarBg: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  subjectBarFill: { height: "100%", borderRadius: 3 },
  subjectMeta: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },

  // Weekly chart
  weekChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: "#FFFBEB",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    padding: 16,
    marginBottom: 28,
    height: 140,
  },
  weekBarCol: { alignItems: "center", flex: 1 },
  weekCountLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "700", marginBottom: 4, height: 14 },
  weekBarBg: { width: 20, height: 80, backgroundColor: "#F1F5F9", borderRadius: 10, justifyContent: "flex-end", overflow: "hidden" },
  weekBarFill: { width: "100%", borderRadius: 10 },
  weekDayLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "700", marginTop: 6 },
  weekDayToday: { color: "#2E7D32", fontWeight: "900" },

  // Recent completions
  recentList: { gap: 10, marginBottom: 20 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FEF9C3",
    gap: 12,
  },
  recentIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  recentTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  recentMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: "600" },
  recentCheck: { marginLeft: 4 },

  emptyBox: { backgroundColor: "#FFFBEB", borderRadius: 18, padding: 24, alignItems: "center", marginBottom: 28, borderWidth: 1, borderColor: "#FEF9C3" },
  emptyText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
});