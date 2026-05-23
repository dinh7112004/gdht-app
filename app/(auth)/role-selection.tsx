import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      router.push({
        pathname: "/(auth)/login",
        params: { role: selectedRole }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bạn là ai?</Text>
          <Text style={styles.subtitle}>
            Chọn vai trò phù hợp để chúng tôi gợi ý nội dung tốt nhất cho bạn!
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.roleCard, 
              styles.studentCard,
              selectedRole === "STUDENT" && styles.selectedStudentCard
            ]}
            onPress={() => setSelectedRole("STUDENT")}
          >
            <View style={styles.cardContent}>
              <Image
                source={require("../../assets/role_student.png")}
                style={styles.roleImage}
                resizeMode="contain"
              />
              <Text style={[styles.roleLabel, styles.studentLabel]}>Học sinh</Text>
            </View>
            {selectedRole === "STUDENT" && (
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark-circle" size={32} color="#1d4ed8" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.roleCard, 
              styles.teacherCard,
              selectedRole === "TEACHER" && styles.selectedTeacherCard
            ]}
            onPress={() => setSelectedRole("TEACHER")}
          >
            <View style={styles.cardContent}>
              <Image
                source={require("../../assets/role_teacher.png")}
                style={styles.roleImage}
                resizeMode="contain"
              />
              <Text style={[styles.roleLabel, styles.teacherLabel]}>Giáo viên</Text>
            </View>
            {selectedRole === "TEACHER" && (
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark-circle" size={32} color="#e11d48" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.continueBtn, !selectedRole && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!selectedRole}
          >
            <Text style={styles.continueBtnText}>Tiếp tục</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  header: { alignItems: "center", marginBottom: 50 },
  title: { fontSize: 36, fontWeight: "900", color: "#1e293b", marginBottom: 12, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: "#64748b", textAlign: "center", lineHeight: 24, paddingHorizontal: 20 },
  rolesContainer: { gap: 20 },
  roleCard: {
    height: 140,
    borderRadius: 32,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    justifyContent: "center",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentCard: {
    backgroundColor: "#f0f7ff",
  },
  teacherCard: {
    backgroundColor: "#fff1f2",
  },
  selectedStudentCard: {
    borderColor: "#1d4ed8",
    backgroundColor: "#e0efff",
    shadowColor: "#1d4ed8",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  selectedTeacherCard: {
    borderColor: "#e11d48",
    backgroundColor: "#ffe4e6",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  roleImage: {
    width: 90,
    height: 90,
    marginRight: 20,
  },
  roleLabel: {
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
  },
  studentLabel: { color: "#1d4ed8" },
  teacherLabel: { color: "#e11d48" },
  checkBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  footer: {
    marginTop: "auto",
    marginBottom: 40,
  },
  continueBtn: {
    backgroundColor: "#1e293b",
    height: 64,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  continueBtnDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  }
});
