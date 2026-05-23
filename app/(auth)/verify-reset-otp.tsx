import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import client from "../../src/api/client";

export default function VerifyResetOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Vui lòng nhập đủ 6 chữ số"); return; }

    setLoading(true);
    try {
      const res = await client.post("/auth/verify-reset-otp", { email, otp: code });
      router.push({ pathname: "/(auth)/reset-password", params: { token: res.data.token } });
    } catch (e: any) {
      setError(e.response?.data?.message || "Mã OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>

          <Text style={styles.title}>Nhập mã xác nhận</Text>
          <Text style={styles.subtitle}>
            Chúng tôi đã gửi mã 6 chữ số đến{"\n"}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null, error ? styles.otpBoxError : null]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, (loading || otp.join("").length < 6) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading || otp.join("").length < 6}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Xác nhận</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendBtn} onPress={() => router.back()}>
            <Text style={styles.resendText}>Không nhận được mã? <Text style={styles.resendLink}>Gửi lại</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  title: { fontSize: 24, fontWeight: "800", color: "#1e293b", marginBottom: 8 },
  subtitle: { color: "#64748b", marginBottom: 32, lineHeight: 22 },
  emailHighlight: { color: "#2E7D32", fontWeight: "700" },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  otpBox: { width: 48, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc", textAlign: "center", fontSize: 22, fontWeight: "700", color: "#1e293b" },
  otpBoxFilled: { borderColor: "#2E7D32", backgroundColor: "#f0fdf4" },
  otpBoxError: { borderColor: "#ef4444", backgroundColor: "#fff1f1" },
  errorText: { color: "#ef4444", fontSize: 13, fontWeight: "600", marginTop: 8, textAlign: "center" },
  btn: { backgroundColor: "#2E7D32", height: 56, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 24 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  resendBtn: { marginTop: 20, alignItems: "center" },
  resendText: { color: "#64748b", fontSize: 14 },
  resendLink: { color: "#2E7D32", fontWeight: "700" },
});
