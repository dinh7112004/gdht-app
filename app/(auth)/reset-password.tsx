import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import client from "../../src/api/client";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.token) setToken(params.token);
  }, [params.token]);

  const handleSubmit = async () => {
    setError("");
    if (!token) { setError("Token không hợp lệ"); return; }
    if (password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp"); return; }

    setLoading(true);
    try {
      await client.post("/auth/reset", { token, password });
      Alert.alert("Thành công", "Mật khẩu đã được đặt lại. Vui lòng đăng nhập bằng mật khẩu mới.");
      router.replace("/(auth)/login");
    } catch (e: any) {
      setError(e.response?.data?.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={styles.title}>Đặt lại mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập mật khẩu mới của bạn.</Text>

          <View style={[styles.inputContainer, error ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Mật khẩu mới" secureTextEntry value={password} onChangeText={setPassword} />
          </View>

          <View style={[styles.inputContainer, error ? styles.inputError : null, { marginTop: 12 }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Xác nhận mật khẩu" secureTextEntry value={confirm} onChangeText={setConfirm} />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đặt lại mật khẩu</Text>}
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
});
