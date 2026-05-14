import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import client from "../../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Error states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleLogin = async () => {
    // Reset errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    let hasError = false;
    if (!email) {
      setEmailError("Vui lòng nhập email hoặc số điện thoại");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const response = await client.post("/auth/login", { email, password });
      const { access_token, user } = response.data;

      // Check if the role matches the selected role
      if (params.role && user.role !== params.role) {
        setLoading(false);
        const roleName = params.role === "TEACHER" ? "Giáo viên" : "Học sinh";
        const userRoleName = user.role === "TEACHER" ? "Giáo viên" : "Học sinh";
        setGeneralError(`Tài khoản của bạn là ${userRoleName}, không phải ${roleName}.`);
        return;
      }
      
      await AsyncStorage.setItem("userToken", access_token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));

      if (user.role === "TEACHER") {
        router.replace("/(teacher)");
      } else {
        router.replace("/(student)");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Email hoặc mật khẩu không chính xác";
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={{ height: 20 }} />
          
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require("../../assets/img1.jpg")} 
                style={styles.logo}
              />
            </View>
            <Text style={styles.title}>Chào mừng trở lại! 👋</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để tiếp tục hành trình khám phá di sản và Toán học.
            </Text>
          </View>

          <View style={styles.form}>
            {generalError ? (
              <View style={styles.generalErrorBox}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.generalErrorText}>{generalError}</Text>
              </View>
            ) : null}

            <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={20} color={emailError ? "#ef4444" : "#64748b"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email hoặc số điện thoại"
                value={email}
                onChangeText={(text) => { setEmail(text); setEmailError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <View style={[styles.inputContainer, passwordError ? styles.inputError : null, { marginTop: emailError ? 8 : 16 }]}>
              <Ionicons name="lock-closed-outline" size={20} color={passwordError ? "#ef4444" : "#64748b"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                value={password}
                onChangeText={(text) => { setPassword(text); setPasswordError(""); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.socialSection}>
            <Text style={styles.socialDividerText}>hoặc đăng nhập với</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialIconBtn}>
                <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png" }} style={styles.socialIcon} />
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn}>
                <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/0/747.png" }} style={styles.socialIcon} />
                <Text style={styles.socialLabel}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn}>
                <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/124/124010.png" }} style={styles.socialIcon} />
                <Text style={styles.socialLabel}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.footer}
            onPress={() => router.push({ pathname: "/(auth)/register", params: { role: params.role } })}
          >
            <Text style={styles.footerText}>
              Chưa có tài khoản? <Text style={styles.footerLink}>Đăng ký ngay</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.changeRoleBtn}
            onPress={() => router.push("/(auth)/role-selection")}
          >
            <Text style={styles.changeRoleText}>Đăng nhập với vai trò khác</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  logoContainer: { width: 100, height: 100, borderRadius: 50, overflow: "hidden", marginBottom: 24, borderOuterWidth: 4, borderColor: "#f1f5f9" } as any,
  logo: { width: "100%", height: "100%" },
  title: { fontSize: 26, fontWeight: "900", color: "#1e293b", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 22 },
  form: { marginBottom: 32 },
  generalErrorBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, borderWidth: 1, borderColor: "#fee2e2" },
  generalErrorText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 16, paddingHorizontal: 16, height: 60, borderWidth: 1, borderColor: "#e2e8f0" },
  inputError: { borderColor: "#ef4444", backgroundColor: "#fff1f1" },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: 4, marginLeft: 4 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#1e293b" },
  forgotBtn: { alignSelf: "flex-end", marginTop: 16, marginBottom: 24 },
  forgotText: { color: "#2E7D32", fontWeight: "600", fontSize: 14 },
  loginBtn: { backgroundColor: "#2E7D32", height: 60, borderRadius: 16, justifyContent: "center", alignItems: "center", shadowColor: "#2E7D32", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  socialSection: { alignItems: "center", marginBottom: 32 },
  socialDividerText: { color: "#94a3b8", fontSize: 14, marginBottom: 24 },
  socialButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  socialIconBtn: { flex: 1, backgroundColor: "#f8fafc", height: 80, borderRadius: 16, justifyContent: "center", alignItems: "center", marginHorizontal: 6, borderWidth: 1, borderColor: "#e2e8f0" },
  socialIcon: { width: 28, height: 28, marginBottom: 8 },
  socialLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  footer: { alignItems: "center" },
  footerText: { color: "#64748b", fontSize: 15 },
  footerLink: { color: "#2E7D32", fontWeight: "bold" },
  changeRoleBtn: { marginTop: 24, alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  changeRoleText: { color: "#64748b", fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});
