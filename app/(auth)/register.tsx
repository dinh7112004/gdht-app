import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import client from "../../src/api/client";

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(params.role || "STUDENT");

  // Error states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleRegister = async () => {
    // Reset errors
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmError("");
    setGeneralError("");

    let hasError = false;
    if (!fullName) { setNameError("Vui lòng nhập họ và tên"); hasError = true; }
    if (!email) { setEmailError("Vui lòng nhập email hoặc số điện thoại"); hasError = true; }
    if (password.length < 6) { setPasswordError("Mật khẩu phải có ít nhất 6 ký tự"); hasError = true; }
    if (password !== confirmPassword) { setConfirmError("Mật khẩu xác nhận không khớp"); hasError = true; }

    if (hasError) return;

    setLoading(true);
    try {
      await client.post("/auth/register", {
        fullName,
        email,
        password,
        role: selectedRole
      });
      
      router.replace({
        pathname: "/(auth)/login",
        params: { role: selectedRole }
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require("../../assets/img1.jpg")} 
                style={styles.logo}
              />
            </View>
            <Text style={styles.title}>Tạo tài khoản mới</Text>
            <Text style={styles.subtitle}>Cùng bắt đầu hành trình học tập thú vị nhé!</Text>
          </View>

          <View style={styles.form}>
            {generalError ? (
              <View style={styles.generalErrorBox}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.generalErrorText}>{generalError}</Text>
              </View>
            ) : null}

            <View style={[styles.inputContainer, nameError ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={20} color={nameError ? "#ef4444" : "#64748b"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                value={fullName}
                onChangeText={(text) => { setFullName(text); setNameError(""); }}
              />
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <View style={[styles.inputContainer, emailError ? styles.inputError : null, { marginTop: nameError ? 8 : 16 }]}>
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
                secureTextEntry
              />
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <View style={[styles.inputContainer, confirmError ? styles.inputError : null, { marginTop: passwordError ? 8 : 16 }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={confirmError ? "#ef4444" : "#64748b"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); setConfirmError(""); }}
                secureTextEntry
              />
            </View>
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled, { marginTop: confirmError ? 24 : 32 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerBtnText}>Đăng ký</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.footer}
            onPress={() => router.replace({ pathname: "/(auth)/login", params: { role: params.role } })}
          >
            <Text style={styles.footerText}>
              Đã có tài khoản? <Text style={styles.footerLink}>Đăng nhập</Text>
            </Text>
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
  logoContainer: { width: 100, height: 100, borderRadius: 50, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: "#f1f5f9" },
  logo: { width: "100%", height: "100%" },
  title: { fontSize: 26, fontWeight: "900", color: "#1e293b", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center" },
  form: { marginBottom: 32 },
  generalErrorBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, borderWidth: 1, borderColor: "#fee2e2" },
  generalErrorText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 16, paddingHorizontal: 16, height: 60, borderWidth: 1, borderColor: "#e2e8f0" },
  inputError: { borderColor: "#ef4444", backgroundColor: "#fff1f1" },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: "600", marginTop: 4, marginLeft: 4 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#1e293b" },
  registerBtn: { backgroundColor: "#2E7D32", height: 60, borderRadius: 16, justifyContent: "center", alignItems: "center", shadowColor: "#2E7D32", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  registerBtnDisabled: { opacity: 0.7 },
  registerBtnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  footer: { alignItems: "center" },
  footerText: { color: "#64748b", fontSize: 15 },
  footerLink: { color: "#2E7D32", fontWeight: "bold" },
});
