import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import client from "../../src/api/client";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleSubmit = async () => {
    setEmailError("");
    if (!email) { setEmailError("Vui lòng nhập email"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setEmailError("Email không hợp lệ"); return; }

    setLoading(true);
    try {
      await client.post("/auth/forgot", { email });
      router.push({ pathname: "/(auth)/verify-reset-otp", params: { email } });
    } catch (error: any) {
      setEmailError(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={styles.title}>Khôi phục mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập email bạn đã đăng ký, chúng tôi sẽ gửi mã xác nhận để đặt lại mật khẩu.</Text>

          <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
            <Ionicons name="mail-outline" size={20} color={emailError ? "#ef4444" : "#64748b"} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={(t) => { setEmail(t); setEmailError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Gửi</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.linkText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: "800", color: "#1e293b", marginBottom: 8 },
  subtitle: { color: "#64748b", marginBottom: 24 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 12, height: 56, borderWidth: 1, borderColor: "#e2e8f0" },
  inputError: { borderColor: "#ef4444", backgroundColor: "#fff1f1" },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#1e293b" },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: 8 },
  btn: { backgroundColor: "#2E7D32", height: 56, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 24 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "#fff", fontWeight: "700" },
  link: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#64748b" },
});
