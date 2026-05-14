import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import client from "../../src/api/client";
import { useTranslation } from "../../src/context/LanguageContext";

export default function SecurityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleChangePassword = async () => {
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      Alert.alert(t('error'), t('error_fill_all'));
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      Alert.alert(t('error'), t('error_password_mismatch'));
      return;
    }

    if (form.newPassword.length < 6) {
      Alert.alert(t('error'), t('error_password_length'));
      return;
    }

    try {
      setLoading(true);
      const res = await client.post("/auth/change-password", {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      });
      Alert.alert(t('success'), res.data.message);
      router.back();
    } catch (e: any) {
      Alert.alert(t('error'), e.response?.data?.message || t('error_password_update'));
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('security')}</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoBox}>
             <Ionicons name="shield-checkmark" size={32} color="#10B981" />
             <Text style={styles.infoText}>{t('password_info')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('current_password')}</Text>
              <TextInput 
                style={styles.input}
                secureTextEntry
                placeholder={t('placeholder_old_password')}
                value={form.oldPassword}
                onChangeText={(text) => setForm({...form, oldPassword: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('new_password')}</Text>
              <TextInput 
                style={styles.input}
                secureTextEntry
                placeholder={t('placeholder_new_password')}
                value={form.newPassword}
                onChangeText={(text) => setForm({...form, newPassword: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('confirm_new_password')}</Text>
              <TextInput 
                style={styles.input}
                secureTextEntry
                placeholder={t('placeholder_confirm_password')}
                value={form.confirmPassword}
                onChangeText={(text) => setForm({...form, confirmPassword: text})}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.disabledBtn]} 
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{t('update_password')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  content: { flex: 1, padding: 24 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 16, borderRadius: 20, marginBottom: 32, borderWidth: 1, borderColor: '#FEF9C3' },
  infoText: { flex: 1, marginLeft: 16, color: '#065F46', fontSize: 13, fontWeight: '600', lineHeight: 20 },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "800", color: "#64748B", marginLeft: 4 },
  input: { height: 56, backgroundColor: "#FFFBEB", borderRadius: 16, paddingHorizontal: 20, fontSize: 16, color: "#1E293B", borderWidth: 1, borderColor: "#FEF9C3" },
  submitBtn: { height: 56, backgroundColor: "#1E293B", borderRadius: 18, justifyContent: "center", alignItems: "center", marginTop: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  disabledBtn: { opacity: 0.7 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }
});
