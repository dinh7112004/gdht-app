import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, useWindowDimensions, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function StudentProgressScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo học sinh</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Student Top Info */}
        <View style={styles.studentInfo}>
          <Image 
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} 
            style={styles.avatar}
          />
          <Text style={styles.studentName}>{id}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Học giả nhí 150 / 190 EXP</Text>
          </View>
        </View>

        {/* Radar Chart Placeholder */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Phân tích kỹ năng</Text>
          <View style={styles.radarPlaceholder}>
            <Image 
              source={{ uri: "https://img.freepik.com/free-vector/radar-chart-infographic-template-flat-style_23-2148151817.jpg" }} 
              style={styles.radarImg}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Progress Stats */}
        <View style={styles.statsGrid}>
          <SkillItem label="Toán học" percent={85} color="#3B82F6" />
          <SkillItem label="Văn hóa" percent={72} color="#10B981" />
          <SkillItem label="Kỷ luật" percent={90} color="#F59E0B" />
          <SkillItem label="Kỹ năng" percent={65} color="#EC4899" />
        </View>

        {/* Bar Chart Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bài tập hoàn thành định kỳ</Text>
          <View style={styles.barChartRow}>
             {[40, 60, 45, 80, 55, 70].map((h, i) => (
               <View key={i} style={styles.barContainer}>
                 <View style={[styles.barFill, { height: h, backgroundColor: i % 2 === 0 ? "#4CAF50" : "#FF9800" }]} />
                 <Text style={styles.barLabel}>{20 + i}</Text>
               </View>
             ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SkillItem({ label, percent, color }: any) {
  return (
    <View style={styles.skillCard}>
      <Text style={styles.skillLabel}>{label}</Text>
      <Text style={[styles.skillPercent, { color: color }]}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFFDF0" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  scrollContent: { padding: 20 },
  studentInfo: { alignItems: "center", marginBottom: 32 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#FFFBEB", marginBottom: 12, borderWidth: 2, borderColor: "#FEF9C3" },
  studentName: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
  levelBadge: { backgroundColor: "#FFFBEB", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8, borderWidth: 1, borderColor: "#FFD700" },
  levelText: { fontSize: 12, fontWeight: "bold", color: "#B45309" },
  chartSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b", marginBottom: 16 },
  radarPlaceholder: { height: 220, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFBEB", borderRadius: 24, borderWidth: 1, borderColor: "#FEF9C3", overflow: "hidden" },
  radarImg: { width: "90%", height: "90%" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32 },
  skillCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: "#FFFBEB", padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#FEF9C3" },
  skillLabel: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  skillPercent: { fontSize: 20, fontWeight: "900", marginTop: 4 },
  section: { marginBottom: 40 },
  barChartRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 120, paddingHorizontal: 10, backgroundColor: "#FFFBEB", borderRadius: 24, paddingVertical: 16, borderWidth: 1, borderColor: "#FEF9C3" },
  barContainer: { alignItems: "center", width: 30 },
  barFill: { width: 12, borderRadius: 6 },
  barLabel: { fontSize: 10, color: "#94a3b8", marginTop: 8, fontWeight: "bold" }
});
