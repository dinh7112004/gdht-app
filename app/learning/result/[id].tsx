import React, { useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSound } from "../../../src/context/SoundContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function QuizResultScreen() {
  const router = useRouter();
  const { id, score, total, xp, preview } = useLocalSearchParams();
  const { playSound } = useSound();
  const isPreview = preview === "true";

  useEffect(() => {
    playSound({ uri: 'https://assets.mixkit.co/active_storage/sfx/1433/1433-preview.mp3' });
  }, []);

  // Chuyển đổi dữ liệu từ params
  const correctCount = parseInt(score as string) || 0;
  const totalCount = parseInt(total as string) || 10;
  const xpGained = parseInt(xp as string) || (correctCount * 10);
  const gemGained = correctCount === totalCount ? 2 : 1; // Thưởng thêm gem nếu làm đúng hết

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Top Header with Close Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={() => router.replace(isPreview ? "/(teacher)" : "/(student)")}
        >
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
      </View>
        {isPreview && (
          <View style={styles.previewBadge}>
            <Ionicons name="eye" size={16} color="#4F46E5" />
            <Text style={styles.previewBadgeText}>CHẾ ĐỘ XEM TRƯỚC (KHÔNG LƯU ĐIỂM)</Text>
          </View>
        )}
        
        {/* Celebration Character - Styled as a badge */}
        <View style={styles.dragonBadgeContainer}>
            <Image 
                source={require("../../../assets/img3.jpg")} 
                style={styles.dragonImg}
            />
        </View>
        
        <Text style={styles.congratsText}>{correctCount >= totalCount / 2 ? "Tuyệt vời!" : "Cố gắng lên!"}</Text>
        <Text style={styles.subText}>{isPreview ? "Thầy/Cô đã hoàn thành xem trước bài học" : "Bạn đã hoàn thành bài quiz!"}</Text>

        {/* Score Circle */}
        <View style={styles.scoreOuterCircle}>
          <View style={styles.scoreInnerCircle}>
            <Text style={styles.scoreNumber}>{correctCount}/{totalCount}</Text>
            <Text style={styles.scoreLabel}>Đúng</Text>
          </View>
        </View>

        {/* Rewards */}
        <View style={styles.rewardsContainer}>
          <View style={styles.rewardItem}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.rewardValue}>+{xpGained} XP</Text>
          </View>
          <View style={styles.rewardDivider} />
          <View style={styles.rewardItem}>
            <Ionicons name="diamond" size={24} color="#9C27B0" />
            <Text style={styles.rewardValue}>+{gemGained}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.reviewBtn}
            onPress={() => router.push({ pathname: "/learning/quiz/[id]", params: { id, mode: "review" } })}
          >
            <Text style={styles.reviewBtnText}>Xem đáp án</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.nextBtn}
            onPress={async () => {
              const userDataStr = await AsyncStorage.getItem("userData");
              if (userDataStr) {
                const user = JSON.parse(userDataStr);
                if (user.role === "TEACHER") {
                  router.replace("/(teacher)");
                  return;
                }
              }
              router.replace("/(student)");
            }}
          >
            <Text style={styles.nextBtnText}>HOÀN THÀNH</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  dragonBadgeContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#F0FDF4",
    borderWidth: 6,
    borderColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF'
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4F46E5',
    marginLeft: 6,
    letterSpacing: 0.5
  },
  dragonImg: { width: "100%", height: "100%", resizeMode: 'cover' },
  congratsText: { fontSize: 32, fontWeight: "900", color: "#2E7D32", marginBottom: 8 },
  subText: { fontSize: 16, color: "#64748b", marginBottom: 35 },
  scoreOuterCircle: { 
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    backgroundColor: "#F0FDF4", 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: 8,
    borderColor: "#DCFCE7",
    marginBottom: 35,
  },
  scoreInnerCircle: { 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    backgroundColor: "#FFFFFF", 
    justifyContent: "center", 
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10
  },
  scoreNumber: { fontSize: 44, fontWeight: "900", color: "#1e293b" },
  scoreLabel: { fontSize: 18, color: "#4CAF50", fontWeight: "bold" },
  rewardsContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#F8FAFC", 
    paddingVertical: 16, 
    paddingHorizontal: 32, 
    borderRadius: 24,
    marginBottom: 35
  },
  rewardItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  rewardValue: { fontSize: 18, fontWeight: "bold", color: "#334155" },
  rewardDivider: { width: 1, height: 30, backgroundColor: "#E2E8F0", marginHorizontal: 20 },
  footer: { width: "100%", gap: 12, marginTop: 10 },
  reviewBtn: { 
    backgroundColor: "#F8FAFC", 
    height: 56, 
    borderRadius: 18, 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  reviewBtnText: { color: "#64748b", fontSize: 16, fontWeight: "bold" },
  nextBtn: { 
    backgroundColor: "#2E7D32",
    height: 60, 
    borderRadius: 20,
    justifyContent: "center", 
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6
  },
  nextBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  header: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    zIndex: 10
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  }
});
