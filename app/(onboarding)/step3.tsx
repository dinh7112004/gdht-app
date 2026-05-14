import React from "react";
import { View, Text, ImageBackground, TouchableOpacity, SafeAreaView, Dimensions, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

export default function Onboarding3() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <ImageBackground 
        source={require("../../assets/img3.jpg")} 
        style={styles.background}
        imageStyle={{
          opacity: 0.95,
        }}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.overlay}>
            <View style={styles.topContent}>
              <Text style={styles.title}>
                Tiến bộ mỗi ngày {"\n"}nhận thưởng xịn!
              </Text>
              <Text style={styles.subtitle}>
                Hoàn thành nhiệm vụ, tích XP, mở khóa huy hiệu và nhiều phần thưởng hấp dẫn.
              </Text>
            </View>

            <View style={styles.bottomContent}>
              <View style={styles.pagination}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={[styles.dot, styles.activeDot]} />
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.button}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.buttonText}>Bắt đầu thôi!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { width: width, height: height },
  safeArea: { flex: 1 },
  overlay: { flex: 1, paddingHorizontal: 32, justifyContent: "space-between" },
  topContent: { marginTop: 60, alignItems: "center" },
  title: { fontSize: 32, fontWeight: "900", textAlign: "center", color: "#1A1A1A", lineHeight: 40, textShadowColor: 'rgba(255, 255, 255, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10 },
  subtitle: { fontSize: 16, color: "#334155", textAlign: "center", marginTop: 20, lineHeight: 24, fontWeight: "600" },
  bottomContent: { marginBottom: 48 },
  pagination: { flexDirection: "row", justifyContent: "center", marginBottom: 32 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.1)", marginHorizontal: 4 },
  activeDot: { width: 32, backgroundColor: "#4CAF50" },
  button: { backgroundColor: "#2E7D32", paddingVertical: 18, borderRadius: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});
